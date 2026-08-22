import {satisfies, validateStrict} from 'compare-versions';

import type {
  ActionInput,
  ConfigField,
  PluginAction,
  PluginBackgroundTask,
  PluginManifest,
} from './manifest';

const PLUGIN_TYPES = new Set(['automation', 'source', 'player']);
const PLUGIN_ICON_APPEARANCES = new Set(['auto', 'monochrome', 'original']);
const FIELD_TYPES = new Set(['text', 'password', 'number', 'boolean', 'select']);
const BACKGROUND_NETWORK_TYPES = new Set(['connected', 'unmetered']);
const PACKAGE_ICON_EXTENSIONS = new Set(['svg', 'png', 'webp']);
const STABLE_ID_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;
const EVENT_ID_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._:-]*[A-Za-z0-9])?$/;
const PLUGIN_ID_PATTERN = /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)+$/;

/** Error raised when an unknown value violates the public addon manifest contract. */
export class PluginManifestValidationError extends Error {
  /** Dot-separated field path associated with the failure when available. */
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(`Invalid plugin manifest: ${message}`);
    this.name = 'PluginManifestValidationError';
    this.field = field;
  }
}

/** Error raised when an addon does not support the running StreamShare version. */
export class PluginCompatibilityError extends Error {
  /** Application version that was checked. */
  readonly applicationVersion: string;
  /** Compatibility range declared by the addon. */
  readonly compatibleVersion: string;

  constructor(applicationVersion: string, compatibleVersion: string) {
    super(
      `Addon compatibility range '${compatibleVersion}' does not include StreamShare ${applicationVersion}.`,
    );
    this.name = 'PluginCompatibilityError';
    this.applicationVersion = applicationVersion;
    this.compatibleVersion = compatibleVersion;
  }
}

function fail(message: string, field?: string): never {
  throw new PluginManifestValidationError(message, field);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) fail(`${field} must be an object.`, field);
  return value;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    fail(`${field} must be a non-empty string.`, field);
  }
  return value;
}

function requireStableId(value: unknown, field: string): string {
  const id = requireString(value, field);
  if (!STABLE_ID_PATTERN.test(id)) {
    fail(`${field} may contain only letters, digits, dot, underscore or dash.`, field);
  }
  return id;
}

function assertOptionalString(value: unknown, field: string): void {
  if (value !== undefined && typeof value !== 'string') {
    fail(`${field} must be a string.`, field);
  }
}

function assertOptionalBoolean(value: unknown, field: string): void {
  if (value !== undefined && typeof value !== 'boolean') {
    fail(`${field} must be a boolean.`, field);
  }
}

function assertPackagePath(value: unknown, field: string): string {
  const packagePath = requireString(value, field);
  const segments = packagePath.split(/[\\/]/);
  if (
    packagePath.startsWith('/')
    || packagePath.startsWith('\\')
    || /^[A-Za-z]:[\\/]/.test(packagePath)
    || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(packagePath)
    || segments.includes('..')
    || packagePath.includes('\0')
    || /[?#]/.test(packagePath)
  ) {
    fail(`${field} must stay inside the addon package.`, field);
  }
  return packagePath;
}

function isValidVersionRange(value: string): boolean {
  try {
    satisfies('0.0.0', value);
    return true;
  } catch {
    return false;
  }
}

/** Tests whether a manifest network entry is a supported host allowlist pattern. */
export function isValidNetworkPermission(value: unknown): value is string {
  if (typeof value !== 'string' || value !== value.trim() || !value || value.length > 253) return false;
  if (value === '*') return true;
  const host = value.startsWith('*.') ? value.slice(2) : value;
  if (!host || host.includes('*') || host.startsWith('.') || host.endsWith('.')) return false;
  if (/^\[[0-9a-f:.]+\]$/i.test(host)) return true;
  if (!/^[a-z0-9.-]+$/i.test(host)) return false;
  return host.split('.').every((label) => label.length > 0
    && label.length <= 63
    && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label));
}

function assertFieldDefault(field: Record<string, unknown>, path: string, optional: boolean): void {
  const value = field['default'];
  if (value === undefined && optional) return;
  if (value === undefined) fail(`${path}.default is required.`, `${path}.default`);

  const type = field['type'];
  if (type === 'boolean' && typeof value !== 'boolean') {
    fail(`${path}.default must be a boolean.`, `${path}.default`);
  }
  if (type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
    fail(`${path}.default must be a finite number.`, `${path}.default`);
  }
  if ((type === 'text' || type === 'password') && typeof value !== 'string') {
    fail(`${path}.default must be a string.`, `${path}.default`);
  }
  if (type === 'select') {
    if (field['multiple'] === true) {
      if (!Array.isArray(value)
        || value.some((entry) => typeof entry !== 'string'
          && (typeof entry !== 'number' || !Number.isFinite(entry)))) {
        fail(`${path}.default must be an array of strings or numbers.`, `${path}.default`);
      }
    } else if (typeof value !== 'string'
      && (typeof value !== 'number' || !Number.isFinite(value))) {
      fail(`${path}.default must be a string or number.`, `${path}.default`);
    }
  }
}

function assertSelectOptions(field: Record<string, unknown>, path: string): void {
  const options = field['options'];
  if (field['type'] !== 'select') {
    if (options !== undefined && !Array.isArray(options)) {
      fail(`${path}.options must be an array.`, `${path}.options`);
    }
    return;
  }
  if (!Array.isArray(options) || options.length === 0) {
    fail(`${path}.options must contain at least one choice for a select field.`, `${path}.options`);
  }
  const values = new Set<string>();
  options.forEach((option, optionIndex) => {
    const optionPath = `${path}.options[${optionIndex}]`;
    const record = requireRecord(option, optionPath);
    requireString(record['label'], `${optionPath}.label`);
    if (typeof record['value'] !== 'string'
      && (typeof record['value'] !== 'number' || !Number.isFinite(record['value']))) {
      fail(`${optionPath}.value must be a string or number.`, `${optionPath}.value`);
    }
    const normalized = `${typeof record['value']}:${String(record['value'])}`;
    if (values.has(normalized)) fail(`${path}.options contains a duplicate value.`, `${path}.options`);
    values.add(normalized);
  });
  if (field['default'] !== undefined) {
    const defaults = Array.isArray(field['default']) ? field['default'] : [field['default']];
    const normalizedDefaults = defaults.map((entry) => `${typeof entry}:${String(entry)}`);
    if (new Set(normalizedDefaults).size !== normalizedDefaults.length) {
      fail(`${path}.default contains a duplicate select choice.`, `${path}.default`);
    }
    if (normalizedDefaults.some((entry) => !values.has(entry))) {
      fail(`${path}.default must match the select choices.`, `${path}.default`);
    }
  }
}

function assertConfigField(value: unknown, path: string): asserts value is ConfigField {
  const field = requireRecord(value, path);
  requireStableId(field['key'], `${path}.key`);
  requireString(field['label'], `${path}.label`);
  if (!FIELD_TYPES.has(String(field['type']))) fail(`${path}.type is unsupported.`, `${path}.type`);
  assertOptionalBoolean(field['multiple'], `${path}.multiple`);
  if (field['multiple'] === true && field['type'] !== 'select') {
    fail(`${path}.multiple is supported only for select fields.`, `${path}.multiple`);
  }
  assertFieldDefault(field, path, false);
  assertSelectOptions(field, path);
}

function assertActionInput(value: unknown, path: string): asserts value is ActionInput {
  const input = requireRecord(value, path);
  requireStableId(input['key'], `${path}.key`);
  requireString(input['label'], `${path}.label`);
  if (!FIELD_TYPES.has(String(input['type']))) fail(`${path}.type is unsupported.`, `${path}.type`);
  assertFieldDefault(input, path, true);
  assertSelectOptions(input, path);
}

function assertAction(value: unknown, path: string): asserts value is PluginAction {
  const action = requireRecord(value, path);
  requireStableId(action['id'], `${path}.id`);
  requireString(action['label'], `${path}.label`);
  assertOptionalString(action['description'], `${path}.description`);
  if (action['inputs'] !== undefined) {
    if (!Array.isArray(action['inputs'])) fail(`${path}.inputs must be an array.`, `${path}.inputs`);
    const keys = new Set<string>();
    action['inputs'].forEach((input, index) => {
      const inputPath = `${path}.inputs[${index}]`;
      assertActionInput(input, inputPath);
      if (keys.has(input.key)) fail(`${path}.inputs contains duplicate key '${input.key}'.`, `${path}.inputs`);
      keys.add(input.key);
    });
  }
}

function assertBackgroundTask(value: unknown, path: string): asserts value is PluginBackgroundTask {
  const task = requireRecord(value, path);
  requireStableId(task['id'], `${path}.id`);
  requireStableId(task['action'], `${path}.action`);
  if (!Number.isInteger(task['intervalMinutes']) || Number(task['intervalMinutes']) < 15) {
    fail(`${path}.intervalMinutes must be an integer of at least 15.`, `${path}.intervalMinutes`);
  }
  const interval = Number(task['intervalMinutes']);
  if (task['freshnessMinutes'] !== undefined
    && (!Number.isInteger(task['freshnessMinutes'])
      || Number(task['freshnessMinutes']) < 0
      || Number(task['freshnessMinutes']) > interval)) {
    fail(`${path}.freshnessMinutes must be between 0 and intervalMinutes.`, `${path}.freshnessMinutes`);
  }
  if (task['flexMinutes'] !== undefined
    && (!Number.isInteger(task['flexMinutes'])
      || Number(task['flexMinutes']) < 5
      || Number(task['flexMinutes']) > interval)) {
    fail(`${path}.flexMinutes must be between 5 and intervalMinutes.`, `${path}.flexMinutes`);
  }
  if (task['sliceDurationMinutes'] !== undefined
    && (!Number.isInteger(task['sliceDurationMinutes'])
      || Number(task['sliceDurationMinutes']) < 1
      || Number(task['sliceDurationMinutes']) > 9)) {
    fail(`${path}.sliceDurationMinutes must be between 1 and 9.`, `${path}.sliceDurationMinutes`);
  }
  assertOptionalBoolean(task['runOnInstall'], `${path}.runOnInstall`);
  assertOptionalBoolean(task['runOnConfigChange'], `${path}.runOnConfigChange`);

  if (task['constraints'] !== undefined) {
    const constraints = requireRecord(task['constraints'], `${path}.constraints`);
    if (constraints['network'] !== undefined
      && !BACKGROUND_NETWORK_TYPES.has(String(constraints['network']))) {
      fail(`${path}.constraints.network is unsupported.`, `${path}.constraints.network`);
    }
    for (const flag of [
      'requiresBatteryNotLow',
      'requiresStorageNotLow',
      'requiresCharging',
      'requiresDeviceIdleOnTv',
    ]) {
      assertOptionalBoolean(constraints[flag], `${path}.constraints.${flag}`);
    }
  }
}

/**
 * Validates an unknown value and narrows it to the public addon manifest type.
 *
 * Unknown additional object fields are retained for forward compatibility.
 *
 * @throws {@link PluginManifestValidationError} when validation fails.
 */
export function assertPluginManifest(value: unknown): asserts value is PluginManifest {
  const manifest = requireRecord(value, 'manifest');
  const id = requireString(manifest['id'], 'id');
  if (!PLUGIN_ID_PATTERN.test(id)) fail('id must be a reverse-domain-style identifier.', 'id');
  requireString(manifest['name'], 'name');
  const version = requireString(manifest['version'], 'version');
  if (!validateStrict(version)) fail('version must be a valid semantic version.', 'version');
  const compatibleVersion = requireString(manifest['compatibleVersion'], 'compatibleVersion');
  if (!isValidVersionRange(compatibleVersion)) {
    fail('compatibleVersion must be a valid semantic-version range.', 'compatibleVersion');
  }
  if (!PLUGIN_TYPES.has(String(manifest['type']))) fail(`unsupported type '${String(manifest['type'])}'.`, 'type');
  assertPackagePath(manifest['main'], 'main');
  requireString(manifest['author'], 'author');
  requireString(manifest['description'], 'description');
  assertOptionalBoolean(manifest['adult'], 'adult');

  if (manifest['icon'] !== undefined) {
    const icon = assertPackagePath(manifest['icon'], 'icon');
    const extension = icon.split('.').pop()?.toLowerCase() ?? '';
    if (!PACKAGE_ICON_EXTENSIONS.has(extension)) fail('icon must be an SVG, PNG or WebP file.', 'icon');
  }
  if (manifest['iconAppearance'] !== undefined
    && !PLUGIN_ICON_APPEARANCES.has(String(manifest['iconAppearance']))) {
    fail('iconAppearance must be auto, monochrome or original.', 'iconAppearance');
  }

  const permissions = requireRecord(manifest['permissions'], 'permissions');
  if (!Array.isArray(permissions['network'])) fail('permissions.network must be an array.', 'permissions.network');
  const networkPermissions = new Set<string>();
  permissions['network'].forEach((entry, index) => {
    if (!isValidNetworkPermission(entry)) {
      fail(`unsupported network permission '${String(entry)}'.`, `permissions.network[${index}]`);
    }
    const normalized = entry.toLowerCase();
    if (networkPermissions.has(normalized)) {
      fail(`duplicate network permission '${entry}'.`, `permissions.network[${index}]`);
    }
    networkPermissions.add(normalized);
  });
  assertOptionalBoolean(permissions['extended_runtime'], 'permissions.extended_runtime');

  const actionIds = new Set<string>();
  if (manifest['actions'] !== undefined) {
    if (!Array.isArray(manifest['actions'])) fail('actions must be an array.', 'actions');
    manifest['actions'].forEach((action, index) => {
      assertAction(action, `actions[${index}]`);
      if (actionIds.has(action.id)) fail(`duplicate action '${action.id}'.`, `actions[${index}].id`);
      actionIds.add(action.id);
    });
  }

  if (manifest['backgroundTasks'] !== undefined) {
    if (!Array.isArray(manifest['backgroundTasks'])) fail('backgroundTasks must be an array.', 'backgroundTasks');
    const taskIds = new Set<string>();
    manifest['backgroundTasks'].forEach((task, index) => {
      assertBackgroundTask(task, `backgroundTasks[${index}]`);
      if (taskIds.has(task.id)) fail(`duplicate background task '${task.id}'.`, `backgroundTasks[${index}].id`);
      if (!actionIds.has(task.action)) {
        fail(`background task '${task.id}' references unknown action '${task.action}'.`, `backgroundTasks[${index}].action`);
      }
      taskIds.add(task.id);
    });
  }

  if (manifest['config'] !== undefined) {
    if (!Array.isArray(manifest['config'])) fail('config must be an array.', 'config');
    const configKeys = new Set<string>();
    manifest['config'].forEach((field, index) => {
      assertConfigField(field, `config[${index}]`);
      if (configKeys.has(field.key)) fail(`duplicate config key '${field.key}'.`, `config[${index}].key`);
      configKeys.add(field.key);
    });
  }

  if (manifest['subscriptions'] !== undefined) {
    if (!Array.isArray(manifest['subscriptions'])) fail('subscriptions must be an array.', 'subscriptions');
    const events = new Set<string>();
    manifest['subscriptions'].forEach((subscription, index) => {
      const path = `subscriptions[${index}]`;
      const event = requireString(requireRecord(subscription, path)['event'], `${path}.event`);
      if (!EVENT_ID_PATTERN.test(event)) {
        fail(`${path}.event is not a valid event identifier.`, `${path}.event`);
      }
      if (events.has(event)) fail(`duplicate subscription '${event}'.`, `${path}.event`);
      events.add(event);
    });
  }
}

/** Validates and returns an unknown value as a public addon manifest. */
export function parsePluginManifest(value: unknown): PluginManifest {
  assertPluginManifest(value);
  return value;
}

/** Tests whether an unknown value satisfies the public addon manifest contract. */
export function isPluginManifest(value: unknown): value is PluginManifest {
  try {
    assertPluginManifest(value);
    return true;
  } catch {
    return false;
  }
}

/** Tests whether an addon manifest supports one exact StreamShare application version. */
export function isPluginCompatibleWithApplication(
  manifest: Pick<PluginManifest, 'compatibleVersion'>,
  applicationVersion: string,
): boolean {
  if (!validateStrict(applicationVersion)) return false;
  try {
    return satisfies(applicationVersion, manifest.compatibleVersion);
  } catch {
    return false;
  }
}

/**
 * Rejects an addon manifest whose compatibility range excludes the application.
 *
 * @throws {@link PluginCompatibilityError} when the versions are incompatible.
 */
export function assertPluginCompatibleWithApplication(
  manifest: Pick<PluginManifest, 'compatibleVersion'>,
  applicationVersion: string,
): void {
  if (!isPluginCompatibleWithApplication(manifest, applicationVersion)) {
    throw new PluginCompatibilityError(applicationVersion, manifest.compatibleVersion);
  }
}

import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  assertPluginManifest,
  isPluginManifest,
  parsePluginManifest,
  PluginManifestValidationError,
  registerPlugin,
} = require('../dist/index.js');

function createManifest(overrides = {}) {
  return {
    id: 'com.example.hello',
    name: 'Hello',
    version: '1.0.0',
    compatibleVersion: '^3.13.0',
    type: 'automation',
    main: 'dist/index.js',
    author: 'Example',
    description: 'Validation fixture',
    permissions: {network: []},
    actions: [{id: 'say_hello', label: 'Say hello'}],
    ...overrides,
  };
}

test('accepts a complete manifest and preserves its identity', () => {
  const manifest = createManifest({
    permissions: {network: ['api.example.com', '*.media.example.com']},
    backgroundTasks: [{id: 'refresh', action: 'say_hello', intervalMinutes: 60}],
  });

  assert.doesNotThrow(() => assertPluginManifest(manifest));
  assert.equal(parsePluginManifest(manifest), manifest);
  assert.equal(isPluginManifest(manifest), true);
});

test('rejects malformed versions, paths and network permissions', () => {
  for (const manifest of [
    createManifest({version: 'latest'}),
    createManifest({compatibleVersion: 'next'}),
    createManifest({main: '../private.js'}),
    createManifest({main: 'https://example.com/addon.js'}),
    createManifest({permissions: {network: ['https://example.com']}}),
    createManifest({permissions: {network: ['EXAMPLE.COM', 'example.com']}}),
  ]) {
    assert.throws(() => assertPluginManifest(manifest), PluginManifestValidationError);
    assert.equal(isPluginManifest(manifest), false);
  }
});

test('rejects duplicate public identifiers', () => {
  assert.throws(() => assertPluginManifest(createManifest({
    actions: [
      {id: 'duplicate', label: 'First'},
      {id: 'duplicate', label: 'Second'},
    ],
  })), /duplicate action/);

  assert.throws(() => assertPluginManifest(createManifest({
    config: [
      {key: 'name', type: 'text', label: 'Name', default: ''},
      {key: 'name', type: 'text', label: 'Name again', default: ''},
    ],
  })), /duplicate config key/);
});

test('requires background tasks to reference declared actions', () => {
  assert.throws(() => assertPluginManifest(createManifest({
    backgroundTasks: [{id: 'refresh', action: 'missing', intervalMinutes: 60}],
  })), /references unknown action/);
});

test('validates typed configuration and select choices', () => {
  assert.throws(() => assertPluginManifest(createManifest({
    config: [{key: 'enabled', type: 'boolean', label: 'Enabled', default: 'yes'}],
  })), /default must be a boolean/);

  assert.throws(() => assertPluginManifest(createManifest({
    config: [{key: 'color', type: 'select', label: 'Color', default: 'cyan'}],
  })), /options must contain at least one choice/);

  assert.throws(() => assertPluginManifest(createManifest({
    config: [{
      key: 'color',
      type: 'select',
      label: 'Color',
      default: 'cyan',
      options: [{label: 'Mint', value: 'mint'}],
    }],
  })), /default must match the select choices/);

  assert.doesNotThrow(() => assertPluginManifest(createManifest({
    config: [{
      key: 'resolutions',
      type: 'select',
      label: 'Resolutions',
      multiple: true,
      default: ['2160', '1080'],
      options: [
        {label: '2160p', value: '2160'},
        {label: '1080p', value: '1080'},
      ],
    }],
  })));

  assert.throws(() => assertPluginManifest(createManifest({
    config: [{
      key: 'resolutions', type: 'select', label: 'Resolutions', multiple: true,
      default: ['2160', 'unknown'], options: [{label: '2160p', value: '2160'}],
    }],
  })), /default must match the select choices/);

  assert.throws(() => assertPluginManifest(createManifest({
    config: [{key: 'name', type: 'text', label: 'Name', multiple: true, default: ''}],
  })), /supported only for select fields/);
});

test('validates subscription event identifiers', () => {
  assert.doesNotThrow(() => assertPluginManifest(createManifest({
    subscriptions: [{event: 'app:started'}],
  })));
  assert.throws(() => assertPluginManifest(createManifest({
    subscriptions: [{event: 'not an event'}],
  })), /valid event identifier/);
});

test('accepts an adult content declaration and rejects non-boolean values', () => {
  assert.doesNotThrow(() => assertPluginManifest(createManifest({adult: true})));
  assert.doesNotThrow(() => assertPluginManifest(createManifest({adult: false})));
  assert.throws(() => assertPluginManifest(createManifest({adult: 'yes'})), /adult must be a boolean/);
});

test('validates the icon appearance policy', () => {
  for (const iconAppearance of ['auto', 'monochrome', 'original']) {
    assert.doesNotThrow(() => assertPluginManifest(createManifest({iconAppearance})));
  }
  assert.throws(
    () => assertPluginManifest(createManifest({iconAppearance: 'inverted'})),
    /iconAppearance must be auto, monochrome or original/,
  );
});

test('registerPlugin forwards the addon to the host runtime', () => {
  const previous = globalThis.registerPlugin;
  const addon = {onInit() {}};
  let received;
  globalThis.registerPlugin = (value) => {
    received = value;
  };

  try {
    registerPlugin(addon);
    assert.equal(received, addon);
  } finally {
    if (previous === undefined) delete globalThis.registerPlugin;
    else globalThis.registerPlugin = previous;
  }
});

test('registerPlugin fails clearly outside the addon runtime', () => {
  const previous = globalThis.registerPlugin;
  delete globalThis.registerPlugin;

  try {
    assert.throws(() => registerPlugin({onInit() {}}), /runtime is not available/);
  } finally {
    if (previous !== undefined) globalThis.registerPlugin = previous;
  }
});

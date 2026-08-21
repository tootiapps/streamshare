/**
 * Functional category declared by an addon.
 *
 * `automation` and `source` have public SDK contracts. `player` is reserved for
 * a future contract and must not be used by third-party addons yet.
 */
export type PluginType = 'automation' | 'source' | 'player';

/** Rendering policy applied by the host to an addon's declared icon. */
export type PluginIconAppearance = 'auto' | 'monochrome' | 'original';

/** Network and foreground-runtime capabilities requested by an addon. */
export interface NetworkPermissions {
  /**
   * HTTP(S)/WebSocket host allowlist shared by interactive and headless runtimes.
   * Use an exact host, a leading subdomain wildcard (`*.site.com`), or `*` for all hosts.
   * Values are hosts only: do not include a scheme, port or path.
   */
  network: string[];
  /** Extends the interactive runtime TTL for explicitly long foreground actions. */
  extended_runtime?: boolean;
}

/** Network condition required before Android may start a background task. */
export type BackgroundNetworkType = 'connected' | 'unmetered';

/** Optional operating-system constraints for a persistent Android task. */
export interface BackgroundTaskConstraints {
  /** Required network. Defaults to connected. */
  network?: BackgroundNetworkType;
  /** Defer while Android reports a low battery. */
  requiresBatteryNotLow?: boolean;
  /** Defer while Android reports low storage. */
  requiresStorageNotLow?: boolean;
  /** Require charging on battery-powered devices. */
  requiresCharging?: boolean;
  /** Require Android device-idle mode on television devices only. */
  requiresDeviceIdleOnTv?: boolean;
}

/** A deferrable task that can run without an open interactive application session. */
export interface PluginBackgroundTask {
  /** Stable identifier, unique inside the plugin manifest. */
  id: string;
  /** Plugin action passed to onAction(params, actionId). */
  action: string;
  /** Repeat interval in minutes. Android's minimum is 15 minutes. */
  intervalMinutes: number;
  /** Skip periodic delivery while the previous successful result is newer than this many minutes. */
  freshnessMinutes?: number;
  /** Optional flexible execution window at the end of each interval. */
  flexMinutes?: number;
  /** Schedule an immediate one-time run when this plugin/version is installed. */
  runOnInstall?: boolean;
  /** Schedule an immediate one-time run after the user saves plugin configuration. */
  runOnConfigChange?: boolean;
  /** Cooperative slice budget. The plugin should checkpoint and request a continuation before it expires. */
  sliceDurationMinutes?: number;
  /** Conditions that must be satisfied before automatic delivery. */
  constraints?: BackgroundTaskConstraints;
}

/** Subscription to a host event delivered to the addon's `onEvent` handler. */
export interface SubscriptionConfig {
  /** Public event name. Unknown future event names must be ignored safely. */
  event: 'app:started' | 'plugin:installed' | 'media:started' | 'media:progress' | 'media:ended' | string;
}

/** User-editable value stored in the addon's configuration. */
export interface ConfigField {
  /** Stable key used by {@link IPluginAPI.getConfig}. */
  key: string;
  /** Editor used by the host configuration screen. */
  type: 'text' | 'password' | 'number' | 'boolean' | 'select';
  /** Human-readable field label. */
  label: string;
  /** Value used before the user saves a custom value. */
  default: string | number | boolean | readonly (string | number)[];
  /** Allowed choices when `type` is `select`. */
  options?: { label: string; value: string | number }[];
  /** Allows a select field to store more than one choice. */
  multiple?: boolean;
}

/** Input requested by the host before invoking a user action. */
export interface ActionInput {
  /** Stable key present in the `params` object passed to `onAction`. */
  key: string;
  /** Editor used by the host action dialog. */
  type: 'text' | 'password' | 'number' | 'boolean' | 'select';
  /** Human-readable input label. */
  label: string;
  /** Initial value shown when the action dialog opens. */
  default?: string | number | boolean;
  /** Allowed choices when `type` is `select`. */
  options?: { label: string; value: string | number }[];
}

/** User-triggered operation exposed by an addon. */
export interface PluginAction {
  /** Stable action identifier passed to the addon's `onAction` handler. */
  id: string;
  /** Short label displayed by the host. */
  label: string;
  /** Optional explanation of the action and its effect. */
  description?: string;
  /** Values collected before invoking the action. */
  inputs?: ActionInput[];
}

/**
 * Public manifest bundled with every StreamShare addon.
 *
 * @remarks
 * The manifest is reviewed before installation. Keep identifiers stable and
 * request only the capabilities required by the current addon version.
 */
export interface PluginManifest {
  /** Globally unique, stable addon identifier such as `com.example.my-addon`. */
  id: string;
  /** Human-readable addon name. */
  name: string;
  /** Semantic version of the addon package. */
  version: string;
  /** Semantic-version range of compatible StreamShare application versions. */
  compatibleVersion: string;
  /** Functional contract implemented by the addon entry script. */
  type: PluginType;
  /** Package-relative path to the compiled JavaScript entry file. */
  main: string;
  /** Package-relative SVG, PNG or WebP used as the plugin's visual identity. */
  icon?: string;
  /**
   * Controls whether the host may recolor the declared icon.
   *
   * `auto` lets the host choose, `monochrome` requests a host-colored
   * silhouette, and `original` preserves every color and filled area.
   * Defaults to `auto` when omitted.
   */
  iconAppearance?: PluginIconAppearance;
  /** Publisher or maintainer name shown to the user. */
  author: string;
  /** Concise user-facing description of the addon. */
  description: string;
  /**
   * Declares that every catalog entry and playback source exposed by this addon
   * is intended for adults. The host may hide the addon and its data behind
   * parental controls. Defaults to `false` when omitted.
   */
  adult?: boolean;
  /** Capabilities that require review during installation or update. */
  permissions: NetworkPermissions;
  /** Android-only persistent work. Unsupported platforms keep using interactive events. */
  backgroundTasks?: PluginBackgroundTask[];
  /** Host events delivered to the addon's optional event handler. */
  subscriptions?: SubscriptionConfig[];
  /** Persistent values editable from the host configuration screen. */
  config?: ConfigField[];
  /** Operations the user can invoke from the addon's host interface. */
  actions?: PluginAction[];
}

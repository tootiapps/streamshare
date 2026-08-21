---
title: Addon manifest reference
description: Complete reference for every supported StreamShare addon manifest property.
---

# Addon manifest reference

Every addon package contains a `manifest.json` file at its root. The manifest is the install-time contract between the addon, the StreamShare host and the user: it identifies the addon, selects its runtime contract, declares its capabilities and describes the configuration and actions shown by the host.

This page explains the contract in context. For the exact TypeScript shape, follow the SDK's [`PluginManifest`](../api/interfaces/PluginManifest.md) interface and its linked field types.

The manifest is validated before the addon is packaged or installed. Unknown top-level properties are tolerated for forward compatibility, but they are not public API unless they are described here and present in the SDK types.

## Complete example

```json
{
  "id": "com.example.catalog",
  "name": "Example catalog",
  "version": "1.2.0",
  "compatibleVersion": "^3.13.0",
  "type": "source",
  "main": "dist/index.js",
  "icon": "assets/icon.svg",
  "iconAppearance": "original",
  "author": "Example author",
  "description": "Adds an example media catalog to StreamShare.",
  "adult": false,
  "permissions": {
    "network": ["api.example.com", "*.media.example.com"],
    "extended_runtime": false
  },
  "subscriptions": [
    {"event": "app:started"}
  ],
  "config": [
    {
      "key": "region",
      "type": "select",
      "label": "Catalog region",
      "default": "eu",
      "options": [
        {"label": "Europe", "value": "eu"},
        {"label": "North America", "value": "na"}
      ]
    }
  ],
  "actions": [
    {
      "id": "refresh",
      "label": "Refresh catalog",
      "description": "Downloads the latest catalog data."
    }
  ],
  "backgroundTasks": [
    {
      "id": "daily-refresh",
      "action": "refresh",
      "intervalMinutes": 1440,
      "freshnessMinutes": 1080,
      "flexMinutes": 360,
      "runOnInstall": true,
      "runOnConfigChange": true,
      "sliceDurationMinutes": 8,
      "constraints": {
        "network": "connected",
        "requiresBatteryNotLow": true,
        "requiresStorageNotLow": true,
        "requiresCharging": false,
        "requiresDeviceIdleOnTv": false
      }
    }
  ]
}
```

Only declare optional properties that the addon actually uses. In particular, do not copy network permissions or background tasks from this example without a functional need.

## Identity and entry point

| Property | Required | Description and rules |
| --- | --- | --- |
| `id` | Yes | Globally unique and stable reverse-domain identifier, for example `com.example.catalog`. Changing it creates a different addon rather than an update. |
| `name` | Yes | Short human-readable name displayed by StreamShare. |
| `version` | Yes | Addon package version in strict semantic-version format, such as `1.2.0` or `2.0.0-beta.1`. |
| `compatibleVersion` | Yes | Semantic-version range of compatible StreamShare application versions, such as `^3.13.0`. See [addon compatibility](../compatibility.md). |
| `type` | Yes | Runtime contract implemented by the addon. Public values are `automation` and `source`; `player` is reserved and must not be used by third-party addons yet. |
| `main` | Yes | Package-relative path of the compiled JavaScript entry point. `dist/index.js` is recommended. This is an output path, not the TypeScript source path. |
| `icon` | No | Package-relative SVG, PNG or WebP file displayed by the host. See [Declaring an icon](#declaring-an-icon). |
| `iconAppearance` | No | Rendering policy for `icon`: `auto`, `monochrome` or `original`. Defaults to `auto`. |
| `author` | Yes | Publisher or maintainer name displayed to users. |
| `description` | Yes | Concise user-facing explanation of the addon's purpose. |
| `adult` | No | Set to `true` when every catalog entry and playback source exposed by the addon is intended for adults. StreamShare can then hide the addon and its data while parental controls are locked. Omitted values default to `false`. |

Paths in `main` and `icon` must stay inside the addon package. Absolute paths, URLs, parent traversal (`..`), query strings and fragments are rejected.

The `adult` declaration applies to the complete addon. It is not a per-item rating and does not replace accurate catalog metadata. An addon must not depend on this flag for access control: the host decides whether and how protected content is displayed.

The public addon contract does not require the addon to implement a PIN, maintain
an unlocked state or provide alternate artwork. Keep the manifest icon and
description suitable for a management screen that may remain visible while
content is locked. If one integration intentionally mixes public and adult
catalogs, split them into separate addons or conservatively declare the complete
addon as adult; there is currently no per-item adult declaration.

### Addon types

- `automation` implements `IAutomationPlugin` and can expose actions or react to subscribed host events.
- `source` implements `ISourcePlugin` and exposes a browsable or searchable media source.
- `player` has no public third-party contract yet. Its presence in the type union is reserved for future compatibility, not an invitation to implement it.

## Declaring an icon

Place the icon in the addon directory, preferably under `assets/`, and reference it from `manifest.json`:

```text
my-addon/
├── assets/
│   └── icon.svg
├── src/
│   └── index.ts
├── manifest.json
└── package.json
```

```json
{
  "icon": "assets/icon.svg"
}
```

The icon is optional. When present:

- its extension must be `.svg`, `.png` or `.webp`;
- its path must be relative to the package root and must not escape the package;
- the file must exist when the CLI builds the addon;
- its maximum size is 512 KiB;
- the CLI includes the `assets/` directory in the ZIP automatically. An icon declared elsewhere is included individually;
- in development mode, the same relative path is served from the development server root.

Use `iconAppearance` only when the icon's visual construction requires an
explicit rendering policy:

- `auto` lets the host adapt ordinary SVG logos to the surrounding interface;
- `monochrome` requests a host-colored silhouette and is suitable for SVG marks
  whose opaque shape forms the complete logo;
- `original` preserves the asset's colors and filled regions. Use it for badges,
  multicolor artwork and SVG files with an opaque background.

Raster images are always rendered with their original pixels. Prefer `auto`
when either adaptive or original rendering is acceptable.

## Permissions

`permissions` is required even when the addon needs no privileged capability.

| Property | Required | Description and rules |
| --- | --- | --- |
| `permissions.network` | Yes | Array of permitted network hosts. Use `[]` when no network access is required. Values are exact hosts, leading wildcards such as `*.example.com`, or `*`. Schemes, ports and paths are not allowed. |
| `permissions.extended_runtime` | No | When `true`, allows explicitly long interactive work to use the host's extended time limit. It is not required for ordinary actions and does not make a task durable. |

Network permissions are reviewed during installation or update. See [Network access](../guides/network-access.md) for matching and least-privilege guidance.

## Event subscriptions

`subscriptions` is an optional array of host events delivered to the addon's `onEvent` method.

| Property | Required | Description and rules |
| --- | --- | --- |
| `subscriptions[].event` | Yes | Event identifier such as `app:started`, `plugin:installed`, `media:started`, `media:progress` or `media:ended`. Duplicate subscriptions are rejected. |

Declaring a subscription does not invoke an event by itself. The addon must implement the appropriate event handler and safely ignore event data it does not understand.

## Configuration fields

`config` is an optional array. StreamShare uses it to present persistent, user-editable addon settings.

| Property | Required | Description and rules |
| --- | --- | --- |
| `config[].key` | Yes | Stable identifier, unique within `config`. The addon uses this key with `api.getConfig()`. |
| `config[].type` | Yes | Editor and value type: `text`, `password`, `number`, `boolean` or `select`. |
| `config[].label` | Yes | Human-readable label displayed by the host. |
| `config[].default` | Yes | Initial value. Its JSON type must match `type`; a scalar `select` accepts one option value and a multiple select accepts an array of option values. |
| `config[].options` | For `select` | Non-empty array of `{label, value}` choices. Values must be unique and each value is a string or finite number. |
| `config[].multiple` | No | Set to `true` on a `select` to let users choose several values. It is rejected on other field types. |

Configuration keys are persistent API identifiers. Rename one only with an explicit data-migration strategy.

`api.getConfig()` returns a read-only string map. The host serializes number and boolean settings, so addon code should parse or compare them explicitly (`config.enabled === 'true'`, for example). Multiple select values are serialized as a JSON array; parse them with `JSON.parse()` and validate every entry against the choices declared by the addon. This keeps configuration behavior identical across interactive and headless runtimes.

## User actions and inputs

`actions` is an optional array of operations the host can present to the user.

| Property | Required | Description and rules |
| --- | --- | --- |
| `actions[].id` | Yes | Stable action identifier, unique within the addon. It is passed to `onAction`. |
| `actions[].label` | Yes | Short user-facing action label. |
| `actions[].description` | No | Explanation of the action and its effect. |
| `actions[].inputs` | No | Values the host collects before invoking the action. Input keys must be unique within the action. |
| `actions[].inputs[].key` | Yes | Stable key in the `params` object passed to `onAction`. |
| `actions[].inputs[].type` | Yes | `text`, `password`, `number`, `boolean` or `select`. |
| `actions[].inputs[].label` | Yes | Human-readable input label. |
| `actions[].inputs[].default` | No | Initial value whose JSON type must match the input type. |
| `actions[].inputs[].options` | For `select` | Non-empty, unique `{label, value}` choices. A provided default must match one of them. |

Treat action and input identifiers as part of the public contract between the manifest and addon code.

## Background tasks

`backgroundTasks` is an optional array of durable Android work. Every task references an action declared in the same manifest.

| Property | Required | Description and rules |
| --- | --- | --- |
| `backgroundTasks[].id` | Yes | Stable task identifier, unique within the addon. |
| `backgroundTasks[].action` | Yes | ID of an entry in `actions`. Unknown action references are rejected. |
| `backgroundTasks[].intervalMinutes` | Yes | Integer repeat interval of at least 15 minutes. Execution remains inexact and controlled by the operating system. |
| `backgroundTasks[].freshnessMinutes` | No | Skip delivery while the last success is newer than this value. Integer from `0` through `intervalMinutes`. |
| `backgroundTasks[].flexMinutes` | No | Flexible execution window. Integer from `5` through `intervalMinutes`. |
| `backgroundTasks[].runOnInstall` | No | Schedule an initial one-time run after installation when `true`. |
| `backgroundTasks[].runOnConfigChange` | No | Schedule a one-time run after configuration is saved when `true`. |
| `backgroundTasks[].sliceDurationMinutes` | No | Cooperative execution slice from 1 to 9 minutes. The addon must checkpoint before yielding. |
| `backgroundTasks[].constraints` | No | Operating-system scheduling conditions described below. |
| `constraints.network` | No | `connected` or `unmetered`. |
| `constraints.requiresBatteryNotLow` | No | Defer while Android reports a low battery. |
| `constraints.requiresStorageNotLow` | No | Defer while Android reports low storage. |
| `constraints.requiresCharging` | No | Require the device to be charging. |
| `constraints.requiresDeviceIdleOnTv` | No | Require Android device-idle mode on television devices only. |

See [Background tasks](../guides/background-tasks.md) before using this capability and consult the [compatibility matrix](../compatibility.md) for currently implemented addon hosts.

## Validation APIs

The CLI and StreamShare host use the SDK's canonical runtime validator. Tools that read manifests should use `parsePluginManifest`, `assertPluginManifest` or `isPluginManifest` rather than maintaining another schema. See [Validate a manifest](../guides/manifest-validation.md).

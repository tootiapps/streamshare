# `@streamshare/plugin-sdk`

TypeScript contracts, helpers and validators for building StreamShare addons.

## Installation

```bash
pnpm add @streamshare/plugin-sdk
```

## Execution modes

Every invocation exposes its current mode through `api.runtime.mode` and its
available features through `api.runtime.capabilities`.

- `interactive` actions run while StreamShare is open. They have a default
  30-second time limit. Addons may request `permissions.extended_runtime` for
  explicitly longer actions of up to 15 minutes.
- `headless` actions are scheduled background tasks declared in
  `manifest.backgroundTasks`. They use a deliberately restricted API and may
  run while StreamShare is not open.

Addons must check capabilities rather than infer support from a platform or
application version. An optional method rejects when its corresponding
capability is unavailable.

## Background tasks

```json
{
  "permissions": {
    "network": ["api.example.com"],
    "extended_runtime": false
  },
  "backgroundTasks": [{
    "id": "daily-refresh",
    "action": "refresh_source",
    "intervalMinutes": 1440,
    "flexMinutes": 360,
    "freshnessMinutes": 1080,
    "runOnInstall": true,
    "runOnConfigChange": true,
    "sliceDurationMinutes": 8,
    "constraints": {
      "network": "connected",
      "requiresBatteryNotLow": true,
      "requiresStorageNotLow": true,
      "requiresCharging": false,
      "requiresDeviceIdleOnTv": true
    }
  }]
}
```

Scheduled intervals are inexact and have a minimum of 15 minutes on supported
platforms. `freshnessMinutes` lets a delivery reuse a sufficiently recent
successful result; `0` disables that check and the value cannot exceed
`intervalMinutes`. Manual, installation and configuration-change requests are
not skipped by freshness.

Background work must tolerate delays, retries, duplicate delivery and
interruption. Use stable task and action IDs, idempotent writes and bounded
execution slices. The invocation reason is available as `manual`, `periodic`,
`install` or `config` through `api.runtime.reason`.

### Cooperative continuation

Keep a background slice between 1 and 9 minutes. After a bounded batch:

```typescript
if (api.runtime.shouldYield()) {
  await saveCheckpoint();
  api.runtime.requestContinuation();
  return;
}
```

The next invocation runs the same action. Persist enough information to replay
a partially completed batch. Source addons can resume an unpublished catalog
with `sourceCatalog.beginSnapshot({ resume: true })`, inspect its counts with
`getSnapshotStats(snapshotId)`, publish it atomically with `commitSnapshot`, or
discard it with `abortSnapshot`.

### Background capabilities

The background-safe surface includes runtime information, configuration,
progress and notifications, logging, isolated storage, supported file writes,
source-catalog snapshots and allowlisted HTTP requests. APIs requiring direct
user interaction or an active application session remain interactive-only.

Notifications with a stable `id` can update the same progress message. Use
`saveInCenter: true` when the final state should remain available in the
application notification center.

Background tasks are currently supported by StreamShare on Android mobile and
TV. Other platforms report the capability as unavailable. Constraints such as
charging, network availability and TV idle state apply to scheduled work;
manual invocations remain subject to the capabilities reported for that run.

## Network access

Every addon request is checked against `permissions.network`. Entries contain a
host without a scheme, port or path:

- `api.example.com` allows exactly that host;
- `*.example.com` allows the apex and its subdomains;
- `"*"` allows every HTTP(S) and WebSocket host.

Prefer the narrowest possible allowlist. StreamShare presents requested
permissions to the user before installation or an update that expands access.

## Development mode

Run the addon development server with the CLI and register the displayed
`host:port` in StreamShare. A physical phone or TV must use the development
computer's reachable LAN address rather than `localhost`.

Development-mode background tasks retrieve the current development bundle on
each invocation. The server must remain reachable and every requested host must
still satisfy the addon's network permission.

## Documentation

- [Addon documentation](https://docs.tootiapps.com/addons/)
- [Manifest reference](https://docs.tootiapps.com/addons/concepts/manifest)
- [Development mode](https://docs.tootiapps.com/addons/guides/development-mode)
- [Background tasks](https://docs.tootiapps.com/addons/guides/background-tasks)

Build the package declarations with:

```bash
pnpm --filter @streamshare/plugin-sdk build
```

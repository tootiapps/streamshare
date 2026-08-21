---
title: Runtime capabilities
description: Detect which host APIs are available in interactive and headless addon executions.
---

# Runtime capabilities

`api.runtime.capabilities` is the source of truth for features available during the current invocation. Check the relevant flag before using an optional API; do not infer availability from the platform name alone.

```ts
if (api.runtime.capabilities.lists) {
  const lists = await api.lists.getAll();
  // Use the interactive Collection list API.
}
```

The capability indicates that the API is available, not that every list operation is authorized. The host filters visible lists and applies the current account's creation and usage rules. See [Work with Collection lists](../guides/lists.md).

Methods remain present on `IPluginAPI` so an addon has one stable structural contract across runtimes. Calling a method whose capability is `false` can reject with an unavailable-feature error.

## Current Android matrix

| Capability | Interactive | Headless | Covers |
| --- | --- | --- | --- |
| `configuration` | Yes | Yes | `getConfig()` |
| `notifications` | Yes | Yes | `toast()`, `dismissToast()` and action progress |
| `storage` | Yes | Yes | Isolated key-value storage |
| `files` | Yes | Yes | File read, write, stat, delete and move |
| `fileScanning` | Yes | No | `files.scanLines()` |
| `sourceCatalogWrite` | Yes | Yes | Snapshot creation, append, statistics, commit and abort |
| `sourceCatalogQuery` | Yes | No | `sourceCatalog.query()` and `queryVariants()` |
| `http` | Yes | Yes | Manifest-allowlisted `http.get()` |
| `lists` | Yes | No | Playlist and library operations |
| `backgroundTasks` | Host-dependent | Yes | Manifest-declared durable work |

Headless notifications are durable system notifications rather than temporary messages in an open user interface. APIs that require an interactive application session are not part of the headless SDK contract.

Other platforms and future clients can expose a different combination. Branch on capability flags and provide a useful fallback when a feature is optional:

```ts
if (!api.runtime.capabilities.fileScanning) {
  api.logger.info('Streaming file scans are unavailable in this runtime.');
  return;
}

const page = await api.files.scanLines('catalog.ndjson', {limit: 100});
```

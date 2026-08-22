---
title: Background tasks
description: Design durable, cooperative addon work on supported Android devices.
---

# Background tasks

Background tasks are Android-only, durable requests declared in `manifest.backgroundTasks`. The current addon host is implemented for Android mobile and TV; iOS and web addon runtimes are not yet public implementations.

```json
{
  "backgroundTasks": [
    {
      "id": "daily-refresh",
      "action": "refresh",
      "intervalMinutes": 1440,
      "flexMinutes": 360,
      "runOnInstall": true,
      "constraints": {
        "network": "connected",
        "requiresBatteryNotLow": true
      }
    }
  ]
}
```

Scheduling is inexact. The operating system may delay work because of battery, network, idle, storage, or vendor policies. Correctness must never depend on an exact execution time.

## Cooperative continuation

Process work in bounded, idempotent batches. Save a checkpoint before asking the host to continue later:

```ts
if (api.runtime.shouldYield()) {
  await saveCheckpoint();
  api.runtime.requestContinuation();
  return;
}
```

An operating system can terminate a process without a final callback. A task must be able to replay its last incomplete batch safely.

Check `api.runtime.capabilities.backgroundTasks` before presenting platform-specific behavior and use `api.runtime.reason` only to adapt presentation, not correctness. See the complete [runtime capability matrix](../concepts/runtime-capabilities.md).

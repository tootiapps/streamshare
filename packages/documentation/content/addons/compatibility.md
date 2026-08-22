---
title: Addon compatibility
description: Compatibility policy for StreamShare addon SDK versions and host applications.
---

# Addon compatibility

An addon declares its compatible StreamShare application range in `manifest.compatibleVersion`. The CLI can check a target version before packaging, and the host rejects installation when that range does not include the running application version.

## Current release-candidate matrix

| SDK | StreamShare application | Android mobile/TV interactive | Android headless | iOS | Web |
| --- | --- | --- | --- | --- | --- |
| `1.0.0` | `^3.13.0` (tested through `3.13.1`) | Supported | Supported on API 26+ | Not implemented | Not implemented |

The machine-readable copy is distributed as `@streamshare/plugin-sdk/compatibility.json`. Until the packages are explicitly published, this remains a tested release candidate rather than a public availability commitment.

Before packaging an addon, run its normal validation command and target only an application range listed in this matrix. The CLI verifies the declared range against the selected application version.

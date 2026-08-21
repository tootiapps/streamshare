---
title: Service compatibility
description: Versioning and compatibility policy for remote StreamShare services.
---

# Service compatibility

Service compatibility is governed by the protocol version in the service manifest, not by the server framework or deployment platform.

The `@streamshare/service` package ships `compatibility.json` so build tools and documentation can consume the same machine-readable matrix:

| Component | Minimum | Latest tested |
| --- | --- | --- |
| Service protocol | 1 | 1 |
| `@streamshare/service` | 1.0.1 | 1.0.1 |
| StreamShare application | 3.13.0 | 3.13.1 |

Services should return explicit protocol versions and validate their outgoing payloads during tests.

No service field is currently deprecated: the first production version has not been released yet, so pre-release consumers must migrate directly to the current contract rather than rely on compatibility aliases.

Protocol v1 therefore requires `protocolVersion`, endpoint `kind`, and semantic parameter `role` values for every behavior the application supplies automatically. Pagination uses `totalPages`; no pre-release alias is accepted.

## Current feature readiness

| Capability | Status |
| --- | --- |
| Manifest discovery and runtime validation | Tested |
| Search, exact TMDB lookup, filtering, and sorting | Tested when the corresponding parameter roles are declared |
| Browse endpoints and folder, series, or season navigation | Tested |
| Recent-content endpoint | Tested |
| Playback variants and relative URLs | Tested |
| Basic authentication | Header transport, persistence, backup, and restore tested |
| API-key authentication | Bearer-header transport, persistence, backup, and restore tested |
| Device-code authentication | Challenge, polling, QR/link presentation, token renewal, rotation, retry, persistence, backup, and restore tested |
| Response `additionalParams` | Validated by the protocol but not currently presented as an interactive follow-up form |

Do not make a production service depend on a capability marked pre-release or not production-ready.

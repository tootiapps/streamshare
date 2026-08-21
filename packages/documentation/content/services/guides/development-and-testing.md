---
title: Development and contract testing
description: Run a service locally, validate payloads, handle failures, and test it with StreamShare.
---

# Development and contract testing

The protocol is independent of the technology used to implement a service. A service only needs to expose its manifest and JSON endpoints over HTTP.

## Validate both boundaries

Use the runtime parsers in tests and immediately before returning generated payloads:

```ts
import {
  parseStreamShareResponse,
  parseStreamShareService,
  StreamShareProtocolError,
} from '@streamshare/service';

const manifest = parseStreamShareService(untrustedManifestValue);
const response = parseStreamShareResponse(untrustedResponseValue);
```

The parsers return the original value with its TypeScript type narrowed. They throw `StreamShareProtocolError` when the value violates protocol v1. Compile-time types do not replace these checks for database, upstream API, or network data.

At minimum, contract tests should cover:

- manifest parsing and unique endpoint semantics;
- each item discriminator returned by the service;
- search roles, exact TMDB lookup, filters, and sort behavior;
- pagination at empty, first, and last pages;
- every playback URL format, including relative URLs and byte-range media responses;
- upstream authentication failures, rate limits, malformed data, and timeouts.

## HTTP behavior and errors

Use `GET` query parameters or a JSON object for `POST`, matching the endpoint manifest. Return JSON with an appropriate HTTP status. A non-2xx response is treated as a failed service request; its response body may be shown as a diagnostic message but is not a stable application API. Keep errors concise and never include credentials, tokens, stack traces, local paths, or upstream secrets.

Recommended status codes include `400` for invalid request values, `401` or `403` for authentication failures, `404` for an unknown media record, `429` for rate limiting, and `502` or `503` for unavailable upstream providers.

## Local device testing

Run the service on an address reachable from the test device. On a virtual device, `localhost` refers to that device rather than to the development computer. Use the host address exposed by the emulator; a commonly used host-loopback alias is `10.0.2.2`, so a service listening on port `4046` can be configured as:

```text
http://10.0.2.2:4046/
```

A physical device must use the development computer's LAN address instead. Allow only the local development origin and port you need, and do not expose the development server to the public internet.

When the local service is protected, StreamShare keeps HTTPS as the default even on a private network. For a loopback or private-network HTTP address, the service form presents a separate consent control. Enable it only for a service and network you trust. The approval is stored only on the current device for that service origin; a service manifest cannot enable the exception itself. HTTP addresses outside a private network remain blocked for authenticated requests.

Then verify this sequence in StreamShare:

1. Add the service root URL and confirm that its public manifest is discovered.
2. For a protected local HTTP service, review and explicitly enable the private-network exception.
3. When requested, enter the detected credential type or select **Connect** to display the link, code, and QR authorization.
4. Confirm that the service name and logo load from the manifest.
5. Search by title and, when available, by exact TMDB identity.
6. Browse series, seasons, and episodes.
7. Open the source selector and verify quality, codec, and language badges.
8. Start the bundled or test media and verify seeking or byte-range playback.
9. In device-code mode, restart a deliberately stateless test service and confirm that the old session becomes **Connection required**.
10. Select **Reconnect**, approve the new code, and verify that protected browsing works again; then repeat after **Reset authentication**.

## Security checklist

- Keep upstream tokens server-side; never return them in the manifest or endpoint responses.
- Use HTTPS by default. Reserve the explicit private-network HTTP exception for local development on a trusted network.
- Never place passwords, bearer tokens, or API keys in query parameters.
- Apply timeouts, size limits, input validation, and rate limiting at the service boundary.
- Treat playback URLs as sensitive when they are signed or user-specific.
- Do not log authorization headers or complete signed URLs.

The [demonstration service](../example-service.md) is a tested reference implementation of this workflow.

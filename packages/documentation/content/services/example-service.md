---
title: Demonstration service
description: Learn from the optional public reference implementation of the StreamShare service protocol.
---

# Demonstration service

The demonstration service exercises the public service contract. It demonstrates:

- serving a service manifest;
- implementing search and browse endpoints;
- returning typed media results and pagination;
- validating configuration and protocol payloads;
- running integration tests against the service contract.

It also demonstrates server-side TMDB enrichment, movie and series discovery, season and episode navigation, relative artwork and media URLs, source qualities, byte-range playback, facets, pagination, and every supported service authentication method. The TMDB read access token remains on the server and is configured only through `TMDB_ACCESS_TOKEN`.

Set `DEMO_AUTH_METHOD` to `basic`, `apikey`, or `deviceCode` to protect the catalog endpoints while keeping the manifest public. Device-code mode provides a local authorization page, rotating refresh tokens, and short-lived bearer access suitable for end-to-end testing.

The demonstration service intentionally keeps device-code sessions in memory. Restarting it invalidates previously issued refresh tokens. On the next protected request, StreamShare marks the connection as requiring authorization; use **Reconnect** to obtain a new code and QR code. This makes restart recovery and explicit authentication reset testable, but production services should normally persist revocable sessions across routine restarts.

When testing a protected mode over a private-network HTTP URL, review and enable the explicit HTTP exception in the service form, then select **Connect**. Device-code mode displays the authorization code, link, and QR code after that confirmation. HTTPS remains required by default and for every non-private address.

The example is not the protocol itself. A compatible service can use any implementation and hosting environment as long as its HTTP behavior matches the published contract.

Use the examples in [Create your first service](./getting-started.md) and the [development guide](./guides/development-and-testing.md) to reproduce each behavior independently.

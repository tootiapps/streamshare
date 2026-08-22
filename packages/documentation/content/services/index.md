---
title: StreamShare services
description: Build remote HTTP media services with the public StreamShare service contract.
slug: /
---

# StreamShare services

A StreamShare service connects a remotely managed media catalog to StreamShare through a small HTTP contract. It publishes a manifest, accepts search or navigation requests, and returns media records and playback choices.

## What a service can provide

- title search and exact TMDB lookup;
- browsable catalogs, folders, series, seasons, and episodes;
- recently added or updated media;
- filters, sorting, facets, and paginated result sets;
- several playback variants with explicit quality, codec, language, subtitle, and size information;
- service-owned metadata and TMDB references for consistent enrichment;
- protected catalogs through the authentication modes defined by the protocol.

Typical uses include a personal media gateway, a shared household catalog, a hosted provider, an index backed by cloud storage, or a catalog assembled from several upstream systems.

## Why choose a service

A service is useful when data, credentials, indexing, or business rules must remain under the operator's control. Its behavior can be updated centrally without reinstalling an addon, expensive processing can stay server-side, and the same catalog can serve several compatible clients.

That flexibility comes with operational responsibilities: the service must remain reachable, validate every request and response, protect credentials, control latency and rate limits, and return playback URLs that the target device can access.

## Service or addon?

Choose according to where the work and trust boundary belong:

| Need | Service | Addon |
| --- | --- | --- |
| Centrally managed catalog or account | Recommended | Possible only through remote APIs |
| Server-held upstream secrets | Recommended | Not recommended |
| Offline or device-local behavior | Not suitable | Recommended |
| Local files and host-granted capabilities | Not available | Recommended |
| Immediate server-side updates for every user | Recommended | Requires an addon update |

The two models can complement each other, but they use separate public contracts:

- a service runs on infrastructure controlled by its operator;
- an addon runs in a restricted environment on the user's device;
- a service communicates only through the published HTTP protocol and does not receive addon capabilities.

Start with [your first service](./getting-started.md), understand the [request lifecycle](./protocol.md), and review [service authentication](./guides/authentication.md) before exposing protected content. The generated [service API reference](./api/index.md) contains the exact package signatures.

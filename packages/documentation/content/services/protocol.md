---
title: Service protocol
description: Public behavioral contract between StreamShare applications and remote services.
---

# Service protocol

The service manifest describes the available HTTP endpoints, their semantic roles, accepted parameters, and presentation metadata. Search or browse endpoints return a `StreamShareResponse` containing media items, playback links, pagination, and optional facets.

## Request lifecycle

1. The user configures a service root URL.
2. StreamShare requests the public service manifest without credentials and validates it.
3. When the manifest declares authentication, StreamShare requests credentials or starts the declared device-code authorization flow.
4. The manifest endpoint kinds and parameter roles determine which search, browsing, filtering, and recent-content operations are available.
5. StreamShare renews an expiring token session when necessary, then calls the selected endpoint with the declared method, parameter IDs, and configured authorization.
6. The response is validated, relative assets are resolved against the service root, and TMDB references may enrich the presentation.
7. When playback is requested, the service-provided variants are presented to the user and the selected media URL is opened.

The service remains the authority for its catalog, access policy, availability, and playback URLs. StreamShare remains the authority for navigation, presentation, source selection, and optional metadata enrichment.

## Endpoint roles

| Kind | Intended use |
| --- | --- |
| `search` | Text search, exact media lookup, filters, and sorting. A manifest may expose at most one. |
| `browse` | A user-visible catalog, collection, or navigation entry. Several are allowed. |
| `recent` | Recently added or updated content. A manifest may expose at most one. |
| `details` | A service-defined lookup reached through a navigation target or shown as a dedicated entry. |

Endpoint IDs and parameter IDs belong to the service. Semantic `kind` and `role` values let compatible clients understand them without relying on naming conventions.

## Requirements

- Serve a valid manifest matching a supported protocol version.
- Return JSON that passes the public runtime validators.
- Use stable identifiers and URLs.
- Return every useful playback variant instead of selecting one quality on behalf of the client.
- Treat request data and media URLs according to the service's own privacy and security policy.
- Preserve backward compatibility within a supported protocol major version.
- Return signed or otherwise self-contained playback URLs when media access cannot use the service request credentials.

## Deliberate boundaries

The protocol does not prescribe a programming language, hosting provider, database, indexing strategy, or upstream metadata source. It also does not proxy media through StreamShare or provide a generic remote-code mechanism. Operators retain control of their service while clients depend only on the documented HTTP behavior.

The [API reference](./api/index.md) is authoritative for exact fields and types. This page defines the higher-level behavioral expectations.

Continue with the guides for the [service manifest](./guides/manifest.md), [authentication](./guides/authentication.md), [results and playback variants](./guides/results-and-playback.md), and [development and contract testing](./guides/development-and-testing.md).

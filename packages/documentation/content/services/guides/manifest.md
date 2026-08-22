---
title: Service manifest
description: Declare endpoint semantics, parameters, authentication, and assets for a StreamShare service.
---

# Service manifest

The URL configured in StreamShare is the service root. An unauthenticated `GET` request to that URL must return a JSON manifest accepted by `parseStreamShareService()`. Keep this discovery document public even when its API endpoints are protected.

```ts
import {defineService} from '@streamshare/service';

export const manifest = defineService({
  protocolVersion: 1,
  name: 'My catalog',
  description: 'Movies available from my service.',
  logoPath: '/assets/logo.svg',
  api: [
    {
      id: 'catalog-lookup',
      kind: 'search',
      label: 'Search',
      method: 'GET',
      pathname: '/v1/catalog/lookup',
      params: [
        {id: 'term', role: 'query', label: 'Title', type: 'text'},
        {id: 'cursor-page', role: 'page', label: 'Page', type: 'text', hidden: true},
      ],
    },
  ],
});
```

The `id`, `pathname`, and parameter IDs are service-owned identifiers. StreamShare discovers their meaning from `kind` and `role`; it does not infer semantics from names.

## Manifest properties

| Property | Required | Meaning |
| --- | --- | --- |
| `protocolVersion` | yes | Must be `1`. Unsupported or missing versions are rejected. |
| `name` | yes | Human-readable service name. |
| `description` | no | Concise explanation of the content or provider. |
| `logoPath` | no | Absolute URL, path resolved relative to the configured service root, or `data:` URL. Secure clients can reject assets loaded over plain HTTP, so use an embedded asset or HTTPS outside credential-free local testing. |
| `api` | yes | Non-empty list of endpoints with unique IDs. |
| `auth` | no | Credential scheme requested when a user configures the service. |

`auth.method` accepts `basic`, `apikey`, or `deviceCode`. Basic and API-key modes select the matching credential form. Device-code mode also declares `deviceAuthorizationPath` and `tokenPath`, then presents the service-provided link, code, and QR code. The manifest never contains a username, password, key, or token. Read the [authentication guide](./authentication.md) for the complete request lifecycle.

## Endpoint properties

Every endpoint declares `id`, `kind`, `label`, `method`, `pathname`, and `params`. `pathname` starts with `/`, is relative to the service root, and contains no query string or fragment. Use parameters for request values.

The optional `hidden` flag prevents an endpoint from appearing as a top-level browsing entry; it does not disable calls made through search or navigation results.

| `kind` | Purpose | Cardinality |
| --- | --- | --- |
| `search` | Search and exact TMDB lookup. | Zero or one. |
| `browse` | User-visible catalog or navigation entry. | Zero or more. |
| `recent` | Recently added or updated media. | Zero or one. |
| `details` | Service-defined detail lookup. | Zero or more. |

Non-hidden endpoints can appear as top-level navigation entries. Use `hidden: true` for endpoints intended only as navigation targets or application-supplied lookups. A `details` endpoint has no special response shape in protocol v1; it returns the same `StreamShareResponse` as every other endpoint.

### Global search versus browsing

The optional `search` endpoint is the service-wide discovery contract. When it is present, StreamShare can include the service in the unified Movies, Series, and Other sections and in global text search. The endpoint must apply every advertised semantic role to the complete matching result set before pagination. In particular, a genre, year, media type, or sort must not be applied only to the current page.

Do not advertise a role the endpoint cannot honor consistently. A service with no `search` endpoint remains browseable through its declared catalog entries, but it is not included in global search.

`browse`, `recent`, and `details` endpoints are service-owned views. Their labels, ordering, accepted parameters, and navigation targets define their behavior. StreamShare does not reinterpret a **Top rated**, folder, or similar browsing entry as a global search endpoint, and does not inject undeclared filters into it.

## Parameters and roles

A parameter is either free-form `text` or a `select` with unique `{label, value}` options. `required`, `hidden`, `description`, and a default `value` are optional. Select parameters may set `multiple`.

Each semantic role may occur at most once in an endpoint:

| Role | Value sent by StreamShare |
| --- | --- |
| `query` | User-entered search text. |
| `mediaType` | `movie`, `series`, `season`, `episode`, or another option advertised by the service. |
| `tmdbId` | Exact TMDB movie or parent-series ID. |
| `genre` | Comma-separated TMDB genre IDs. |
| `year` | Four-digit production year. |
| `season`, `episode` | One-based episode coordinates. |
| `seriesTitle` | Parent-series title when available. |
| `sort` | A supported sort option such as `date`, `title`, `rating`, or `popularity`. |
| `minimumVotes` | Minimum vote count used with rating sorts. |
| `page`, `limit` | One-based page and requested item count. |

Unknown parameter IDs remain valid for service-specific forms, but the application only supplies automatic values through declared roles.

Roles are endpoint-local declarations but search support is service-wide: the single `search` endpoint describes the combinations available to unified discovery. Keep the contract simple by omitting unsupported roles rather than returning partially filtered pages.

For `GET`, values are serialized as query parameters. For `POST`, values are sent as a JSON object. Parameter values are strings at the HTTP boundary. A multi-select value must use the representation defined by the service; comma-separated values are recommended when the role already uses that convention.

See the generated [`StreamShareService`](../api/interfaces/StreamShareService.md) and [`APIEndpoint`](../api/interfaces/APIEndpoint.md) references for the exact TypeScript contract.

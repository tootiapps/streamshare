# `@streamshare/service`

Canonical TypeScript contract for HTTP services consumed by StreamShare.

This package is intentionally independent from `@streamshare/plugin-sdk`:

- a **service** is a remote HTTP API that returns JSON;
- a **plugin** runs inside the StreamShare plugin sandbox and uses host capabilities.

Keeping the protocols separate prevents server projects from depending on the plugin runtime. The StreamShare application imports this package directly, so service authors and the application always compile against the same definitions.

## Install

```bash
pnpm add @streamshare/service
```

## Define the manifest

```ts
import { defineService } from '@streamshare/service';

export const service = defineService({
  protocolVersion: 1,
  name: 'My service',
  logoPath: '/assets/logo.svg',
  api: [
    {
      id: 'search',
      kind: 'search',
      label: 'Search',
      method: 'GET',
      pathname: '/search',
      params: [
        { id: 'q', role: 'query', label: 'Query', type: 'text' },
        { id: 'page', role: 'page', label: 'Page', type: 'text', hidden: true },
      ],
    },
  ],
});
```

`defineService()` returns plain JSON and preserves literal TypeScript types. No class instance or serialization step is required.

Protocol v1 requires `protocolVersion` and an explicit `kind` on every endpoint. Parameter IDs are service-defined; the application maps automatic values exclusively through each parameter's `role`. Do not depend on conventional IDs such as `search`, `q`, or `page` being inferred.

## Protect the service

The public manifest may declare HTTP Basic credentials, a static API key, or a device-code token session. Device-code authentication is designed for link and QR authorization followed by rotating access and refresh tokens:

```ts
auth: {
  method: 'deviceCode',
  deviceAuthorizationPath: '/auth/device',
  tokenPath: '/auth/token',
}
```

The package exports runtime parsers for the device challenge, polling response, and token grant. The root manifest remains public; protect only the catalog API endpoints.

## Return results

```ts
import type { StreamShareResponse } from '@streamshare/service';

const response: StreamShareResponse = {
  items: [
    {
      type: 'movie',
      title: 'Example',
      tmdb: { id: 123, type: 'movie' },
      links: [{ href: 'https://media.example/movie.m3u8', quality: '1080p' }],
    },
  ],
  pagination: {
    currentPage: 1,
    itemsPerPage: 50,
    totalPages: 1,
    totalItems: 1,
  },
  facets: {
    genreTmdbIds: [28],
    years: [2026],
  },
};
```

`PlayLink.href` may be an absolute URL or a URL relative to the service manifest. Every link is exposed as an independent playable variant in the source selector, so services should return all available qualities/languages instead of selecting one server-side.

### Host metadata enrichment

A stable TMDB reference is the minimum recommended metadata contract. The application uses it to populate and cache the localized title, overview, poster, backdrop, genres and runtime:

- movies: `tmdb: { id: movieId, type: 'movie' }`;
- series and seasons: `tmdb: { id: seriesId, type: 'tvShow' }`;
- episodes: `tmdb.id` is the parent series ID and `tmdb.episodeId` is the episode ID when known.

Metadata already returned by the service remains immediately usable. Missing TMDB cache entries are downloaded in the background and the loaded Media Hub items are refreshed in place.

Facet values are TMDB numeric IDs and years. They must be unique integers. Paginated endpoints return `pagination.totalPages` when the total page count is known.

## Runtime validation

TypeScript cannot validate JSON received over the network. The package therefore exposes runtime guards:

```ts
import { parseStreamShareResponse, parseStreamShareService } from '@streamshare/service';

const manifest = parseStreamShareService(await manifestResponse.json());
const results = parseStreamShareResponse(await searchResponse.json());
```

Invalid payloads throw `StreamShareProtocolError` with a protocol-oriented message.

The StreamShare service documentation includes a complete development workflow and a reviewed Express reference implementation.

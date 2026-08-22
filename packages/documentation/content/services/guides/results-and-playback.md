---
title: Results and playback variants
description: Return media, TMDB references, navigation targets, quality labels, and pagination.
---

# Results and playback variants

Every endpoint returns a `StreamShareResponse`. Its `items` array uses the `type` discriminator to distinguish playable media from navigation containers.

| Item type | Playable | Required identity |
| --- | --- | --- |
| `movie` | yes | At least one `links` entry. |
| `episode` | yes | `season`, `episode`, and at least one `links` entry. |
| `unclassified` | yes | At least one `links` entry. |
| `series` | no | `title` and a TV-show TMDB reference. |
| `season` | no | `title`, `seasonNumber`, and a TV-show TMDB reference. |
| `folder` | no | `title` and an endpoint navigation target. |

## Common presentation metadata

Every result may provide `title`, `tagline`, `poster`, `backdrop`, `rating`, `year`, `popularity`, `voteCount`, and `productionDate`. Artwork URLs may be absolute or relative to the configured service root. Use HTTPS for remotely hosted artwork.

The runtime validator applies these constraints:

- `rating` is between `0` and `10`;
- `year` is a four-digit integer;
- `voteCount` is a non-negative integer;
- playable items contain at least one valid link;
- season and episode numbers are one-based positive integers.

Provide `productionDate` in `YYYY-MM-DD` form. Protocol v1 describes that format, although the current runtime validator only verifies that the value is a string.

Prefer stable identity over copied presentation data. Service-provided metadata remains valuable for unmatched or provider-specific records, but stable external identifiers improve deduplication and presentation consistency.

## Use TMDB as the stable metadata reference

When a matching TMDB record exists, return its ID instead of copying all artwork and descriptive metadata. StreamShare can enrich the result consistently with the rest of the application.

```ts
const movie = {
  type: 'movie' as const,
  title: 'Example movie',
  tmdb: {id: 603, type: 'movie' as const},
  links: [{href: '/assets/demo.mp4'}],
};
```

For an episode, `tmdb.id` identifies the parent series and `tmdb.episodeId` identifies the episode. A series or season uses `type: 'tvShow'`. Service-provided `poster`, `backdrop`, `tagline`, `rating`, `year`, and `productionDate` remain useful when TMDB has no match or before enrichment completes.

## Describe each playback variant

Return one `PlayLink` for every variant the user may select. Do not hide quality decisions inside an opaque title.

```ts
const links = [
  {
    href: '/media/example-1080p.mp4',
    title: 'French 1080p',
    quality: '1080p',
    codec: 'H.264',
    languages: ['fr'],
    subtitles: ['fr', 'en'],
    size: 2_400_000_000,
  },
  {
    href: 'https://cdn.example/media/example-2160p.m3u8',
    title: 'Original 4K',
    quality: '2160p',
    codec: 'H.265',
    languages: ['en'],
    metadata: [
      {label: 'HDR', value: 'Dolby Vision', view: {type: 'text', color: 'tertiary'}},
    ],
  },
];
```

Relative media URLs are resolved against the configured service root. Custom schemes may be passed to a compatible player. `expiresAt` can describe an expiring signed URL and `size` is expressed in bytes.

Service request credentials are not automatically reusable by arbitrary playback hosts. Protected media should use a self-contained, short-lived signed URL. See [Service authentication](./authentication.md#playback-access-is-separate).

The source selector currently derives its primary badges from `quality`, `codec`, and `languages`. A parseable `filename` can provide the same information, but structured fields are preferred because they are explicit and language-independent. Extra `metadata` is preserved by the protocol for richer clients; do not rely on it as the only place for quality or codec.

## Navigation

`series`, `season`, and `folder` results can point to a manifest endpoint and prefill its parameters:

```ts
const season = {
  type: 'season' as const,
  title: 'Season 1',
  seasonNumber: 1,
  tmdb: {id: 1399, type: 'tvShow' as const},
  endpoint: {
    id: 'catalog-lookup',
    paramsValues: {mediaType: 'episode', tmdbId: '1399', season: '1'},
  },
};
```

Keys in `paramsValues` are endpoint parameter IDs, not semantic roles. Values are always strings.

## Pagination and facets

Use one-based pagination. `currentPage` and `itemsPerPage` are required when `pagination` is present; `totalItems` and `totalPages` are optional when the service cannot calculate totals. Return unique integer TMDB genre IDs and production years in `facets`.

Filtering and sorting happen before pagination. If a request combines a keyword with a genre or year, page 1 must contain the first matching items from the complete filtered result set—not the subset that happened to match inside an upstream page. When an upstream provider cannot calculate the final count cheaply, omit `totalItems` and only advertise another page while one is known to exist.

```ts
const response = {
  items,
  pagination: {currentPage: 1, itemsPerPage: 50, totalItems: 84, totalPages: 2},
  facets: {genreTmdbIds: [12, 28], years: [2026, 2025]},
};
```

Validate the final object with `parseStreamShareResponse()` or `assertStreamShareResponse()` before it leaves the service.

## Dynamic follow-up parameters

`additionalParams` can describe extra parameters discovered from a response. Protocol v1 validates this field and requires unique parameter IDs, but current applications do not present it as a general interactive follow-up form. Do not depend on it for essential navigation or playback.

For interoperable flows, declare stable inputs in the manifest and use item `endpoint.paramsValues` to carry service-owned navigation state. Treat `additionalParams` as reserved for compatible clients that explicitly advertise support.

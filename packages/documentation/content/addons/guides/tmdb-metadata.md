---
title: TMDB metadata and source addons
description: Let StreamShare enrich source results while keeping playback and availability under addon control.
---

# TMDB metadata and source addons

TMDB metadata enrichment belongs to the StreamShare host. A source addon normally
provides stable media identity and availability; the application can then add
localized titles, summaries, artwork, genres, ratings, dates and runtimes from its
own TMDB integration.

The addon must not copy an application TMDB credential or depend on a private
StreamShare endpoint. It can participate by returning public identifiers.

## Provide the right identity

| Returned item | Identity used for enrichment |
| --- | --- |
| Movie | `tmdbId` for the movie |
| Series | `tmdbId` for the series |
| Season | `seriesTmdbId` and `seasonNumber` |
| Episode | `seriesTmdbId`, `seasonNumber` and `episodeNumber` |

Keep the addon `id` stable as well. TMDB identity enriches and deduplicates media,
while the addon ID remains the key passed back to `resolvePlayback()`.

```ts
const item: SourceMediaItem = {
  id: 'provider:movie:42',
  type: 'movie',
  title: 'Fallback title',
  isContainer: false,
  tmdbId: 10378,
};
```

The title remains a useful fallback. When no TMDB ID is known, StreamShare may try
a best-effort title and year match, but explicit identifiers are faster and avoid
ambiguous matches.

Only return an identifier that the source can assert for that media. StreamShare
may use an addon-provided TMDB, IMDb or content hash as exact cross-source identity.
A host match inferred from title and year can improve presentation, but is not used
as proof for cross-source merging or hierarchy lookup. Ambiguous records therefore
remain as separate results rather than risk combining different media.

## Host enrichment is not source lookup

Two related behaviors must not be confused:

- **Host enrichment:** returning `tmdbId` or `seriesTmdbId` allows StreamShare to
  decorate results. This works without `supportsTmdbLookup`.
- **Direct source lookup:** setting `supportsTmdbLookup: true` promises that the
  addon applies `targetTmdbId` and relevant `parentTmdbId` criteria before
  pagination.

```ts
const matching = items.filter((item) => {
  if (criteria.targetTmdbId && item.tmdbId !== criteria.targetTmdbId) return false;
  if (criteria.parentTmdbId && item.seriesTmdbId !== criteria.parentTmdbId) return false;
  return true;
});
```

Advertise direct lookup only when this behavior is implemented. It lets source
selection ask whether the addon has playable media for a movie, series or episode
already identified by the application.

During source selection, `targetSourceItemId` may also contain the opaque ID that
the receiving source previously returned for the selected logical item. A source
should prefer its own stable ID over the display title, because host enrichment may
replace or localize that title. This hint does not imply `supportsTmdbLookup`.

## Preserve hierarchy ownership

For a unified series or season, StreamShare expands each attached source with the
opaque container ID that source originally returned. Other active sources are
queried only when a trusted parent TMDB identity is available and they advertise
`supportsTmdbLookup`. A source that supports neither route is skipped for that
level; it is not searched by title as a fallback.

Consequently, `browse(parentId)` must treat `parentId` as an exact source-owned
container identity, and direct TMDB lookup must return children of the requested
parent only. A child carrying a different explicit parent identity can be ignored
by the host. Keeping stable container IDs across refreshes and pagination is what
allows source-native and TMDB-aware hierarchies to coexist safely.

## Decide which fields the source owns

TMDB describes media; the source describes access to it. The source should remain
authoritative for:

- its stable item ID and container hierarchy;
- availability and playback resolution;
- required playback headers;
- source, quality, encoding and language labels;
- source-specific artwork or metadata that must override a generic presentation.

Do not download TMDB artwork merely to return it unchanged. Let the host select
the appropriate image size, language and cache policy. When the request contains
`noEnrich: true`, avoid optional or expensive metadata work; the host may still
use metadata already present in its cache.

## Network permissions and credentials

Returning TMDB IDs requires no addon network permission. The application's TMDB
configuration remains host-owned. If an addon deliberately contacts another
metadata API itself, it must declare only the required domains and manage its own
authorization; that is a separate integration from StreamShare enrichment.

The [Example Catalog Source](../examples/catalog-source-addon.md) demonstrates both
host enrichment and direct TMDB lookup without embedding credentials in addon code.

---
title: Example Catalog Source
description: Explore a deterministic reference implementation of every public source-addon method.
---

# Example Catalog Source

The Example Catalog Source is the maintained reference for the public `source`
contract. It combines Blender Foundation open movies carrying TMDB identifiers
with a deterministic fictional series hierarchy and a generic-video record. The
addon performs no network request and depends only on the published addon
contract.

## Manifest

```json
{
  "id": "com.tootiapps.streamshare.catalog-example",
  "name": "Example Catalog Source",
  "version": "1.0.0",
  "compatibleVersion": "^3.13.0",
  "type": "source",
  "main": "dist/index.js",
  "author": "TootiApps",
  "description": "A deterministic catalog demonstrating the public source-addon contract.",
  "permissions": {
    "network": []
  }
}
```

An empty network allowlist is intentional: the example never calls `api.http`.
StreamShare enriches movie records through its own TMDB integration and opens the
Blender media URL only after playback resolution. The fictional episode URLs under
`example.com` remain non-working placeholders.

## Source identity

`getSourceInfo()` advertises exactly the implemented behavior. In particular, the
example supports local type/year filtering and direct TMDB lookup, but does not
claim genre filtering.

```ts
getSourceInfo(): SourceInfo {
  return {
    id: 'example-catalog',
    name: 'Example Catalog',
    isAvailable: true,
    capabilities: {
      supportsSearch: true,
      supportsBrowse: true,
      supportsTypeFilter: true,
      supportsGenreFilter: false,
      supportsYearFilter: true,
      supportsTmdbLookup: true,
      supportedSorts: ['relevance', 'date', 'rating', 'title'],
      supportedTypes: ['movie', 'series', 'season', 'episode', 'folder', 'video'],
    },
  };
}
```

## TMDB enrichment and direct lookup

The movie records intentionally omit artwork, overview, genres and rating. Their
stable TMDB IDs let StreamShare provide those fields in the current application
language:

```ts
{
  id: 'movie:big-buck-bunny',
  type: 'movie',
  title: 'Big Buck Bunny',
  isContainer: false,
  tmdbId: 10378,
  productionYear: 2008,
}
```

The source also advertises `supportsTmdbLookup: true` because it applies
`targetTmdbId` and `parentTmdbId` criteria before pagination. Merely returning a
`tmdbId` for host enrichment would not be enough to advertise this capability.
See [TMDB metadata and source addons](../guides/tmdb-metadata.md) for the complete
distinction.

The generic-video record intentionally has no TMDB identity. It demonstrates
that `video` is a first-class playable type when a source advertises it:

```ts
{
  id: 'video:cosmos-livestream',
  type: 'video',
  title: 'Cosmos Livestream',
  isContainer: false,
  qualityLabel: '1080p live',
  language: 'VO',
}
```

## Source-selection metadata

Every playable demonstration item provides structured technical metadata. These
labels are illustrative and show how the source-selection interface presents each
field independently:

```ts
{
  id: 'episode:orbit:1:1',
  type: 'episode',
  title: 'Arrival',
  isContainer: false,
  seasonNumber: 1,
  episodeNumber: 1,
  resolution: '2160p',
  source: 'WEB-DL',
  encoding: 'HEVC',
  language: 'MULTI',
}
```

The reference catalog exposes one playable representation per item, so it does not
advertise `supportsPlaybackVariants`. A provider with several encodes should return
one logical item during discovery and expand it into stable variant IDs only when
`isSourceSelection` is requested. See [Describe playback quality](../guides/source-addons.md#describe-playback-quality).

## Search and pagination

The reference catalog filters and sorts the complete result before applying a
bounded page. Its next-page token is a string offset, but consumers must treat it
as opaque.

```ts
async search(criteria: SourceSearchCriteria, pageToken?: string | number) {
  const matchingItems = filterItems(criteria);
  const result = paginate(matchingItems, pageToken, criteria.limit);
  result.facets = {
    years: [...new Set(matchingItems
      .map((item) => item.productionYear)
      .filter((year): year is number => year !== undefined))]
      .sort((left, right) => right - left),
  };
  return result;
}
```

## Browse hierarchy

The root contains `Movies`, `Series` and `Videos` folders. Selecting the example
series navigates through a season to two playable episodes. Unknown parents
return an empty page rather than leaking an implementation error.

## Playback resolution

Only known, playable logical IDs resolve. Containers and unknown IDs fail clearly.

```ts
async resolvePlayback(sourceItemId: string): Promise<SourcePlaybackInfo> {
  const url = PLAYBACK_URLS[sourceItemId];
  if (!url) throw new Error(`No playable media exists for '${sourceItemId}'.`);
  return {url};
}
```

The movie map uses openly distributed Blender Foundation resources. Replace every
URL with media you own or are authorized to distribute when adapting the example.
The fictional episode URLs are placeholders and are not expected to play.

## Validate locally

From the example project directory:

```bash
pnpm validate
pnpm test
pnpm dev
```

The tests cover capabilities, hierarchy, filtering, sorting, pagination, recents
and playback resolution. Follow [Build a source addon](../guides/source-addons.md)
for the design rules behind each method.

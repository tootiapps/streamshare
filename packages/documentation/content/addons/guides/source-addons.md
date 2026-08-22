---
title: Build a source addon
description: Model searchable media, containers, pagination and playback through the public source contract.
---

# Build a source addon

A source addon exposes logical media to StreamShare without writing into the
application database. The host asks the addon what it supports, requests bounded
pages of media and resolves a selected logical item only when playback is needed.

## Lifecycle

One source invocation follows this sequence:

1. StreamShare creates an isolated addon instance and calls `onInit(api)`.
2. `getSourceInfo()` returns stable identity, availability and capabilities.
3. The host calls `search()`, `browse()` or `getRecent()` according to those capabilities.
4. When the user selects playable media, `resolvePlayback(sourceItemId)` returns the resource.

An addon must not perform expensive synchronization in `getSourceInfo()`. Return
`isAvailable: false` when required configuration or local state is missing.

## Advertise only implemented capabilities

[`SourceCapabilities`](../api/interfaces/SourceCapabilities.md) controls which
operations and filters the host may present. A `true` flag is a behavioral promise:
the corresponding criteria must be applied before pagination.

For example, a source that filters types and years but has no metadata-provider
lookup should report:

```ts
capabilities: {
  supportsSearch: true,
  supportsBrowse: true,
  supportsTypeFilter: true,
  supportsGenreFilter: false,
  supportsYearFilter: true,
  supportsTmdbLookup: false,
  supportedSorts: ['relevance', 'date', 'rating', 'title'],
  supportedTypes: ['movie', 'series', 'season', 'episode', 'folder', 'video'],
}
```

## Keep logical IDs stable

Every [`SourceMediaItem`](../api/interfaces/SourceMediaItem.md) needs an ID that
remains stable across searches, pages and application restarts. StreamShare passes
that ID back to the addon for browsing and playback. Do not use a page position,
translated title or temporary URL as the logical ID.

Set `isContainer: true` for folders, series and seasons that should open another
browse level. Return playable movies and episodes with `isContainer: false`.
Use `video` with `isContainer: false` for generic playable content that has no
movie or episodic TMDB identity, such as a documentary feed or television clip.
Its stable `id` follows the same `resolvePlayback()` lifecycle as other playable
items. Advertising `video` in `supportedTypes` lets the host include the source
in generic-video searches.

## Filter, sort, then paginate

Apply every supported criterion and the requested sort before slicing a page.
Treat `pageToken` as opaque at the API boundary: your addon may use an offset,
cursor or signed provider token, while the host passes it back unchanged.

Normalize `rating` to the inclusive zero-to-ten scale used by the source
contract. For example, multiply a five-star provider score by two. Omit the field
when the provider has no reliable rating instead of substituting zero.

```ts
const hasMore = offset + limit < matchingItems.length;

return {
  items: matchingItems.slice(offset, offset + limit),
  hasMore,
  nextPageToken: hasMore ? String(offset + limit) : undefined,
};
```

Keep pages bounded even when the host omits `limit`. Facets must describe the
matching result set, not only the current page.

## Separate discovery from playback

Search and browse should return logical metadata. Resolve the final URL and any
required HTTP headers in `resolvePlayback()` only after the user selects an item.
Reject unknown IDs and containers instead of returning a guessed resource.

When source selection uses a text-query fallback, verify the returned title, year
and episodic context before attaching variants to the selected media. Never assume
that the first remote search result is the requested item. Prefer the addon's own
`targetSourceItemId`, and keep every returned ID independently resolvable after an
addon reload rather than relying on a previous in-memory search result.

Return media request headers through `SourcePlaybackInfo.headers`. StreamShare
forwards them to playback targets that support custom headers, but external targets
may differ; test each platform the addon claims to support. Resolve signed or
short-lived media URLs at playback time instead of storing them as stable IDs.

Network permissions cover requests performed by addon APIs such as `api.http`.
They do not replace the developer's responsibility to distribute only media and
credentials they are authorized to expose.

## Describe playback quality

Playable [`SourceMediaItem`](../api/interfaces/SourceMediaItem.md) records can
provide the metadata rendered in source selection:

| Field | Example | Meaning |
| --- | --- | --- |
| `resolution` | `1080p`, `2160p` | Video resolution or quality tier |
| `source` | `WEB-DL`, `BluRay` | Distribution or provider origin |
| `encoding` | `H.264`, `HEVC`, `AV1` | Video codec or encoding |
| `language` | `MULTI`, `VO`, `VOSTFR` | Audio or content-language label |
| `qualityLabel` | `1080p WEB-DL HEVC` | Composite fallback for legacy or unstructured data |
| `tags` | `[{label: 'Host A', color: '#38BDF8'}]` | Short addon-defined badges for provider-specific metadata |

Prefer the structured fields whenever they are known. StreamShare renders them as
separate badges and uses `qualityLabel` only when resolution, source and encoding
are absent.

```ts
{
  id: 'provider:movie:42',
  type: 'movie',
  title: 'Example movie',
  isContainer: false,
  resolution: '2160p',
  source: 'WEB-DL',
  encoding: 'HEVC',
  language: 'MULTI',
  tags: [{label: 'Host A', color: '#38BDF8'}],
}
```

Keep `source` for the distribution origin rather than the hosting provider. Use
`tags` when a provider, edition or other source-specific value needs its own
badge. Tag colors are optional six-digit hexadecimal values. Hosts validate
colors, limit the number and length of tags, and choose readable foreground
text automatically.

For several playable variants of the same media, keep one logical record in normal
search and browse results. Advertise `supportsPlaybackVariants: true`, then return
one item per variant when `search()` receives `isSourceSelection: true`. Each
variant needs a stable distinct `id`; StreamShare passes the selected variant ID to
`resolvePlayback()`.

When the selected media already came from the receiving source,
`targetSourceItemId` contains that source's previous opaque item ID. Prefer it over
`query` to locate the logical record: host enrichment can localize or replace the
displayed title before source selection. The value is source-specific and must not
be interpreted by another source. A returned variant can copy `targetTmdbId` when
the source ID confirms that it belongs to that requested media. Do not copy the
requested metadata ID onto an unverified text-search result merely to force a
match.

For addons backed by `api.sourceCatalog`, translate `targetSourceItemId` to the
catalog query's exact `mediaId`; do not combine that exact lookup with enriched
title or year filters.

Do not advertise playback variants when every logical media item has only one
playable representation. Missing structured metadata is displayed as an unknown
quality rather than being guessed by the interface.

For rich titles, artwork and episode metadata, follow [TMDB metadata and source
addons](./tmdb-metadata.md). Returning a TMDB identifier enables host enrichment;
it does not require embedding TMDB credentials in the addon.

## Start from the reference implementation

The [Example Catalog Source](../examples/catalog-source-addon.md) demonstrates the
complete lifecycle with deterministic in-memory data, two-level pagination and no
external dependency. Its contract tests are suitable as a starting point for a
real provider adapter.

When the provider is queried on demand instead of synchronized into a local
catalog, continue with [Adapt a remote catalog](./remote-source-addons.md) for
variant loading, hierarchy, facets, configuration and HTTP limitations.

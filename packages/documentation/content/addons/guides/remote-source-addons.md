---
title: Adapt a remote catalog
description: Design a source addon that queries and parses an authorized remote catalog without maintaining a local index.
---

# Adapt a remote catalog

A source addon can translate an authorized website or remote catalog directly into
the StreamShare source contract. This design is useful when fresh results matter
more than offline browsing and the provider already exposes bounded search,
pagination and detail pages.

It also has deliberate limits. Without a local index, the addon only knows what it
has fetched. It must avoid claiming global filters, counts or availability that
cannot be derived from the provider response.

## Audit the provider before coding

Map the provider behavior to the public source contract before selecting HTML
elements or writing parsers:

| Provider behavior | Source contract |
| --- | --- |
| Search or category result | `search()`, `browse()` or `getRecent()` |
| Result-page cursor or page number | opaque `pageToken` |
| Movie or generic video | playable logical item |
| Series page | `series` container |
| Season page or section | `season` container |
| Episode row | playable `episode` item |
| Quality, language or edition page | playback variant candidate |
| Hosting-provider link | URL returned by `resolvePlayback()` |

Record which filters are applied by the provider before pagination, whether item
IDs survive sorting and page changes, and whether variants are present on one page
or linked from several pages. Test missing fields, empty pages and changed markup;
the most complete example is rarely representative of the whole catalog.

Only adapt content and endpoints you are authorized to access and expose.

## Separate logical media from playback variants

Normal discovery should return one logical item for a movie or episode. Do not
expand every quality and hosting provider into duplicate Media Hub results.

When the user opens source selection, StreamShare sends
`isSourceSelection: true`. A source advertising `supportsPlaybackVariants` can
then fetch the selected detail page and return one item per available variant.
Prefer `targetSourceItemId` over a display title: titles may have been localized
or enriched after discovery.

This separation keeps ordinary search bounded:

1. Fetch one requested result page.
2. Parse logical media and stable detail locators.
3. Fetch variant pages only for the selected item.
4. Return distinct stable IDs for the resulting variants.
5. Resolve only the chosen variant URL in `resolvePlayback()`.

If variants are split across several linked pages, deduplicate their URLs before
fetching them and use bounded concurrency. The source methods return a complete
promise; the current contract does not emit variants progressively. Avoid opening
every detail page during discovery just to prepare a source selector that the user
may never open.

`SourcePlaybackInfo` describes a URL, optional headers and playback hints. It does
not classify URLs as direct, external or redirector links. Return the
source-supported URL; do not invent an undocumented URL category in the addon.
Resolve expiring or signed URLs only after the user selects a variant.

## Make identity globally stable

An ID must be unique within the complete source, not merely within the current
page or parent. For example, `season:1` and `episode:1` collide as soon as a second
series is opened. Include stable provider identity at every level:

```text
series:<provider-series-id>
season:<provider-series-id>:<season-number>
episode:<provider-series-id>:<season-number>:<episode-number>
variant:<provider-release-id>:<provider-link-id>
```

When no provider ID exists, derive an opaque ID from a normalized canonical detail
locator. Do not use an array position, a title alone or a temporary image URL.
Keep any locator needed for later browsing or source selection recoverable from
the ID or from addon-owned state.

Return explicit artwork for each item when the provider owns that artwork. A
season or episode must not rely on a previously opened series remaining in the
interface. Artwork URLs must be absolute and directly retrievable: source media
items cannot attach request headers to image fields. If images require a session,
referer or authorization header, prefer host metadata enrichment or another
authorized public image URL.

## Model series as a real hierarchy

Do not flatten series into a single playable record when the provider exposes
seasons and episodes. A typical hierarchy is:

```text
series (container)
└── season (container)
    └── episode (playable logical item)
```

Some providers place links to other seasons inside a season page. Parse those
links as sibling season containers rather than treating the current page as the
complete series. Include `seriesTmdbId`, `seasonNumber` and `episodeNumber` when
known so the host can enrich each level correctly.

## Advertise only filters the provider really applies

A capability flag promises that the criterion is applied to the full matching
result before pagination. If the remote endpoint supports year and type but not a
reliable genre mapping, advertise only year and type.

Facets have the same scope rule. The years or genres found on page 1 are not the
facets of a ten-page result set. Omit `facets`, or honor `noFacets`, unless the
provider returns aggregate values or the addon has inspected the complete bounded
result. Partial facets are more misleading than no facets.

Propagate the provider cursor or page number through an opaque `pageToken` and
return bounded pages. Do not scan every remote page to simulate a capability that
the provider does not expose.

## Keep preferences, scope and exclusions distinct

Configuration names must describe their actual effect:

- A **preference** changes ordering. Non-preferred but valid variants remain
  available.
- A **selection** or **allowed set** deliberately limits the requested qualities
  or languages.
- An **ignore list** excludes matching providers.
- A **maximum** truncates results only when the user selects a non-zero limit.

Neutral defaults are usually the least surprising: return all valid variants,
ignore no provider and apply no maximum. Sort preferred languages, release origins
and hosting providers first, preserving the provider order as the final tie-break.

Use manifest `select` fields for stable, closed vocabularies. For values controlled
by a remote provider and likely to evolve, a normalized comma-separated text field
can remain forward-compatible. Trim values, compare case-insensitively and ignore
empty entries. Unknown providers should remain available unless the user explicitly
excluded them.

## Parse defensively

Remote markup is not a versioned API. Keep transport, parsing and contract mapping
separate so each can be tested independently.

- Convert relative links and artwork to absolute URLs against the configured base
  URL.
- Prefer semantic attributes and stable link patterns over visual positions.
- Accept missing optional metadata and reject records without stable identity.
- Normalize whitespace, entities, quality labels and provider names in one place.
- Deduplicate variants by their stable link identity, not only by their label.
- Preserve unknown release origins and hosting providers as displayable values.
- When player data is embedded in page scripts, associate the parsed URL with the
  current media and variant; do not return the first media-looking URL in the page.
- Log bounded diagnostic context without URLs containing credentials or tokens.

Build parser tests from small, sanitized fixtures that cover each known page shape.
Include at least a changed wrapper, missing artwork, an unknown provider, several
seasons, duplicate links and a result with no playable variants.

## Understand the HTTP boundary

`api.http.get()` retrieves text through the manifest-constrained HTTP capability.
It is suitable for server-rendered pages and documented text endpoints. It is not
a programmable browser session and provides no public contract for executing page
JavaScript, solving challenges, completing interactive authentication or sharing
browser cookies.

Development-time inspection in a browser can help identify the requests and markup
used by an authorized provider, but it does not add those browser capabilities to
the addon runtime. If access depends on an interactive challenge or complex client
execution, use an authorized stable endpoint or report the source unavailable;
do not depend on private host behavior.

A user-editable base URL does not automatically extend `permissions.network`.
Declare the finite allowed hosts whenever possible. If arbitrary origins are an
essential product requirement, the current manifest requires the broad `*`
permission, which users can review and which should be explained clearly.

## Use TMDB enrichment without coupling availability to it

Return provider TMDB or IMDb identifiers when they are explicitly available. If
they are absent, retain a clean title and production year for best-effort host
matching. Do not embed host credentials or scrape a metadata service merely to
duplicate host enrichment.

Returning identifiers enables enrichment; it does not mean the addon implements
direct lookup. Advertise `supportsTmdbLookup` only when incoming target identifiers
are actually applied before pagination. See [TMDB metadata and source
addons](./tmdb-metadata.md).

## Test the complete user path

Parser tests alone cannot validate a source addon. In development mode, exercise:

1. search, browse, recent items and next-page navigation;
2. movie, generic-video and complete series hierarchies;
3. artwork with cold and repeated navigation;
4. source selection with several qualities and providers;
5. preference ordering, explicit exclusions and unlimited defaults;
6. fallback when a preferred value is absent;
7. `resolvePlayback()` for every returned variant ID;
8. source selection from a unified result, including a similarly named remote item;
9. playback headers on every playback target claimed as supported;
10. malformed responses, timeouts and provider changes;
11. remote-control operation on a supported TV device when configuration is meant
   for television use.

Use [development mode](./development-mode.md) for runtime logs and reloads, and
start with the deterministic [Example Catalog Source](../examples/catalog-source-addon.md)
before adding remote transport and parsing.

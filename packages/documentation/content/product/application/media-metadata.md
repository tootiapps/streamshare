---
title: Media metadata and TMDB
description: Understand how StreamShare adds rich, localized metadata to media from different sources.
---

# Media metadata and TMDB

StreamShare uses TMDB to present consistent information for media discovered from
the application, services and source addons. When a source provides a reliable
TMDB identity, the application can add localized titles and summaries, posters,
backdrops, genres, ratings, release dates, runtimes, seasons and episode details.

## Metadata and playback remain separate

TMDB describes a movie or series; it does not provide the playable resource.
Sources remain responsible for availability, quality information and playback
resolution. This separation lets several sources offer the same media while the
interface presents one consistent identity and set of artwork.

## Why some matches are better than others

The most reliable matches use a TMDB identifier supplied by the content source.
Movies and series each have their own identifier; seasons and episodes also use
their season or episode number.

When that identifier is unavailable, StreamShare may try to match the title and
year. This can be less precise for remakes, similarly named media or translated
titles.

## Refresh media information

StreamShare keeps recently used media information so pages can appear more
quickly. Details that are missing or out of date can be refreshed in the
background and may appear shortly afterwards.

For followed series, use **Settings > Accounts & Synchronization > TMDB
synchronization** to choose the refresh frequency or start an update manually.

To force StreamShare to retrieve selected information again, open **Settings >
System > Cache** and clear the relevant media-information category. The next
visit can take longer while the information and artwork are retrieved again.

## If information is missing or incorrect

1. Confirm that the content source is still available under [Settings > Content](./settings.md#content).
2. Refresh TMDB information for followed series, or clear only the relevant cache category.
3. Reopen the media item after the refresh completes.
4. If the wrong title keeps returning, report the affected title, year and source so its match can be checked.

Addon authors can consult [TMDB metadata and source addons](/addons/guides/tmdb-metadata)
for the technical identity and lookup contract.

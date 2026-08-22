---
title: Media Hub
description: Browse, search and play media from the sources selected in StreamShare.
---

# Media Hub

The Media Hub provides one place to browse media from your collection, connected services and source extensions. When several selected sources identify the same movie or series, StreamShare can present one media entry while preserving the available playback choices.

## Main sections

| Section | What it contains |
| --- | --- |
| **Movies** | Movies supplied by the selected compatible sources. |
| **Series** | Series, seasons and episodes supplied by the selected compatible sources. |
| **Others** | Videos that do not belong to the movie or series categories. |
| **Explorer** | The folders and categories defined by each selected source. |
| **History** | Media previously started or marked as watched, with a local title search. |

Use **Explorer** when you want to follow a source's own organization. Use Movies, Series or Others when you want a unified view across several sources.

## Choose your sources

Open the source picker in the Media Hub toolbar and select the integrations that should contribute to browsing and search.

- The same selection applies to Movies, Series, Others and Explorer.
- The selection is kept on the current device.
- The free plan can select up to two sources at the same time. Premium removes this limit.
- A configured integration remains manageable under [Settings > Content](./settings.md#content) even when it is not selected in the Media Hub.

The source picker controls which sources are consulted; it does not remove or reconfigure them.

If parental control is configured, the lock button in the toolbar controls adult content for the current session. While locked, adult sources and their saved history or favorites are not shown. A public shortcut that combines several sources may remain visible, but adult results are removed when it is opened and potentially adult artwork is replaced by a neutral image. Enter the PIN to restore protected content; locking the control hides it again immediately.

## Search, filters and sorting

Open the search control in Movies, Series or Others to enter a keyword. Genre and year filters are offered when every selected source used for the current view can apply them consistently. Sort choices follow the same rule.

Explorer keeps the navigation and ordering provided by the current source, so global search and filters are not shown there. History provides its own search over saved media titles.

If a control is absent, the current source selection or section does not offer that operation consistently. You can change the selected sources or use Explorer to access a source's own browsing options.

## Open and play a media item

Selecting a media item opens its playback choices. Depending on the information supplied by each source, a choice can show details such as quality, language, format or provider.

The source selector can also indicate a source used previously for that media. Choose a source and playback target, then start playback. To skip repeated choices when suitable defaults are available, enable **Settings > Playback & Cast > Quick Play** and select a default player.

Available actions can include adding the current page to favorites, opening a trailer, or updating watched status. Actions appear only when they apply to the selected item.

## Configure content integrations

The Media Hub consumes integrations configured elsewhere:

- **Settings > Content > Media Library** manages local playlists and their media information.
- **Settings > Content > Services** connects compatible remote services.
- **Settings > Content > Jellyfin** connects Jellyfin servers.
- **Settings > Content > Extension sources** manages source addons.

Developers can use the dedicated [addon documentation](/addons/) or [service documentation](/services/) to build these integrations.

For Main List, account limits and list management, see [Media Library and lists](./media-library.md).

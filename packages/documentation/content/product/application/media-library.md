---
title: Media Library and lists
description: Organize the personal lists exposed by the Collection source.
---

# Media Library and lists

The Media Library is the list manager behind the **Collection** source. Each list is displayed as a folder in **Media Hub > Explorer > Collection**, while its identified movies and series can also contribute to the corresponding unified sections.

Open **Settings > Content > Media Library** to manage these lists.

## Main List

**Main List** is created automatically and cannot be removed. It is the default destination when a supported mobile application shares a playable web address with StreamShare.

There is no separate “received links” list and no current-list setting: shared links always go to Main List. Open the list from its actions to review the links it contains.

## Account limits

The free plan can use Main List. Premium accounts can create and use additional lists.

If additional lists remain on a device after Premium access ends, their data is retained and the lists can still be managed in Settings, but only Main List is available for browsing in Collection until the account permits the additional lists again.

## Manage lists

Use **Add** to create an empty list when your account permits another one. Open a list's actions to:

- view its contents in the Media Hub;
- rename it;
- clear all of its items;
- remove it when it is not a protected list.

Clearing a list keeps the list itself. Removing a list deletes both the list and its items. Main List is protected from removal.

## Add content

Lists can be populated in two supported ways:

- share an individual playable address with StreamShare on a supported mobile device; it is added to Main List;
- use an addon that works with the public list API to add one or more items to a list authorized for the current account.

File and URL-based JSON list import, JSON export and source-URL synchronization are not part of the Media Library workflow. Addon developers can use the [list API guide](/addons/guides/lists) for maintained integrations.

## Refresh media information

Choose the Media Library scan action to look for items whose movie, series or episode information has not been identified. Review the exclusions report for items that could not be matched or that you chose to exclude.

See [Media information and TMDB](./media-metadata.md) to understand matching and refresh behavior.

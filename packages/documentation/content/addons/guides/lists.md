---
title: Work with Collection lists
description: Read and populate user-authorized Collection lists from an interactive addon.
---

# Work with Collection lists

The interactive list API lets an addon contribute playable links to the user's **Collection** source. Use it when the addon is importing or producing personal library entries. A source addon that maintains its own browsable catalog should use the [source addon API](./source-addons.md) instead.

## Check availability

List operations require an interactive execution with the `lists` runtime capability:

```ts
if (!api.runtime.capabilities.lists) {
  api.logger.info('Collection lists are unavailable in this execution.');
  return;
}
```

The host returns only the lists the current account may use. Creation can also be refused when the account has reached its list limit, so treat `create()` as an operation that can reject.

## Select or create a target

Prefer an existing list selected by the user. If the addon does not expose a list setting, it can fall back to the protected main list and create a dedicated list only when the account permits it:

```ts
const lists = await api.lists.getAll();
let target = lists.find(list => list.locked) ?? lists[0];

if (!target) {
  const id = await api.lists.create('My addon');
  target = {id, name: 'My addon'};
}
```

Do not hard-code a numeric list identifier or assume that every account can create an additional list.

## Add items

Use `addItem()` for an isolated entry or `addItems()` for a batch. Supply a playable URL, a display filename and the most accurate media type available. Include TMDB identifiers and episode coordinates when the addon already knows them.

```ts
await api.lists.addItems(target.id, [
  {
    filename: 'Example movie',
    url: 'https://media.example/movie.m3u8',
    type: 'movie',
    tmdbID: 1234,
  },
]);

await api.lists.enrichList(target.id);
```

`enrichList()` asks StreamShare to complete supported media information. It is useful after a batch that contains partial metadata, but it is not required when the supplied information is already sufficient.

## Maintain addon-owned entries

Use `getById()` to inspect a list, `removeItem()` to delete a specific entry and `clear()` only when the user has explicitly chosen to replace all content in that list. The SDK intentionally does not rename or delete lists: those lifecycle actions remain under user control in the Media Library.

Every operation is checked by the host. Handle rejected or unavailable operations without discarding the addon's own source data or leaving a partially prepared user workflow.

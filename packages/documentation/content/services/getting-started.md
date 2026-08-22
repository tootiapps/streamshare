---
title: Create your first service
description: Define a StreamShare service manifest and return a typed media response.
---

# Create your first service

## Install the protocol package

```bash
npm install @streamshare/service
```

## Define the service manifest

```ts
import {defineService} from '@streamshare/service';

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
        {id: 'q', role: 'query', label: 'Query', type: 'text'},
        {id: 'page', role: 'page', label: 'Page', type: 'text', hidden: true},
      ],
    },
  ],
});
```

`defineService()` preserves literal type inference and returns plain JSON that can be served by any HTTP application.

## Return results

```ts
import type {StreamShareResponse} from '@streamshare/service';

const response: StreamShareResponse = {
  items: [
    {
      type: 'movie',
      title: 'Example',
      tmdb: {id: 123, type: 'movie'},
      links: [{href: 'https://media.example/movie.m3u8', quality: '1080p'}],
    },
  ],
  pagination: {
    currentPage: 1,
    itemsPerPage: 50,
    totalPages: 1,
    totalItems: 1,
  },
};
```

Validate data received across a network boundary with the runtime parsers exported by the package. Compile-time types alone cannot validate external JSON.

Continue with the detailed [manifest guide](./guides/manifest.md), [authentication guide](./guides/authentication.md), [result and playback guide](./guides/results-and-playback.md), and [demonstration service](./example-service.md).

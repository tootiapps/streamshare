import assert from 'node:assert/strict';
import test from 'node:test';

import { TmdbApiClient, TmdbApiError } from '../dist/tmdb-api.js';

test('sends the TMDB bearer token and default language server-side', async () => {
  let request;
  const client = new TmdbApiClient({
    accessToken: 'secret-token',
    language: 'de-DE',
    fetch: async (input, init) => {
      request = { url: String(input), init };
      return new Response(JSON.stringify({ id: 603 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  assert.deepEqual(await client.get('/movie/603', { page: 2 }), { id: 603 });
  assert.match(request.url, /\/movie\/603\?/);
  assert.match(request.url, /language=de-DE/);
  assert.match(request.url, /page=2/);
  assert.equal(request.init.headers.Authorization, 'Bearer secret-token');
});

test('turns an upstream HTTP failure into a typed TMDB error', async () => {
  const client = new TmdbApiClient({
    accessToken: 'secret-token',
    fetch: async () => new Response('rate limited', { status: 429 }),
  });

  await assert.rejects(
    () => client.get('/discover/movie'),
    (error) => error instanceof TmdbApiError && error.status === 429 && /rate limited/.test(error.message),
  );
});

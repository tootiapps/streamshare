import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { parseStreamShareResponse, parseStreamShareService } from '@streamshare/service';
import { createApp } from '../dist/app.js';

const movies = Array.from({ length: 30 }, (_, index) => ({
  id: 600 + index,
  title: `Demo Movie ${String(index + 1).padStart(2, '0')}`,
  overview: `Movie ${index + 1} returned by the fake TMDB API.`,
  release_date: index < 10 ? `2024-${String((index % 9) + 1).padStart(2, '0')}-01` : '2023-01-01',
  genre_ids: index < 10 ? [28, 12] : [35],
  vote_average: 8 - index / 100,
  vote_count: 1_000 - index,
  popularity: 100 - index,
  poster_path: `/movie-${index + 1}.jpg`,
  backdrop_path: `/movie-${index + 1}-backdrop.jpg`,
}));

const series = [
  {
    id: 1399,
    name: 'Demo Series',
    overview: 'A series returned by the fake TMDB API.',
    first_air_date: '2024-01-01',
    genre_ids: [18],
    vote_average: 8.5,
    vote_count: 500,
    popularity: 90,
    poster_path: '/series.jpg',
    backdrop_path: '/series-backdrop.jpg',
  },
];

function paged(results, page = 1) {
  const start = (page - 1) * 20;
  return {
    page,
    results: results.slice(start, start + 20),
    total_pages: Math.ceil(results.length / 20),
    total_results: results.length,
  };
}

function filterDiscover(items, params) {
  const year = Number(params.primary_release_year ?? params.first_air_date_year);
  const genres = String(params.with_genres ?? '')
    .split(',')
    .filter(Boolean)
    .map(Number);
  return items.filter((item) => {
    const date = item.release_date ?? item.first_air_date;
    return (!Number.isInteger(year) || Number(date?.slice(0, 4)) === year)
      && genres.every((genre) => item.genre_ids.includes(genre));
  });
}

const tmdbApi = {
  async get(pathname, params = {}) {
    if (pathname === '/discover/movie') {
      return paged(filterDiscover(movies, params), Number(params.page ?? 1));
    }
    if (pathname === '/discover/tv') {
      return paged(filterDiscover(series, params), Number(params.page ?? 1));
    }
    if (pathname === '/search/movie' || pathname === '/search/tv') {
      const source = pathname.endsWith('/tv') ? series : movies;
      const query = String(params.query ?? '').toLowerCase();
      const matching = source.filter((item) => (item.title ?? item.name).toLowerCase().includes(query));
      return paged(matching, Number(params.page ?? 1));
    }
    if (pathname === '/tv/1399') {
      return {
        ...series[0],
        number_of_seasons: 1,
        in_production: true,
        genres: [{ id: 18 }],
        seasons: [{
          id: 1400,
          name: 'Season 1',
          overview: 'The first season.',
          poster_path: '/season.jpg',
          air_date: '2024-01-01',
          season_number: 1,
          episode_count: 2,
          vote_average: 8,
        }],
      };
    }
    if (pathname === '/tv/1399/season/1') {
      return {
        id: 1400,
        name: 'Season 1',
        poster_path: '/season.jpg',
        air_date: '2024-01-01',
        season_number: 1,
        episodes: [1, 2].map((episode) => ({
          id: 1500 + episode,
          name: `Episode ${episode}`,
          overview: `Episode ${episode} overview.`,
          still_path: `/episode-${episode}.jpg`,
          air_date: `2024-01-0${episode}`,
          season_number: 1,
          episode_number: episode,
          vote_average: 8,
          vote_count: 100,
        })),
      };
    }
    const movieId = pathname.match(/^\/movie\/(\d+)$/)?.[1];
    if (movieId) {
      const movie = movies.find((item) => item.id === Number(movieId));
      if (movie) return { ...movie, genres: movie.genre_ids.map((id) => ({ id })) };
    }
    throw new Error(`Unexpected fake TMDB request: ${pathname}`);
  },
};

let server;
let baseUrl;

before(async () => {
  const app = await createApp({ tmdbApi });
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function json(path) {
  const response = await fetch(`${baseUrl}${path}`);
  assert.equal(response.status, 200);
  return response.json();
}

async function withAuthenticatedServer(authentication, run) {
  const app = await createApp({ tmdbApi, authentication });
  const authServer = await new Promise((resolve) => {
    const started = app.listen(0, '127.0.0.1', () => resolve(started));
  });
  const address = authServer.address();
  const authBaseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await run(authBaseUrl);
  } finally {
    await new Promise((resolve, reject) => authServer.close((error) => error ? reject(error) : resolve()));
  }
}

test('serves a valid discoverable manifest', async () => {
  const manifest = parseStreamShareService(await json('/'));
  assert.equal(manifest.protocolVersion, 1);
  assert.equal(manifest.api.find((endpoint) => endpoint.kind === 'search')?.id, 'search');
  assert.match(manifest.logoPath ?? '', /^data:image\/png;base64,/);
  const logoBytes = Buffer.from(manifest.logoPath.split(',')[1], 'base64');
  assert.equal(logoBytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});

test('searches and paginates valid movie results', async () => {
  const result = parseStreamShareResponse(await json('/search?mediaType=movie&page=1&limit=3&sortBy=date'));
  assert.equal(result.items.length, 3);
  assert.ok(result.items.every((item) => item.type === 'movie'));
  assert.ok(result.items.every((item) => item.links[0]?.href === '/assets/demo.mp4'));
  assert.equal(result.pagination?.itemsPerPage, 3);
  assert.equal(result.pagination?.totalPages, 10);
});

test('resolves an exact TMDB movie to a playable result', async () => {
  const result = parseStreamShareResponse(await json('/search?mediaType=movie&tmdbId=603'));
  assert.equal(result.items[0]?.type, 'movie');
  assert.equal(result.items[0]?.tmdb?.id, 603);
  assert.equal(result.items[0]?.links[0]?.href, '/assets/demo.mp4');
});

test('serves the bundled playable demo media', async () => {
  const response = await fetch(`${baseUrl}/assets/demo.mp4`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'video/mp4');
  assert.ok(Number(response.headers.get('content-length')) > 0);

  const rangeResponse = await fetch(`${baseUrl}/assets/demo.mp4`, {
    headers: { Range: 'bytes=0-99' },
  });
  assert.equal(rangeResponse.status, 206);
  assert.match(rangeResponse.headers.get('content-range') ?? '', /^bytes 0-99\//);
  assert.equal((await rangeResponse.arrayBuffer()).byteLength, 100);
});

test('returns unique numeric facets and applies TMDB filters', async () => {
  const result = parseStreamShareResponse(await json('/search?mediaType=movie&genre=28&year=2024&limit=5'));
  const genres = result.facets?.genreTmdbIds ?? [];
  const years = result.facets?.years ?? [];

  assert.equal(result.items.length, 5);
  assert.ok(result.items.every((item) => item.year === 2024));
  assert.ok(genres.every(Number.isInteger));
  assert.equal(new Set(genres).size, genres.length);
  assert.ok(years.includes(2024));
});

test('applies a genre to the complete text-search result set before paginating', async () => {
  const first = parseStreamShareResponse(await json('/search?q=Demo&mediaType=movie&genre=35&page=1&limit=5'));
  const second = parseStreamShareResponse(await json('/search?q=Demo&mediaType=movie&genre=35&page=2&limit=5'));

  assert.equal(first.items.length, 5);
  assert.equal(second.items.length, 5);
  assert.deepEqual(first.items.map((item) => item.tmdb.id), [610, 611, 612, 613, 614]);
  assert.deepEqual(second.items.map((item) => item.tmdb.id), [615, 616, 617, 618, 619]);
  assert.equal(first.pagination?.totalPages, 2);
  assert.equal(second.pagination?.totalPages, 4);
});

test('navigates from a series to seasons and episodes', async () => {
  const seriesPage = parseStreamShareResponse(await json('/search?mediaType=series&limit=1'));
  const show = seriesPage.items[0];
  assert.equal(show?.type, 'series');

  const seasonsPage = parseStreamShareResponse(await json(`/search?mediaType=season&tmdbId=${show.tmdb.id}&limit=10`));
  const season = seasonsPage.items.find((item) => item.type === 'season');
  assert.ok(season);

  const episodesPage = parseStreamShareResponse(await json(`/search?mediaType=episode&tmdbId=${show.tmdb.id}&season=${season.seasonNumber}&limit=10`));
  assert.equal(episodesPage.items.length, 2);
  assert.ok(episodesPage.items.every((item) => item.type === 'episode'));
  assert.ok(episodesPage.items.every((item) => item.links[0]?.href === '/assets/demo.mp4'));
});

test('serves the top-rated endpoint through the same response contract', async () => {
  const result = parseStreamShareResponse(await json('/top-rated?limit=5'));
  assert.equal(result.items.length, 5);
  assert.ok(result.items.every((item) => item.type === 'movie'));
});

test('keeps the manifest public while enforcing Basic authentication on API endpoints', async () => {
  await withAuthenticatedServer({ method: 'basic', username: 'alice', password: 'password' }, async (url) => {
    const manifestResponse = await fetch(`${url}/`);
    assert.equal(manifestResponse.status, 200);
    assert.equal((await manifestResponse.json()).auth.method, 'basic');

    assert.equal((await fetch(`${url}/search?mediaType=movie&limit=1`)).status, 401);
    const authorized = await fetch(`${url}/search?mediaType=movie&limit=1`, {
      headers: { Authorization: `Basic ${Buffer.from('alice:password').toString('base64')}` },
    });
    assert.equal(authorized.status, 200);
  });
});

test('enforces static API-key authentication as a Bearer token', async () => {
  await withAuthenticatedServer({ method: 'apikey', apiKey: 'demo-key' }, async (url) => {
    assert.equal((await fetch(`${url}/search?mediaType=movie&limit=1`, {
      headers: { Authorization: 'Bearer wrong-key' },
    })).status, 401);
    assert.equal((await fetch(`${url}/search?mediaType=movie&limit=1`, {
      headers: { Authorization: 'Bearer demo-key' },
    })).status, 200);
  });
});

test('authorizes a device code, protects API calls, and rotates refresh tokens', async () => {
  await withAuthenticatedServer({ method: 'deviceCode', accessTokenExpiresIn: 60 }, async (url) => {
    const manifest = parseStreamShareService(await (await fetch(`${url}/`)).json());
    assert.equal(manifest.auth.method, 'deviceCode');

    const challenge = await (await fetch(`${url}/auth/device`, { method: 'POST' })).json();
    assert.equal(challenge.verificationUrl, `${url}/auth/activate`);
    assert.match(challenge.verificationUrlComplete, /\?code=/);

    const pendingRequest = {
      grantType: 'urn:ietf:params:oauth:grant-type:device_code',
      deviceCode: challenge.deviceCode,
    };
    const pending = await (await fetch(`${url}/auth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pendingRequest),
    })).json();
    assert.deepEqual(pending, { status: 'pending' });

    const activation = await fetch(`${url}/auth/activate`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: challenge.userCode }),
    });
    assert.equal(activation.status, 200);

    const authorized = await (await fetch(`${url}/auth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pendingRequest),
    })).json();
    assert.equal(authorized.status, 'authorized');
    assert.ok(authorized.accessToken);
    assert.ok(authorized.refreshToken);

    assert.equal((await fetch(`${url}/search?mediaType=movie&limit=1`, {
      headers: { Authorization: `Bearer ${authorized.accessToken}` },
    })).status, 200);

    const refreshed = await (await fetch(`${url}/auth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ grantType: 'refresh_token', refreshToken: authorized.refreshToken }),
    })).json();
    assert.ok(refreshed.accessToken);
    assert.notEqual(refreshed.refreshToken, authorized.refreshToken);
    assert.equal((await fetch(`${url}/auth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ grantType: 'refresh_token', refreshToken: authorized.refreshToken }),
    })).status, 401);
  });
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadSource() {
  let source;
  const script = fs.readFileSync(path.join(__dirname, '../dist/index.js'), 'utf8');
  vm.runInNewContext(script, {
    console,
    globalThis: {
      registerPlugin(value) {
        source = value;
      },
    },
  });
  return source;
}

test('advertises the capabilities implemented by the source', async () => {
  const logs = [];
  const source = loadSource();
  await source.onInit({logger: {info: (message) => logs.push(message)}});

  const info = await source.getSourceInfo();
  assert.equal(info.id, 'example-catalog');
  assert.equal(info.isAvailable, true);
  assert.equal(info.capabilities.supportsSearch, true);
  assert.equal(info.capabilities.supportsTmdbLookup, true);
  assert.equal(info.capabilities.supportedTypes.includes('video'), true);
  assert.deepEqual(Array.from(info.capabilities.supportedSorts), ['relevance', 'date', 'rating', 'title']);
  assert.deepEqual(logs, ['Example catalog source initialized.']);
});

test('browses containers from the root to playable episodes', async () => {
  const source = loadSource();
  const root = await source.browse();
  const series = await source.browse('folder:series');
  const seasons = await source.browse(series.items[0].id);
  const episodes = await source.browse(seasons.items[0].id);

  assert.deepEqual(Array.from(root.items, (item) => item.title), ['Movies', 'Series', 'Videos']);
  assert.equal(series.items[0].title, 'Orbit Station');
  assert.equal(seasons.items[0].seasonNumber, 1);
  assert.deepEqual(Array.from(episodes.items, (item) => item.episodeNumber), [1, 2]);
});

test('filters, sorts and paginates search results with opaque tokens', async () => {
  const source = loadSource();
  const first = await source.search({types: ['movie'], sortBy: 'title', limit: 2});
  const second = await source.search({types: ['movie'], sortBy: 'title', limit: 2}, first.nextPageToken);
  const query = await source.search({query: 'ORBIT', types: ['series', 'episode'], sortBy: 'relevance'});
  const year = await source.search({types: ['movie'], year: 2010});
  const tmdb = await source.search({targetTmdbId: 10378});

  assert.deepEqual(Array.from(first.items, (item) => item.title), ['Big Buck Bunny', 'Sintel']);
  assert.equal(first.hasMore, true);
  assert.equal(first.nextPageToken, '2');
  assert.deepEqual(Array.from(second.items, (item) => item.title), ['Spring']);
  assert.equal(second.hasMore, false);
  assert.deepEqual(Array.from(query.items, (item) => item.title), ['Orbit Station', 'First Contact']);
  assert.deepEqual(Array.from(year.items, (item) => item.title), ['Sintel']);
  assert.deepEqual(Array.from(tmdb.items, (item) => item.title), ['Big Buck Bunny']);
  assert.deepEqual(Array.from(first.facets.years), [2019, 2010, 2008]);

  const videos = await source.search({types: ['video']});
  assert.deepEqual(Array.from(videos.items, (item) => item.title), ['Cosmos Livestream']);
  assert.equal(videos.items[0].isContainer, false);
});

test('returns recent media and resolves only playable identifiers', async () => {
  const source = loadSource();
  const recent = await source.getRecent(2);
  const playback = await source.resolvePlayback('episode:orbit:1:1');
  const videoPlayback = await source.resolvePlayback('video:cosmos-livestream');

  assert.deepEqual(Array.from(recent, (item) => item.title), ['Big Buck Bunny', 'Sintel']);
  assert.equal(playback.url, 'https://media.example.com/streamshare-example/orbit-s01e01.m3u8');
  assert.equal(videoPlayback.url, 'https://media.example.com/streamshare-example/cosmos-live.m3u8');
  await assert.rejects(() => source.resolvePlayback('series:orbit'), /No playable media/);
});

test('describes playable sources with structured selection metadata', async () => {
  const source = loadSource();
  const movies = await source.browse('folder:movies', undefined, {limit: 10});
  const episodes = await source.browse('season:orbit:1');

  assert.deepEqual(
    Array.from(movies.items, ({resolution, source, encoding, language}) => (
      [resolution, source, encoding, language]
    )),
    [
      ['1080p', 'WEB-DL', 'H.264', 'MULTI'],
      ['1080p', 'WEB-DL', 'H.264', 'VO'],
      ['1080p', 'WEB-DL', 'H.264', 'VO'],
    ],
  );
  assert.deepEqual(
    Array.from(episodes.items, ({resolution, source, encoding, language}) => (
      [resolution, source, encoding, language]
    )),
    [
      ['2160p', 'WEB-DL', 'HEVC', 'MULTI'],
      ['1080p', 'WEB-DL', 'H.264', 'VOSTFR'],
    ],
  );
});

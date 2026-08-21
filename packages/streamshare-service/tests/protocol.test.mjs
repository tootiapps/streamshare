import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  StreamShareProtocolError,
  defineService,
  isStreamShareResponse,
  parseServiceDeviceAuthorization,
  parseServiceDeviceTokenResponse,
  parseServiceTokenGrant,
  parseStreamShareResponse,
  parseStreamShareService,
} from '../dist/index.js';

test('keeps the shipped compatibility matrix aligned with the package version', async () => {
  const compatibility = JSON.parse(await readFile(new URL('../compatibility.json', import.meta.url), 'utf8'));
  const servicePackage = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

  assert.equal(compatibility.schemaVersion, 1);
  assert.equal(compatibility.protocol.minimum, 1);
  assert.equal(compatibility.protocol.latestTested, 1);
  assert.equal(compatibility.package.latestTested, servicePackage.version);
  assert.match(compatibility.application.minimum, /^\d+\.\d+\.\d+$/);
  assert.match(compatibility.application.latestTested, /^\d+\.\d+\.\d+$/);
});

test('defines and validates a service manifest', () => {
  const manifest = defineService({
    protocolVersion: 1,
    name: 'Test service',
    api: [{ id: 'search', kind: 'search', label: 'Search', method: 'GET', pathname: '/search', params: [] }],
  });

  assert.equal(parseStreamShareService(manifest), manifest);
});

test('validates a device-code authentication manifest and token lifecycle', () => {
  const manifest = defineService({
    protocolVersion: 1,
    name: 'Protected service',
    auth: {
      method: 'deviceCode',
      deviceAuthorizationPath: '/auth/device',
      tokenPath: '/auth/token',
    },
    api: [{ id: 'search', kind: 'search', label: 'Search', method: 'GET', pathname: '/search', params: [] }],
  });

  assert.equal(parseStreamShareService(manifest), manifest);
  assert.deepEqual(parseServiceDeviceAuthorization({
    deviceCode: 'device-code',
    userCode: 'ABCD-1234',
    verificationUrl: 'https://service.example/activate',
    verificationUrlComplete: 'https://service.example/activate?code=ABCD-1234',
    expiresIn: 600,
    interval: 5,
  }), {
    deviceCode: 'device-code',
    userCode: 'ABCD-1234',
    verificationUrl: 'https://service.example/activate',
    verificationUrlComplete: 'https://service.example/activate?code=ABCD-1234',
    expiresIn: 600,
    interval: 5,
  });
  assert.deepEqual(parseServiceDeviceTokenResponse({ status: 'pending', interval: 6 }), {
    status: 'pending', interval: 6,
  });
  assert.deepEqual(parseServiceTokenGrant({
    accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 3600,
  }), {
    accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 3600,
  });
});

test('rejects unsafe device-code endpoint declarations and malformed token grants', () => {
  const base = {
    protocolVersion: 1,
    name: 'Protected service',
    api: [{ id: 'search', kind: 'search', label: 'Search', method: 'GET', pathname: '/search', params: [] }],
  };

  assert.throws(() => parseStreamShareService({
    ...base,
    auth: {
      method: 'deviceCode',
      deviceAuthorizationPath: 'https://other.example/device',
      tokenPath: '/auth/token',
    },
  }), StreamShareProtocolError);
  assert.throws(() => parseServiceDeviceTokenResponse({
    status: 'authorized', accessToken: 'access-token', expiresIn: 3600,
  }), StreamShareProtocolError);
});

test('rejects duplicate endpoint IDs', () => {
  assert.throws(
    () => parseStreamShareService({
      name: 'Invalid',
      protocolVersion: 1,
      api: [
        { id: 'search', kind: 'search', label: 'One', method: 'GET', pathname: '/one', params: [] },
        { id: 'search', kind: 'browse', label: 'Two', method: 'GET', pathname: '/two', params: [] },
      ],
    }),
    StreamShareProtocolError,
  );
});

test('requires explicit v1 endpoint semantics', () => {
  const base = {
    name: 'Invalid',
    protocolVersion: 1,
    api: [{ id: 'lookup', kind: 'search', label: 'Lookup', method: 'GET', pathname: '/lookup', params: [] }],
  };

  assert.throws(
    () => parseStreamShareService({ ...base, protocolVersion: undefined }),
    StreamShareProtocolError,
  );
  assert.throws(
    () => parseStreamShareService({ ...base, api: [{ ...base.api[0], kind: undefined }] }),
    StreamShareProtocolError,
  );
  assert.throws(
    () => parseStreamShareService({ ...base, api: [{ ...base.api[0], pathname: 'https://example.com/search' }] }),
    StreamShareProtocolError,
  );
});

test('rejects duplicate semantic parameter roles', () => {
  assert.throws(() => parseStreamShareService({
    name: 'Invalid',
    protocolVersion: 1,
    api: [{
      id: 'lookup',
      kind: 'search',
      label: 'Lookup',
      method: 'GET',
      pathname: '/lookup',
      params: [
        { id: 'q', role: 'query', label: 'Query', type: 'text' },
        { id: 'term', role: 'query', label: 'Term', type: 'text' },
      ],
    }],
  }), StreamShareProtocolError);
});

test('validates result discriminators and numeric facets', () => {
  const response = {
    items: [{ type: 'movie', title: 'Movie', links: [{ href: 'https://example.com/movie.m3u8' }] }],
    facets: { genreTmdbIds: [28, 35], years: [2026] },
  };

  assert.equal(parseStreamShareResponse(response), response);
  assert.equal(isStreamShareResponse({ ...response, facets: { genreTmdbIds: [{ id: 28 }] } }), false);
});

test('rejects malformed pagination and duplicate facets', () => {
  assert.throws(() => parseStreamShareResponse({
    items: [],
    pagination: { currentPage: 0, itemsPerPage: 50 },
  }), StreamShareProtocolError);

  assert.throws(() => parseStreamShareResponse({
    items: [],
    facets: { genreTmdbIds: [28, 28] },
  }), StreamShareProtocolError);

  assert.throws(() => parseStreamShareResponse({
    items: [],
    pagination: { currentPage: 1, itemsPerPage: 50, pageLength: 2 },
  }), StreamShareProtocolError);
});

test('validates playback variants and navigation targets', () => {
  assert.throws(() => parseStreamShareResponse({
    items: [{ type: 'movie', links: [] }],
  }), StreamShareProtocolError);

  const response = {
    items: [{
      type: 'movie',
      title: 'Movie',
      links: [{
        href: '/assets/movie.m3u8',
        quality: '2160p',
        codec: 'H.265',
        languages: ['fr', 'en'],
        subtitles: ['fr'],
        metadata: [{ label: 'HDR', value: 'Dolby Vision', view: { type: 'text', color: 'tertiary' } }],
      }],
    }],
  };
  assert.equal(parseStreamShareResponse(response), response);
});

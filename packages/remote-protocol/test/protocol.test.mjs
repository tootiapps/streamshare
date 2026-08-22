import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createRemoteRequest,
  derivePairingCode,
  isRemoteEnvelope,
  parseRemoteEnvelope
} from '../dist/index.js';

test('creates and parses a playback load request', () => {
  const request = createRemoteRequest('request-1', 'playback.load', {
    url: 'https://example.test/movie.m3u8',
    autoplay: true,
    metadata: {
      title: 'Example',
      releaseYear: 2026,
      overview: 'A movie synopsis sent to the remote receiver.',
      customData: { streamshareHistoryItem: { url: 'library://movie/1' } }
    }
  });

  assert.equal(request.v, 1);
  const parsed = parseRemoteEnvelope(JSON.stringify(request));
  assert.equal(parsed.type, 'request');
  assert.equal(parsed.params.metadata.releaseYear, 2026);
  assert.equal(parsed.params.metadata.overview, request.params.metadata.overview);
  assert.deepEqual(parsed.params.metadata.customData, request.params.metadata.customData);
});

test('rejects unsupported protocol versions and methods', () => {
  assert.equal(isRemoteEnvelope({ v: 2, type: 'request', id: '1', method: 'playback.play', params: {} }), false);
  assert.equal(isRemoteEnvelope({ v: 1, type: 'request', id: '1', method: 'player.destroy', params: {} }), false);
});

test('rejects malformed JSON', () => {
  assert.throws(() => parseRemoteEnvelope('{'), /valid JSON/);
});

test('creates track selection and interface navigation requests', () => {
  const track = createRemoteRequest('track-1', 'playback.selectTrack', {
    type: 'audio',
    trackId: 'audio:1'
  });
  const navigation = createRemoteRequest('nav-1', 'ui.navigate', { action: 'down' });

  assert.equal(parseRemoteEnvelope(JSON.stringify(track)).type, 'request');
  assert.equal(parseRemoteEnvelope(JSON.stringify(navigation)).type, 'request');
});

test('derives a stable two-digit pairing code from the shared SAS input', async () => {
  assert.equal(await derivePairingCode('aabbcc', 'pair-123', 'controller-456'), '72');
});

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadLocalEnvironment } from '../dist/environment.js';

test('loads local files without overriding host-provided secrets', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'streamshare-env-'));
  const keys = [
    'STREAMSHARE_TEST_HOST_SECRET',
    'STREAMSHARE_TEST_LOCAL_WINS',
    'STREAMSHARE_TEST_FALLBACK',
  ];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  try {
    process.env.STREAMSHARE_TEST_HOST_SECRET = 'host';
    delete process.env.STREAMSHARE_TEST_LOCAL_WINS;
    delete process.env.STREAMSHARE_TEST_FALLBACK;
    writeFileSync(path.join(root, '.env.local'), [
      'STREAMSHARE_TEST_HOST_SECRET=local',
      'STREAMSHARE_TEST_LOCAL_WINS=local',
    ].join('\n'));
    writeFileSync(path.join(root, '.env'), [
      'STREAMSHARE_TEST_LOCAL_WINS=base',
      'STREAMSHARE_TEST_FALLBACK=base',
    ].join('\n'));

    loadLocalEnvironment(root);

    assert.equal(process.env.STREAMSHARE_TEST_HOST_SECRET, 'host');
    assert.equal(process.env.STREAMSHARE_TEST_LOCAL_WINS, 'local');
    assert.equal(process.env.STREAMSHARE_TEST_FALLBACK, 'base');
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
    rmSync(root, { recursive: true, force: true });
  }
});

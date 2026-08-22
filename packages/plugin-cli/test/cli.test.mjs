import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDirectory, '..');
const repositoryRoot = path.resolve(packageRoot, '../..');
const executable = path.join(packageRoot, 'dist/index.js');
const exampleRoot = path.join(repositoryRoot, 'packages/example-plugin');

function run(args, cwd = exampleRoot) {
  return spawnSync(process.execPath, [executable, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

test('prints discoverable help and package version', () => {
  const help = run(['--help']);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /validate \[--app-version/);
  assert.match(help.stdout, /dev \[--port/);

  const version = run(['--version'], packageRoot);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout.trim(), /^1\.0\.0$/);
});

test('validates the public example and its application compatibility', () => {
  const result = run(['validate', '--app-version', '3.13.1']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Manifest valid: com\.tootiapps\.streamshare\.hello@1\.0\.0/);
  assert.match(result.stdout, /Compatible with StreamShare 3\.13\.1/);
});

test('rejects incompatible application versions and unknown commands', () => {
  const incompatible = run(['validate', '--app-version', '4.0.0']);
  assert.equal(incompatible.status, 1);
  assert.match(incompatible.stderr, /does not include StreamShare 4\.0\.0/);

  const unknown = run(['publish']);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Unknown command 'publish'/);
});

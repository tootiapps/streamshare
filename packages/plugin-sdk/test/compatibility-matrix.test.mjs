import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDirectory, '..');
const repositoryRoot = path.resolve(packageRoot, '../..');
const require = createRequire(import.meta.url);
const {
  assertPluginCompatibleWithApplication,
  isPluginCompatibleWithApplication,
  PluginCompatibilityError,
} = require('../dist/index.js');

const readJson = (filePath) => JSON.parse(readFileSync(filePath, 'utf8'));
const matrix = readJson(path.join(packageRoot, 'compatibility.json'));
const sdkPackage = readJson(path.join(packageRoot, 'package.json'));
const exampleManifest = readJson(path.join(repositoryRoot, 'packages/example-plugin/manifest.json'));
const sourceExampleManifest = readJson(path.join(repositoryRoot, 'packages/example-source-addon/manifest.json'));

test('compatibility helpers accept supported hosts and reject unsupported hosts', () => {
  assert.equal(isPluginCompatibleWithApplication(exampleManifest, '3.13.0'), true);
  assert.equal(isPluginCompatibleWithApplication(exampleManifest, '4.0.0'), false);
  assert.doesNotThrow(() => assertPluginCompatibleWithApplication(exampleManifest, '3.13.1'));
  assert.throws(
    () => assertPluginCompatibleWithApplication(exampleManifest, '4.0.0'),
    PluginCompatibilityError,
  );
});

test('machine-readable matrix matches the SDK and supported application versions', () => {
  assert.equal(matrix.schemaVersion, 1);
  assert.equal(matrix.sdk.latestTested, sdkPackage.version);

  for (const version of [matrix.application.minimum, matrix.application.latestTested]) {
    assert.match(version, /^\d+\.\d+\.\d+$/);
    for (const manifest of [exampleManifest, sourceExampleManifest]) {
      assert.equal(
        isPluginCompatibleWithApplication(manifest, version),
        true,
        `${manifest.id} must support StreamShare ${version}.`,
      );
    }
  }
});

test('public examples build against the lowest and latest supported SDK contract', () => {
  const sdkVersions = new Set([matrix.sdk.minimum, matrix.sdk.latestTested]);
  assert.deepEqual(
    [...sdkVersions],
    [sdkPackage.version],
    'Add a frozen package fixture when the minimum supported SDK differs from the workspace SDK.',
  );

  for (const packageName of [
    '@streamshare/example-hello-addon',
    '@streamshare/example-source-addon',
  ]) {
    execFileSync(
      'pnpm',
      ['--filter', packageName, 'typecheck'],
      {cwd: repositoryRoot, stdio: 'pipe'},
    );
  }
});

test('publication metadata keeps the SDK package explicit and auditable', () => {
  assert.equal(sdkPackage.private, undefined);
  assert.equal(sdkPackage.license, 'ISC');
  assert.equal(sdkPackage.publishConfig.access, 'public');
  assert.equal(sdkPackage.publishConfig.provenance, true);
  assert.equal(sdkPackage.repository.directory, 'packages/plugin-sdk');
  assert.ok(sdkPackage.files.includes('dist'));
  assert.ok(sdkPackage.files.includes('LICENSE'));
  assert.ok(sdkPackage.files.includes('compatibility.json'));
});

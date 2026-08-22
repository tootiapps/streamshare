import { readdir } from 'node:fs/promises';
import path from 'node:path';

const documentationRoot = path.resolve('packages/documentation');
const sourceDirectories = ['content', 'src', 'static'];
const blockedExtensions = new Set(['.heic', '.heif', '.icns', '.jxl']);
const blockedAssets = [];

async function inspectDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await inspectDirectory(entryPath);
      continue;
    }

    if (entry.isFile() && blockedExtensions.has(path.extname(entry.name).toLowerCase())) {
      blockedAssets.push(path.relative(documentationRoot, entryPath));
    }
  }
}

for (const directory of sourceDirectories) {
  await inspectDirectory(path.join(documentationRoot, directory));
}

if (blockedAssets.length > 0) {
  console.error('Unsupported documentation image formats:');
  for (const asset of blockedAssets.sort()) {
    console.error(`- ${asset}`);
  }
  console.error('Convert these assets to PNG, JPEG, WebP, GIF, AVIF, or SVG before building the documentation.');
  process.exitCode = 1;
} else {
  console.log('Documentation assets use supported image formats.');
}

#!/usr/bin/env node

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import chokidar from 'chokidar';
import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import os from 'os';
import {
  assertPluginCompatibleWithApplication,
  assertPluginManifest,
  type PluginManifest,
} from '@streamshare/plugin-sdk';

const cwd = process.cwd();
const MAX_ICON_BYTES = 512 * 1024;
const ICON_EXTENSIONS = new Set(['.svg', '.png', '.webp']);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function optionValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
  return value;
}

function developmentPort(args: string[]): number {
  const raw = optionValue(args, '--port') ?? process.env.PORT ?? '3000';
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid development server port '${raw}'.`);
  }
  return port;
}

function deviceAddresses(port: number): string[] {
  const addresses = new Set<string>();
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) addresses.add(`${entry.address}:${port}`);
    }
  }
  return [...addresses].sort();
}

function validatePackagePath(value: string, field: string) {
  if (path.isAbsolute(value) || value.split(/[\\/]/).includes('..')) {
    throw new Error(`${field} must stay inside the plugin directory`);
  }
}

function validateIcon(icon: unknown) {
  if (icon === undefined) return;
  if (typeof icon !== 'string' || !icon.trim()) {
    throw new Error('manifest.icon must be a non-empty package-relative path');
  }
  validatePackagePath(icon, 'manifest.icon');
  const extension = path.extname(icon).toLowerCase();
  if (!ICON_EXTENSIONS.has(extension)) {
    throw new Error('manifest.icon must be an SVG, PNG or WebP file');
  }
  const iconPath = path.join(cwd, icon);
  if (!fs.existsSync(iconPath) || !fs.statSync(iconPath).isFile()) {
    throw new Error(`manifest.icon file not found: ${icon}`);
  }
  if (fs.statSync(iconPath).size > MAX_ICON_BYTES) {
    throw new Error('manifest.icon must not exceed 512 KiB');
  }
}

// Load manifest.json
function loadManifest(): {manifest: PluginManifest; manifestPath: string} {
  const manifestPath = path.join(cwd, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest.json not found in ${cwd}`);
  }

  try {
    const manifest: unknown = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assertPluginManifest(manifest);
    validateIcon(manifest.icon);
    return {
      manifest,
      manifestPath
    };
  } catch (error: unknown) {
    throw new Error(`Could not read manifest.json: ${errorMessage(error)}`);
  }
}

// Determine entry point
function getEntryPoint() {
  const entryPoint = fs.existsSync(path.join(cwd, 'src/index.ts'))
    ? 'src/index.ts'
    : fs.existsSync(path.join(cwd, 'src/main.ts'))
      ? 'src/main.ts'
      : 'src/index.js';

  if (!fs.existsSync(path.join(cwd, entryPoint))) {
    throw new Error(`Entry point ${entryPoint} not found in ${cwd}`);
  }
  return entryPoint;
}

function validateProject(applicationVersion?: string) {
  const {manifest, manifestPath} = loadManifest();
  const entryPoint = getEntryPoint();
  if (applicationVersion) assertPluginCompatibleWithApplication(manifest, applicationVersion);
  console.log(`[CLI] Manifest valid: ${manifest.id}@${manifest.version} (${manifest.type})`);
  console.log(`[CLI] Entry point: ${entryPoint} -> ${manifest.main}`);
  if (applicationVersion) console.log(`[CLI] Compatible with StreamShare ${applicationVersion}.`);
  return {manifest, manifestPath, entryPoint};
}

// Compile plugin
async function compile(entryPoint: string, mainOut: string, isProduction = false) {
  console.log(`[CLI] Compiling for ${isProduction ? 'production' : 'development'} (${entryPoint} -> ${mainOut})...`);
  try {
    await esbuild.build({
      entryPoints: [entryPoint],
      outfile: mainOut,
      bundle: true,
      format: 'iife',
      minify: isProduction,
      sourcemap: !isProduction ? 'inline' : false,
    });
    console.log(`[CLI] Compilation successful!`);
    return true;
  } catch (error: unknown) {
    console.error(`[CLI] [Error] Compilation failed: ${errorMessage(error)}`);
    return false;
  }
}

// Command: Dev Mode (Start local HTTP/WS server and watch file changes)
async function runDevMode(port: number, applicationVersion?: string) {
  console.log(`[CLI] Starting StreamShare plugins development server...`);
  const {manifest, manifestPath, entryPoint} = validateProject(applicationVersion);
  const mainOut = manifest.main || 'dist/index.js';

  // Initial build
  if (!await compile(entryPoint, mainOut, false)) {
    throw new Error('Initial development build failed.');
  }

  const app = express();

  // Allow CORS
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
  });

  app.get('/manifest.json', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(manifestPath);
  });

  app.use('/dist', express.static(path.join(cwd, 'dist')));
  app.use(express.static(cwd));

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve, reject) => {
    const candidate = app.listen(port, '0.0.0.0');
    const onError = (error: unknown) => {
      candidate.off('listening', onListening);
      reject(new Error(`Development server could not listen on port ${port}: ${errorMessage(error)}`));
    };
    const onListening = () => {
      candidate.off('error', onError);
      resolve(candidate);
    };
    candidate.once('error', onError);
    candidate.once('listening', onListening);
  });

  console.log(`[CLI] HTTP server: http://localhost:${port}`);
  for (const address of deviceAddresses(port)) {
    console.log(`[CLI] Device address: ${address}`);
  }
  console.log(`[CLI] Ready to test in development mode.`);

  // WebSocket Server for logs and HMR
  const wss = new WebSocketServer({ server });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    console.log(`[CLI] [WS] New client connected.`);
    clients.add(ws);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'log') {
          const level = data.level || 'info';
          const payload = data.payload || [];
          const prefix = `[PLUGIN][${level.toUpperCase()}]`;
          if (level === 'error') {
            console.error(prefix, ...payload);
          } else if (level === 'warn') {
            console.warn(prefix, ...payload);
          } else {
            console.log(prefix, ...payload);
          }
        }
      } catch (err) {
        console.error(`[CLI] [WS] Message parsing error:`, err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[CLI] [WS] Client disconnected.`);
    });
  });

  // Watcher
  const watcher = chokidar.watch(['src/**/*', 'assets/**/*', 'manifest.json'], {
    ignored: /(^|[\/\\])\../,
    persistent: true,
  });

  watcher.on('change', async (filePath) => {
    console.log(`[CLI] File change detected: ${filePath}`);
    const success = await compile(entryPoint, mainOut, false);
    if (success) {
      console.log(`[CLI] HMR notification (Reload) sent to connected clients...`);
      const reloadMsg = JSON.stringify({ type: 'RELOAD' });
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(reloadMsg);
        }
      }
    }
  });
}

// Command: Packaging (Create a .zip archive ready for distribution)
async function packagePlugin(applicationVersion?: string) {
  console.log(`[CLI] Preparing plugin package (Packaging)...`);
  const {manifest, manifestPath, entryPoint} = validateProject(applicationVersion);
  const mainOut = manifest.main || 'dist/index.js';

  // 1. Compile in production mode (minified, without sourcemaps)
  const success = await compile(entryPoint, mainOut, true);
  if (!success) {
    throw new Error('Could not compile the script for the package.');
  }

  // 2. Create the zip archive
  const zip = new AdmZip();

  // Add manifest.json to the archive root
  zip.addLocalFile(manifestPath);

  // Add the bundled script inside its respective folder
  const mainOutAbs = path.join(cwd, mainOut);
  if (!fs.existsSync(mainOutAbs)) {
    throw new Error(`Compiled script not found: ${mainOutAbs}`);
  }
  const zipDestDir = path.dirname(mainOut);
  zip.addLocalFile(mainOutAbs, zipDestDir !== '.' ? zipDestDir : undefined);

  // Add assets folder if present
  const assetsDir = path.join(cwd, 'assets');
  if (fs.existsSync(assetsDir) && fs.statSync(assetsDir).isDirectory()) {
    zip.addLocalFolder(assetsDir, 'assets');
  }
  if (manifest.icon && !manifest.icon.replace(/\\/g, '/').startsWith('assets/')) {
    const iconPath = path.join(cwd, manifest.icon);
    const iconDestDir = path.dirname(manifest.icon);
    zip.addLocalFile(iconPath, iconDestDir !== '.' ? iconDestDir : undefined);
  }

  // Zip filename format: <plugin-id>-<version>.zip
  const zipName = `${manifest.id}-${manifest.version}.zip`;
  const zipPath = path.join(cwd, zipName);

  try {
    zip.writeZip(zipPath);
    const size = fs.statSync(zipPath).size;
    console.log(`[CLI] Package created: ${zipPath} (${size} bytes)`);
  } catch (error: unknown) {
    throw new Error(`Could not write ZIP file: ${errorMessage(error)}`);
  }
}

function printHelp() {
  console.log(`StreamShare addon CLI

Usage:
  streamshare-plugin-cli dev [--port <port>] [--app-version <version>]
  streamshare-plugin-cli validate [--app-version <version>]
  streamshare-plugin-cli build [--app-version <version>]
  streamshare-plugin-cli package [--app-version <version>]
  streamshare-plugin-cli --version

Commands:
  dev       Validate, compile, serve and reload an addon during development.
  validate  Validate manifest.json, its icon and the source entry point.
  build     Create the installation ZIP (alias: package).
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h') || args[0] === 'help') {
    printHelp();
    return;
  }
  if (args.includes('--version') || args.includes('-v')) {
    const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')) as {version: string};
    console.log(metadata.version);
    return;
  }

  const command = args[0]?.startsWith('--') ? 'dev' : (args.shift() ?? 'dev');
  const applicationVersion = optionValue(args, '--app-version');

  if (command === 'dev') {
    await runDevMode(developmentPort(args), applicationVersion);
  } else if (command === 'validate') {
    validateProject(applicationVersion);
  } else if (command === 'build' || command === 'package') {
    await packagePlugin(applicationVersion);
  } else {
    throw new Error(`Unknown command '${command}'. Run with --help to list supported commands.`);
  }
}

void main().catch((error: unknown) => {
  console.error(`[CLI] [Error] ${errorMessage(error)}`);
  process.exitCode = 1;
});

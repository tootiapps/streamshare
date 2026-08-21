---
title: Development mode
description: Run an addon from the local CLI, connect StreamShare and reload changes without building installation ZIPs.
---

# Development mode

Development mode runs an addon directly from your computer. The plugin CLI validates the manifest, bundles the entry point, serves the project over HTTP and reloads connected addon sandboxes when watched files change.

This workflow is currently verified with StreamShare's Android mobile and TV addon runtime. The public compatibility matrix will identify additional supported hosts as they become available.

## Start the local server

Your package scripts should include:

```json
{
  "scripts": {
    "validate": "streamshare-plugin-cli validate --app-version 3.13.1",
    "dev": "streamshare-plugin-cli dev",
    "build": "streamshare-plugin-cli build"
  }
}
```

From the addon directory, run:

```bash
pnpm dev
```

The server listens on all local interfaces at port `3000` by default. Use `--port 3100` or set the `PORT` environment variable to select another port. The CLI prints the reachable `IP:port` values to enter on the device.

The CLI then:

1. validates `manifest.json`, including the declared icon;
2. finds `src/index.ts`, `src/main.ts` or `src/index.js` as the source entry point;
3. bundles it to the path declared by `manifest.main`, with an inline source map;
4. serves `manifest.json`, the compiled script and project assets over HTTP;
5. watches `src/`, `assets/` and `manifest.json`;
6. sends a reload notification over WebSocket after a successful rebuild;
7. prints `console.log`, `console.warn` and `console.error` messages forwarded by the addon runtime.

Before connecting a particular application build, validate the manifest range explicitly:

```bash
pnpm validate
```

You can confirm that the server is reachable on the development computer:

```text
http://localhost:3000/manifest.json
http://localhost:3000/dist/index.js
```

The second path must match the `main` property in your manifest.

## Connect StreamShare

The device and development computer must be able to reach each other on the local network.

1. Find the development computer's LAN address, for example `192.168.1.50`.
2. In StreamShare, open **Settings → Extensions → Developer Mode**.
3. Enable developer mode.
4. Enter the server as `IP:port`, for example `192.168.1.50:3000`. Do not enter a protocol or path.
5. Select **Connect / reload manifest** and review the requested permissions.

On a physical phone or TV, `localhost` refers to that device, not to the development computer. Use the computer's reachable LAN address and allow the selected port through its firewall when necessary.

After approval, StreamShare creates or updates a virtual addon entry marked `[DEV]`, loads the script from the CLI server and dispatches `plugin:installed` to that addon.

## Reload behavior

Changes under `src/`, `assets/` or to `manifest.json` trigger a rebuild. After a successful build, the CLI asks connected runtime sandboxes to reload.

Script and asset edits are therefore delivered automatically to an active development runtime. A manifest edit changes permissions or host-provided UI metadata, so select **Connect / reload manifest** again to make StreamShare fetch, validate and approve the new manifest.

If an action or event is not currently running, trigger it again after the rebuild to create a new runtime execution with the latest bundle.

## Icons in development mode

An icon declared as `"icon": "assets/icon.svg"` is available at:

```text
http://192.168.1.50:3000/assets/icon.svg
```

The host resolves the icon from the server root, applies the same supported-format and 512 KiB limits as an installed addon, and does not retain development icons across reconnects or rebuilds. See the [manifest icon reference](../concepts/manifest.md#declaring-an-icon).

## Permissions and local-network safety

The development server itself is allowed as the source of the manifest, bundle, icon and reload connection. Other outbound requests from the addon remain constrained by `permissions.network`.

The CLI development server binds to the local network, uses unencrypted HTTP/WebSocket connections and has no authentication. Use it only on a trusted development network, stop it when finished, and do not expose it directly to the internet.

Disabling developer mode removes virtual development addons from StreamShare. It does not delete the project or any locally built ZIP from the development computer.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| StreamShare cannot connect | Confirm `pnpm dev` is still running, use the computer's LAN IP rather than `localhost`, verify the port and check the firewall. |
| Manifest rejected | Read the CLI or application error, then compare the file with the [manifest reference](../concepts/manifest.md) and [validation rules](./manifest-validation.md). |
| Script returns 404 | Ensure `manifest.main` matches the generated URL, normally `dist/index.js`. |
| Icon is missing | Confirm `icon` is relative to the project root, the file exists, and its case and extension match exactly. |
| Change does not affect permissions or actions | Reconnect the manifest; automatic reload refreshes the bundle but does not silently approve a changed contract. |
| Addon request is blocked | Add the exact required host to `permissions.network`; never add `*` merely to bypass diagnosis. |

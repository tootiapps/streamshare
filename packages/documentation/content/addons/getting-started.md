---
title: Create your first addon
description: Set up, implement, run, and package a minimal StreamShare addon.
---

# Create your first addon

## Install the development packages

```bash
pnpm add @streamshare/plugin-sdk
pnpm add --save-dev @streamshare/plugin-cli typescript
```

## Define the manifest

Create `manifest.json` at the package root. Its supported shape is defined by the SDK's [`PluginManifest`](./api/interfaces/PluginManifest.md) interface; the [manifest reference](./concepts/manifest.md) explains how each property is used and validated.

```json
{
  "id": "com.example.hello",
  "name": "Hello StreamShare",
  "version": "1.0.0",
  "compatibleVersion": "^3.13.0",
  "type": "automation",
  "main": "dist/index.js",
  "author": "Example author",
  "description": "A minimal StreamShare addon",
  "permissions": {
    "network": []
  },
  "actions": [
    {
      "id": "hello",
      "label": "Say hello"
    }
  ]
}
```

Use a globally unique, stable ID. Declare only the network hosts and runtime capabilities the addon actually needs.

This minimal example has no icon. To add one, place an SVG, PNG or WebP file in `assets/` and declare `"icon": "assets/icon.svg"`.

## Implement the addon

```ts
import {
  type IAutomationPlugin,
  type IPluginAPI,
  type PluginActionParameters,
  registerPlugin,
  type SystemEventContext,
} from '@streamshare/plugin-sdk';

class HelloAddon implements IAutomationPlugin {
  private api!: IPluginAPI;

  async onInit(api: IPluginAPI): Promise<void> {
    this.api = api;
  }

  async onEvent(_event: SystemEventContext): Promise<void> {}

  async onAction(_params: PluginActionParameters, actionId: string): Promise<void> {
    if (actionId === 'hello') {
      this.api.toast({message: 'Hello from the addon', color: 'success'});
    }
  }
}

registerPlugin(new HelloAddon());
```

## Add scripts

```json
{
  "scripts": {
    "validate": "streamshare-plugin-cli validate --app-version 3.13.1",
    "dev": "streamshare-plugin-cli dev",
    "build": "streamshare-plugin-cli build"
  }
}
```

Run `pnpm validate` before targeting a specific StreamShare version, `pnpm dev` while testing locally and `pnpm build` to create an installation ZIP. Follow the [development-mode guide](./guides/development-mode.md) to connect a supported StreamShare device, receive reloads and inspect logs.

## Next steps

- Review the [public addon contract](./concepts/public-contract.md).
- Read the complete [manifest reference](./concepts/manifest.md).
- Detect optional APIs through [runtime capabilities](./concepts/runtime-capabilities.md).
- Connect StreamShare using [development mode](./guides/development-mode.md).
- Give an assistant authoritative context with [AI-assisted development](./guides/ai-assisted-development.md).
- Explore the complete [Hello addon](./examples/hello-addon.md).
- Build a searchable catalog with the [Example Catalog Source](./examples/catalog-source-addon.md).
- Learn the [source-addon lifecycle](./guides/source-addons.md).
- Adapt an authorized [remote catalog without a local index](./guides/remote-source-addons.md).
- Integrate with [StreamShare TMDB enrichment](./guides/tmdb-metadata.md).
- Declare [network access](./guides/network-access.md) narrowly.
- Use [background tasks](./guides/background-tasks.md) only for durable Android work.
- Consult the [SDK API reference](./api/index.md).

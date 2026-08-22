---
title: Hello addon example
description: Explore a minimal automation addon with no network access or external dependencies.
---

# Hello addon example

The Hello addon is the smallest complete StreamShare automation addon. It demonstrates configuration, an event subscription, a user action, and typed host registration without requesting network access.

## Manifest

```json
{
  "id": "com.tootiapps.streamshare.hello",
  "name": "Hello StreamShare",
  "version": "1.0.0",
  "compatibleVersion": "^3.13.0",
  "type": "automation",
  "main": "dist/index.js",
  "author": "TootiApps",
  "description": "A minimal addon demonstrating configuration, events and actions.",
  "permissions": {
    "network": []
  },
  "subscriptions": [
    {"event": "app:started"}
  ],
  "config": [
    {
      "key": "greeting",
      "type": "text",
      "label": "Greeting",
      "default": "Hello"
    }
  ],
  "actions": [
    {
      "id": "say_hello",
      "label": "Say hello",
      "description": "Displays a greeting using the configured message.",
      "inputs": [
        {
          "key": "recipient",
          "type": "text",
          "label": "Recipient",
          "default": "StreamShare"
        }
      ]
    }
  ]
}
```

An empty network list is intentional. Addons should not request capabilities they do not need.

The example omits the optional `icon` property to keep the package minimal. See [Declaring an icon](../concepts/manifest.md#declaring-an-icon) for the recommended `assets/icon.svg` layout and packaging rules.

## Entry point

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
    this.api.logger.info('Hello addon initialized.');
  }

  async onEvent(event: SystemEventContext): Promise<void> {
    if (event.eventName === 'app:started') {
      this.api.logger.info('StreamShare started.');
    }
  }

  async onAction(params: PluginActionParameters, actionId: string): Promise<void> {
    if (actionId !== 'say_hello') return;

    const config = await this.api.getConfig();
    const greeting = config['greeting'] || 'Hello';
    const recipient = typeof params['recipient'] === 'string' ? params['recipient'] : 'StreamShare';

    this.api.toast({
      message: `${greeting}, ${recipient}!`,
      color: 'success',
      duration: 3000,
    });
  }
}

registerPlugin(new HelloAddon());
```

`registerPlugin` is provided by the SDK and reports a clear error if the bundle is executed outside the StreamShare addon runtime.

## Validate and package

From the example project directory:

```bash
pnpm typecheck
pnpm build
```

The build validates the manifest, bundles the entry point and creates a local installation ZIP. It does not publish the addon.

For an iterative workflow, run `pnpm dev` and follow the [development-mode guide](../guides/development-mode.md).

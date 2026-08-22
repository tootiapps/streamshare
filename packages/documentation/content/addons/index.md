---
title: StreamShare addons
description: Build sandboxed addons with the public StreamShare plugin SDK and CLI.
slug: /
---

# StreamShare addons

Addons extend StreamShare through a versioned, sandboxed contract. An addon declares its identity, permissions, configuration, actions, and entry script in a manifest. Its code interacts with StreamShare only through the API exposed by `@streamshare/plugin-sdk`.

Start with [your first addon](./getting-started.md), use the complete [manifest reference](./concepts/manifest.md), and connect a device through [development mode](./guides/development-mode.md). The tested [Hello addon](./examples/hello-addon.md) provides a complete minimal implementation, while the generated [SDK API reference](./api/index.md) contains exact TypeScript signatures.

When working with an AI assistant, start from the public [`llms.txt`](https://docs.tootiapps.com/llms.txt)
index and follow the [AI-assisted development guide](./guides/ai-assisted-development.md).

## Public documentation boundary

Only the capabilities described by this documentation and the published SDK form the addon contract. Addons must not rely on undocumented behavior.

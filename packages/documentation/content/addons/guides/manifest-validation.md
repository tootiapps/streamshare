---
title: Validate a manifest
description: Validate untrusted addon manifests with the same rules as the StreamShare host and CLI.
---

# Validate a manifest

The SDK provides the canonical runtime validator for addon manifests. The StreamShare host and plugin CLI use this same implementation, so a manifest accepted locally is checked against the same structural rules when it is installed.

Use `parsePluginManifest` at an untrusted boundary such as a JSON file, HTTP response, or package archive:

```ts
import {parsePluginManifest} from '@streamshare/plugin-sdk';

const manifest = parsePluginManifest(JSON.parse(manifestJson));
console.log(manifest.id, manifest.version);
```

The function returns a typed `PluginManifest` or throws a `PluginManifestValidationError`. Its `field` property identifies the invalid manifest field when one is available.

If you already hold a value and want an assertion, use `assertPluginManifest`:

```ts
import {assertPluginManifest} from '@streamshare/plugin-sdk';

const candidate: unknown = JSON.parse(manifestJson);
assertPluginManifest(candidate);

// candidate is now typed as PluginManifest.
console.log(candidate.actions ?? []);
```

For a non-throwing check, use `isPluginManifest(candidate)`. Avoid maintaining a separate schema in an addon or developer tool: importing the SDK validator prevents rule drift as the public contract evolves.

## What is validated

The validator checks the public manifest contract, including:

- reverse-domain addon identifiers and strict semantic versions;
- compatible-version ranges, package-relative entry points and supported icon paths;
- declared permissions and network permission patterns;
- action inputs, configuration defaults and select choices;
- unique action, configuration, subscription and background-task identifiers;
- background-task references to declared actions.

Filesystem concerns remain the responsibility of the package reader. For example, the CLI also verifies that the declared icon exists and respects its size limit.

Unknown top-level fields are tolerated for forward compatibility. They are not considered supported public API unless this documentation and the SDK types describe them.

For the meaning, requirement level and constraints of each field, use the complete [addon manifest reference](../concepts/manifest.md).

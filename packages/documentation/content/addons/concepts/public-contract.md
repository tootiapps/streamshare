---
title: Public addon contract
description: Understand what StreamShare guarantees to addons and what remains an implementation detail.
---

# Public addon contract

The supported addon contract consists of:

- the published `@streamshare/plugin-sdk` types;
- the manifest fields documented for the relevant SDK major version;
- the behavior explicitly described in this documentation;
- the public compatibility and versioning policy.

Anything else must be treated as an implementation detail. In particular, addons must not depend on application database layouts, native class names, private filesystem paths, undocumented globals, or the behavior of internal test packages.

The current public implementation contracts are `automation` and `source`. The manifest value `player` is reserved for a future SDK contract and is not yet available to third-party addon authors.

The SDK's runtime manifest validator is the canonical structural validation used by the host and plugin CLI. Developer tools should reuse it instead of implementing an independent schema. See [Validate a manifest](../guides/manifest-validation.md).

## Stability

Breaking contract changes require a new SDK major version. Additive fields and methods may appear in compatible minor releases. Addons should tolerate optional fields they do not use and inspect the [runtime capability matrix](./runtime-capabilities.md) before using platform- or mode-dependent APIs.

## Trust boundary

Addon code runs in a restricted environment. It receives only the capabilities granted by the host API and approved through its manifest. An addon should keep its permission set minimal and must treat user data as private.

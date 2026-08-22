---
title: Develop addons with AI assistants
description: Give an AI assistant authoritative SDK context, use llms.txt effectively and keep addon changes reviewable.
---

# Develop addons with AI assistants

An AI assistant can accelerate contract mapping, scaffolding, parser tests and
debugging. It cannot decide whether content access is authorized, approve
permissions, protect undisclosed credentials or replace testing on a supported
StreamShare host. Treat generated code as a proposed change that remains subject
to developer review.

The safest workflow gives the assistant a small set of authoritative public
sources and requires it to distinguish documented behavior from assumptions.

## Start with the public documentation index

StreamShare publishes two AI-readable entry points:

- [`llms.txt`](https://docs.tootiapps.com/llms.txt) is a compact index of public
  documentation pages with direct Markdown links and descriptions.
- [`llms-full.txt`](https://docs.tootiapps.com/llms-full.txt) concatenates the
  complete public documentation for tools that work better with one context file.

Prefer `llms.txt` first. Ask the assistant to retrieve only the pages relevant to
the task, such as the public contract, manifest, compatibility matrix, source guide
and exact SDK interface. This reduces unrelated context and makes citations easier
to verify. Use `llms-full.txt` when the assistant cannot follow links or when the
task genuinely spans most of the documentation.

These files are documentation transports, not additional SDK APIs. The installed
package version, generated API reference and compatibility page remain decisive
when a model's prior knowledge conflicts with them.

## Provide enough project context

Give the assistant:

- the desired observable behavior and addon type;
- the target StreamShare application version;
- `manifest.json`, `package.json` and the relevant source files;
- current validation, typecheck or runtime errors;
- small sanitized provider responses or fixtures when parsing is involved;
- constraints such as supported platforms, latency goals and whether local state
  is allowed.

Do not provide passwords, API tokens, session cookies, private user data or large
copyrighted page dumps. Replace secrets with named placeholders and reduce remote
responses to the smallest fixture that reproduces the shape under test.

## Use a contract-first prompt

A useful initial prompt is:

```text
Build a StreamShare source addon for an authorized remote catalog.
Target application version: <version>.

Read https://docs.tootiapps.com/llms.txt first, then retrieve only the relevant
addon Markdown pages and exact SDK API declarations. Use documented public APIs
only. If a required capability is absent, identify the limitation instead of
inventing an API or depending on host internals.

Before editing code:
1. map the requested behavior to SourceCapabilities and SourceMediaItem;
2. define stable IDs and the container hierarchy;
3. separate discovery from playback variants;
4. list required manifest permissions and configuration semantics;
5. propose deterministic tests and device-level checks.

After editing, run manifest validation, typechecking, tests and the addon build.
Report assumptions, remaining limitations and every changed public permission.
```

For an existing addon, also ask the assistant to preserve unrelated changes and
to diagnose a failure from evidence before rewriting the implementation.

## Work in verifiable increments

Use the assistant for one observable slice at a time:

1. Validate the manifest and establish a minimal registered addon.
2. Implement stable logical discovery with deterministic fixtures.
3. Add pagination and only the capabilities the provider applies globally.
4. Model series, seasons and episodes as distinct IDs and containers.
5. Add source-selection variants and `resolvePlayback()`.
6. Add configuration, with preferences separated from filters and exclusions.
7. Test in development mode on every supported interaction model.

Require a test or a concrete runtime observation for each slice. Small steps make
it easier to identify whether a regression comes from parsing, identity, source
mapping, configuration or presentation.

Before asking for a fix, identify the failing boundary: remote response, addon
mapping, published SDK contract or host behavior. Give the assistant the received
criteria, returned opaque ID and resolved result when they are relevant. Browser
inspection can establish the remote page shape, but it does not prove that the
same request, image or media URL works in the addon runtime or on every playback
target.

## Ask the assistant to challenge common mistakes

An AI review should explicitly check for:

- APIs or manifest fields that do not exist in the published SDK;
- capabilities advertised without applying their criteria before pagination;
- page positions, titles or sibling-only values used as IDs;
- the first remote search result accepted without verifying media identity;
- duplicate logical results for qualities that belong in source selection;
- eager detail-page requests during ordinary search;
- language, quality or provider **preferences** implemented as filters;
- fixed select options for a provider-controlled vocabulary that can evolve;
- partial facets computed from the current page only;
- host enrichment confused with `supportsTmdbLookup`;
- image URLs that require headers the artwork contract cannot carry;
- signed playback URLs stored as durable item IDs;
- configuration values used without parsing their serialized string form;
- broad network permissions added only to hide an allowlist error;
- credentials, signed URLs or remote response bodies written to logs;
- generated documentation or host internals treated as editable public source.

When the assistant identifies a missing capability, ask it to describe a fallback
using current public contracts and to state the user-visible trade-off. Do not ask
it to reach into undocumented application behavior.

## Validate generated work

At minimum, run manifest validation and the addon build. Run the project's test
suite when it declares one:

```bash
pnpm validate
pnpm build
pnpm test # when the project defines this script
```

Then connect through [development mode](./development-mode.md) and test the real
user path. A successful typecheck does not prove correct pagination, stable
identity, remote-control operation, provider tolerance or playback resolution.

Review the final diff and answer these questions before distribution:

- Does every permission correspond to an observable requirement?
- Are configuration defaults neutral and labels semantically accurate?
- Can unknown remote values remain usable?
- Are errors bounded, understandable and free of secrets?
- Does the addon degrade safely when the provider changes or is unavailable?
- Is every external resource authorized for this use?

AI assistance changes development speed, not responsibility. A human maintainer
remains accountable for security, rights, compatibility, testing and publication.

# StreamShare documentation workspace

This workspace builds the public StreamShare documentation. It does not deploy
or publish anything automatically.

## Local commands

From the repository root:

```bash
pnpm --filter @streamshare/documentation start
pnpm --filter @streamshare/documentation build
pnpm --filter @streamshare/documentation typecheck
```

The local build prepares content before Docusaurus starts. It generates:

- TypeDoc Markdown for the explicitly allowed public API packages;
- `/llms.txt` and `/llms-full.txt`;
- clean Markdown copies and a machine-readable documentation manifest.

TypeDoc uses `typedoc-docusaurus-theme` directly. This produces Docusaurus-compatible Markdown and sidebars in a deterministic pre-build step, while avoiding automatic package discovery and cross-package output collisions.

Generated files are ignored by Git and must never be edited manually.

`pnpm generate:ai` is available for debugging the machine-readable outputs after API Markdown already exists. Normal development and build commands perform the complete pipeline automatically.

## Publication boundary

The allowlist in `public-scope.mjs` is the enforcement point for the build.
Adding a content root, API package, example or external link requires an
explicit publication-scope review.

There is deliberately no deployment or publishing script in this package.

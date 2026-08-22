# StreamShare developer ecosystem

This repository is the controlled public distribution of the StreamShare
developer ecosystem. It contains the contracts, tools, examples and
documentation intended for addon, service and client developers.

## Packages

| Package | Purpose |
| --- | --- |
| `@streamshare/plugin-sdk` | TypeScript contracts and validators for StreamShare addons |
| `@streamshare/plugin-cli` | Development, validation and packaging tools for addons |
| `@streamshare/service` | Typed protocol and runtime validators for StreamShare services |
| `@streamshare/remote-protocol` | Versioned contract for compatible remote playback clients |

## Examples

- `@streamshare/example-hello-addon`: minimal addon lifecycle example;
- `@streamshare/example-source-addon`: catalog, discovery, search and playback
  source example;
- `streamshare-example-service`: reference service with catalog, playback and
  authentication flows.

Examples are marked `private` so they cannot be published accidentally.

## Documentation

The documentation workspace builds the human-readable site, generated API
reference and AI-oriented Markdown outputs from the same maintained sources.

- [Applications](https://docs.tootiapps.com/)
- [Addon development](https://docs.tootiapps.com/addons/)
- [Service development](https://docs.tootiapps.com/services/)

## Development

Requirements:

- Node.js 22 or newer;
- pnpm 11.9.0 through Corepack.

```bash
corepack enable
pnpm install
pnpm test
pnpm run docs:build
```

Run the complete public validation suite with:

```bash
pnpm run ci
```

## Releases

Publishable packages use independent semantic versions managed with Changesets.
Add a changeset whenever a public package change affects consumers:

```bash
pnpm changeset
```

This repository does not publish packages automatically. Releases are promoted
only from `main`, after an explicit maintainer approval in the protected
`npm-production` environment and a successful release check. The manual release
workflow is prepared for npm trusted publishing and does not require a
long-lived publication token once the npm package trust relationship is active.

## Public scope

Only the material present in this repository is part of the public developer
surface. Application internals, unpublished integrations and private test
packages are not public contracts.

See [PUBLIC_SCOPE.md](./PUBLIC_SCOPE.md) and
[CONTRIBUTING.md](./CONTRIBUTING.md) before proposing a change.

# Contributing

StreamShare uses this repository as a controlled public distribution.

Issues describing reproducible problems, compatibility questions or gaps in the
public documentation are welcome. Pull requests may be reviewed, but accepted
changes can be reproduced by the maintainers through the controlled release
process instead of being merged directly.

## Before opening a change

1. Work only against documented public contracts.
2. Do not include application internals, private integrations, credentials,
   production endpoints, personal data or generated build output.
3. Add or update tests for contract and tooling changes.
4. Update the relevant documentation when public behavior changes.
5. Add a Changeset for every consumer-visible change to a publishable package.

## Validation

```bash
pnpm install
pnpm run ci
```

Before a release candidate is approved, maintainers also run:

```bash
pnpm run release:check
```

Documentation-only changes and private examples do not require a Changeset.

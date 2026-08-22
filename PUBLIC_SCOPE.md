# Public scope

This repository follows a deny-by-default publication policy.

The supported public surface consists of:

- exported entry points of packages under `packages/`;
- addon and service manifests described by the documentation;
- the checked-in examples;
- authored Markdown and generated API documentation produced by the
  documentation workspace;
- compatibility files shipped by publishable packages.

Files, symbols and behaviors not exported or documented here are not public
contracts. Examples demonstrate supported patterns but do not grant additional
capabilities beyond the corresponding SDK or protocol.

Generated archives must be reviewed with `pnpm pack --dry-run` before
publication. Generated documentation, package output and dependency directories
must not be committed.

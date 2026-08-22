# Hello StreamShare addon

Minimal automation addon used to validate the public StreamShare addon-development journey.

The package is intentionally marked `private` until the SDK and publication process are approved. It requests no network access and demonstrates only stable public concepts:

- manifest identity and compatibility;
- one editable configuration value;
- one application event subscription;
- one user action with a typed input;
- registration through `@streamshare/plugin-sdk`.

From the repository root:

```bash
pnpm --filter @streamshare/example-hello-addon typecheck
pnpm --filter @streamshare/example-hello-addon validate
pnpm --filter @streamshare/example-hello-addon build
pnpm --filter @streamshare/example-hello-addon dev
```

The build produces a local ZIP archive for installation testing. Neither the package nor the archive is published by these commands.

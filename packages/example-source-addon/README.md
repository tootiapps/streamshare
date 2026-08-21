# Example Catalog Source addon

Reference implementation of the public StreamShare `source` addon contract. The
catalog is deterministic, has no private dependency and performs no network
request from addon code, so developers can inspect and test every source method
independently. Its movie records carry TMDB identifiers that StreamShare uses for
host-owned metadata enrichment, while its generic-video record demonstrates the
playable `video` contract without TMDB metadata.

The movie playback URLs point to Blender Foundation open movies. The fictional
series keeps reserved `example.com` placeholders. The package intentionally
requests no addon network permission because it never calls `api.http`; playback
resources are opened by the host player after `resolvePlayback()` returns.

From the repository root:

```bash
pnpm --filter @streamshare/example-source-addon typecheck
pnpm --filter @streamshare/example-source-addon validate
pnpm --filter @streamshare/example-source-addon test
pnpm --filter @streamshare/example-source-addon dev
```

The package remains `private` until the SDK and example-publication process are
approved. These commands build and test local artifacts but never publish them.

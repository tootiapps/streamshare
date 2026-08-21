# streamshare-example-service

## Unreleased

### Changed

- Replaced the bundled SQL.js catalogue with direct, stateless TMDB API access.
- Added server-side TMDB token and language configuration.
- Added ignored `.env.local` development configuration with a secret-free `.env.example` template.
- Kept StreamShare pagination stable across TMDB's fixed-size pages.
- Renamed the misleading `top-250` route to `top-rated`.
- Made integration tests independent from TMDB credentials and network access.

## 1.0.1

### Patch Changes

- Updated dependencies
  - @streamshare/service@1.0.1

# StreamShare example service

Reference implementation for `@streamshare/service`.

The example demonstrates:

- service discovery through a JSON manifest;
- a stateless catalogue backed directly by TMDB;
- movies, series, seasons and episodes;
- search, filtering, sorting and pagination;
- TMDB genre/year facets derived from the current result window;
- runtime protocol validation through the canonical package.
- public manifest discovery with Basic, API-key, and device-code authentication examples.

## Run locally

Create a local configuration file once:

```bash
cp packages/streamshare-example-service/.env.example \
  packages/streamshare-example-service/.env.local
```

Set `TMDB_ACCESS_TOKEN` in `.env.local`, then start the service:

```bash
pnpm --filter streamshare-example-service start
```

`.env.local` and the other `.env.*` files are ignored by Git. Only `.env.example`, which never contains a real credential, is committed. Variables supplied by the host process, Docker, systemd or CI take priority over local files.

The default URL is `http://127.0.0.1:4046`.

For an Android TV or emulator on the same network:

```bash
pnpm --filter streamshare-example-service start:network
```

Protected modes still require HTTPS by default in StreamShare. When using this local HTTP server, review and enable the private-network HTTP exception in the service form. For `deviceCode`, select **Connect** afterward to display the authorization code and QR code. The exception is limited to private-network addresses and must never be used on an untrusted network.

Configuration is provided through environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Listening interface |
| `PORT` | `4046` | Listening port |
| `DEMO_MEDIA_URL` | `/assets/demo.mp4` | Playable URL attached to movies and episodes |
| `TMDB_ACCESS_TOKEN` | — | Required TMDB API Read Access Token, kept on the server |
| `TMDB_LANGUAGE` | `fr-FR` | Language requested from TMDB |
| `DEMO_AUTH_METHOD` | — | Optional `basic`, `apikey`, or `deviceCode` protection |
| `DEMO_AUTH_USERNAME` | `demo` | Username used in Basic mode |
| `DEMO_AUTH_PASSWORD` | `demo` | Password used in Basic mode |
| `DEMO_AUTH_API_KEY` | `demo-api-key` | Static key used in API-key mode |
| `DEMO_AUTH_ACCESS_TOKEN_EXPIRES_IN` | `3600` | Device-flow access-token lifetime in seconds |

The example has no database and writes no catalogue data to disk. Movies and series use TMDB search/discover endpoints, while series navigation uses the TV details and season details endpoints. The StreamShare `limit` is translated over TMDB's fixed 20-item pages, so callers retain stable StreamShare pagination.

TMDB text search does not expose a genre parameter. When a text query and genres are combined, the service scans the upstream search pages until it can return the requested globally filtered page. Discover requests apply genre, year and sorting directly on TMDB.

Device-code challenges and token sessions are intentionally held in memory. Restarting the example invalidates previously issued refresh tokens; StreamShare then shows that a new connection is required. Select **Reconnect** to start a fresh challenge, or **Reset authentication** to discard the local session explicitly. A production service should normally persist revocable session state across routine restarts.

## TMDB attribution and licensing

TMDB requires approved branding and the notice: “This product uses the TMDB API but is not endorsed or certified by TMDB.” Add them to the application's About or Credits screen. TMDB's developer API is described as free for non-commercial use; commercial products must review the current [TMDB FAQ and licensing guidance](https://developer.themoviedb.org/docs/faq) and contact TMDB when required. This example does not grant a TMDB data or image licence.

The bundled three-second H.264/AAC clip makes the default catalogue immediately testable from the source selector. Set `DEMO_MEDIA_URL` to an absolute URL to exercise the player with another stream.

The manifest embeds the bundled `Service-Symbol.png` as a `data:` URL. This keeps the logo available when a secure application tests the local HTTP service. The asset also remains available under `/assets` for direct use. Production services should prefer a square SVG or transparent PNG served over HTTPS; an embedded `data:` URL is also supported.

## Verify

```bash
pnpm --filter streamshare-example-service test
```

The integration suite injects a deterministic fake TMDB client, starts the service on random local ports and validates the manifest, exact TMDB lookup, results, pagination, filters, facets, playback links, series navigation, Basic credentials, static API keys, device authorization, and refresh-token rotation without external network access.

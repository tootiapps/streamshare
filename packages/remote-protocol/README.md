# @streamshare/remote-protocol

Public TypeScript contract for interoperable StreamShare playback controllers
and receivers.

The package provides versioned message types, request helpers, runtime envelope
validation, and the pairing-code derivation shared by compatible clients. It
does not provide discovery, networking, certificate storage, or media playback.

## Installation

```bash
pnpm add @streamshare/remote-protocol
```

## Create and validate a request

```ts
import {
  createRemoteRequest,
  parseRemoteEnvelope,
} from '@streamshare/remote-protocol';

const request = createRemoteRequest('request-1', 'playback.load', {
  url: 'https://media.example/movie.m3u8',
  autoplay: true,
  metadata: {
    title: 'Example movie',
    releaseYear: 2026,
  },
});

const envelope = parseRemoteEnvelope(JSON.stringify(request));
```

`parseRemoteEnvelope()` rejects malformed JSON, unsupported protocol versions,
and unknown methods. Applications should still validate media URLs, credentials,
permissions, and method-specific values at their own trust boundary.

## Compatibility

Protocol v1 is identified by `STREAMSHARE_REMOTE_PROTOCOL_VERSION`. Breaking
wire changes require a new protocol version; compatible additions may be made
without changing the version.

See [PROTOCOL.md](./PROTOCOL.md) for discovery, pairing, authentication,
playback, track selection, and interface-navigation requirements.

## License

Apache-2.0. See [LICENSE](./LICENSE).

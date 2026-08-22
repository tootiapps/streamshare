# Streamshare Remote Protocol v1

Streamshare Remote Protocol is the interoperable contract used by Streamshare
senders and Streamshare TV receivers. Discovery uses DNS-SD with the service
type `_streamshare-tv._tcp.local.`. Control traffic uses HTTPS and WSS on the
advertised TCP port. The authenticated WebSocket endpoint is `/v1/ws`.

## Discovery TXT records

- `id`: lowercase SHA-256 fingerprint of the receiver TLS certificate.
- `v`: protocol version (`1`).
- `platform`: `android`, `windows`, `macos`, or `linux`.
- `caps`: comma-separated capabilities.
- `tls`: always `1` for protocol v1.
- `name`: current user-visible receiver name.
- `updated`: Unix timestamp in milliseconds of the latest receiver identity
  update. Senders retain the announcement with the greatest value for a given
  `id`, so a cached DNS-SD record cannot restore an obsolete name.

No secret, pairing code, media URL, or personal information may be advertised.

## Pairing

The receiver owns a persistent TLS identity. `pair.begin` creates a pairing
session and makes the receiver display a two-digit short authentication string
(SAS). The sender independently derives the SAS from the receiver certificate,
pairing id, and controller id. The entered SAS is compared locally and is never
sent to the receiver.

After a successful comparison, the sender creates a random 256-bit bearer token,
encrypts it with the receiver certificate public key using RSA-OAEP/SHA-256, and
sends it with `pair.complete`. Receivers store only a SHA-256 token digest.

Pairing sessions expire after 60 seconds. A receiver must allow a single active
session and apply a global cooldown after three failed or abandoned sessions.

## Authentication

Authenticated requests use `Authorization: Bearer <token>` over certificate-
pinned TLS. Receivers update the controller's `lastSeenAt` after authentication.
Revocation deletes the token digest and closes matching active connections.

## Playback

`playback.load` replaces the current media and creates a new playback session.
The receiver emits `playback.state` after every state transition and at most once
per second while the position changes. Commands are idempotent where practical.
Optional `metadata.customData` values are sender-owned and opaque. A receiver
must preserve and return them unchanged in `playback.state` while that media
session remains active; it must neither interpret nor advertise them.

Optional display metadata includes `title`, `subtitle`, `releaseYear`,
`overview`, `artworkUrl`, and `contentType`. Receivers may adapt their layout to
the available screen space, but must preserve these values in playback state.

Receivers may expose audio, video/quality, and subtitle choices in the optional
`tracks` playback-state member. `playback.selectTrack` uses the receiver-owned
track identifier. The optional `ui` state tells controllers whether on-screen
controls are visible; while they are visible, `ui.navigate` provides directional
focus navigation without coupling the protocol to a particular UI toolkit.

The receiver must reject unsupported protocol versions and media without
silently attempting unsafe fallbacks.

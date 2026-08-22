---
title: Service authentication
description: Protect service endpoints with Basic credentials, a static API key, or a device-code token session.
---

# Service authentication

Authentication is optional. Omit `auth` for a public service. A protected service declares one authentication method in its public manifest without placing credentials or tokens in that manifest.

| Manifest method | User experience | Request authorization |
| --- | --- | --- |
| `basic` | Enter a username and password. | `Authorization: Basic …` |
| `apikey` | Enter a service API key. | `Authorization: Bearer <key>` |
| `deviceCode` | Open a link or scan a QR code, approve the connection, then let the application maintain the session. | `Authorization: Bearer <accessToken>` |

The service root manifest always remains available without authentication. Only the declared API endpoints require credentials.

## Device-code sessions

Device-code authentication is useful on televisions and whenever signing in from another device is more convenient. Declare two service-relative paths:

```ts
const manifest = defineService({
  protocolVersion: 1,
  name: 'Protected catalog',
  auth: {
    method: 'deviceCode',
    deviceAuthorizationPath: '/auth/device',
    tokenPath: '/auth/token',
  },
  api: [
    // Endpoints omitted for brevity.
  ],
});
```

Both paths must begin with `/` and remain on the configured service origin.

### 1. Create a challenge

The application sends `POST deviceAuthorizationPath` with an empty JSON object. Return:

```json
{
  "deviceCode": "opaque-device-code",
  "userCode": "ABCD-1234",
  "verificationUrl": "https://service.example/activate",
  "verificationUrlComplete": "https://service.example/activate?code=ABCD-1234",
  "expiresIn": 600,
  "interval": 5
}
```

`deviceCode` is an opaque secret used only for polling. `userCode` is displayed to the user. `verificationUrlComplete` is optional; when provided, it is preferred for the clickable link and QR code.

### 2. Poll for authorization

After waiting at least `interval` seconds, the application sends this JSON object to `POST tokenPath`:

```json
{
  "grantType": "urn:ietf:params:oauth:grant-type:device_code",
  "deviceCode": "opaque-device-code"
}
```

Return one of these states with HTTP `200`:

```json
{"status": "pending"}
```

```json
{"status": "denied"}
```

```json
{"status": "expired"}
```

The pending response may provide a larger `interval`. Once approved, return a token grant:

```json
{
  "status": "authorized",
  "accessToken": "short-lived-access-token",
  "refreshToken": "rotating-refresh-token",
  "expiresIn": 3600
}
```

The application stops polling on authorization, denial, expiry, cancellation, or when the challenge lifetime elapses.

### 3. Refresh the session

Before the access token expires, the application sends:

```json
{
  "grantType": "refresh_token",
  "refreshToken": "rotating-refresh-token"
}
```

Return a new `ServiceTokenGrant` containing a new access token, refresh token, and access-token lifetime. Refresh tokens are rotated: invalidate the consumed refresh token when issuing its replacement. Concurrent API requests share one renewal operation, and an API request rejected with `401` is retried only once after a forced renewal.

If the refresh token is rejected, or if the retried API request still returns `401`, StreamShare discards the invalid local token session. The service then appears as **Connection required** in Settings. **Reconnect** always starts a new device-code challenge; it does not treat an existing local token as proof of a valid service session. The user can also choose **Reset authentication** before reconnecting.

This behavior is important for revoked accounts, expired server-side sessions, and service restarts that do not preserve refresh-token state. A production service should normally persist revocable refresh-token records across routine restarts. An intentionally stateless demonstration server may invalidate them on restart, but the next protected request must return `401` so the application can request a fresh connection.

## Persistence and backups

Configured usernames, passwords, API keys, access tokens, and refresh tokens are retained with the service connection. When the user includes services in a backup, those access details are included so restoring the backup also restores the connection.

Approval for private-network HTTP is device-local and is not part of the service backup. After restoring a protected HTTP service, review the current network and approve the exception again before the application can send its restored credentials.

Treat the backup as credential-bearing data. Protect the destination account, avoid sharing the file, and use the available backup encryption when the copy may leave a trusted personal account. Revoking a credential at the service remains authoritative even when an older backup contains it.

## Security rules

- Use HTTPS for the manifest, authorization endpoints, and protected API endpoints.
- Never put credentials in the manifest, URL paths, query parameters, response diagnostics, analytics, or logs.
- Give each user a revocable, least-privilege credential.
- Return `401` when a credential is absent, invalid, expired, or revoked, and `403` when a valid credential lacks permission.
- Rate-limit authorization attempts and device-code polling.
- Generate device codes, access tokens, and refresh tokens with a cryptographically secure random source.
- Store only hashed refresh tokens server-side when the original value is not required.
- Do not redirect an authenticated API request to another origin.

For local testing, a user may explicitly approve unencrypted HTTP for a service on loopback or a private-network address. The approval belongs to that origin on the current device and cannot be requested or enabled by the service manifest. It never permits authenticated HTTP to a public-network address. Treat this as a development-only exception: credentials and tokens can be observed or altered by other systems on the local network.

## Playback access is separate

Service credentials authenticate JSON API requests. They are not automatically attached to artwork, subtitle, or playback URLs.

For protected media, return a short-lived signed URL or another self-contained playback URL that the target device can open directly. Use `expiresAt` on a playback link when the URL has a known expiry.

## Test the complete boundary

Verify that:

1. the root manifest remains public while protected endpoints reject missing credentials;
2. Basic and static API-key credentials appear only in the authorization header;
3. device-code polling respects the advertised interval and expiry;
4. refresh-token rotation invalidates the previous token;
5. simultaneous expired requests trigger only one renewal;
6. a `401` causes at most one renewal and retry;
7. a rejected refresh token clears the old session and a new connection succeeds;
8. explicit authentication reset removes the local session;
9. backup and restore preserve the selected service access;
10. playback and artwork use their own safe access mechanism.

The [demonstration service](../example-service.md) provides executable examples of every supported authentication method.

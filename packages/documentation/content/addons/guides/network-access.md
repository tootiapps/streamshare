---
title: Network access
description: Declare and use the addon network allowlist safely.
---

# Network access

Every addon declares its allowed network hosts in `permissions.network`.

```json
{
  "permissions": {
    "network": ["api.example.com", "*.media.example.com"]
  }
}
```

Entries are host names only. Do not include a scheme, port, path, query, or fragment.

- `api.example.com` grants that exact host.
- `*.example.com` grants the apex domain and its subdomains.
- `*` grants every supported HTTP(S) and WebSocket host and should be avoided unless arbitrary origins are essential to the addon.

Network access can be reviewed by the user. Redirects and development resources remain subject to the declared allowlist.

Use `api.http.get()` when the native HTTP capability is required. Handle timeouts, invalid responses, rate limits, and unavailable networks as normal runtime conditions.

A URL entered in addon configuration remains subject to this manifest allowlist;
configuration does not grant a host automatically. Use exact or wildcard-domain
entries when the possible origins are bounded. If arbitrary user-selected origins
are essential, the current contract requires `*`, so explain the broader access
and validate the configured URL before every request.

The HTTP capability returns text. It does not provide a public programmable
browser session, page-JavaScript execution, interactive authentication, challenge
solving or shared browser cookies. See [Adapt a remote
catalog](./remote-source-addons.md) before integrating a server-rendered site.

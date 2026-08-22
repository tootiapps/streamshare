# `@streamshare/plugin-cli`

Local development, validation and packaging commands for StreamShare addons.

```bash
streamshare-plugin-cli validate --app-version 3.13.1
streamshare-plugin-cli dev --port 3000 --app-version 3.13.1
streamshare-plugin-cli build --app-version 3.13.1
```

`validate` checks `manifest.json`, the package icon, the source entry point and optionally the targeted StreamShare application version. `dev` prints every reachable LAN address that can be entered on a mobile or TV device. `build` validates and bundles the addon before writing its installation ZIP.

Run `streamshare-plugin-cli --help` for the complete command summary. These commands never publish a package or addon.

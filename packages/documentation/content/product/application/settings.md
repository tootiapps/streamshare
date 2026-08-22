---
title: Settings
description: Understand each StreamShare settings section and when to use it.
---

# Settings

Settings is where you connect StreamShare to your accounts, content sources and playback devices. It also controls the homepage, application experience and troubleshooting tools.

The presentation differs between mobile and TV, but the main sections serve the same purpose.

## Notifications on mobile

Open **Notifications** to review saved messages and progress updates from StreamShare. Use it when a short-lived message has disappeared before you could read it. You can dismiss one message or clear the complete list.

## Accounts and synchronization

Use this section for accounts and data that can follow you across devices.

### Subscription

View the current plan and manage Premium access. Premium affects features such as the number of Media Hub sources that can be selected together.

### AllDebrid

Connect an AllDebrid account when you want StreamShare to resolve supported links through that service. Select **AllDebrid**, open the displayed link or scan its QR code, then confirm the displayed code with your AllDebrid account. The status indicator changes when authorization succeeds.

After connection, select the card again to enable, disable or reset the account. Enable automatic link resolution if you intend to use Quick Play without being asked to resolve a link first.

### Trakt

Connect Trakt to synchronize supported collection and viewing information. Select **Trakt**, open the displayed link or scan its QR code, and confirm the code with your Trakt account. After connection, select the card again to start collection synchronization, temporarily disable the integration or reset its authorization.

### Backups

Create and restore supported application data with Google Drive. Use backups before changing device or reinstalling the application.

Open **Backups**, connect Google Drive if requested, then choose **Create a backup** and select the data to include. A password is optional, but a protected backup cannot be restored if that password is forgotten. To restore data, choose an available backup, enter its password when required, and review the data to restore before confirming.

### TMDB synchronization

Choose how often StreamShare refreshes information for active series, or start an update manually. Use this when followed series are missing newly available episode information.

## Content

Use this section to decide where the [Media Hub](./media-hub.md) obtains media.

### Media Library

Create and manage the lists exposed by the Collection source. Open **Media Library** to add a list when your account permits it, review its items, rename or clear it, and refresh its media information. See [Media Library and lists](./media-library.md) for the role of Main List and the available workflows.

### Services

Add compatible remote services when content is supplied by a StreamShare service server. Choose **Add a service**, enter its address, select the authentication method required by that service, then connect and save. Link or QR-code authentication must be completed on the page displayed by the service.

An installed service can expose a catalog, browsing sections, search and playback sources according to its capabilities. Return to this section to enable, disable, edit or remove it. If its session is no longer accepted, reset the authentication and connect again.

### Jellyfin

Connect a Jellyfin server to include its libraries as StreamShare sources. Open **Jellyfin**, add a server detected on the local network or enter its address manually, then sign in with a Jellyfin user. Return here to edit the address, change user, reauthenticate or remove the server.

### Extension sources

Manage source addons that contribute content to the Media Hub. The installed list lets you enable, disable, configure, update or remove an addon when those actions are available. Use **Add** to install from a supported catalog or address. Developer instructions belong in the [addon documentation](/addons/).

After configuring a source, select it from the [Media Hub source picker](./media-hub.md#choose-your-sources) if you want it included in unified browsing.

### Parental control

An addon can declare that its content is intended for adults. When you first enable such an addon, StreamShare offers to protect adult content with a numeric PIN; protection remains optional.

When parental control is enabled and locked, adult addons and adult-only content are omitted from source lists, browsing, search, playback choices, history and favorites. The installed-addons list displays a notice with an unlock action when adult addons are currently hidden. Public shortcuts that aggregate several sources can remain visible with neutral artwork; opening them still excludes adult results. Unlocking restores protected content for the current application session. Use **Settings > Content > Parental control** to configure, change or disable the PIN.

## Playback and Cast

Use this section to choose where media plays and how StreamShare starts playback.

### StreamShare TV Client

Enable receiving on a compatible StreamShare device when another StreamShare device should be able to select it as a playback target. Choose a recognizable device name, enable receiving and approve the controller when it connects. The same page can revoke an authorized controller or forget a paired receiver.

### Devices

Add and configure Kodi devices. Enter the address and connection information used by that Kodi installation, then save it. The saved device becomes available during playback selection and in the [Remote control](./remote-control.md). See [Configure Kodi](./remote-control.md#configure-kodi) for the settings required on Kodi itself.

### Default player

Choose the playback target StreamShare should propose by default. Select the device you use most often to reduce repeated choices.

### Quick Play

Quick Play starts playback directly when StreamShare can use the saved defaults and resolve a suitable source. Leave it disabled if you prefer to review the source and target before every playback.

### Player extensions

Manage extensions that add supported playback integrations or players.

## Experience

Use this section for application-wide behavior:

- **Language** changes the application language.
- **Quick Play** controls whether suitable defaults can start playback directly.
- **Show news** controls whether release news is presented after an update.
- On mobile, **Suggest rating and sharing** can offer a sharing prompt near the end of playback; nothing is shared without confirmation, and the suggestion frequency is configurable.

### Performance profile on TV

Open **Settings > Experience > Performance profile** when a TV needs a different balance between visual quality and responsiveness:

- **Recommended by the app** uses the profile selected for the installed release.
- **Automatic** adapts to the TV's available resources.
- **Standard** keeps the complete visual presentation.
- **Lightweight** reduces visual complexity to prioritize responsiveness.

StreamShare indicates when a restart is required to apply the change throughout the TV application.

## Extensions

This section separates everyday extension management from developer tools:

- **Installed** lists extensions already available and opens their configuration or actions.
- **Add** installs an extension from a supported source.
- **Developer mode** loads and tests an addon during development. See [Addon development mode](/addons/guides/development-mode) for the technical workflow.

## Appearance

Appearance controls the [Homepage](./homepage.md):

- show or hide new episodes and series to continue;
- show or hide playback history;
- show or hide latest movies and latest series;
- show or hide popular media, source shortcuts and favorites;
- move homepage sections up or down.

These choices change the organization of the current device; they do not enable or disable the underlying content sources.

## Support

Open **Documentation** to consult the maintained StreamShare guides on the documentation website. Use **Report an issue** when you need to describe a reproducible problem or suggest an improvement; include the application version and the shortest sequence that reproduces the problem. On TV, both destinations display a QR code that can be scanned with a phone when no suitable browser is available.

## System

### Cache

View and clear cached media information. Clearing a cache can help refresh stale artwork or descriptions, but the information may need to be downloaded again.

### System logs

Enable logs when diagnosing a problem, reproduce it, then export the logs for support. Clear them when they are no longer needed.

### Information

View the installed application version and other information useful when requesting support or checking compatibility.

---
title: Remote control
description: Select and control a playback target from the StreamShare remote screen.
---

# Remote control

Remote control lets you manage playback on another compatible screen without returning to that device. Use it after selecting a Kodi device, a Chromecast session or a StreamShare receiver.

## Prepare a playback target

- For a Kodi device, complete the [Kodi setup](#configure-kodi), then open **Settings > Playback & Cast > Devices** and add it.
- For a StreamShare receiver, make the receiver available on the same local network and authorize the controller when requested. See [Desktop clients](../clients/index.md) for Windows, macOS and Linux receivers.
- Chromecast targets are offered when a compatible receiver is available to the device running StreamShare.

## Configure Kodi

Kodi must accept remote commands from the device running StreamShare:

1. In Kodi, open **Settings**, then **System information**, and note the device's IP address.
2. Open **Settings > Services > Control**.
3. Enable remote control over HTTP and note the configured port.
4. Enable authentication and choose a username and password.
5. Allow remote control from applications on other systems.
6. In StreamShare, open **Settings > Playback & Cast > Devices**, add a device, and enter a name, the Kodi IP address, port, username and password.

The two devices must be able to reach each other on the same network. If the Kodi address or credentials change, edit the saved device in StreamShare.

## Select the device to control

1. Open **Remote control**.
2. Choose the target type at the top of the screen.
3. Select the device or active session.

StreamShare keeps the controls associated with the selected target. You can change target at any time from the same selector.

## Available controls

Controls are shown only when the selected target supports them.

| Control | Use |
| --- | --- |
| Direction pad and **OK** | Navigate the receiver interface and confirm a selection. |
| Playback timeline | View progress or move to another position. |
| Play, pause and stop | Control the current media session. |
| Back | Return to the previous screen on compatible receivers. |
| Audio and subtitles | Choose among the tracks reported by the current playback target. |
| Volume | Adjust the receiver or session volume. |

When playback information is available, the remote also displays the current media, duration and useful stream details.

## If the remote cannot connect

For configured devices, first verify **Settings > Playback & Cast > Devices**. Confirm that the controller and receiver are reachable on the same network and that the saved address and credentials are still valid.

For a StreamShare receiver, also verify that its receiving mode is enabled and that the controlling device is authorized.

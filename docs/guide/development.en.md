# pureTV developer guide

[简体中文](development.md) · **English** · [User guide](README.en.md) · [Home](../../README.en.md)

## Repository map

| Directory | What you’ll find there |
| --- | --- |
| [desktop/](../../desktop/README.md) | The desktop TV manager, including its interface, ADB operations and Tauri host. |
| [resource/](../../resource/README.md) | Source, APKs and manifests for first-party TV launchers and apps, plus the [Game Kit host](../../resource/game-kit/README.md). |
| [joystick-games/](../../joystick-games/README.md) | Games for the pureTV Wi-Fi controller. Each game has its own directory for source, platform packages and verification records. |
| [puretv-joystick/](../../puretv-joystick/README.md) | ESP32 controller firmware, the TCP protocol, the Python SDK and tools for testing a connection. |
| [fork/](../../fork/README.md) | Original third-party APKs grouped by category, with upstream sources and checksums. |
| [tools/](../../tools/) | Scripts for catalog maintenance, verification and releases. Third-party APK import and verification tools are in [tools/tvapp/](../../tools/tvapp/). |

For changes and test results across versions 0.5.0–0.5.2 of the nine Android TV games, see the [game release notes (Chinese)](../game-releases/README.md). For a record of other changes by task, see the [work log index (Chinese)](../../history/INDEX.md).

## Build and test

| Component | Starting point |
| --- | --- |
| Desktop manager | Build the interface in `desktop/`, run the Rust core and Tauri host tests, and run the UI tests. [Build commands and platforms (Chinese)](../../desktop/README.md#开发与验证) |
| TV launchers and apps | The Android Gradle projects use Android SDK Platform 35 and Build Tools 34.0.0. For example, from `resource/launcher/puretv/`, run `./gradlew assembleDebug assembleRelease lintDebug testDebugUnitTest`. [Development and verification (Chinese)](../../resource/README-development.md#开发与验证) |
| Game Kit games | Keep gameplay and offline assets in the game's directory and reuse Game Kit's Android host. [Toolchain, build, signing and checks](../../resource/game-kit/BUILD.md) |
| Published resources | Each first-party software directory holds its APK, preview, licenses and SHA256 checksums. Each TV app's 64×64 `logo.svg` supplies its icon for the layout editor. Update the manifests and indexes when adding a resource or version. [App resource convention (Chinese)](../../resource/README-development.md#应用资源与-logosvg-约定) · [Maintenance commands](../resource-maintenance.md) |

## MCP and agents

Open **Device connection → MCP · Agent debugging** in the manager. Copy the complete JSON shown in the window into the agent client's MCP configuration, reconnect the `puretv` service and keep the window open. The configuration uses stdio. Its `command` points to the actual manager executable on that computer and the `--mcp` argument identifies the local session file. Copy the configuration again after moving the app, and reconnect after restarting the manager.

The agent and interface share the current device, Android user, ADB configuration, operation lock and log. The 34 tools cover system information, connections, app management, APK installation, launcher switching and layout, market browsing and installation, backgrounds, ADB setup, language and themes, cancellation and logs. Use `get_state` to inspect the state of the open window. [MCP setup, tool parameters and examples (Chinese)](../../desktop/docs/mcp.md)

## Custom launcher layouts

The TV launcher and the manager's visual editor use the same `layout.json`. The version 5 users/system interface describes independent layouts, backgrounds and navigation for Home and Apps. User app tiles are editable. System components are read-only. Before writing, the manager checks installed user apps, icons, bounds and the system list. It reads the saved layout back from the TV after applying it. [Layout editor and compatibility (Chinese)](../../desktop/docs/launcher-layout.md)

A third-party launcher can include a default layout and Home background in `assets/layout.json`. To enable live editing, implement the Android ContentProvider with the authority `<packageName>.layout`. The manager calls `status` over ADB and shows **Adjust layout** when the active launcher's response passes protocol validation. The `apply` method accepts a Base64-encoded layout. The `reset` method restores the default. The MCP tools `get_launcher_layout` and `apply_launcher_layout` use the same protocol and read-only protections. [Fields, ContentProvider examples and rendered layouts (Chinese)](../../resource/README-development.md#layoutjson-协议规范与画面对照)

## Game client compatibility with the controller

The game acts as the TCP server. The ESP32 controller initiates the connection. An Android game can reuse the Game Kit host's listener, service advertisement and input forwarding. An independent host implements the same discovery and input interfaces. [Game Kit controller support (Chinese)](../../resource/game-kit/README.md#puretv-wi-fi-实体手柄)

### Service advertisement and discovery

1. Listen on the LAN interface on TCP port **63485** by default. Use a fallback port only if the default is occupied at startup. Once listening, advertise `_puretv._tcp` through mDNS/DNS-SD with the actual port. Keep that port throughout the run, including controller reconnects, focus changes and permission dialogs. For older game versions, use the port displayed or advertised by the running game.
2. On Android TV, use `NsdManager.registerService`. Set `NsdServiceInfo.serviceType` to `"_puretv._tcp"`, give the instance a recognizable `serviceName`, set `port` to the active listener and call `setAttribute("version", "1")`. Unregister using the same listener when the service shuts down. If the native host advertises the service, let it own the registration. [Android network service discovery](https://developer.android.com/develop/connectivity/wifi/use-nsd)
3. Wire the normally open **GPIO 23** button to GND. Pressing it runs one local discovery query. **GPIO 27** sends the START game button. The current firmware adopts a target only when it finds exactly one service with a valid IPv4 address and port. With zero services, multiple services or an invalid address, it keeps the current target. The firmware does not filter by instance name or TXT version.
4. The game host may be left empty during Wi-Fi setup. After joining the network, press the search button or configure a host and port directly. A discovered target lasts for the current boot. The controller reconnects to it after a disconnect and restores the saved configuration after reboot.

### TCP input protocol

Use UTF-8 JSON Lines. Each message and ACK ends with a newline (`\n`). Buffer TCP bytes until a complete line arrives. Reply to every valid message with an ACK carrying the same `seq`, such as `{"type":"ack","seq":12}` followed by a newline.

On connection, the controller sends `hello` and nine `button/sync` messages. While connected, it sends `ping` approximately every five seconds. Both `hello` and `ping` carry `type`, `seq` and `controller_id`. Track each controller by its ID. The ESP32 derives this ID from its factory MAC address. Its sequence number increases with each message and restarts when the controller reboots.

```json
{"type":"button","seq":12,"controller_id":"esp32-001122334455","key":"A","pressed":true,"action":"down","duration_ms":0}
```

The nine case-sensitive `key` values are `UP`, `DOWN`, `LEFT`, `RIGHT`, `START`, `A`, `B`, `X` and `Y`.

| `action` | `pressed` | Game behavior |
| --- | --- | --- |
| `down` | `true` | Begin holding the key and handle its press. |
| `tap` | `false` | End a short press. |
| `long_press` | `true` | The controller sends this once after about 500 ms. Trigger a long-press action if the game uses one. |
| `long_release` | `false` | End a long press. |
| `sync` | Current state | Restore the held state without firing a one-shot action. |

`duration_ms` gives the elapsed hold time in milliseconds. It is 0 for `down` and `sync`. Clear the pressed keys for the disconnected connection. On reconnect, use the new `sync` messages. The side indicator pairs the actual client ID with its player seat and updates on disconnect. The current firmware and Python SDK do not transmit RSSI. [Field definitions and reference implementation](../../puretv-joystick/README.md)

### Test a game client

Start the game. From `puretv-joystick/` on the computer, run the command below with the game host's actual IP and listening port. Open the virtual controller and select **Connect to game** (连接游戏). Check all nine keys, long presses, matching ACK sequences and reconnection. To inspect what a controller sends, run the reference server separately and open its monitor page. [Virtual controller, monitor and SDK instructions (Chinese)](../../puretv-joystick/README.md)

```sh
python3 bridge.py 192.168.1.100 --port 63485
```

The virtual controller connects directly to the configured address. Use a physical ESP32 to verify GPIO 23 discovery with zero, one and multiple visible services. Check that the single-service response advertises the actual listening port.

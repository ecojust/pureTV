# Windows catalog game host

This host packages each game's unchanged `dist/` as a Windows x64 desktop app. It uses Win32 and Microsoft Edge WebView2, with no Node, Electron or .NET runtime inside each game. The portable ZIP contains `PureTVGame.exe`, `game.json`, the complete `Web/` tree and license notices. The setup EXE installs the same bytes for the current user and adds a shortcut/uninstaller.

Windows 10 version 1903 or later / Windows 11 x64 and the **Microsoft Edge WebView2 Evergreen Runtime** are required. WebView2 is normally present on Windows 11 and many Windows 10 installations; a machine without it gets a clear prompt linking to Microsoft's official download page. The game does not silently download executables. Game assets work offline after this runtime is present. Initial Windows Firewall prompts must allow the application on the user's private network for remote controllers. These packages have **no Authenticode signature**; they are not represented as Microsoft-signed or SmartScreen-approved.

## Native behavior

- TCP binds 63485 once. Only an initial address conflict can select an available port. Windows exclusive-listener `WSAEACCES` is treated as a conflict only when the native TCP table confirms an existing listener. Focus, reconnect, minimize or restore never recreate the listener.
- Windows DNS Service APIs advertise `_puretv._tcp.local`, TXT `version=1`, the actual port and a unique game-specific instance name. A registration failure is visible in the game bridge, not reported as available.
- The original newline JSON protocol supports all nine independent keys, exact sequence ACKs, same-ID reconnect replacement, a single active controller and bounded pending clients/lines/writes. No other computer's ADB or network processes are touched.
- Native state is owned by the window thread. Frame input uses cumulative counters and the cached `PureGameHost.snapshot()` bridge. Diagnostics never consume input. Short presses survive native-to-WebView pushes.
- Background, minimize, sleep, disconnect and renderer failure cancel controls without generating rewarded release events. Held keys remain quarantined until released; returning to the game does not automatically resume it.
- Full `dist/` directories, including nested models, textures, fonts and audio, map to the restricted secure local origin `https://puretv.local/`. External navigation, popups, browser permission requests and nonlocal asset requests are blocked. `tv.html` remains the entry point; it need not contain all assets inline.
- Each package identity has its own `%LOCALAPPDATA%/pureTV/<package>/` profile. Declared game save keys mirror to an atomic native JSON store with a 1 MiB per-key limit, and hydrate before game code executes. Unknown keys and `sessionStorage` never enter the native store.
- F11 toggles fullscreen. `--diagnostics <directory>` enables read-only state files and requested native screenshots; `--profile <directory>` isolates actual QA saves. Neither option writes or fast-forwards game state.

## Build and original-package validation

Run from a committed source checkout on Windows x64 with Visual Studio 2022 C++ tools, CMake, Python 3.12 and NSIS 3.10:

```powershell
python joystick-games/tools/windows-build.py --game <registered-slug> --output C:/scratch/game-build --dependencies C:/scratch/windows-dependencies
python joystick-games/tools/windows-packages.py --source C:/scratch/game-build --output C:/scratch/game-install-check
python -m pip install zeroconf==0.148.0
python joystick-games/tools/windows-verify.py --game <registered-slug> --app C:/scratch/game-install-check/installed --output C:/scratch/normal
python joystick-games/tools/windows-verify.py --game <registered-slug> --app C:/scratch/game-install-check/installed --output C:/scratch/occupied --occupy-default-port
```

`dependencies.json` pins the Microsoft WebView2 SDK NuGet package and nlohmann JSON header/license by URL, byte count and SHA256. Dependencies are fetched to the separate build directory and verified before use. The SDK's loader links statically; the browser runtime remains a system prerequisite.

The builder rejects uncommitted or symlinked build inputs. Its manifest binds the source commit, complete source inputs, packaged app files, ZIP and installer hashes. Package validation checks ZIP CRC, the complete file set, an actual silent installation, installed/portable byte equality, actual uninstall preserving unrelated sentinel files, and the executable's AMD64 PE machine.

The workflow `.github/workflows/joystick-catalog-windows.yml` accepts an explicit JSON array of up to nine registered slugs. It runs the actual GUI app and unchanged Python controller SDK in normal and occupied-port modes. Evidence covers real DNS-SD resolution, controller rejection/identity, each game's data-only gameplay plan, actual pause freeze, three minimize/restore cycles, held-sync reconnect, all matching ACKs, normal quit/TCP closure and native save hydration after deleting only the closed browser cache. Games requiring a real saved result must produce a nonempty save through normal gameplay. Software-rendered CI does not establish physical device FPS or physical-controller compatibility.

Original reports, screenshots, wire events and executed source are retained even on failure. Only games whose actual package/install/runtime checks passed get installation packages exported. The immutable export manifest separately lists requested and verified games, so one successful game never makes an entire matrix appear completed. Files at or above Git's 100 MB export limit require a separately implemented artifact transport; the exporter fails rather than silently truncating or omitting them.

## Current verification boundary

Portable protocol tests: **32 behavior groups passed** under strict C++17, AddressSanitizer and UndefinedBehaviorSanitizer. The actual Windows bridge passed **10 Node behavior tests**, including independent keys, one-time pulses, cancellation and native storage mirroring. Three installer safety tests passed, including literal registry-command quoting and deletion limited to packaged files. Python and workflow YAML syntax checks passed. Original local logs are in [docs/local-preflight](docs/local-preflight/).

The initial host has **not yet been compiled or run on Windows**. These local results are a development checkpoint, not a Windows client release. Native CI, actual game visual review, package publication and physical hardware testing are separate pending gates.

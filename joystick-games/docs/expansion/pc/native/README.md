# Signed APK input checks on Windows and macOS

All six signed games in the final desktop player passed the input checks on Windows Server 2022 x64 in Edge 157.0.4341.60 and on macOS 15.8.2 ARM64 in Chrome 158.0.8127.37. In each session the game displayed the connected SDK client's ID and observed its DOWN press and release. After the client disconnected, the game observed a Numpad8 press and release. The SDK checked each acknowledgement against its sequence number. [Verification run 44825458248](https://github.com/ecojust/pureTV/actions/runs/44825458248)

| Game | APK version | Renderer on both systems | Windows report and ACK count | macOS report and ACK count |
| --- | --- | --- | --- | --- |
| Kart Royale | 0.1.6 | WebGL 2 | [12](windows-2022/kart-royale.json) | [12](macos-15/kart-royale.json) |
| Turbo Kart Rally | 0.1.1 | WebGL 2 | [12](windows-2022/turbo-kart-rally.json) | [12](macos-15/turbo-kart-rally.json) |
| Clawd Pop 3D | 0.1.1 | WebGL 2 | [16](windows-2022/clawd-pop.json) | [14](macos-15/clawd-pop.json) (loading), [12](macos-15/clawd-pop-menu.json) (menu) |
| Saber Magic Tower | 0.1.1 | WebGL 2 | [12](windows-2022/saber-magic-tower.json) | [12](macos-15/saber-magic-tower.json) |
| Operation Ironhold | 0.1.1 | WebGL 2 | [12](windows-2022/operation-ironhold.json) | [12](macos-15/operation-ironhold.json) |
| Lumenrift | 0.1.1 | Canvas 2D | [12](windows-2022/lumenrift.json) | [12](macos-15/lumenrift.json) |

The first macOS Clawd Pop session completed both input checks while its initial snapshot still showed `loading`. A second session with the same APK and portable host waited for `menu` before taking the snapshot, confirmed WebGL 2 and repeated the SDK and keyboard checks. [Menu check](https://github.com/ecojust/pureTV/actions/runs/44825914491) · [Startup wait](https://github.com/ecojust/pureTV/blob/36e9bf4275570392a0d3458227fd004143cedc37/verify_menu.py) · [Menu check environment](macos-15/clawd-pop-menu-environment.json)

The linked JSON files preserve the SDK identities, ACK counts (including heartbeats), browser versions, timings, menu snapshots and exact APK SHA-256 values emitted by the jobs. Each OS environment file includes the desktop downloads' hashes, the extracted host and bridge hashes, and the source commit for each APK. [Windows environment](windows-2022/environment.json) · [macOS environment](macos-15/environment.json) · [Windows artifact](https://github.com/ecojust/pureTV/actions/runs/44825458248/artifacts/14673742527) · [macOS artifact](https://github.com/ecojust/pureTV/actions/runs/44825458248/artifacts/14674105970)

## Reproduce a session

1. Check the published EXE and portable ZIP against `SHA256SUMS.txt`, then extract the ZIP. On Windows the job ran `pureTV-Games.exe --list --language en`. On macOS it ran `python launcher.py --list --language en` from the extracted player. Each listed the 40 games in catalog order. [Published player and checksums](https://github.com/ecojust/pureTV/tree/34236b9b8e287997335e90e1546cf7397aa2f041/tools/pc-games/packages)
2. Download each signed APK from the extracted player's `catalog.json`. Check its byte count and SHA-256 value against that entry, then save the same bytes as `<game-id>.zip` in a payload directory for the verifier. These six entries use five games at 0.1.1 and Kart Royale at 0.1.6. [Pinned catalog](https://github.com/ecojust/pureTV/blob/34236b9b8e287997335e90e1546cf7397aa2f041/tools/pc-games/catalog.json) · [Five signed 0.1.1 APKs](https://github.com/ecojust/pureTV/commit/b9dbfd704e5d45e0a8849e72ea6da6855c3c54b0) · [Kart Royale 0.1.6 APK](https://github.com/ecojust/pureTV/commit/f1e41ebba5c58d6ab78a10eca07b3720bb2c5c79)
3. At the player commit, use Python 3.12 and run the commands below for each game. Substitute the system browser executable from the OS environment file. For every game the verifier starts the portable ZIP's Python host on unused HTTP and TCP ports and opens the native headless browser at 960×540 with the default graphics backend selection. [Exact workflow](https://github.com/ecojust/pureTV/blob/56e1c1e95807f189a58ede52ddd45d6db95c6c5b/.github/workflows/catalog-pc-input-verification.yml) · [Runner script](https://github.com/ecojust/pureTV/blob/56e1c1e95807f189a58ede52ddd45d6db95c6c5b/run.py) · [Input verifier](https://github.com/ecojust/pureTV/blob/34236b9b8e287997335e90e1546cf7397aa2f041/joystick-games/qa/controller-input/pc.py)

```text
python -m pip install playwright==1.62.0 -r tools/pc-games/requirements.txt
python joystick-games/qa/controller-input/pc.py --chromium "<browser-executable>" --host "<extracted-player>/host.py" --payloads "<verified-apks>" --output "<results>" --timeout 180 <game-id>
```

The earlier desktop verification used the five 0.1.0 APKs and the same Kart Royale 0.1.6 APK. [Archived reports, environments and reproduction steps](https://github.com/ecojust/pureTV/tree/da8a9d9cde86b1806cf7c8e50cdd80b1e1ed31f3/joystick-games/docs/expansion/pc/native) · [Earlier run 44822698837](https://github.com/ecojust/pureTV/actions/runs/44822698837)

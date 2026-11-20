# Signed APK input checks on Windows and macOS

All six games reached the menu on Windows Server 2022 x64 in Edge 157.0.4341.60 and on macOS 15.8.2 ARM64 in Chrome 158.0.8127.37. Each session displayed the ID of the connected SDK client, received its DOWN press and release, then observed Numpad8 press and release after the client disconnected. The SDK checked that each sequence number received its matching acknowledgement. [Successful run 44822698837](https://github.com/ecojust/pureTV/actions/runs/44822698837)

| Game | Renderer on both systems | Windows report and ACK count | macOS report and ACK count |
| --- | --- | --- | --- |
| Kart Royale | WebGL 2 | [13](windows-2022/kart-royale.json) | [12](macos-15/kart-royale.json) |
| Turbo Kart Rally | WebGL 2 | [12](windows-2022/turbo-kart-rally.json) | [12](macos-15/turbo-kart-rally.json) |
| Clawd Pop 3D | WebGL 2 | [15](windows-2022/clawd-pop.json) | [12](macos-15/clawd-pop.json) |
| Saber Magic Tower | WebGL 2 | [12](windows-2022/saber-magic-tower.json) | [12](macos-15/saber-magic-tower.json) |
| Operation Ironhold | WebGL 2 | [12](windows-2022/operation-ironhold.json) | [12](macos-15/operation-ironhold.json) |
| Lumenrift | Canvas 2D | [12](windows-2022/lumenrift.json) | [12](macos-15/lumenrift.json) |

Each JSON preserves all fields from the job's emitted result, including the APK SHA-256, browser version, menu snapshot, SDK identity, ACK count and timings. SDK heartbeats also receive ACKs. The environment records include the packaged host and bridge hashes, launcher file hashes, checkout commits and runner identities. The jobs uploaded their original JSON files as Actions artifacts. [Windows environment](windows-2022/environment.json) · [macOS environment](macos-15/environment.json) · [Windows artifact](https://github.com/ecojust/pureTV/actions/runs/44822698837/artifacts/14670858946) · [macOS artifact](https://github.com/ecojust/pureTV/actions/runs/44822698837/artifacts/14672363003)

## Reproduce a session

1. Use the player files from commit `d03513ef9f6d775bf0cd9530582826dce98cd6af`. Check both published files against `SHA256SUMS.txt` and extract the portable ZIP. On Windows the job ran `pureTV-Games.exe --list --language en`; on macOS it ran `python launcher.py --list --language en` from the extracted player. Both returned the 40 IDs in catalog order. [Published player and checksums](https://github.com/ecojust/pureTV/tree/d03513ef9f6d775bf0cd9530582826dce98cd6af/tools/pc-games/packages)
2. Download the six APKs from the extracted player's `catalog.json` and check their exact byte counts and SHA-256 values. Save each signed file unchanged as `<game-id>.zip` in the payload directory. The verifier uses that filename to open the APK as a ZIP archive. [Signed APK commit](https://github.com/ecojust/pureTV/commit/f1e41ebba5c58d6ab78a10eca07b3720bb2c5c79) · [Pinned catalog](https://github.com/ecojust/pureTV/blob/d03513ef9f6d775bf0cd9530582826dce98cd6af/tools/pc-games/catalog.json)
3. At the player commit, use Python 3.12, install Playwright 1.62.0 and the dependencies in `tools/pc-games/requirements.txt`, then run the following command once per game. Substitute the native browser executable from the relevant environment record and local paths. Each invocation starts the extracted Python host on unused HTTP and TCP ports and opens a fresh 960×540 headless browser with the default graphics backend selection. The two jobs used the Python host for the per-game input sessions. [Exact workflow](https://github.com/ecojust/pureTV/blob/6c5e45df049e33f556282e8acd90c7a475b00ad4/.github/workflows/catalog-pc-input-verification.yml) · [Runner commands](https://github.com/ecojust/pureTV/blob/6c5e45df049e33f556282e8acd90c7a475b00ad4/run.py) · [Input verifier](https://github.com/ecojust/pureTV/blob/d03513ef9f6d775bf0cd9530582826dce98cd6af/joystick-games/qa/controller-input/pc.py)

```text
python -m pip install playwright==1.62.0 -r tools/pc-games/requirements.txt
python joystick-games/qa/controller-input/pc.py --chromium "<browser-executable>" --host "<extracted-player>/host.py" --payloads "<verified-apks>" --output "<results>" --timeout 180 <game-id>
```

The initial run stopped during checksum parsing, before game startup. The rerun recognized GNU's binary-file marker in the checksum list and used the same released downloads. [Initial run 44822580510](https://github.com/ecojust/pureTV/actions/runs/44822580510)

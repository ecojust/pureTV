# Controller input checks

These checks drive the published Web entry point, read its existing `JoystickGameQA.snapshot()`, and use the repository's Wi-Fi controller SDK. Run them against a package or staged payload whose game assets match the source revision under review. An APK and a ZIP with the original `assets/` tree are both accepted. Keep the program, inputs and Chromium version with the results.

## Android phone room and Wi-Fi controller

Run on Linux with Python 3.11+, Playwright for Python, Chromium, JDK 17+ and the following Java dependencies. The Android host uses ZXing 3.5.3. Android JSON provides the `org.json` classes on the standalone JVM.

| Artifact | SHA-256 |
| --- | --- |
| `com.google.zxing:core:3.5.3` | `8d8064c1636fdaef7189dd9055c7d59950a8940a12f2293956446ec3c109fd82` |
| `com.vaadin.external.google:android-json:0.0.20131108.vaadin1` | `dfb7bae2f404cfe0b72b4d23944698cb716b7665171812a0a4d0f5926c0fac79` |

```sh
python joystick-games/qa/controller-input/android.py \
  --payload /path/to/sugarplum-drop.zip \
  --android-json /path/to/android-json.jar --zxing /path/to/core-3.5.3.jar \
  --output /tmp/sugarplum-controller-qa
```

The check compiles the original Java LAN and TCP servers. A loopback fixture forwards the TV page's two native bridge reads and serves Sugarplum Drop's self-contained page. Chromium displays the menu at 960×540 and 1280×720. ZXing decodes the actual QR pixels, and a second browser opens that address. Touches move the phone's original stick and press each button. Closing the phone must pause the game. The official TCP SDK then resumes play, sends all nine keys and checks each returned sequence number. Both sizes must render the full canvas with the connected client's identity visible. Finally, Chromium sends each physical keyboard code through its normal input path. The JSON report records the input and server hashes. Screenshots remain in the specified output directory.

The retained [Sugarplum Drop result](results/android-sugarplum.json) records the tested source revision and program hashes.

## Portable PC game host

Install the portable host's Python dependencies from `tools/pc-games/requirements.txt` and Playwright for Python. Use one `<game-id>.zip` per game in the payload directory, with the exact files under `assets/`. The script accepts multiple game IDs.

```sh
python joystick-games/qa/controller-input/payloads.py --output /tmp/pc-inputs \
  sugarplum-drop kart-rush story-thief
python joystick-games/qa/controller-input/pc.py \
  --payloads /tmp/pc-inputs --output /tmp/pc-controller-qa \
  sugarplum-drop kart-rush story-thief
```

The check launches the portable host on unused HTTP and TCP ports, opens its entry in Chromium, and observes the game's own controller frames. The actual SDK client must appear on the visible identity card and its DOWN press and release must reach the game. After disconnect, a trusted browser keyboard press and release must also reach the game. Each game's JSON report includes its payload hash, browser version, startup time and outcome. This check covers the portable host and the desktop browser. Android WebView, native Windows and macOS packages, and physical devices have separate acceptance runs.

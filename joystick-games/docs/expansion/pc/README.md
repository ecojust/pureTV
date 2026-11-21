# Portable PC host controller checks

Each of the six signed games has a separate keypad session and an official TCP controller session that starts from the menu and reaches a core game action. [Gameplay reports](../gameplay/)

All six games in the final player passed the signed-APK input check on Windows Server 2022 x64 and macOS 15.8.2 ARM64. Both systems ran the five 0.1.1 releases and Kart Royale 0.1.6. [Native OS reports and reproduction steps](native/README.md)

Each report comes from the repository's Linux PC host loading the game's actual offline payload at 960×540 in Chromium. The official SDK opens a TCP session, verifies the displayed identity, exercises DOWN and release, and counts the acknowledgements. After disconnection, a real keyboard press/release of Numpad8 is observed through the game's cached input frame. These checks cover the host input path; campaign completion and normal game actions are covered by the individual game tests.

Generate the assets-only packages with the same bytes used by Android's payload composer. The hashes in the reports identify the ZIPs. From the repository root:

```sh
python joystick-games/qa/controller-input/payloads.py --output /tmp/pc-games \
  kart-royale turbo-kart-rally clawd-pop saber-magic-tower operation-ironhold lumenrift
python joystick-games/qa/controller-input/pc.py --payloads /tmp/pc-games \
  --output /tmp/pc-results --timeout 240 --angle gl-egl \
  lumenrift kart-royale saber-magic-tower operation-ironhold turbo-kart-rally clawd-pop
```

The first Clawd Pop run reached its WebGL menu, then Playwright's injected predicate compiler hit the game's script policy. The PC observer now polls via read-only DevTools evaluation, and the adapted page permits same-origin connections to the PC bridge. The original error and package hash are preserved in [attempts/clawd-pop-initial.json](attempts/clawd-pop-initial.json).

Lumenrift, Kart Royale, Saber Magic Tower and Operation Ironhold used the original PC verifier from commit `7b55f15` with system Chromium and `--angle gl-egl`. The final Turbo Kart Rally and Clawd Pop runs used the CSP-compatible observer, the same Chromium binary on an Xvfb display, Mesa EGL, `LP_NUM_THREADS=2` and `--disable-accelerated-2d-canvas`. The earlier passing Turbo result in `attempts/` identifies the payload before its final menu CSS adjustment.

After the target SDK update, the five new games were tested again with the 0.1.1 configuration. These reports use the CSP-compatible observer and Mesa EGL at 960×540. Kart Royale retains its 0.1.6 report. [Earlier 0.1.0 PC reports](https://github.com/ecojust/pureTV/tree/da8a9d9/joystick-games/docs/expansion/pc)

All six ZIPs were independently compared, entry by entry, with the output of `joystick-games/tools/android-build.py`'s `payload(game)` function. This comparison includes the controller page, configuration, index, assets and notices.

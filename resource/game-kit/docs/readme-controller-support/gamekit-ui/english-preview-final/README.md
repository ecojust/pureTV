# Final English-gallery menu previews

Nine 1280×720 Chromium menu screenshots use the exact assets from the release-signed APKs built from `a657ce24fc4c0c5adb07a671adabb3ce604f68f8`. `apk-asset-binding.json` compares every served asset byte with each APK and links its existing signing-verification receipt. The browser receives an explicitly synthetic native bridge in the ordinary available/disconnected state. These are browser previews, not Android or physical-TV execution evidence.

Eight puzzle games retain their actual Chinese title, rules, controls, and game content. Their existing pureTV Wi-Fi instruction card uses English. Neon Rush provides a full English UI; the script exercises its normal language button (English → Chinese → English) before capture. No screenshot text is replaced or translated after rendering.

This is a menu-only capture: all games remain at level 0, phase menu, tick 0. No model or clock writes occur, and gameplay acceptance is not repeated. `report.json` preserves the raw capture result, source/asset hashes, geometry, snapshots, and inputs; `visual-review.json` records individual inspection of all nine unedited images. `manifest.json` lists the image paths and SHA256 values for the gallery update.

The exact scripts and common helper are included. They retain the original `/dev/shm` execution paths for provenance. The served assets are archived in `../final-payload/<game>/`; the QR fixture is genuine but points to the synthetic LAN example. Chromium and all page contexts exited normally after capture. Existing gameplay/UI evidence remains unchanged.

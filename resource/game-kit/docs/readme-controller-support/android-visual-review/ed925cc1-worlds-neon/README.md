# Actual APK visual review — ed925cc1 worlds and Neon

The 13 original PNGs listed in `review.json` were individually viewed without changing the raw export. They show the signed APKs running in an Android TV emulator, captured by `adb exec-out screencap -p`; they are not the earlier synthetic bridge-browser previews or physical-TV photographs.

Coast, Cozy and Neon have menu, gameplay, paused and reconnected images. Used Car has only its garage/menu image: its AVD became unavailable before a gameplay capture. All four menus show actual rendered QR patterns, readable controller address `10.0.2.15:63485`, and complete primary controls. No blocking layout issue was observed. Coast's sidebar heading is fully visible; Used Car's two QR codes and certificate block fit, while their URL captions intentionally use ellipses. Neon shows version 0.1.2 and exposes controller help in its menu/pause panel.

This does **not** pass any game or release: the raw cases remain failed. Coast, Cozy and Neon hit the final ACK check (the parent identified a fixture problem); Used Car lost its AVD. QR decoding, physical devices, frame performance, protocol correctness and full gameplay are outside this still-image review. Alien and the final replacement run remain pending.

Each image, source case and raw report has its SHA-256 recorded. No production code, gallery preview, Chinese thumb, existing manifest or original report was modified.

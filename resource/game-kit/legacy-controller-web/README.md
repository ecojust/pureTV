# Legacy game controller adapter

`puretv-controller.js` is the shared input boundary for the eleven standalone games. Game Kit uses its own runtime. The native host handles TCP, ACK, nine-key synchronization, A/X aliases, Y/SELECT and retained quick presses. This adapter preserves the existing phone fields and detects changes involving Wi-Fi sessions, seats, cancellations and disconnects.

Create with `PureTVControllerAdapter.create({onCancel})` and call `read(players)` exactly once per simulation input read. The callback receives `{id, previous, source, disconnected}`. Return `true` when active gameplay was paused: that input is neutralized and held actions remain quarantined until release. Return `false` in title menus to preserve a normal first START. The returned cancellation marker remains stable until the next source/cancellation change. `peek()` only returns a copy of cached input; UI timers and diagnostics must use it, since native snapshots consume retained short presses.

Standalone games use A/X for action A, B for action B, and Y for SELECT. Game-specific action labels remain in each game's UI and README. The two-control-seat hosts preserve independent identifiers and sessions; Alien Shooter is single-player.

```sh
python3 resource/game-kit/legacy-controller-web/sync.py --check
node --test resource/game-kit/legacy-controller-web/adapter.test.cjs
TMPDIR=/dev/shm/neon-chrome-temp PURETV_PACKAGE=/path/to/playwright/package.json \
  node resource/game-kit/legacy-controller-web/browser-3d.mjs /fresh/output/path
```

The browser checks use ordinary input through an explicitly synthetic Android bridge and real animation frames, with no game-state, camera or clock writes. They are not TCP/NSD, Android-device, physical-controller or performance evidence. Preserve the exact executed scripts, hashes and any failed attempts alongside later official SDK/native acceptance.

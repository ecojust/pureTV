# Wi-Fi TCP → game integration check

Use the official virtual-controller check for SDK acceptance:

```sh
node resource/apps/neon-rush/tests/official-virtual-smoke.mjs \
  --assets /absolute/final-extracted-assets \
  --output /absolute/empty-official-evidence-directory \
  --jdk /absolute/jdk17 \
  --json-jar /absolute/json-20240303.jar
```

This starts the repository's unchanged `puretv-joystick/bridge.py`, `joystick_sdk.py`, and `virtual.html`. Real browser mouse and keyboard events activate the official page. Its original Python SDK sends TCP input to the actual production receiver through a byte-transparent observation proxy. The proxy records both directions and validates every ACK's sequence; it never generates or modifies controller messages. The game and virtual controller run in separate Chromium processes so switching tabs cannot cause artificial blur pauses. The original HTML response and all SDK/bridge/source/asset files are hash checked.

Coverage includes the connect button, `hello` and nine `sync` messages, all nine mouse buttons with 650 ms hold and `long_press`/`long_release`, keyboard A/B and X/Y driving, real drift-release boosts and nitro, periodic SDK `ping`, disconnect while keys are held, automatic game pause, reconnect without automatic START/nitro, fresh START recovery, and ordinary release. This is still a desktop JVM/browser integration check; it does not claim Android NSD discovery or physical ESP32 execution.

The complementary direct-TCP check below adds hostile reconnect-held-sync cases that the official page cannot produce through its normal controls. Its hand-written protocol client is not a substitute for the official virtual-controller test.

This check runs the **actual production `WifiControllerServer.java`** on a desktop JDK, sends newline-delimited controller messages over a real loopback TCP socket, validates ACK sequence numbers, and supplies the receiver's actual snapshots to the unchanged browser game through a test-only native-bridge adapter. It never calls `PureGame.key`, writes simulation state, or changes the game clock.

It is not Android execution, NSD service discovery, or a physical ESP32/TV test. The HTTP snapshot adapter is test infrastructure; Android lifecycle, transport selection, and NSD registration are covered separately by the native tests. The desktop JSON dependency is test-only and is never included in the APK.

```sh
node resource/apps/neon-rush/tests/wifi-wire-smoke.mjs \
  --assets /absolute/final-extracted-assets \
  --output /absolute/empty-evidence-directory \
  --jdk /absolute/jdk17 \
  --json-jar /absolute/json-20240303.jar
```

Download the test-only jar from Maven Central:
`https://repo.maven.apache.org/maven2/org/json/json/20240303/json-20240303.jar`

Its required SHA256 is `3cf6cd6892e32e2b4c1c39e0f52f5248a2f5b37646fdfbb79a66b46b618414ed`. The test compiles the Java receiver and `WifiWireHarness.java` into its evidence directory. It records source and asset hashes, the executed receiver/harness/test files, all sent button messages and ACKs, state observations, raw failures, and screenshots. Use a new output directory for every attempt.

Coverage includes nine-key protocol acknowledgement, real TCP START, directional snapshots, automatic observation-based driving using A/B and X/Y aliases, drift-release boosts, nitro consumption, pause/resume, disconnect cancellation and freeze, and reconnect `sync` without unintended START or nitro. The normal public keyboard `R` command starts a fresh race solely to test X/Y with a fresh initial nitro reserve. Screenshots are taken after an ordinary TCP pause so capture latency cannot hold a steering key in an unobserved turn.

# Build and verification

This game uses the shared [Game Kit build and signing flow](../../../game-kit/BUILD.md).
The application ID is `com.ecojust.stackdispatchtv`; the initial version is 0.1.0.

From the repository root:

```sh
node --test resource/apps/stack-dispatch/tests/model-test.cjs
node resource/apps/stack-dispatch/tests/independent-check.cjs
python3 resource/game-kit/build.py \
  --game resource/apps/stack-dispatch --output /tmp/stack-dispatch-build \
  --sdk /path/to/android-sdk --jdk /path/to/jdk-17 \
  --zxing /path/to/core-3.5.3.jar
```

Extract the `assets/` directory from `unsigned.apk` to a scratch directory. With
Playwright and pngjs installed (see the shared QA README), run:

```sh
node resource/game-kit/qa/qa.mjs \
  --assets /tmp/stack-dispatch-assets --output /tmp/stack-dispatch-qa \
  --automation resource/apps/stack-dispatch/tests/automation.mjs \
  --seconds 35 --record --recipe resource/apps/stack-dispatch/tests/recipe.json
```

The browser uses normal keyboard events and real elapsed time. The test planner
lives outside packaged assets; the shipped game has no solution or state-writing
QA entry point. Model tests and browser observations are distinct evidence.

After the exact source revision is committed, request a signature through
`sign-game-kit.yml`. Verify the downloaded APK with `fetch-signed.py` and then:

```sh
python3 resource/game-kit/qa/verify-artifacts.py \
  --apk /path/to/stack-dispatch-0.1.0.apk \
  --assets /tmp/stack-dispatch-assets --package com.ecojust.stackdispatchtv \
  --video /tmp/stack-dispatch-qa/recording/gameplay.mp4 \
  --build-tools /path/to/android-sdk/build-tools/34.0.0 \
  --output /tmp/stack-dispatch-artifacts.json
```

`docs/verification.json` records the actual release checks. Software browser
captures and performance samples do not certify physical TV/phone behavior.

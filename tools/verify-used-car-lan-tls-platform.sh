#!/usr/bin/env bash
set -euo pipefail

platform_apks=${1:?Expected the downloaded used-car-racing-tv artifact directory}
platform_log=${RUNNER_TEMP:?RUNNER_TEMP is required}/usedcar-lan-tls-platform.log
shopt -s nullglob
game_apks=("$platform_apks"/debug/*-debug.apk)
test_apks=("$platform_apks"/androidTest/debug/*-debug-androidTest.apk)
test "${#game_apks[@]}" -eq 1
test "${#test_apks[@]}" -eq 1
adb wait-for-device
adb install -r "${game_apks[0]}"
adb install -r "${test_apks[0]}"
adb shell am instrument -w -r \
  -e class com.ecojust.usedcartv.LanTlsPlatformTest \
  -e allowIdentityReset true \
  com.ecojust.usedcartv.test/androidx.test.runner.AndroidJUnitRunner | tee "$platform_log"

# am instrument can exit zero even when an Android test failed.
python3 - "$platform_log" <<'PY'
import pathlib, re, sys
result = pathlib.Path(sys.argv[1]).read_text()
assert re.search(r'OK \([1-9][0-9]* tests?\)', result), 'Android Keystore/TLS tests did not report success'
assert not any(marker in result for marker in ('FAILURES!!!', 'INSTRUMENTATION_FAILED', 'Process crashed.')), 'Android instrumentation failed'
print('Actual Android Keystore and trusted local TLS checks passed.')
PY

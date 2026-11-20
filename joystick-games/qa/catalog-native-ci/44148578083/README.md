# Android catalog run 44148578083 — app-name resource failure

Frozen source: `127d108053297e2ae5f2b6e14aa20550ae97dae4`.
Original export: `96dde5c68e9a1762af557231ca3712b4f96ef50c` at
`build-assets/joystick-catalog-android-44148578083-attempt-1`.

Sugarplum Drop and Popgun Pip built. Starblazer failed in real `aapt2 compile`:
the English app name `STARBLAZER '86` was written as XML text without Android
string-resource quoting. XML escaping does not escape Android's resource syntax.
Signing and runtime validation were skipped for this batch; the successful
export job is evidence preservation, not a successful package delivery.

`original-export/` preserves the complete original export. All 30 manifest-listed
files were fetched from the public immutable commit and checked by byte count
and SHA256; see `fetch-verification.json` and the actual `executed-fetch.py`.
The script originally downloaded to `qa/android/catalog-ci/`; the verified files
were moved here to keep archived scripts outside the live Android QA source tree.

The fix quotes Android string literals while escaping literal backslashes and
double quotes; the game name and Web payload are unchanged. The focused regression
uses the real Android 34.0.0 `aapt2 compile/link` and `aapt dump badging`, checking
nine decoded labels including apostrophes, XML characters, backslashes, spaces,
and reference-like prefixes. The first regression assertion incorrectly compared
the escaped badging representation directly; its exact script and failure are
preserved. The final script decodes the output before comparison. This was a test
decoder correction, not a second production fix.

`label-fix/` contains the final nine-case report, exact executed scripts, 16 passing
Android packaging regressions, and the real local unsigned Starblazer build logs,
source context, receipt and resource labels. The 315,933-byte unsigned APK stays
outside the repository; it is **not** a signed delivery or native gameplay result.
Its `assets/tv.html` is byte-identical to the original frozen Web payload. The
updated workflow also runs and archives this resource-string regression.

A new frozen-source triptych-01 build/sign/runtime run is still required.
The other batches continue using their original frozen source; this evidence does
not change their source bindings or acceptance status. No physical TV was tested.

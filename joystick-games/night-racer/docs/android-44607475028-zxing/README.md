# Night Racer Android dependency-download failure

Run 44607475028, source 2e1f3b02160995d6a0ce19b47886bd52819b7a41, passed the committed Web payload and Android boundary checks. Downloading the existing ZXing 3.5.3 jar returned HTTP404 six times and curl exited22; Android build, signing and runtime did not run. The ten original export files are preserved and verified against Git blobs and the export manifest.

Later complete GETs from both fixed Maven Central endpoints returned the exact original 607650-byte jar and SHA-256. The production workflow now tries the primary endpoint and its Central mirror with bounded process/transfer time, verifies exact size and the existing hash, and only then publishes the input atomically. Nine offline boundary tests and a real helper GET pass. No game source, original report or runtime workflow changed; no new production run was dispatched by this investigation.

The original complete CLI job log, immutable export, exact tested helper/workflow, tests and download receipt are retained. Original runtime is still skipped; dependency download success is not a native gameplay result.

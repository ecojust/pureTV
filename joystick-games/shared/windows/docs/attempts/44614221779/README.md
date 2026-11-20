# Actual Windows document bootstrap fixture

Original run `44614221779`, fixed source `b9ffc9e1e5e512927d78dd6adfb393bd0351f4b2`, completed successfully. Its immutable export is `aa214ebdcc0832a789e140c6d247c271749d459f`.

This archive restores only 17 original evidence/source files (169,905 bytes), not another copy of the whole application package. Each file was checked against the immutable Git tree and the original export/evidence SHA256 manifests. Eight executed source files were also compared byte-for-byte with the original source commit. The fixture's binary hash matches both the build manifest and the original installation-verification report.

The actual production Win32 executable and WebView2 ran an isolated fixture page. Its four first-script observations use document epochs 1, 2, 3, 4 and show the expected native seed, immediate set/remove followed by ordinary reload, query navigation, and clear followed by another query navigation. The final query page's preference message persisted and the normal exit completed. The fixture modifies only its copied application page, metadata and isolated profile; these observations do not claim acceptance of the eight racing games or a physical device test.

The original fixture report remains unchanged under `original-bootstrap-export/`. Its input-source keys use Windows backslashes. The first local reader assumed POSIX keys and failed after downloading the evidence; its script and failure description are retained. The second reader accepts only the six exact expected source names, records separator normalization separately, verifies their original hashes and fixed Git bytes, and reuses the already downloaded files. See `bootstrap-independent-verification.json` for the complete checks and file inventory.

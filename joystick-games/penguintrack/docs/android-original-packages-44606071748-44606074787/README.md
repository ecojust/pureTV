# Original Android package verification

Independent local verification of the two c5ad63e8c6a0ccfada5f763d1d26afa27f45002e production exports. Every export Git blob and manifest entry is rechecked, then the original signed game APK and test Observer identities, certificate, receipts, exact frozen source inventory, full APK contents and original GameKit asset payload are verified. No package was rebuilt and no new native execution occurred. Both original runtime results remain failures.

`report.json`, executed script/tool copies, log, original export trees/manifests, signing/build receipts and exact binary references are retained. This directory intentionally does not duplicate APKs; their complete original bytes remain in the fixed original exports identified by commit.

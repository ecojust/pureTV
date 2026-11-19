# Windows document bootstrap and entry navigation

The old host registered a document-start script containing one launch-time `info.preferences` object. Every reload replayed that object. The actual Night Racer Windows attempt `44607480315` recorded a Low selection returning to High after reload and an empty initial setting. Original reports remain unchanged under `docs/attempts/44607480315/`.

`BootstrapSnapshot` now exposes one read-only COM property. Each permitted main document synchronously reads current native `info`, input and document epoch before the existing bridge seeds localStorage and before game scripts run. No generic property writer, filesystem endpoint or synchronous preference writer was introduced. The existing bounded preference messages and bridge are unchanged. The object is held by ComPtr through browser shutdown; the existing OleAut32 link supplies BSTR/VARIANT functions.

The shared entry policy permits only `https://puretv.local/tv.html` with an optional query of at most4096 encoded ASCII characters. It rejects userinfo, port/path/origin changes, fragments, malformed escapes, controls and backslashes. Query values never become file paths. Both top-level navigation and WebMessage source checks use it; original virtual-host asset queries are unchanged. Rejected navigation completions do not replace the current document, and diagnostics discard callbacks crossing document epochs.

Local checks:27 compiled C++ URL boundaries,4 portable live-bootstrap checks and10 existing web-bridge tests passed. The first version of the new Node test had a syntax error; its source is preserved separately. The local tests mock the COM/IPC boundary and cannot establish real WebView2 message ordering.

Run the prepared actual Windows fixture after building/installing the new host:

```
python -B joystick-games/shared/windows/tests/navigation-storage.test.py --app <built-or-installed-package-folder> --output <new-empty-evidence-directory>
```

It copies the exact production EXE/host assets into a separate fixture folder, uses an isolated profile, and asserts values in the first page script across immediate set/remove/reload, Backroad-style query navigation, clear/reload, final query-page preference write and normal exit. The supplied game package is untouched. This native fixture and MSVC compilation have not run in this Linux environment. A failure of immediate-write persistence would justify investigating a separate IPC ordering issue; that issue is not presumed here.

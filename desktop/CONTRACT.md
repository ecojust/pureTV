# Desktop bridge contract (implementation)

Tauri command `execute` receives `{ request }` and returns a `Snapshot` (camelCase JSON). Errors reject with a user-facing Chinese string. A separate `cancel` command sets an AtomicBool without taking the service lock; it cancels scanning or Platform Tools preparation and skips remaining batch operations; an in-flight mutation finishes and is verified before stopping (completed steps remain recorded). All work runs off the UI thread, serialized by a service Mutex. Browser-only preview uses an explicit demo adapter and never claims a device connection.

Rust core API for the shell:

```rust
pub struct Manager; // persistent state, ADB adapter, current device/catalogue
impl Manager {
  pub fn new(data_dir: std::path::PathBuf, cancel: std::sync::Arc<std::sync::atomic::AtomicBool>) -> Self;
  pub fn execute(&mut self, request: Request) -> Result<Snapshot, String>;
}
```

`Request` uses serde internally tagged `action`, camelCase variant names/fields:

- `getState`
- `setAdbPath { path: string }` (empty = auto discover)
- `connect { host: string, port: number }`
- `pair { host: string, port: number, code: string }` (pairing port, code never persisted)
- `disconnect`
- `scan`
- `setEnabled { packages: string[], enabled: boolean }`
- `uninstall { packages: string[] }` (current user, keep data)
- `restore { packages: string[] }` (install-existing for available packages)
- `install { paths: string[] }` (single APK files, batch sequential)
- `setHome { component: string }`
- `restoreHome`
- `clearHistory`

`Snapshot`:

```ts
interface Snapshot {
  revision: number; // monotonically increasing in this Manager process; UI rejects older results
  adbPath: string | null;
  adbAvailable: boolean;
  device: Device | null;
  packages: PackageInfo[];
  launchers: LauncherInfo[];
  defaultHome: string | null;
  originalHome: string | null;
  history: HistoryEntry[];
  message: string;
}
interface Device { serial: string; model: string; androidVersion: string; userId: number; status: string; }
// status: device / unauthorized / offline; scan/mutations only for device
interface PackageInfo {
  apkSizeBytes: number | null; // installed user base/split APK byte total; excludes private data/cache
  packageName: string; label: string; system: boolean; enabled: boolean;
  installed: boolean; protectedReason: string | null;
}
// installed=false entries are recoverable candidates, not installed counts.
// Label falls back to packageName; don't fetch all APKs merely to obtain icons/labels.
interface LauncherInfo { component: string; packageName: string; label: string; isDefault: boolean; }
interface HistoryEntry {
  id: string; timestamp: number; action: string; target: string;
  device: string; userId: number; success: boolean; message: string;
}
// timestamp: Unix seconds. History bounded to 200 records, no pairing code or raw shell input.
```

Other Tauri commands:

- `choose_apks` -> `string[]` (native file picker, .apk, multiple)
- `choose_adb` -> `string | null` (native executable file picker)
- `open_resource { resource: "catalog" | "releases" | "platformTools" | "platformToolsLicense" | "market" }` (fixed URL allowlist)
- `platform_tools_info` -> `PlatformToolsInfo` (local metadata only, no download)
- `install_platform_tools { acceptedLicense: boolean, onProgress: Channel<DownloadProgress> }` -> `Snapshot`

```ts
interface PlatformToolsInfo {
  version: string;
  platform: string; // windows / macos / linux for supported builds
  downloadBytes: number;
  installed: boolean; // managed copy exists; validated before use
  supported: boolean;
  message: string;
}
interface DownloadProgress {
  stage: 'downloading' | 'verifying' | 'extracting' | 'checking';
  downloaded: number; // bytes received, never an invented completion value
  total: number; // pinned archive byte count
}
```

Platform Tools setup runs under the same busy/cancel guard as device operations. It requires explicit SDK license acceptance and rejects while a television is selected, including unauthorized/offline states. The UI shows source, version, platform and download size before consent; its checkbox starts unchecked. No download occurs on startup or in ordinary browser preview; demo mode remains explicitly simulated.

The shell selects Platform Tools 37.0.1 from its built-in manifest, with fixed Google and Tencent mirror HTTPS URLs, archive sizes and SHA256 values. Google is tried first; network, HTTP, size or checksum failures discard partial data and retry the mirror using the same official size and digest. Cancellation never starts another source. The webview cannot supply download URLs or destination paths. Downloads stream into staging files with timeout and size bounds; checksums are verified before extracting or executing. Extraction rejects traversal, links and excessive archive contents, preserves the complete official tool set (including Windows DLLs and NOTICE), and writes to `app_data_dir/tools/platform-tools-37.0.1-<nonce>/platform-tools/`. It does not modify system PATH, require administrator access, or write into the macOS `.app`.

The prepared binary is checked using `adb version` before saving it via `setAdbPath`. A valid managed copy can be reused offline. A damaged cache is downloaded to a fresh directory on retry, never overwriting tools that may still be in use; `tools/current-37.0.1.json` identifies the complete managed cache. Failure or cancellation cleans partial staging files and preserves the previously configured ADB; no device commands are sent by setup. Download progress is carried by the Tauri channel, while the existing `cancel` command requests cancellation. After success, the returned `Snapshot` supplies the selected path and ADB readiness. Version updates are tied to manager releases rather than an unverified moving `latest` archive.

No generic shell/exec command is exposed to the webview. Tauri uses a restrictive local CSP and no remote scripts.

## Package purpose and uninstall risk

`get_package_insight { packageName: string, refresh?: boolean }` is an independent read-only lookup. It returns `{packageName, found, description, removal, risk, list, sourceName, sourceUrl, licenseUrl, fetchedAt, stale, warning}`. `risk` is `low | medium | high | critical | unknown`; descriptions and original community categories are nullable strings. `fetchedAt` is the data retrieval time in Unix milliseconds, not its publication date. `found: false` means the successfully read dataset has no exact package match; initial network or invalid-data failures reject instead of claiming the package is unlisted.

The Rust service downloads the fixed HTTPS UAD-ng community package list on demand, with bounded responses and timeouts, and searches it locally. It does not upload the TV's application list. A separate cache lock avoids occupying the ADB operation lock; fresh cached data is reusable for 24 hours. Failed refreshes may return the last valid data with `stale: true` and an explicit warning. The third-party dataset is not bundled with the manager, and the interface identifies its source and GPLv3 license. Remote descriptions are displayed as escaped plain text in their original language.

Community `Recommended`, `Advanced`, `Expert` and `Unsafe` map to lower, medium, high and critical risk respectively. Unknown classifications remain unknown. `Recommended` is not an instruction to uninstall. The info dialog prioritizes the current snapshot's protection reason and default HOME over community categories; these lookups neither relax core protection rules nor perform any device mutation. Missing information never becomes a low-risk conclusion merely because a package is a user app.

`open_package_resource { packageName, resource: "source" | "search" }` opens a fixed source or a search URL constructed from a validated package name. The webview cannot supply an arbitrary URL. Web search only occurs after the user selects that action. The info dialog tracks the selected package and device, discarding responses after closing it or changing targets.

The backend owns validation and protection. On connect, verify devices state and scan only after authorization. Query current user, installed/system/disabled packages and separate `-u` recovery candidates. Protect platform core apps plus current HOME from disable/uninstall, never infer all system apps are removable. Save original HOME before switching, verify the target declares HOME, and verify resulting default. Confirmations in the UI list the actual selected targets, current serial/user and operation; no destructive selection defaults.

Batches are bounded, serial and independently recorded; no success claims from exit status alone. Remote shell arguments must be strictly validated. Paths to local APKs are passed as process arguments. Use explicit `-s SERIAL`, process timeout/output limit, and recheck the connected user's identity before mutation. Persist configured ADB path, original HOME per device/user and bounded history; do not persist pairing codes or APK contents.

The Tauri dispatcher resets the cancellation flag once before enqueueing a task. `Manager::execute` never resets it, so cancellation queued before acquiring the manager lock is preserved.

## MCP bridge

The desktop starts an authenticated loopback MCP service sharing the same Manager, cached snapshot, busy/cancel guard and protected device operations. `mcp_info` returns a stdio client configuration; `puretv-desktop --mcp <session-file>` relays to that running window without creating a Manager. The 34 tools, protocol behavior and validation are documented in [docs/mcp.md](docs/mcp.md). The native integration test runs against the actual GUI and stdio process with isolated simulated ADB.

Installed application and launcher APK sizes are measured during scans (and refreshed after APK installation) using validated `pm path --user` paths and bounded marker-delimited `stat` batches; normal batch catalogue checks reuse the measured values. Unavailable, unsupported or incomplete results are null, never invented zeroes. Metadata collection has a 30-second scheduling budget, 12-second batch command timeouts and shares cancellation. Uninstalled recovery entries have null sizes; installed system packages are measured too.

## Current-launcher layout API

`launcher_execute` accepts `getLayout`, `getBackgrounds`, `applyLayout { layout }`, `resetLayout`; it shares the busy/cancel guard. `choose_launcher_json` returns UTF-8 layout.json text (90 KiB maximum). Legacy version 3 adds independent scenes for home/apps: a background and fixed controls share the same frame (960×540 design coordinates), visibility and layer fields as application cards. Android and the editor consume the same JSON; fixed controls retain their native behavior. Background images are embedded, bounded data URIs. Legacy version 2 launcher grid editing remains supported by the manager; no apps.json compatibility. Core and Android both reject new package entries unless installed, enabled, launchable user applications. The current verified HOME alone exposes an Adjust layout button and full-window canvas; unsupported launchers stay read-only. See [docs/launcher-layout.md](docs/launcher-layout.md).

Before confirming Apply, the editor refreshes the current launcher's layout/app catalogue and the matching manager snapshot. A failed read cannot authorize a write. Only an open editor's unsaved edits survive refresh; a closed editor never replaces a freshly read layout with its earlier cache. Availability checks cover both pages, including hidden cards. Unavailable cards remain in the draft and are identified by page, name, ID and package, with a shortcut to select and repair the card. Core validation supplies the same identifiers plus the specific rejection reason for MCP clients.

The GUI shows modal checking feedback before the first preflight read. Cancellation and failures produce a result without opening write confirmation. Preflight skips other launchers' background reads; ordinary catalogue reads and confirmed writes retain background refreshes. SVG property input removes only unnamespaced role/aria-* attributes and text-only title/desc metadata, then validates the unchanged v5 drawing subset. Invalid icon edits stay in the editor and block GUI Apply until corrected, discarded, or removed; protocol imports and MCP payloads remain strict.

`get_launcher_covers`, `choose_launcher_cover` and `choose_launcher_apks` manage user-provided optional card backgrounds, never TV screenshots. PNG/JPEG/WebP imports are bounded to 4 MiB. APK sibling thumb images are discovered locally, and installed-card covers persist in the manager data directory. MCP exposes get_launcher_covers and set_launcher_cover, synchronizing local UI state.

## System info and install queue

`Snapshot.systemInfo` holds nullable manufacturer/brand/SDK/security patch/CPU/ABI, RAM total/available bytes, `/data` total/available bytes, display resolution, uptime and query timestamp. Connection/scans refresh it; `refreshSystemInfo` refreshes it explicitly. Values come from fixed getprop/proc/df/wm commands; unavailable readings remain null.

`Snapshot.installResults` holds the current batch's `{path,success,message}` using the original full request paths. It is not persisted into history. The UI removes only confirmed successful paths from its pending queue; failures and skipped files remain.

Explicit GUI operations display a modal loading state followed by a result dialog, above any open layout editor. Results use the operation's own response and distinguish failures, cancellation, and unprocessed targets; an unrelated MCP event cannot replace them. Rejected installation requests never consume old `installResults`. Layout write failures preserve the editor draft. Automatic reads and MCP state synchronization remain non-modal.

## Interface preferences

get_interface_preferences / set_interface_preferences expose the same locale and theme controls as the window. Values are limited to zh-CN/zh-TW/en and emerald/ocean/graphite, persisted separately as interface-preferences.json and emitted through interface-preferences events. Initialization only fills unset values, preserving agent changes during startup. Native file-picker titles follow the selected locale. Browser storage contains only the scoped puretv.preferences object, never device hosts, pairing codes or APK paths.

Normal window close, application quit and confirmed MCP close_manager share one exit sequence: reject new device work, cancel cancellable work, wait for atomic mutations, call the configured adb kill-server with an independent cancellation token and an eight-second timeout, then exit. This stops the shared ADB daemon.

## Layout v5

screen defines integer design dimensions (320–7680). Each page contains users, system, background and navigation. Every component has id/name/text/frame/action/visible/icon/textColor/iconColor/backgroundColor. User actions are launchable installed user package names; SVG is a bounded static subset without scripts, DTD or external resources. System components are launcher-owned and immutable through apply, except coordinate conversion when screen dimensions change. The backend compares them with the current verified launcher result; Android verifies the template too. Page backgrounds and directional navigation remain editable. Maximum JSON is 90 KiB, below Android shell's per-argument limit after base64 encoding. Both applications use these same frames; internal v2/v3 adapters are not part of the public v5 JSON.

V5 components use separate textColor/iconColor; backgroundColor may be transparent. Desktop screen dimensions are informational, and the property inspector places its visibility switch beneath the component type. V4 remains accepted with its original coupled color field.

## Manager client updates

`check_client_update` is a read-only background/manual request returning `{currentVersion, platform, supported, status, available, latestVersion, revision, fileName, bytes, sourceUrl, checkedAt}`. Status is `available | upToDate | notPublished | unsupported`. Network or invalid-catalog errors reject; they are not represented as up-to-date results. The fixed Gitee repository's default branch is resolved to a commit before inspecting canonical `client/pureTV-Manager-X.Y.Z-<platform>` package names. Each platform is compared separately using numeric stable versions. Startup only checks metadata; it never downloads or installs a client automatically.

`install_client_update {version, revision, onProgress}` accepts the previously displayed selection, without caller-controlled URLs, destinations or hashes. The backend owns the selected tree entry, refuses downgrades and changed selections, verifies the package's size and Git blob SHA, and supplies SHA256 to the native installation preparation and helper. Progress stages are `checking | downloading | verifying | preparing | installing` with measured `downloaded` and `total` byte counts. `cancel_client_update` cancels downloading/preparation; cancellation and the transition into installation share a lock so an acknowledged cancellation cannot initiate installation. `client_update_result` returns `{version, success, message} | null` from the previous helper run.

Download/install reserves the same operation guard as ADB mutations and market installation. After preparation, the updater claims the shutdown state, blocks new device work, stops ADB and starts an independent copied helper. The helper acknowledges readiness and waits for the running manager's `manager.lock` to be released. Only then may it install the verified package. Failed handoff resets the shutdown reservation and retains the current manager. The UI distinguishes handoff from completed installation; a returning install command is not presented as an installed-success result.

Windows invokes the NSIS installer; a portable user transitions to the standard installation. macOS stages a verified app from the read-only DMG, backs up the existing app, replaces it and restarts, with recovery on replacement failure. Running directly from a DMG or App Translocation requires moving the app into Applications first. Linux uses native authorization and the DEB package manager when a corresponding package is published. These actions do not disable platform security controls. See [client-updates.md](docs/client-updates.md) for publisher filenames and first-upgrade requirements.

## Market catalog and packages

The manager reads the fixed public repository `https://gitee.com/juzisang331/pure-tv-store`. It resolves the default branch to a commit and discovers APK blobs under `apps/` and `launcher/`, with sibling thumbnail images. Names and versions fall back to the APK filename. Catalog and APK requests run in Rust; the webview cannot choose an arbitrary source URL or destination. Only the two Gitee image origins are allowed for lazy thumbnail rendering, without remote scripts.

`get_market_catalog {refresh?: boolean}` returns `{sourceUrl,revision,fetchedAt,stale,warning?,items}`. `revision` is the Git commit SHA, not its tree SHA; `fetchedAt` is Unix milliseconds. A cached catalog is usable without a connected TV. A failed refresh may return the last valid catalog with `stale: true` and a warning; an initial failure without a cache remains an error.

Each item contains `{id,kind,name,version?,fileName,bytes,blobSha,folderUrl,coverUrl?}`. `id` is a repository-relative APK path and `kind` is `app` or `launcher`. Remote data is rendered as text, not HTML. Thumbnail URLs are pinned to the catalog commit, retaining the canonical raw URL rather than a short-lived redirect URL.

`download_market_item {id,revision?}` and `install_market_item {id,revision?}` return `{operation,download,installed,error?,snapshot?}`. `download` contains `{item,path,homeBackground?,homeBackgroundColor?}`; Home metadata is bounded and read from the APK. The GUI sends the displayed catalog revision; a mismatch is rejected instead of silently substituting a new APK. Downloads use a fixed commit, verify the byte count and Git blob SHA, and clean temporary files on failure or cancellation. Cached files are verified before reuse.

Download and installation share the global operation lock and cancellation flag with device operations. Installation uses the existing validated `Request::Install` path and its per-file results. Download success followed by installation failure preserves the downloaded path with `installed: false` and an error. A successful download joins the corresponding GUI pending queue; only confirmed installation success removes it. Installing a launcher does not activate it.

Market progress is separate from ADB tool progress: `{stage:'catalog'|'downloading'|'verifying'|'installing',downloaded,total,itemId?}`. MCP exposes the same three tools, progress in `get_status`, and `mcp-market-progress` events. Completed `mcp-operation` events carry `marketResult`, either `{operation:'catalog',catalog}` or the download/install result, so Agent actions update the same window.

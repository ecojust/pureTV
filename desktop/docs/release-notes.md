# pureTV Manager 0.5.2

## 简体中文

- 修复 Android 4.4（SDK 19）设备连接时因不支持当前用户查询命令而返回 `am usage` 的问题；逐步尝试兼容查询方式，仅在 SDK 19 使用旧版系统进程信息回退。
- 系统信息读取独立于当前用户查询，兼容旧版 `df` 容量输出，减少旧系统信息读取失败。
- 新增可离线阅读的独立 Info 页面，以简体中文、繁体中文和英文说明各项操作的 ADB 命令、用法与兼容性，包括 Android 4.4 的限制。
- 本次修复不代表 Android 4.4 支持所有修改操作。无法确认当前用户时仍拒绝修改；无法查询默认 HOME 时，停用与卸载保护仍保留。尚未进行实体电视验证。

## 繁體中文

- 修正 Android 4.4（SDK 19）裝置連線時，因不支援目前使用者查詢命令而回傳 `am usage` 的問題；逐步嘗試相容查詢方式，僅在 SDK 19 使用舊版系統程序資訊回退。
- 系統資訊讀取獨立於目前使用者查詢，相容舊版 `df` 容量輸出，減少舊系統資訊讀取失敗。
- 新增可離線閱讀的獨立 Info 頁面，以簡體中文、繁體中文和英文說明各項操作的 ADB 命令、用法與相容性，包括 Android 4.4 的限制。
- 本次修正不代表 Android 4.4 支援所有修改操作。無法確認目前使用者時仍拒絕修改；無法查詢預設 HOME 時，停用與解除安裝保護仍保留。尚未進行實體電視驗證。

## English

- Fixes connections to Android 4.4 (SDK 19) devices returning `am usage` when the current-user command is unsupported. Compatible queries are tried in sequence, with a legacy activity-process fallback limited to SDK 19.
- Reads system information independently of current-user queries and supports legacy `df` capacity output, reducing information retrieval failures on older systems.
- Adds a standalone Info page available offline in Simplified Chinese, Traditional Chinese and English, explaining each operation's ADB commands, usage and compatibility, including Android 4.4 limitations.
- This fix does not make every modification operation available on Android 4.4. Changes remain blocked when the current user cannot be confirmed, and disable/uninstall protections remain when the default HOME cannot be queried. No physical television validation has been performed.

---

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验值见 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。本次发布未同步 Gitee 商店安装包，应用内更新仍以 `client/` 中实际同步的版本为准。

提供 Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；校驗值見 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。本次發佈未同步 Gitee 商店安裝套件，應用內更新以 `client/` 實際同步的版本為準。

Windows x64 installer/portable, macOS ARM64/Intel DMG and Linux x64 DEB packages are included. See `SHA256SUMS.txt`. macOS builds are ad-hoc signed and not notarized; Windows builds do not use commercial code signing. This release has not synchronized packages to Gitee; in-app updates depend on the versions actually available in the store's `client/` directory.

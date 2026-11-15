# pureTV Manager 0.5.7

## 简体中文

- 修复 APK 市场中部分大安装包无法下载的问题：Gitee 原始下载返回 HTTP 403 时，备用下载上限从 32 MiB 提高到 128 MiB。
- 覆盖麦动KTV 2.1.10（53,570,243 字节）因超过旧备用上限而被管理器拒绝的场景。
- 下载仍固定到所选目录提交及 Git blob，并验证文件大小和内容哈希；保留取消、超时及有界数据读取。

## 繁體中文

- 修正 APK 市場中部分大型安裝套件無法下載的問題：Gitee 原始下載傳回 HTTP 403 時，備用下載上限由 32 MiB 提高至 128 MiB。
- 涵蓋麥動KTV 2.1.10（53,570,243 位元組）因超過舊備用上限而遭管理器拒絕的情況。
- 下載仍固定至所選目錄提交及 Git blob，並驗證檔案大小和內容雜湊；保留取消、逾時及有界資料讀取。

## English

- Fixes downloads of some large APK Market packages by raising the fallback download limit from 32 MiB to 128 MiB when Gitee's raw endpoint returns HTTP 403.
- Covers Maidong KTV 2.1.10 (53,570,243 bytes), which the manager rejected because it exceeded the previous fallback limit.
- Downloads remain pinned to the selected catalog commit and Git blob, with file size and content hash verification, cancellation, timeouts and bounded reads.

---

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验值见 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。本次发布未同步 Gitee 商店安装包，应用内更新仍以 `client/` 中实际同步的版本为准。

提供 Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；校驗值見 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。本次發佈未同步 Gitee 商店安裝套件，應用內更新以 `client/` 實際同步的版本為準。

Windows x64 installer/portable, macOS ARM64/Intel DMG and Linux x64 DEB packages are included. See `SHA256SUMS.txt`. macOS builds are ad-hoc signed and not notarized; Windows builds do not use commercial code signing. This release has not synchronized packages to Gitee; in-app updates depend on the versions actually available in the store's `client/` directory.

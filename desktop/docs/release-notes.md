# pureTV Manager 0.5.5

## 简体中文

- APK市场在每款应用和启动器的名称下显示作者，读取 Gitee 软件目录中 `manifest.json` 的 `provider` 字段。
- 作者按原文显示，不随界面语言翻译；长名称省略显示，悬停可查看完整内容。没有可用作者信息时显示「未提供」。
- 作者与目录固定在同一仓库提交中，刷新市场时更新；升级后重新获取作者，离线时仍可浏览旧缓存。

## 繁體中文

- APK市場在每款應用與啟動器的名稱下顯示作者，讀取 Gitee 軟體目錄中 `manifest.json` 的 `provider` 欄位。
- 作者按原文顯示，不隨介面語言翻譯；長名稱以省略號顯示，懸停可查看完整內容。沒有可用作者資訊時顯示「未提供」。
- 作者與目錄固定於同一儲存庫提交，重新整理市場時更新；升級後重新取得作者，離線時仍可瀏覽舊快取。

## English

- Shows each app or launcher's author below its name in the APK Market, using `provider` from `manifest.json` in the corresponding Gitee software directory.
- Preserves author names across interface languages. Long names are shortened visually with the full text available on hover; missing author information appears as “Not provided”.
- Pins authors to the same repository revision as the catalog and updates them on refresh. Upgrading checks for author metadata while retaining old cached catalogs for offline browsing.

---

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验值见 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。本次发布未同步 Gitee 商店安装包，应用内更新仍以 `client/` 中实际同步的版本为准。

提供 Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；校驗值見 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。本次發佈未同步 Gitee 商店安裝套件，應用內更新以 `client/` 實際同步的版本為準。

Windows x64 installer/portable, macOS ARM64/Intel DMG and Linux x64 DEB packages are included. See `SHA256SUMS.txt`. macOS builds are ad-hoc signed and not notarized; Windows builds do not use commercial code signing. This release has not synchronized packages to Gitee; in-app updates depend on the versions actually available in the store's `client/` directory.

# pureTV Manager 0.4.12

## 简体中文

统一所有应用内弹窗的毛玻璃背景。确认框、操作进度与结果、布局编辑、嵌套的 layout.json 和背景设置、包名资料及客户端更新都使用同一套半透明遮罩与背景虚化，弹窗内容保持清晰。补齐 WebKit 前缀支持；减少动画设置仍保留静态模糊效果。

保留 0.4.11 的包名查询修复（系统代理、固定 HTTPS 备用来源、有效缓存保留）以及 Gitee `client/` 更新检测、下载校验、自动安装和重启。0.4.10 或更早版本需要先手动安装一次带更新功能的版本；后续新包上传到 Gitee `client/` 后即可被检测。

## 繁體中文

統一所有應用程式內彈窗的毛玻璃背景。確認框、操作進度與結果、版面編輯、巢狀的 layout.json 和背景設定、套件資料及用戶端更新都使用一致的半透明遮罩與背景模糊，彈窗內容保持清晰。補齊 WebKit 支援；減少動畫設定仍保留靜態模糊效果。

保留 0.4.11 的套件查詢修復（系統代理、固定 HTTPS 備用來源、有效快取保留）以及 Gitee `client/` 更新檢查、自動安裝與重新啟動。0.4.10 或更早版本需先手動安裝一次具備更新功能的版本。

## English

All in-app dialogs now share a consistent translucent, blurred backdrop. This covers confirmations, operation progress/results, layout editing, nested JSON/background dialogs, package information and client updates. Dialog content stays sharp. WebKit-prefixed support is included, and reduced-motion settings retain the static blur.

Retains the package lookup fixes from 0.4.11 (system proxy support, fixed HTTPS fallback sources and valid-cache recovery), plus Gitee `client/` update detection, verified downloads, installation and restart. Clients at 0.4.10 or earlier need one manual upgrade before using the built-in updater. Future packages must be uploaded to Gitee's `client/` directory for detection.

---

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验值见发布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。

提供 Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；校驗值見發布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。

Packages are available as Windows x64 installer/portable builds, macOS ARM64/Intel DMGs and Linux x64 DEBs. Checksums are listed in the release attachment `SHA256SUMS.txt`. macOS builds are ad-hoc signed and not notarized by Apple; Windows builds do not use commercial code signing.

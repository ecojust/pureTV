# pureTV Manager 0.5.8

## 简体中文

- APK 市场的启动器、影音、游戏及管理器自身更新改用 `https://apps.b14f.com` 的对应目录，直接通过 HTTPS 下载文件。
- 下载时核对文件大小与服务器提供的版本标记；应用清单提供匹配的 SHA256 时追加校验，复用本地缓存前重新计算 SHA256。
- 新服务器缓存与旧 Gitee 缓存隔离，移除 Gitee 下载及备用下载；论坛继续使用 Gitee。

## 繁體中文

- APK 市場的啟動器、影音、遊戲及管理器本身更新改用 `https://apps.b14f.com` 的對應目錄，直接透過 HTTPS 下載檔案。
- 下載時核對檔案大小與伺服器提供的版本標記；應用程式清單提供相符的 SHA256 時追加校驗，重用本機快取前重新計算 SHA256。
- 新伺服器快取與舊 Gitee 快取隔離，移除 Gitee 下載及備用下載；論壇繼續使用 Gitee。

## English

- APK Market launchers, media apps and games, along with manager updates, now use their respective directories on `https://apps.b14f.com` and download files directly over HTTPS.
- Downloads check file size and server version metadata. A matching SHA256 from an app manifest is verified when available; cached files are hashed again before reuse.
- The new server uses a separate cache from Gitee. Gitee downloads and their fallback have been removed; the forum continues to use Gitee.

---

安装包格式：Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；发布文件的校验值见 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。应用内更新以 `https://apps.b14f.com/client/` 实际提供的版本为准。

安裝套件格式：Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；發佈檔案的校驗值見 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。應用程式內更新以 `https://apps.b14f.com/client/` 實際提供的版本為準。

Package formats: Windows x64 installer/portable, macOS ARM64/Intel DMG and Linux x64 DEB. Checksums for release files are listed in `SHA256SUMS.txt`. macOS builds use ad-hoc signing without Apple notarization; Windows builds do not use commercial code signing. In-app updates depend on the versions actually available at `https://apps.b14f.com/client/`.

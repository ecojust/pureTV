# pureTV Manager 0.4.9

## 简体中文

修复市场中《赤色要塞》（Jackal TV）等较大 APK 的下载：当 Gitee 原始文件接口返回 HTTP 403 时，不超过 32 MiB 的 APK 会自动通过同一仓库的 Git blob API 重试。下载保持用户选择的 APK 版本，并继续核对文件大小与 Git blob SHA，校验通过后才进入待安装列表。

保留 0.4.8 的布局设置：Home 和 Apps 新增应用块默认宽 160、高 142，已有块保留原尺寸。

## 繁體中文

修正市場中《赤色要塞》（Jackal TV）等較大 APK 的下載：當 Gitee 原始檔案介面回傳 HTTP 403 時，不超過 32 MiB 的 APK 會自動透過同一儲存庫的 Git blob API 重試。下載保留使用者選擇的 APK 版本，並繼續核對檔案大小與 Git blob SHA，驗證通過後才加入待安裝清單。

保留 0.4.8 的佈局設定：Home 和 Apps 新增應用區塊預設寬 160、高 142，現有區塊保留原尺寸。

## English

Fix downloads of larger market APKs such as Jackal TV: when Gitee's raw-file endpoint returns HTTP 403, the manager retries APKs up to 32 MiB through the same repository's Git blob API. The download retains the selected APK version and verifies its size and Git blob SHA before adding it to the pending installation list.

The 0.4.8 layout default remains: new app blocks are 160 wide × 142 high on Home and Apps, while existing blocks retain their sizes.

---

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验值见发布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。

提供 Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；校驗值見發布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。

Packages are available as Windows x64 installer/portable builds, macOS ARM64/Intel DMGs and Linux x64 DEBs. Checksums are listed in the release attachment `SHA256SUMS.txt`. macOS builds are ad-hoc signed and not notarized by Apple; Windows builds do not use commercial code signing.

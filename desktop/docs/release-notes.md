# pureTV Manager 0.4.11

## 简体中文

新增 Manager 客户端更新：启动后后台检查一次，也可在左下角点击「检查更新」。更新来源为 Gitee 商店的 `client/` 目录，按当前系统匹配安装包并比较版本；仅在点击「下载并安装」后下载，校验通过后安全结束 ADB 连接、退出管理器，再自动安装和重启。

- 显示当前版本、仓库版本、平台、安装包大小和下载进度；支持取消下载、失败重试及查看上次安装结果。
- 下载绑定固定仓库提交，核对大小与 Git blob SHA，交接前再次验证 SHA256。缺少当前平台的包或检查失败会明确提示，不会误报最新或自动降级。
- Windows 使用安装版更新，便携用户会安装为标准版；macOS 更新已安装的应用并保留失败回退路径；系统需要时会弹出授权提示。Linux 在仓库提供对应 DEB 且系统具备授权工具时可更新。
- 从 0.4.10 或更早版本首次升级，需要先手动安装一次 0.4.11，之后即可使用内置更新。发布者将同命名的新安装包放进 Gitee `client/` 后即可被发现，无需额外更新服务。
- 修复包名资料查询对单一 GitHub Raw 地址的依赖：支持系统代理配置，并在固定 HTTPS 备用源之间自动回退；仅缓存通过格式校验的数据。刷新失败时保留有效旧资料，未知包仍标为未知风险。

保留包名用途与卸载风险查询、市场大文件下载修复和 160 × 142 新应用块默认尺寸。各平台行为及仓库文件约定见 `desktop/docs/client-updates.md`。

## 繁體中文

新增 Manager 用戶端更新：啟動後在背景檢查一次，也可在左下角點擊「檢查更新」。來源為 Gitee 商店的 `client/` 目錄，依目前系統選擇安裝包並比較版本。點擊「下載並安裝」後才會下載，驗證通過後結束 ADB 連線、退出管理器，再自動安裝及重新啟動。

顯示版本、平台、檔案大小與下載進度，支援取消下載、失敗重試及上次安裝結果。下載綁定固定提交並核對 Git blob SHA、大小與 SHA256；缺少對應平台或無法查詢會明確提示，不會自動降級。Windows 使用安裝版，便攜使用者會安裝為標準版；macOS 更新已安裝的應用程式；必要時由系統要求授權。Linux 需倉庫提供對應 DEB 及可用的系統授權工具。

0.4.10 或更早版本須先手動安裝一次 0.4.11。往後發布者把新安裝包放進 Gitee `client/` 即可被發現。

修復包名資料查詢僅依賴 GitHub Raw 的問題：支援系統代理設定，並在固定 HTTPS 備用來源之間自動切換，只快取驗證通過的資料。更新失敗時保留有效舊資料，未知套件仍標為未知風險。

## English

Manager now checks the Gitee store's `client/` directory once after startup, with a manual **Check for updates** action in the sidebar. It matches the running platform and compares stable numeric versions. **Download and install** verifies the package, safely ends the ADB connection, exits the manager, and hands installation and restart to a separate helper.

The dialog shows versions, platform, package size and progress, with download cancellation, retry and the previous installation result. Downloads are pinned to the selected repository commit and checked against its Git blob hash and byte count; SHA256 is verified again before installation. Missing platform packages and lookup failures are explicit, and downgrades are rejected.

Windows uses the standard installer, including a transition from the portable edition. macOS updates an installed app bundle with recovery on replacement failure. Native authorization may be requested. Linux requires a published DEB and the system authorization tools. Clients at 0.4.10 or earlier need one manual upgrade to 0.4.11 before they can use this updater. Future packages are discovered when the publisher adds them to Gitee's `client/` directory.

Package reference lookup now supports system proxy settings and fixed HTTPS fallback sources instead of relying on GitHub Raw alone. Responses are validated before caching; failed refreshes retain valid older data, and unknown packages retain an unknown risk rating.

---

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验值见发布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。

提供 Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；校驗值見發布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。

Packages are available as Windows x64 installer/portable builds, macOS ARM64/Intel DMGs and Linux x64 DEBs. Checksums are listed in the release attachment `SHA256SUMS.txt`. macOS builds are ad-hoc signed and not notarized by Apple; Windows builds do not use commercial code signing.

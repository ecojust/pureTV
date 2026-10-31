# pureTV Manager 0.4.17

## 简体中文

每次连接电视前先清理本机当前用户的 ADB 服务和残留进程，等待退出后再重新建立连接。界面与 MCP 使用同一流程，清理失败或取消时不会继续连接；连接区域也会提示重置会中断其他工具的 ADB 连接。

修复「检查更新 → 下载并安装」在下载和校验成功后被 ADB 错误阻止的问题。ADB 服务本来没有启动时，官方 `adb kill-server` 的正常返回不再误报失败；ADB 不可执行、关闭失败或超时只记录清理日志，Manager 仍会交接安装并重启。安装包校验失败、安装助手启动失败和用户取消仍会停止更新，设备操作期间仍不能开始安装。

0.4.11–0.4.15 已出现「无法安全结束 ADB，客户端更新未启动」时，请退出 Manager，使用本发布页的对应系统安装包手动覆盖安装一次，保留原有配置。macOS 将新应用拖入原安装位置并选择替换。仅上传新包到 Gitee 不能修复旧客户端本身的交接逻辑；后续包仍需放入 Gitee 商店的 `client/` 目录供检查更新使用。

## 繁體中文

每次連接電視前先清理本機目前使用者的 ADB 服務與殘留程序，等待結束後再重新建立連線。介面與 MCP 使用相同流程，清理失敗或取消時不會繼續連線；連接區域也會提示重設會中斷其他工具的 ADB 連線。

修正「檢查更新 → 下載並安裝」在下載與驗證成功後被 ADB 錯誤阻止的問題。ADB 服務尚未啟動時，官方 `adb kill-server` 的正常回傳不再誤報失敗；ADB 無法執行、關閉失敗或逾時只記錄清理日誌，Manager 仍會交接安裝並重新啟動。安裝包驗證失敗、安裝助手啟動失敗及使用者取消仍會停止更新，裝置操作期間仍不能開始安裝。

0.4.11–0.4.15 若已出現無法結束 ADB 的更新錯誤，請退出 Manager，使用本發布頁的對應系統安裝包手動覆蓋安裝一次，保留原有設定。macOS 將新應用程式拖入原安裝位置並選擇替換。僅上傳新包到 Gitee 無法修正舊用戶端的交接邏輯；後續安裝包仍須放入 Gitee 商店的 `client/` 目錄。

## English

Each TV connection first stops the current user’s local ADB server and remaining ADB processes, waits for them to exit, then establishes a fresh connection. The GUI and MCP share this behavior. Cleanup failure or cancellation stops the connection attempt. The connection screen explains that resetting ADB also disconnects other tools using it.

Fixes Manager updates stopping after a successful download and verification because ADB cleanup reports an error. A successful `adb kill-server` with no running daemon is now treated as normal. An unavailable ADB executable, shutdown failure or timeout is logged without blocking installer handoff and restart. Invalid packages, failed installer handoff and cancellation still stop the update, and device operations continue to exclude installation.

If Manager 0.4.11–0.4.15 already fails during ADB shutdown, close it and manually install this release over the existing application once, preserving its settings. On macOS, replace the app at its original installation location. Publishing a newer package cannot change the old client's handoff logic. Future update packages must still be uploaded to the Gitee store's `client/` directory.

---

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验值见发布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。

提供 Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；校驗值見發布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。

Packages are available as Windows x64 installer/portable builds, macOS ARM64/Intel DMGs and Linux x64 DEBs. Checksums are listed in the release attachment `SHA256SUMS.txt`. macOS builds are ad-hoc signed and not notarized by Apple; Windows builds do not use commercial code signing.

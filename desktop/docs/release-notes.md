# pureTV Manager 0.5.0

## 简体中文

论坛支持在管理器内查看帖子详情：点击标题即可阅读原帖正文和跟帖，显示作者、时间与回复信息，支持刷新、跟帖翻页及返回帖子列表。移除「在 Gitee 查看」，保留「发布帖子」和「去回复」，通过系统默认浏览器完成 Gitee 登录、发帖和回复。

APK市场、论坛、操作记录三页隐藏常驻 ADB 提示与右上角电视连接入口，浏览这些页面无需连接电视。市场中的实际安装操作仍检查 ADB 和电视连接，并保留必要的操作错误提示。

论坛读取沿用固定公开 Gitee 数据源；加载、空内容、网络错误和缓存回退分别显示，切换帖子或离开页面时较晚返回的请求不会覆盖当前内容。支持简体中文、繁体中文、英文及现有主题。

保留连接前 ADB 进程清理与客户端更新修复。若 0.4.11–0.4.15 被 ADB 错误阻止更新，请退出 Manager 后手动覆盖安装一次，保留配置。自动更新包仍需同步至 Gitee 商店的 `client/` 目录。

## 繁體中文

論壇現在可於管理器內查看帖子詳情：點擊標題即可閱讀原帖正文與回覆，顯示作者、時間等資訊，支援重新整理、回覆翻頁及返回列表。移除「在 Gitee 查看」，保留「發布帖子」與「前往回覆」，以系統預設瀏覽器進行 Gitee 登入、發帖和回覆。

APK市場、論壇、操作記錄三頁隱藏常駐 ADB 提示與右上角電視連線入口，瀏覽不需連接電視。市場中的實際安裝操作仍檢查 ADB 與電視連線，保留必要錯誤提示。

讀取公開 Gitee 資料，分別顯示載入、空內容、網路錯誤與快取回退；切換帖子或離開頁面後，較晚返回的請求不會覆蓋目前內容。支援三種語言與現有佈景主題。

保留連線前 ADB 清理及用戶端更新修正。若 0.4.11–0.4.15 被 ADB 錯誤阻止更新，請退出後手動覆蓋安裝一次。自動更新包仍須同步至 Gitee 商店的 `client/` 目錄。

## English

Forum titles now open an in-app detail view showing the original post and its replies, with authors, timestamps, refresh, reply pagination and return navigation. Removes the View on Gitee button. New post and Reply continue to open the default browser for Gitee sign-in and submission.

APK Market, Forum and History hide persistent ADB notices and the top-right TV connection control. Browsing these pages requires no TV connection. Actual APK installation still checks ADB and the target TV, with actionable errors preserved.

The forum uses the fixed public Gitee source and distinguishes loading, empty results, network errors and cached fallback content. Late requests cannot overwrite a different post or page. Simplified Chinese, Traditional Chinese, English and existing themes are supported.

Retains ADB cleanup before connection and client update fixes. If 0.4.11–0.4.15 is blocked by an ADB update error, close Manager and manually install this release over it once. Update packages must still be synchronized to the Gitee store's `client/` directory.

---

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验值见 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。

提供 Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；校驗值見 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。

Windows x64 installer/portable, macOS ARM64/Intel DMG and Linux x64 DEB packages are included. See `SHA256SUMS.txt`. macOS builds are ad-hoc signed and not notarized; Windows builds do not use commercial code signing.

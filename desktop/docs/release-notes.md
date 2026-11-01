# pureTV Manager 0.4.19

## 简体中文

在「APK市场」后新增「论坛」，从 Gitee 商店仓库 pure-tv-store 的公开 Issues 读取帖子列表。显示标题、作者、状态、更新时间、回复数和标签，按最近更新排序，每页 20 条；支持刷新、翻页及打开 Gitee 原帖，浏览无需连接电视或配置 ADB。新增「发布帖子」和每帖「去回复」入口，分别使用系统默认浏览器打开 Gitee 新建 Issue 页面和对应帖子网页。

加载、空列表、网络失败和过期缓存分别提示；切换页面时不会被迟到的请求带回论坛或覆盖当前页。帖子按文本展示，支持简体中文、繁体中文和英文界面及现有主题。

保留 0.4.17 的连接前 ADB 进程清理和客户端更新修复。0.4.11–0.4.15 如果更新被 ADB 错误阻止，请退出 Manager 后手动覆盖安装一次，保留原有配置。后续更新包仍需放入 Gitee 商店的 `client/` 目录供自动检测。

## 繁體中文

在「APK市場」後新增「論壇」，從 Gitee 商店倉庫 pure-tv-store 的公開 Issues 讀取帖子列表。顯示標題、作者、狀態、更新時間、回覆數與標籤，按最近更新排序，每頁 20 則；支援重新整理、翻頁及開啟 Gitee 原帖，瀏覽不需連接電視或設定 ADB。新增「發布帖子」及每帖「前往回覆」入口，分別以系統預設瀏覽器開啟 Gitee 新增 Issue 頁面和對應帖子網頁。

載入、空列表、網路失敗及過期快取分別提示；切換頁面時，較晚傳回的請求不會將使用者帶回論壇或覆蓋目前頁面。帖子以文字顯示，支援簡體中文、繁體中文及英文介面與現有佈景主題。

保留 0.4.17 的連線前 ADB 程序清理及用戶端更新修正。0.4.11–0.4.15 若更新被 ADB 錯誤阻止，請退出 Manager 後手動覆蓋安裝一次，保留原有設定。後續更新包仍須放入 Gitee 商店的 `client/` 目錄。

## English

Adds Forum immediately after APK Market in the sidebar. It reads public Issues from the Gitee pure-tv-store repository and shows titles, authors, status, update times, reply counts and labels. Posts are ordered by recent updates with 20 per page. Refresh, pagination and opening the original Gitee post are supported without connecting a TV or configuring ADB. New post opens the Gitee issue creation page in the default browser; Reply opens the corresponding issue page.

Loading, empty results, network errors and stale cached content are distinguished. Late requests cannot navigate back to the forum or overwrite the selected page. Posts are displayed as text. The page supports Simplified Chinese, Traditional Chinese, English and the existing themes.

Retains the ADB cleanup before connection and client update fixes from 0.4.17. If Manager 0.4.11–0.4.15 is blocked by an ADB update error, close it and manually install this release over the existing application once, keeping its settings. Future update packages must still be uploaded to the Gitee store's `client/` directory.

---

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验值见发布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。

提供 Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；校驗值見發布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。

Packages are available as Windows x64 installer/portable builds, macOS ARM64/Intel DMGs and Linux x64 DEBs. Checksums are listed in the release attachment `SHA256SUMS.txt`. macOS builds are ad-hoc signed and not notarized by Apple; Windows builds do not use commercial code signing.

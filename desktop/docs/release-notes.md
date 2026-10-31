# pureTV Manager 0.4.13

## 简体中文

「市场」更名为「APK市场」。每次从其他页面进入时检查最新目录，将本次新增的应用或有更高数字版本的应用排到前面，并在卡片右上角标「新」。首次使用先建立基线，不把全部应用标成新内容；同一次浏览中的搜索、分类切换、版本选择和手动刷新保留本次标记。补传旧版本、同版本替换文件或封面变化不会误标为版本升级。

本地 `market/seen-apps.json` 保存每个应用的稳定标识、名称和最新版本，供下一次进入时比较。网络失败、旧缓存回退或取消不会推进记录；离开页面后才返回的检查结果也不会消费更新提示。记录损坏或读写失败会明确提示。

保留统一毛玻璃弹窗、包名查询的系统代理与备用来源，以及 Gitee `client/` 的客户端更新检测、下载校验、自动安装和重启。0.4.10 或更早版本需先手动升级一次；后续安装包上传到 Gitee `client/` 后即可被检测。

## 繁體中文

「市場」更名為「APK市場」。每次從其他頁面進入時檢查最新目錄，將本次新增或有較高數字版本的應用程式排到前面，並在卡片右上角標示「新」。首次使用先建立比較基準，不將全部項目標為新內容；同一次瀏覽中的搜尋、分類切換、版本選擇與手動重新整理會保留標記。補傳舊版本、替換相同版本的檔案或更換封面不會誤判為版本升級。

本機 `market/seen-apps.json` 儲存每個應用程式的穩定識別碼、名稱與最新版本，供下次進入時比較。網路失敗、使用舊快取或取消檢查時不會更新記錄；離開頁面後才傳回的結果也不會消除更新提示。記錄損毀或讀寫失敗時會明確提示。

保留統一毛玻璃彈窗、套件查詢的系統代理與備用來源，以及 Gitee `client/` 的更新檢查、下載驗證、自動安裝與重新啟動。0.4.10 或更早版本需先手動升級一次；後續安裝包上傳到 Gitee `client/` 後即可被偵測。

## English

Market is now named APK Market. Entering it from another page checks the latest catalog, places newly discovered apps and higher numeric versions first, and adds a NEW badge at the top right of each affected card. The first visit establishes a baseline instead of marking every app as new. Searching, switching categories, selecting versions and refreshing during the same visit retain the visit's badges. Older-version uploads, replacement files with the same version and cover changes do not count as version upgrades.

The local `market/seen-apps.json` file stores each app's stable identity, name and latest version for comparison on the next visit. Failed checks, stale-cache fallback and cancellation leave the record unchanged. Results arriving after the user leaves the page do not consume update indicators. Damaged records and read/write failures produce an explicit warning.

Retains the consistent frosted dialog backdrops, system proxy and fallback sources for package lookups, and Gitee `client/` update checks, verified downloads, installation and restart. Clients at 0.4.10 or earlier need one manual upgrade. Future installers must be uploaded to Gitee's `client/` directory for detection.

---

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验值见发布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。

提供 Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；校驗值見發布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。

Packages are available as Windows x64 installer/portable builds, macOS ARM64/Intel DMGs and Linux x64 DEBs. Checksums are listed in the release attachment `SHA256SUMS.txt`. macOS builds are ad-hoc signed and not notarized by Apple; Windows builds do not use commercial code signing.

# pureTV Manager 0.4.7

## 简体中文

- 修正安装结果提示：Android 明确返回 `INSTALL_FAILED_*` 或 `INSTALL_PARSE_FAILED_*` 拒绝安装时，显示确定的安装失败及原始错误，不再误加“操作可能已生效”。连接中断、超时等无法确认执行结果的情况，仍提示重新扫描核对。
- 签名冲突 `INSTALL_FAILED_UPDATE_INCOMPATIBLE` 明确说明不能覆盖安装，并提供处理步骤与数据风险。需要保留旧数据时，先保留原安装，备份可导出的数据或使用原证书签名的版本。确认不需要旧数据后，在**电视系统设置 → 应用 → 对应应用 → 卸载**中彻底删除旧安装及数据，再重新安装；这会清除该应用的存档和本地记录。
- 管理器的“为当前用户卸载”保留数据，可能保留旧签名记录，不能代替上述换证书处理。管理器不会自动卸载应用或删除数据。新版诊断同步提供简体中文、繁體中文和 English，并继续保留失败的 APK 供用户选择重试。

这是电脑端提示修复，不要求改变市场中的游戏版本。**管理器 0.4.6 也能在彻底卸载旧签名应用后，重新安装市场已提供的游戏 0.5.1；无需先发布或安装游戏 0.5.2。** 更高版本号不能绕过签名校验。操作前核对应用和 APK 文件名，只处理需要更换证书的那个应用；刷新市场不会替换待安装列表中已有的文件。

## 繁體中文

- 修正安裝結果提示：Android 明確回傳 `INSTALL_FAILED_*` 或 `INSTALL_PARSE_FAILED_*` 拒絕安裝時，顯示確定的安裝失敗及原始錯誤，不再誤加「操作可能已生效」。連線中斷、逾時等無法確認執行結果的情況，仍提示重新掃描確認。
- 簽章衝突 `INSTALL_FAILED_UPDATE_INCOMPATIBLE` 明確說明無法覆蓋安裝，並提供處理步驟與資料風險。如需保留舊資料，先保留原安裝，備份可匯出的資料或使用原憑證簽署的版本。確認不需要舊資料後，在**電視系統設定 → 應用程式 → 對應應用程式 → 解除安裝**中完整刪除舊安裝及資料，再重新安裝；這會清除該應用程式的存檔和本機記錄。
- 管理器的「為目前使用者解除安裝」保留資料，可能保留舊簽章記錄，不能代替上述更換憑證的處理。管理器不會自動解除安裝應用程式或刪除資料。新版診斷同步提供簡體中文、繁體中文和 English，並繼續保留失敗的 APK 供使用者選擇重試。

這是電腦端提示修正，不要求改變市場中的遊戲版本。**管理器 0.4.6 也能在完整解除安裝舊簽章應用程式後，重新安裝市場已提供的遊戲 0.5.1；無須先發布或安裝遊戲 0.5.2。** 較高版本號不能繞過簽章驗證。操作前確認應用程式和 APK 檔名，只處理需要更換憑證的那個應用程式；重新整理市場不會替換待安裝清單中已有的檔案。

## English

- Correct installation-result messages: an explicit Android `INSTALL_FAILED_*` or `INSTALL_PARSE_FAILED_*` rejection is reported as a failed installation with the original error, without the misleading “the operation may have taken effect” warning. Connection interruptions, timeouts and other results that cannot be confirmed still ask you to rescan the TV.
- The `INSTALL_FAILED_UPDATE_INCOMPATIBLE` signing conflict now explains why an in-place update is blocked and describes the recovery steps and data loss. To keep existing data, retain the current installation, back up exportable data or obtain a version signed with the original certificate. If the old data is no longer needed, use **TV system settings → Apps → the affected app → Uninstall** to remove the old installation and its data before reinstalling. This deletes that app’s saves and local records.
- The manager’s “Uninstall for current user” keeps data and may retain the old signing record, so it does not replace the certificate-change procedure above. The manager does not automatically uninstall apps or delete data. Updated diagnostics are available in Simplified Chinese, Traditional Chinese and English; failed APKs remain available for an explicit retry.

This is a desktop message fix and does not require a change to the games offered in the market. **Manager 0.4.6 can also install the market’s game version 0.5.1 after the old conflicting installation has been fully removed. Publishing or installing game version 0.5.2 is not required.** A higher version number does not bypass signature checks. Verify the app and APK filename before acting, and handle only the app with the certificate conflict. Refreshing the market does not replace files already in the pending installation list.

---

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验值见发布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。

提供 Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；校驗值見發布附件 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。

Packages are available as Windows x64 installer/portable builds, macOS ARM64/Intel DMGs and Linux x64 DEBs. Checksums are listed in the release attachment `SHA256SUMS.txt`. macOS builds are ad-hoc signed and not notarized by Apple; Windows builds do not use commercial code signing.

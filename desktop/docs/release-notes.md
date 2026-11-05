# pureTV Manager 0.5.3

## 简体中文

- 在 SDK 19 兼容处理的基础上，将旧版系统进程信息中的当前用户识别回退扩展到 Android 5.0／5.1／6.0（SDK 21／22／23）；无法确认身份时不猜测用户为 0，仍拒绝修改。
- 修复 Android 4.4 包列表因已知 `libdvm.so` 非致命 linker 警告而读取失败的问题；仅忽略已核实的完整诊断，权限错误、未知警告和无效列表仍拒绝。
- 两种 `df` 查询均无法解析 `/data` 容量时，使用固定 `stat -f -c %S:%b:%a /data` 直接读取文件系统，兼容挂载别名，不把其他分区容量当作 `/data`。
- 默认 HOME 只接受唯一、明确且非 Resolver／Chooser 的组件；结果缺失或有歧义时，继续阻止停用与卸载，保留默认桌面保护。
- 更新离线 Info 页的三语命令与兼容性说明，补充品牌／系统版本验收清单、只读设备能力采集工具及可复查的 Android 系统模拟器证据。
- Android 4.4／6／11 系统镜像已验证对应读取、安装结果与保护行为，旧镜像仍受 root 测试条件限制，不代表全部电视功能可用。小米电视 2 的系统尚待确认，小米电视 4 的 Android 6 为用户报告；两者均尚无实体电视验证（E4）。

## 繁體中文

- 在 SDK 19 相容處理的基礎上，將舊版系統程序資訊中的目前使用者識別回退擴展至 Android 5.0／5.1／6.0（SDK 21／22／23）；無法確認身分時不猜測使用者為 0，仍拒絕修改。
- 修正 Android 4.4 套件清單因已知 `libdvm.so` 非致命 linker 警告而讀取失敗的問題；僅忽略已核實的完整診斷，權限錯誤、未知警告與無效清單仍拒絕。
- 兩種 `df` 查詢均無法解析 `/data` 容量時，使用固定 `stat -f -c %S:%b:%a /data` 直接讀取檔案系統，相容掛載別名，不將其他分割區容量當成 `/data`。
- 預設 HOME 僅接受唯一、明確且非 Resolver／Chooser 的元件；結果缺失或有歧義時，繼續阻止停用與解除安裝，保留預設桌面保護。
- 更新離線 Info 頁面的三語命令與相容性說明，補充品牌／系統版本驗收清單、唯讀裝置能力採集工具及可複查的 Android 系統模擬器證據。
- Android 4.4／6／11 系統映像已驗證對應的讀取、安裝結果與保護行為，舊映像仍受 root 測試條件限制，不代表全部電視功能可用。小米電視 2 的系統尚待確認，小米電視 4 的 Android 6 為使用者回報；兩者均尚無實體電視驗證（E4）。

## English

- Extends the legacy activity-process fallback for current-user identification from SDK 19 to Android 5.0, 5.1 and 6.0 (SDK 21, 22 and 23). An unverified identity still blocks changes; user 0 is never assumed.
- Fixes Android 4.4 package-list reads interrupted by the known non-fatal `libdvm.so` linker warning. Only the exact verified diagnostic is ignored; permission errors, unknown warnings and invalid lists remain rejected.
- When neither `df` query yields a valid `/data` capacity, uses the fixed command `stat -f -c %S:%b:%a /data` to query that filesystem directly. This supports mount aliases without treating another partition's capacity as `/data`.
- Accepts a default HOME only when it resolves to one unambiguous component other than a Resolver or Chooser. Missing or ambiguous results continue to block disabling and uninstalling apps, preserving launcher protection.
- Updates the offline Info page's command and compatibility explanations in all three languages, and adds a brand/system acceptance checklist, a read-only capability collector and reviewable Android emulator evidence.
- Android 4.4, 6 and 11 system images verified the corresponding reads, installation outcomes and protections. Older images retain root-related test limitations; this is not full TV compatibility certification. Xiaomi TV 2's system is unconfirmed, and Android 6 on Xiaomi TV 4 is user-reported; neither has physical-TV validation (E4).

---

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验值见 `SHA256SUMS.txt`。macOS 使用 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。本次发布未同步 Gitee 商店安装包，应用内更新仍以 `client/` 中实际同步的版本为准。

提供 Windows x64 安裝版／可攜版、macOS ARM64／Intel DMG、Linux x64 DEB；校驗值見 `SHA256SUMS.txt`。macOS 使用 ad-hoc 簽署，未經 Apple 公證；Windows 未進行商業程式碼簽署。本次發佈未同步 Gitee 商店安裝套件，應用內更新以 `client/` 實際同步的版本為準。

Windows x64 installer/portable, macOS ARM64/Intel DMG and Linux x64 DEB packages are included. See `SHA256SUMS.txt`. macOS builds are ad-hoc signed and not notarized; Windows builds do not use commercial code signing. This release has not synchronized packages to Gitee; in-app updates depend on the versions actually available in the store's `client/` directory.

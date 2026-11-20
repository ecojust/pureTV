# Backroad target SDK 35 与 Android 本地 query 修复

此源尚未生成或签名新的 Backroad APK，没有生产 workflow POST，也不宣称解决 Play Protect。原安装失败、helper 和未展开的 UI 证据均保留。

`resource/game-kit/build.py` 仅新增显式 programmatic target SDK 29/35 参数，CLI及共享默认29、min26、compile35不变；注册的 joystick caller 只给 Backroad 选择35。没有在game.json添加字段，338项原游戏资源/生成metadata/index逐SHA与原签包相同。签包验证器另外读取真实aapt badging，拒绝min/target不符；固定证书与原规则不变。

`LocalGameUrl.java` 将精确 `https://game-kit.invalid/`、既有安全相对路径、4096字符合法query分开校验；query永不成为文件路径。MainActivity的两个导航回调及PageFinished均识别精确tv.html的合法query，加载资源仍严格核原构建索引。保留拒绝外部origin、userinfo、端口变化、fragment、路径编码、目录穿越、无效转义、控制符和反斜线。

105项实际生产Java策略检查、19项打包边界与actionlint通过；真实aapt2/javac/d8/zipalign编出两个小型未签名测试包，aapt确认min26、target29/35、compile35。两个测试包只有AndroidManifest.xml不同，DEX和资源相同。首次测试夹具重复tv.html的失败与原脚本保留。没有构建巨型Backroad本地副本。

原Robolectric回调/资源fixture补了两项query测试并更新旧拒绝期待，但本机没有Gradle/Robolectric依赖，未执行；不能把Java策略或编译通过当WebView/实体设备通过。实际新APK仍需普通安装、完整加载、query切赛道、手柄连接/失焦/恢复、存档与两个尺寸检查。

只读兼容性检查：Activity已经exported；宿主无动态广播receiver、PendingIntent或前台service；NSD只登记已监听TCP服务；存档在固定WebView私有origin，无外部存储。target35的新重点是[Android15 edge-to-edge](https://developer.android.com/about/versions/15/behavior-changes-15)，现有全屏代码的实际insets仍待验。[NSD指南](https://developer.android.com/develop/connectivity/wifi/use-nsd)和[局域网权限说明](https://developer.android.com/privacy-and-security/local-network-permission)已只读获取并留SHA/摘录；target35没有采用target37的新局域网权限要求。

[validation.json](validation.json)列明全部范围与限制。共享生产源已变化，后续旧原包复验仍须使用原冻结生产树，不能用新HEAD冒充旧源。

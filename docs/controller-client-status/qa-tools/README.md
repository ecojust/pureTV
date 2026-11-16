# 连接 ID 验收工具前测

新增 `--status-only` 使用原 SDK 的真实 TCP 输入验证连接身份侧栏；原完整玩法默认分支保留。此目录是工具开发/浏览器前测和本地观察器编译，不能代替本轮正式 APK 的 Android 验收。

- `contract-final`：11 项判据契约通过。准确 ID、SVG、席位和换行的正例；隐藏、只在属性里保留 ID、缺图标、错席位、裁剪、重复等负例必须失败。Android 固定只读 DOM 函数与浏览器函数字节相等。128 字符仅是合成 DOM 极端测试，不称为原生协议接受的长度（协议上限96）。
- `sdk-twenty-four-*`：原 SDK 单席6项，通过开始/暂停后持续显示；`sdk-tank-*`：双席7项；`sdk-coast-kart-attempt-1`：3D 双席7项，均保留真实消息、逐seq ACK、实际软件截图和执行源。每份报告的源码/资产哈希各自独立，不把早期文件冒充最终签名资产。
- `heartbeat-idle-boundary`：生产 Java TCP 服务及未修改 SDK 的真实套接字对照。等待22.5秒后，默认无自动心跳的peer按20秒原生超时断开，可选1秒SDK.ping测试peer继续连接，22条ping均收到真实ACK。测试心跳频率不代表固件约5秒的节奏；没有改变服务超时或时钟。后续 `sdk-tank-heartbeat-final` 再过7项。原默认完整玩法仍不启用可选心跳。
- `observer-preflight`：javac/d8/aapt2实际编译成功，仅为未签名、testOnly观察器；没有安装/设备执行结论。

第一次两款软件预检的合成 getInfo 仍静态显示服务待连接，尽管侧栏使用真实缓存 ID。后续仅为status-only模式从已读真实快照派生connected计数，原截图保留。没有增加snapshot调用，也没有写入模型。组件后来由flex gap改为旧WebView兼容的margin；旧版本结果保留，最终兼容副本在后续代表和组件检查中验证。

`verification.json` 给出精确最终工具哈希和全部运行。只移除了已结束运行的javac生成classes；原脚本、报告、消息、日志和媒体保留，文件字节清单见 `archive-manifest.json`。

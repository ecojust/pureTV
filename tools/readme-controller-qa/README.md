# README 游戏 pureTV 手柄验收

范围由 `baseline-inventory.json` 固定为根 README 的20个游戏入口，基线提交为 bf58393b。该文件记录的是旧已发布APK及元数据；签名指纹是元数据记录，不冒充重新执行过的签名验证。基线APK中仅霓虹飞车包含Wi-Fi接收类和 `_puretv._tcp` 常量。

## 输入与观察

`run.mjs` 加载仓库原版 `virtual.html`，用正常鼠标/键盘操作它，原版 `bridge.py` 和 `joystick_sdk.py` 发出实际TCP消息。透明代理逐字节转发并记录消息与同序号ACK，不生成替代输入。第二手柄测试经 `sdk-peer.py` 调用同一未修改的 SDK，检查席位隔离、同ID重连及held-sync抑制。

观察代理在客户端断开后，先等待该连接已发送消息的真实ACK（最多2秒），再向转发端发送FIN，避免ADB收到EOF后关闭整个通道而截断回程。connectionEvents记录客户端EOF、待回执序号、实际等待耗时和FIN原因；超时仍由严格每消息ACK断言判失败。第二SDK的正常释放操作等对应ACK后才主动关闭。断线场景先确认真实游戏帧看见按住RIGHT+A，再按原虚拟页断开按钮；不修改SDK或合成回执。

- Game Kit：方向、A/X=动作A、B/Y=动作B，START开始/暂停。
- 旧11款：方向、A/X=动作A、B=动作B、Y=SELECT，START开始/暂停。保留原游戏的SELECT入口；孤胆枪手1席，其余旧游戏2席。
- `cases.mjs` 只读真实状态，以普通输入验证具体方向、选择、跳跃、旋转、投掷等效果。开局隔离解除、倒计时、方块落地均等待真实游戏条件；模型和时钟都不写入。自动输入不是实体ESP32验证。
- `--gameplay-only` 仅执行菜单、连接、START和该款玩法检查，用于工具开发/前置检查；报告明确标记范围，不等于完整协议验收。
- 必须使用新的空输出目录，失败后保留原报告及准确执行脚本。每次保存资产/脚本哈希，完成时核对未变；最终验收应取签名APK的实际资产。

## Desktop JVM / Chromium

```sh
python3 tools/readme-controller-qa/prepare-assets.py --slug tetris \
  --apk /absolute/tetris-final.apk --output /absolute/empty-assets
PURETV_PACKAGE=/absolute/package-with-playwright-and-pngjs.json \
node tools/readme-controller-qa/run.mjs --mode browser --slug tetris \
  --assets /absolute/empty-assets --output /absolute/new-evidence \
  --jdk /absolute/jdk17 --json-jar /absolute/json-20240303.jar
```

测试直接编译生产 `WifiControllerServer.java`，使用测试HTTP只读快照适配器把其实际TCP输入送到游戏页面。浏览器宿主 `getInfo` 是明确的模拟信息，没有Android NSD注册或实体发现。默认63485，冲突时使用接收器实际备用端口。Playwright需要Chromium，`CHROMIUM_PATH`可指定系统Chromium。菜单检查960×540和1280×720，玩法检查960×540。默认不录桌面录像；加`--record`后需要Playwright的FFmpeg组件。桌面软件渲染的帧率不代表电视设备性能。

双手柄步骤验证两个原SDK身份的独立席位、相反方向、第二席断线不影响第一席、同ID新会话及held-sync抑制。先等held-sync的同序号ACK，再发新的方向并读取实际消费帧，确认该帧B仍未触发。这一步不宣称已完成双人合作通关。

不带`--apk`时从源码准备预览；Jackal的既有art资源由其现有提取工具从基线APK恢复。源码预览不能替代最终签名包验收。

## 实际 Android TV 模拟器

先用 `android-observer/build.py --game SLUG --output EMPTY --sdk SDK --jdk JDK` 生成测试观察APK，再由构建流程用目标应用的同一发布证书签名。观察APK不是游戏产品，不上架商城。其Manifest固定目标包，receipt包含目标、观察包名、runner、完整源/类哈希和未签名APK哈希。构建脚本不持有或生成密钥。

安装实际签名游戏和同签名observer后，持续启动一次Instrumentation：

```sh
adb shell am instrument -w -e diagnosticPort 63486 \
  com.ecojust.controllerqa.tetris/com.ecojust.controllerqa.Observer
```

该命令作为后台受管进程保持运行。Observer正常启动真实目标Activity，在主线程读真实WebView的 `PureTVQA.snapshot()` 深拷贝、宿主getInfo和页面尺寸。只监听设备loopback63486，只提供GET `/status`、`/snapshot`；不提供写模型、注入键盘、改时钟或执行任意JavaScript的路由。没有开启WebView远程调试。

CI为真实游戏TCP63485与诊断63486分别建立ADB forward；`run.mjs`参数使用对应电脑端口：

```sh
node tools/readme-controller-qa/run.mjs --mode android --slug tetris \
  --diagnostics http://127.0.0.1:HOST_DIAGNOSTIC_PORT \
  --tcp-port HOST_GAME_PORT --output /absolute/new-evidence \
  --adb /absolute/adb --serial emulator-5554
```

启动阶段等待Observer就绪和实际游戏快照最长60秒；之后读取失败严格报错。输入仍走原SDK TCP，不经诊断端口。截图来自ADB screencap；批处理由 `tools/controller-emulator-batch.py` 安装旧包、覆盖安装新包、安装观察包、启动/终止进程并保留logcat及录像。

Android NSD注册状态来自实际宿主信息，不等同实体ESP32 GPIO23发现检查。实际模拟器、桌面桥接及实体设备测试必须分别报告。

## 观察代理关闭边界回归

`node tools/readme-controller-qa/proxy-close-test.mjs BEFORE_RUN.mjs EMPTY_OUTPUT`用真实TCP套接字、未修改的SDK及受控延迟回执接收器重现EOF即关闭整个转发通道的边界。它对照旧代理丢尾部ACK、新代理收齐后关闭，并故意扣留最后ACK确认有界超时保留缺失、不会伪造成功。这是测试夹具回归，不是Android或游戏玩法验证。

## 连接 ID 侧栏专项验收

`run.mjs --status-only` 使用同一未修改的原版 SDK、虚拟页和真实 Java TCP 接收器／实际 APK，只验证本轮连接标识。它与 `--gameplay-only` 互斥；不传该参数时仍执行原完整玩法验收。

专项读取每帧已经缓存的控制器身份，再与 `[data-puretv-controller-id]` 的可见文本、1P／2P、SVG 图标、文字 Range 和父级裁剪边界逐项核对。菜单初始无手柄；真实连接后显示准确 ID；双席宿主另验不同 ID、第二席单独断开和同 ID 重连；最后核对全部实际消息的同序号 ACK。没有额外调用生产 `native.snapshot()`，没有写入模型或游戏时钟。

- Android：`scope="controller client status acceptance"`、`statusAcceptanceEnvironment="android-menu"`、`fullGameplayAcceptance=false`。只在真实 APK 菜单完成连接/断线/重连/截图，不能称为完整玩法通过。
- 浏览器：相同 scope，environment 为 `browser-menu-and-playing`，另用普通 START 开始和暂停，验证游玩时二维码收起后连接标识仍可见。模拟宿主的 connected 数量仅从最后一个真实接收器快照派生，不另读或消费输入；页面仍明确为合成原生桥。
- 标准 ESP32／原 SDK ID 必须整段可见，无需滚动。独立布局测试另覆盖最长 96 字符；如横栏需要内部滚动，须如实记录，不能把 DOM 保留全部文字当作整段同时可见。

`client-status-dom.mjs` 是固定只读 DOM 采样函数。测试 Observer 嵌入其精确副本，契约测试核对字节相等；没有新增任意脚本执行或写入路由。`client-status-test.mjs EMPTY_OUTPUT` 用受控 DOM 检查隐藏祖先、错误席位、缺字/缺图标、裁剪、重复身份等错误必须被拒绝。这些测试不是 APK 或实体设备结果。

专项截图使用 `controller-connected-{android|960|1280}.png`、双席 `controllers-two-*`、`controller-disconnected.png` 和 `controller-reconnected.png`；浏览器另有 `controller-playing.png` / `controller-paused.png`。每份报告保留实际脚本、资产哈希、原始消息和失败，不能沿用旧截图表示新 UI。

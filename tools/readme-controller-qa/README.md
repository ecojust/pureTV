# README 游戏 pureTV 手柄验收

范围由 `baseline-inventory.json` 固定为根 README 的20个游戏入口，基线提交为 bf58393b。该文件记录的是旧已发布APK及元数据；签名指纹是元数据记录，不冒充重新执行过的签名验证。基线APK中仅霓虹飞车包含Wi-Fi接收类和 `_puretv._tcp` 常量。

## 输入与观察

`run.mjs` 加载仓库原版 `virtual.html`，用正常鼠标/键盘操作它，原版 `bridge.py` 和 `joystick_sdk.py` 发出实际TCP消息。透明代理逐字节转发并记录消息与同序号ACK，不生成替代输入。第二手柄测试经 `sdk-peer.py` 调用同一未修改的 SDK，检查席位隔离、同ID重连及held-sync抑制。

观察代理在客户端断开时向接收器发送FIN，继续读取服务器排空的真实ACK；不会用立即destroy截断回程。第二SDK的正常释放操作等对应ACK后才主动关闭。用户在虚拟页按住键直接断开的路径仍按原页面实际行为执行。

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

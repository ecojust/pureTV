# Android 实包与 pureTV SDK 验收

此工具安装正式签名游戏和同证书签名的独立 `testOnly` Observer。游戏输入全部来自仓库原版 `puretv-joystick/joystick_sdk.py`，经透明 TCP 转发器记录真实消息和 ACK。Observer 只读 `JoystickGameQA.snapshot()`、`PureGameHost.getInfo()` 和侧栏 DOM，不消费原生输入快照、不改模型、不改时钟。

```sh
python3 joystick-games/qa/android/build-observer.py \
  --game cf-transport-ship --sdk /absolute/android-sdk \
  --jdk /absolute/jdk17 --output /absolute/empty-observer-build

# unsigned Observer 必须走仓库正式签名流程，不能临时造签名密钥。
python3 joystick-games/qa/android/run.py \
  --game cf-transport-ship --apk /absolute/signed-game.apk \
  --observer /absolute/signed-observer.apk \
  --output /absolute/new-runtime-output --adb adb
```

`--game` 也支持 `qq-speed`。目标包分别为 `com.ecojust.joystickcf` 和 `com.ecojust.joystickqqspeed`，Activity 沿用原 `com.ecojust.gamekit.MainActivity`。仅连接工作流的专用模拟器；多设备时显式 `--serial`。

使用另一新输出目录加 `--occupy-default-port` 验证默认端口被占用：Observer 的启动夹具先占用 63485，再启动未经修改的游戏宿主，游戏自行选择备用端口。测试从真实 `getInfo()` 获取发布端口，转发该端口并验证连接、全部操作和重连。该夹具不提供输入或模型写入端点。正常模式必须使用 63485，两种模式都要求进程 PID 与服务端口在同一轮中保持稳定；不得把重启后的端口差异当作连接中端口漂移。

验收范围：

- 实际 WebGL 2 上下文及菜单；START 开始、暂停、模拟时间冻结和恢复。
- CF：普通 TCP 方向输入改变位置；B＋方向改变实际 yaw/pitch；A 增加实际 `shotsFired`；X 开始实际换弹。
- QQ：加速到可转向速度后检查实际 heading 左右变化；A＋方向进入真实漂移。小喷尝试另存快照，不把没有可用库存的氮气或小喷尝试记为功能通过。
- 九键分别按下/释放，在生产帧已消费并缓存的原始玩家输入中逐个核对，防止 A/X、B/Y 被合并。START 暂停会隔离当前按住状态，不能要求被隔离的玩法输入继续保持 true；开始/暂停另用真实游戏状态判据。
- 图标、完整 ID 和 1P；第二手柄收到明确 `controller_busy`，首个手柄的席位、会话、完整 ID 和真实 START 暂停/恢复操作不受影响；断开清键、同 ID 重连、重连 held-sync 不误触 START。
- 已接受连接的每条 SDK 消息必须有同连接、同 seq 的唯一真实 ACK。预期第二身份的 hello 必须收到唯一且精确的 `controller_busy` 错误；该拒绝连接的原 SDK hello/sync 帧另列为拒绝消息，绝不计为 ACK。任何其它错误、额外响应、错误身份/seq、首连接丢失 ACK 或重复 ACK 都失败。

ID 文本接受完整 `controller_id` 或共享组件的精确 `ID: ` 标签加完整 ID；不使用子串匹配，也不接受省略号、截断、错误 ID 或额外字符。首轮实际 Android 报告因为遗漏标签前缀被 QA 误拒，原报告/录像及独立复核保留于 `../../docs/qa/android/runtime-attempt-1-review/`，两份真实 DOM 摘录作为回归夹具。

两款游戏是单人游戏，复用的 Android `MainActivity` 调用 `WifiControllerServer()`，其原构造器固定一个席位。第二轮 QA 错误地要求两个同时连接的 ID，实际原生服务器按设计返回 `controller_busy`。该次原失败报告、六张 PNG 的目视复核和修正来源见 `../../docs/qa/android/runtime-attempt-2-review/`；真实原始 wire 和失败 snapshot 作为回归夹具保留。修正仅匹配单席约定，不修改游戏、宿主、Observer 或签名包。

输出保存游戏/Observer/实际执行源码哈希、原始 `wire.jsonl`、ADB 命令和输出、只读快照、原生 PNG 与屏幕录像。每张图前自然等待 1500 ms 并记录前后 DOM、实际采集时间及 PNG 哈希；这不等同于渲染栅栏，图片仍须逐张目视。既有失败目录不可覆盖。Observer 不随最终游戏 APK 分发。

屏幕录像记录本轮最初最多 180 秒；慢速模拟器上后续步骤可能超出录像长度，后续原始快照和 PNG 单独保留，不能把短录像当作整个流程的视频覆盖。

动作等待使用生产缓存的 `controller.pollCount`：按下后必须看到更新帧中的对应九键输入，再等更新帧中的实际位置、角度、射击或漂移变化，才松开。暂停和 held-sync 抑制也要跨越真实新帧；held-sync 先匹配同 TCP 连接和 seq 的真实 ACK。等待有墙钟上限，不以固定按住毫秒数推算已渲染帧数。工具修正来源及陈旧快照负例见 `../../docs/qa/android/freshness-correction/summary.json`。

本地 `python3 joystick-games/qa/android/test_runner.py` 仅验证 SDK 透传/ACK、只读工具和快照契约，不能替代 Android 实包运行；实体电视、ESP32 及发现广播测试仍需单独进行。

# Wi-Fi 手柄联调记录

`official-virtual-attempt2` 是绑定最终资源的官方 SDK 验收，6 项全部通过。执行于 2026-11-12 16:55:14–16:56:10 UTC，使用原样的 `puretv-joystick/virtual.html`、`bridge.py`、`joystick_sdk.py`，真实鼠标和键盘输入经过 Python SDK、真实 TCP、生产 `WifiControllerServer` 后驱动实际 3D 游戏。

验收观测到 237 条 SDK 消息与 237 条相同 `seq` 的生产 ACK，包含 `hello`、九键 `sync`、全部九键 650 ms 鼠标长按及释放、键盘 A/B 与 X/Y、周期 `ping`。两次正常驾驶分别产生 1 次漂移、1 次出弯小喷、1 次氮气且无碰撞。按住方向和漂移键点击断开后游戏暂停，重连不自动开始或释放氮气，新的 START 可以恢复。

TCP 观察代理只转发原始字节并记录双方消息。游戏的 Android JavaScript bridge 使用只读 HTTP snapshot 测试适配器；游戏与虚拟手柄分别运行在独立 Chromium 进程，游戏保持焦点且未隐藏。没有直接调用 `PureGame.key`、写入模型或修改游戏时钟。这些证据不代表 Android NSD 发现、实体 ESP32、电视或手机实测。

正式验收绑定的生产接收器 SHA256 为 `012267b799975c5140dc53cbed44ace48c2eff1c0e430f3c4c3a0e90091c7703`，最终 `game.js` 为 `fc47fbba494b18fbe847bbb3a814fca2ce55ff1528d16a681e872a842db598cb`。14 个实际游戏资产以及官方 SDK、网页、桥接程序、测试执行源码的完整 SHA256 在 [summary.json](official-virtual-attempt2/summary.json) 内。执行源码、原始日志、截图及单独视觉检查均保留；[report.json.gz](official-virtual-attempt2/report.json.gz) 是未删改原始报告的 gzip 压缩，包含完整 TCP 双向消息和游戏状态观测。

`official-virtual-attempt1` 同样通过 6 项官方输入检查，223 条消息均获 ACK，完整记录未改动。随后目视发现仅 Wi-Fi 手柄连接时，旁边的手机扫码徽章也错误显示 CONNECTED。修正 `game.js` 后，使用完全相同的测试脚本重跑 attempt2 以绑定最终资产；新截图明确显示 Wi-Fi 已连接而手机扫码徽章保持 LOCAL。第一轮不是失败重写，属于修复前资产的真实通过记录。

`direct-tcp-attempt1` 保留早先手写 TCP 客户端的 5 项通过记录，包括重连时携带按住状态的 `sync` 不触发 START/氮气。该轮绑定旧版接收器 `266319a22f4d10f5ae3c788c04c67fbffe00eb1a97e06abb6ca2804430c1b833`，执行在官方 SDK `hello`/`ping`/最小 ACK 兼容修改之前，属于历史证据，不能替代本次官方 SDK 验收。新版 direct-TCP 测试源码已跟随协议更新，本轮没有重复执行。

复现步骤与测试边界见 [README-wifi-wire.md](../../../../tests/README-wifi-wire.md)。本轮正式执行命令为：

```sh
node resource/apps/neon-rush/tests/official-virtual-smoke.mjs \
  --assets /tmp/neon-rush-wifi-web-v2 \
  --output /tmp/neon-rush-official-virtual-attempt2 \
  --jdk /workspace/scratch/neon-rush-toolchain/jdk17 \
  --json-jar /workspace/scratch/neon-rush-wifi-wire-tools/json-20240303.jar
```

每次复测必须使用新的输出目录。归档不包含测试 JVM 的 class 文件或外部 JSON jar；外部 jar 不加入 APK。

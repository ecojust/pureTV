# macOS 手柄游戏宿主

为 `cf-transport-ship` 与 `qq-speed` 打包原生 AppKit/WKWebView 客户端。沿用 pureTV 霓虹飞车 0.1.4 的 TCP/Bonjour、固定监听端口及本机资源服务实现；这里只扩展独立九键快照和通用应用信息，原霓虹客户端不变。

```sh
# 在所选游戏目录先安装锁定依赖并构建、检查 dist
python3 joystick-games/tools/macos-build.py --game qq-speed --output /absolute/scratch/qq-macos
```

构建前逐文件比对冻结 Git 提交，拒绝未提交输入和符号链接，并在构建后验证输入集合与字节未变。构建须在 macOS 上运行，输出包含 ARM64 + x86_64 的通用 `.app`、ZIP、DMG、输入及产物 SHA256 清单。默认 TCP 63485、`_puretv._tcp`、TXT `version=1`；仅首次绑定遇到端口占用才选择备用端口，窗口失焦不会关闭连接或更换端口。两款目前各是单人玩法，第二个不同 ID 会收到 `controller_busy`。

`PureGameHost.snapshot()` 返回独立 `buttons` 九键。Swift 的 `buttonCounters` 保存每键累计按下次数，WK 缓存从中保留短按；每帧只消费一次。原来的 a/b alias 字段保留在协议诊断中，但新的游戏不使用它们。失焦、断线、重连的旧按键不能触发新的动作。连接卡显示实际设备 ID；固件无 RSSI，不伪造信号强度。

包为 ad-hoc 签名，未 Apple 公证。声明最低 macOS 11 是构建部署目标；实际游戏需要 WebGL2，不等于全部 macOS 11 机器均实测。上游来源和许可事实以各游戏 NOTICE 为准，CF 没有上游明确开源许可证，不能标为 MIT/ISC。

## 验证

- `tests/web-bridge.test.mjs`：独立九键、短按、重复/过期快照、断重连、焦点取消。已在当前 Linux 环境执行，原输出见 `docs/bridge-tests.tap`。
- `tests/ControllerServerTests.swift`：既有 ACK、同步、重连、取消与 socket 生命周期回归，新增九键独立状态/计数；必须在 macOS 编译执行，不能用本地 JS 通过代替。
- `tools/macos-packages.py`：完整核对 ZIP、只读挂载 DMG、实际复制安装后的 `.app` 与签名。
- `tools/macos-verify.py`：真实 AppKit/WKWebView + 未修改 Python SDK，观察 Bonjour、卡片 ID、游戏动作、START 暂停、三次焦点变化同端口/同连接、断线/同步重连与 ACK。只读诊断不会读会消费短按的页面 snapshot。
- workflow 保存 ARM、端口占用、Rosetta 的游戏检查；Intel 只有明确创建 WebGL2 失败，或实际游戏的 shader precision 空值与独立 WKWebView 三帧能力探针吻合时，才记 `limited_graphics`，不算玩法通过。普通初始化错误仍失败。原生专项未覆盖完整比赛/整局胜负，另见游戏浏览器 QA。
- `joystick-games-macos-qa.yml` 复用 run `44115155028` / source `8d647598` 的成功构建包；先核对原构建状态、冻结输入与当前生产文件，再安装与运行原字节。产物来源与新验收脚本提交分别记录，所有平台通过相应范围检查后才导出安装包。旧失败报告及截图保留在 `docs/attempts/44115155028-1/`。

当前文档描述工具能力，是否已构建与通过原生检查以对应版本实际工作流和证据为准。没有实体 ESP32 手柄验收。

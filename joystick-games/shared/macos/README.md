# macOS 手柄游戏宿主

为 `cf-transport-ship`、`qq-speed` 及 `catalog-registry.json` 注册游戏打包原生 AppKit/WKWebView 客户端。沿用 pureTV 霓虹飞车 0.1.4 的 TCP/Bonjour、固定监听端口及本机资源服务实现；这里只扩展独立九键快照和通用应用信息，原霓虹客户端不变。

```sh
# 在所选游戏目录先安装锁定依赖并构建、检查 dist
python3 joystick-games/tools/macos-build.py --game qq-speed --output /absolute/scratch/qq-macos
```

构建前逐文件比对冻结 Git 提交，拒绝未提交输入和符号链接，并在构建后验证输入集合与字节未变。构建须在 macOS 上运行，输出包含 ARM64 + x86_64 的通用 `.app`、ZIP、DMG、输入及产物 SHA256 清单。默认 TCP 63485、`_puretv._tcp`、TXT `version=1`；仅首次绑定遇到端口占用才选择备用端口，窗口失焦不会关闭连接或更换端口。两款目前各是单人玩法，第二个不同 ID 会收到 `controller_busy`。

`PureGameHost.snapshot()` 返回独立 `buttons` 九键。Swift 的 `buttonCounters` 保存每键累计按下次数，WK 缓存从中保留短按；每帧只消费一次。原来的 a/b alias 字段保留在协议诊断中，但新的游戏不使用它们。失焦、断线、重连的旧按键不能触发新的动作。连接卡显示实际设备 ID；固件无 RSSI，不伪造信号强度。

包为 ad-hoc 签名，未 Apple 公证。声明最低 macOS 11 是构建部署目标；既有CF／QQ游戏需要 WebGL2，不等于全部 macOS 11 机器均实测；新游戏的渲染要求取决于实际引擎。上游来源和许可事实以各游戏 NOTICE 为准，CF 没有上游明确开源许可证，不能标为 MIT/ISC。

## 验证

- `tests/web-bridge.test.mjs`：独立九键、短按、重复/过期快照、断重连、焦点取消。已在当前 Linux 环境执行，原输出见 `docs/bridge-tests.tap`。
- `tests/ControllerServerTests.swift`：既有 ACK、同步、重连、取消与 socket 生命周期回归，新增九键独立状态/计数；必须在 macOS 编译执行，不能用本地 JS 通过代替。
- `tools/macos-packages.py`：完整核对 ZIP、只读挂载 DMG、实际复制安装后的 `.app` 与签名。
- `tools/macos-verify.py`：真实 AppKit/WKWebView + 未修改 Python SDK，观察 Bonjour、卡片 ID、游戏动作、START 暂停、三次焦点变化同端口/同连接、断线/同步重连与 ACK。只读诊断不会读会消费短按的页面 snapshot。
- workflow 保存 ARM、端口占用、Rosetta 的游戏检查；Intel 只有明确创建 WebGL2 失败，或实际游戏的 shader precision 空值与独立 WKWebView 三帧能力探针吻合时，才记 `limited_graphics`，不算玩法通过。普通初始化错误仍失败。原生专项未覆盖完整比赛/整局胜负，另见游戏浏览器 QA。
- `joystick-games-macos-qa.yml` 复用 run `44115155028` / source `8d647598` 的成功构建包；先核对原构建状态、冻结输入与当前生产文件，再安装与运行原字节。产物来源与新验收脚本提交分别记录，所有平台通过相应范围检查后才导出安装包。旧失败报告及截图保留在 `docs/attempts/44115155028-1/`。

当前文档描述工具能力，是否已构建与通过原生检查以对应版本实际工作流和证据为准。没有实体 ESP32 手柄验收。

## 新目录批量构建

`joystick-games/catalog-registry.json` 是新游戏应用标识的唯一登记表：`schemaVersion: 1`、`games` 以 slug 为键，包含 `packageName`、英文 `appName`、`executable`、`initials`；`batches` 把批次名映射到 slug 数组。版本仍来自各游戏的 `game.json`。CF/QQ 的已发布安装包不由新批次工作流重建或替换。

```sh
python3 joystick-games/tools/macos-build.py --game blaze-thrust \
  --output /absolute/scratch/blaze-macos --host-cache /absolute/scratch/macos-host-cache
```

所有源码、共享适配器和引擎、离线 `dist/`、登记表、QA解释器、原SDK和工作流均进入冻结输入。未提交文件、符号链接或构建前后任何输入字节／集合变化都会失败。各游戏须先运行自己的 `npm run build:check`；存在 `test` 脚本时必须执行 `npm test`。没有上游／游戏测试脚本时报告明确记为 `not_provided`，不宣称原测试通过，共享回归和实际原生QA仍为硬门。输出必须在仓库外。

`--host-cache` 仅复用通用宿主的双架构可执行文件；缓存键包含 Swift 源、builder、编译参数、编译器文件与版本、SDK路径／版本／build／settings。复用前再次核对完整输入、可执行文件哈希及两种架构，损坏缓存直接失败。每个 App 仍有独立名字、包名、图标、Web资源、Info.plist 和 ad-hoc 签名。ZIP、只读挂载DMG、安装拷贝都必须与该App完整文件集和每个字节一致，额外文件及符号链接不能通过。

新 `joystick-catalog-macos.yml` 要求显式40位源码提交与所选workflow提交一致；按登记批次保留每款游戏的原始测试、构建和失败日志，ARM构建仅编译一次宿主。每款均检查 ARM、Intel、Rosetta 及默认端口占用回退，只有全部实际通过才创建新的不可变导出分支。上传失败证据不表示该款通过；当前工具已实现不代表已运行Mac原生验收。

## 目录游戏只读原生 QA

每款 `qa-plan.json` 为纯数据：`schemaVersion:1`，`renderer` 为 `canvas2d`、`webgl1`、`webgl2` 或 `dom`，`compatibleRenderers` 可选且只允许包含主值的 `webgl1`／`webgl2` 同族版本列表（每次仍按实际上下文验证），`pauseStablePaths` 列出至少一个真实模型数值路径，也可同时列模型对象或数组作深比较，`steps` 列出 `name`、实际SDK `keys`、`holdMs` 和 `expect`。期望只支持 `stage`／`paused`／`frames`／`gameplay.*` 路径和 `eq`、`gt`、`lt`、`gte`、`lte`、`changed`、`increased` 操作；后两项相对该步骤按键前快照。计划从实际menu严格按顺序执行，自己包含首次START，运行器不在步骤间隐式开始或恢复；计划结束后才执行通用生命周期专项。必须至少包含非START操作键对应的真实 `gameplay.*` 核心字段 `changed`／`increased` 变化，自动tick／time／frame增长不能作为操作证据，缺失／null及非有限数值不会作为通过。

`JoystickGameQA.snapshot()` 必须只读，返回 `game`、实际 `renderer`、`stage`（menu／playing／paused／ended）、`paused`、`frames`、`gameplay` 和缓存的 `controller`（包括pollCount／buttons）。WebGL游戏还返回真实上下文的 `webglVersion`。快照不能消费输入或推进时钟。暂停期间真实模型数值冻结，手柄缓存继续按帧更新；返回菜单、结束后重开均只使用真实START。

新QA通过未修改的Python SDK记录真实按键和模型变化，验证第二个不同ID被拒绝、实际ID卡片、START暂停／恢复、暂停模型冻结、三次失焦后的同端口／同连接、断线及带按住同步的重连。各次报告保留执行过的验证器、QA解释器、plan和来源哈希。目录游戏在Intel也必须实际运行，任何Canvas／DOM／WebGL初始化失败均失败；旧CF／QQ的明确WebGL能力限制不适用于这些新游戏。当前工具不声明完整通关、实体ESP32或实体电视测试。

## 跨启动存档

本地HTTP资源服务每次启动选择空闲端口，浏览器origin随之改变。新目录游戏必须在 `game.json.storageKeys` 声明原游戏实际使用的精确localStorage键（不使用则 `[]`）；builder验证后写入 `Info.plist.PureTVStorageKeys`。宿主只保存允许表中的字符串，按bundle ID分隔NSUserDefaults字典，每值最多1 MiB UTF-8。文档开始时先恢复存档，再运行游戏脚本；`setItem`、`removeItem` 和 `clear` 都同步，sessionStorage及未声明键不跨界。随后输入推送不会覆盖当前游戏写入。CF/QQ缺少新字段时继续使用原两键与原存储位置、64 KiB限制；已发布包字节不变。

`tests/web-bridge.test.mjs` 包含新origin恢复、删除不复活、空允许表、UTF-8边界、sessionStorage排除与隔离模拟；`tests/GameStorageTests.swift` 在Mac CI验证真实NSUserDefaults重开、删除、bundle隔离和旧键兼容。模拟测试不能代替WKWebView原生重启验收。

每次native／端口占用／Rosetta验收使用新的随机命名测试preferences suite，并在报告记录，不读写用户存档域。同一验收结束时读取正常玩法产生的localStorage和native值；正常退出后用只读 `defaults export` 捕获包括pagehide保存的最终值，保留原HTTP端口占用，复用该测试suite重开相同包。诊断记录文档开始时实际hydrate结果，必须与所记录保存值逐键相等且origin不同。`qa-plan.storageRestartRequired:true` 要求有真实非空游戏存档，否则失败；目前首3款Triptych开启此硬门。未产生存储的其它游戏明确记 `not_exercised`，空值相等不算存档验证通过。所有原生重启结果以实际CI报告为准。

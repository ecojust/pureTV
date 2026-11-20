# pureTV 开发指南

**简体中文** · [English](development.en.md) · [使用指南](README.md) · [返回首页](../../README.md)

## 仓库目录

| 目录 | 开发与维护内容 |
| --- | --- |
| [desktop/](../../desktop/README.md) | 电脑端电视管理器，包括界面、ADB 操作与 Tauri 宿主。 |
| [resource/](../../resource/README.md) | 自研电视启动器和应用的源码、APK 与资源清单，以及 [Game Kit 游戏宿主](../../resource/game-kit/README.md)。 |
| [joystick-games/](../../joystick-games/README.md) | pureTV Wi-Fi 手柄游戏。每款的源码、平台安装包和验收记录见对应游戏目录。 |
| [puretv-joystick/](../../puretv-joystick/README.md) | ESP32 手柄固件、TCP 协议、Python SDK 与联调工具。 |
| [fork/](../../fork/README.md) | 按类别保存的第三方原版 APK、上游出处和校验信息。 |
| [tools/](../../tools/) | 资源索引、验证与发布脚本。第三方 APK 的导入与核验工具见 [tools/tvapp/](../../tools/tvapp/)。 |

查阅九款 Android 电视游戏 0.5.0 至 0.5.2 的改动与验证，见[游戏发行回顾](../game-releases/README.md)。按任务查找其他改动，见[工作记录索引](../../history/INDEX.md)。

## 构建与测试

| 要开发的部分 | 入口 |
| --- | --- |
| 电脑端管理器 | 在 `desktop/` 构建界面、测试 Rust 核心与 Tauri 宿主，再运行 UI 测试。[构建命令与平台说明](../../desktop/README.md#开发与验证) |
| 电视启动器与应用 | 电视端 Gradle 工程使用 Android SDK Platform 35 和 Build Tools 34.0.0。以启动器为例，在 `resource/launcher/puretv/` 运行 `./gradlew assembleDebug assembleRelease lintDebug testDebugUnitTest`。[开发与验证](../../resource/README-development.md#开发与验证) |
| Game Kit 游戏 | 在游戏目录维护玩法与离线资源，复用 Game Kit 的 Android 宿主。工具链、构建、签名与核验步骤见 [Game Kit 构建指南](../../resource/game-kit/BUILD.md)。 |
| 发布资源 | 自研 APK、封面、许可证及 SHA256 跟随各软件目录。电视应用目录中的 64×64 `logo.svg` 供布局编辑器使用。新增资源或更新版本时同步清单与索引。[应用资源约定](../../resource/README-development.md#应用资源与-logosvg-约定) · [维护命令](../resource-maintenance.md) |

## MCP / Agent

打开管理器，进入「设备连接 → MCP · Agent 调试」，复制窗口显示的完整 JSON 到 Agent 客户端，重新连接 `puretv` 服务，并保持窗口打开。配置使用标准输入输出（stdio）。`command` 指向当前系统上实际的管理器可执行文件，`--mcp` 参数指向本机会话文件。移动应用后重新复制配置，重启窗口后重新连接。

Agent 和界面共用当前设备、Android 用户、ADB 配置、操作锁与记录。34 个工具覆盖系统信息、连接、应用管理、APK 安装、启动器切换与布局、市场目录／下载／安装、背景图、ADB 配置、语言与主题、取消及操作记录。可先用 `get_state` 确认当前窗口状态。[完整 MCP 配置、工具参数与示例](../../desktop/docs/mcp.md)

<a id="layoutjson-规范与画面对照"></a>
<a id="layoutjson-协议规范与画面对照"></a>

## 自定义启动器布局

电视启动器和管理器的画布读取同一份 `layout.json`。版本 5 的 users/system 接口分别保存 Home 和 Apps 的布局、背景与切页设置，用户应用块可编辑，系统组件只读。管理器在写入前校验用户应用、图标、边界和系统列表，写入后从电视读回核对。[布局编辑器与兼容说明](../../desktop/docs/launcher-layout.md)

第三方启动器在 APK 的 `assets/layout.json` 中可提供默认布局和 Home 预览背景。要让管理器编辑正在使用的桌面，还需实现 authority 为 `<packageName>.layout` 的 Android ContentProvider。管理器通过 ADB 调用 `status` 探测当前启动器，返回结果通过协议校验后才显示「调整布局」。`apply` 接受 Base64 编码的布局，`reset` 恢复默认布局。MCP 的 `get_launcher_layout` 和 `apply_launcher_layout` 使用相同协议与只读保护。[字段、ContentProvider 示例与画面对照](../../resource/README-development.md#layoutjson-协议规范与画面对照)

<a id="controller-protocol"></a>

## 游戏客户端开发兼容手柄的要求

新游戏从四种游玩方式开始设计，并在发布前逐款检查玩家连接时的画面、席位和暂停行为。[游戏输入与连接显示规范及验收清单](game-controls.md)

游戏是 TCP 服务端，ESP32 手柄主动连接。Android 游戏可复用 Game Kit 原生宿主提供的监听、服务发布和输入转发。独立宿主也需提供同样的发现与输入接口。[Game Kit 实体手柄接入](../../resource/game-kit/README.md#puretv-wi-fi-实体手柄)

### 发布服务与自动查找

1. 在局域网接口监听 TCP，默认端口为 **63485**。仅在启动时端口已被占用的情况下选用备用端口。监听成功后通过 mDNS/DNS-SD 发布 `_puretv._tcp`，并广播实际端口。同一次运行保持该端口，包括手柄重连、窗口失焦和弹出授权提示期间。旧版本以实际广播与游戏界面为准。
2. Android TV 使用 `NsdManager.registerService`。在 `NsdServiceInfo` 中设置 `serviceType = "_puretv._tcp"`、可辨认的 `serviceName`、实际监听的 `port`，用 `setAttribute("version", "1")` 声明协议版本。退出时用同一个监听器撤销注册。复用宿主发布时由宿主统一注册。[Android NSD 文档](https://developer.android.com/develop/connectivity/wifi/use-nsd)
3. **GPIO 23** 的常开按键接 GND，按下触发一次本机服务发现。**GPIO 27** 是 START 游戏键，发送按键消息。当前固件发现恰好一个具有有效 IPv4 和端口的服务时才采用目标，发现零个、多个或地址无效时保留当前目标。固件当前不按服务实例名或 TXT 版本筛选。
4. 配网页可以留空游戏主机，加入 Wi-Fi 后按键搜索，也可填入主机地址与端口直连。搜索结果在本次开机期间有效，断线重连当前目标，手柄重启后恢复已保存的配置。

### TCP 输入协议

使用 UTF-8 JSON Lines，每条消息与 ACK 均以换行符 `\n` 结束。接收端应缓存 TCP 字节直到读到换行，再解析一条消息。每条有效消息均需回复相同 `seq` 的 ACK，例如 `{"type":"ack","seq":12}` 加换行。

建立连接后，手柄先发 `hello` 和九条 `button/sync`，随后约每 5 秒发一条 `ping`。`hello`、`ping` 都带 `type`、`seq` 和 `controller_id`。按 `controller_id` 分别维护各手柄的状态。ESP32 根据芯片出厂 MAC 生成该 ID，消息序号 `seq` 逐条递增，手柄重启后重新计数。

```json
{"type":"button","seq":12,"controller_id":"esp32-001122334455","key":"A","pressed":true,"action":"down","duration_ms":0}
```

九个 `key` 值为 `UP`、`DOWN`、`LEFT`、`RIGHT`、`START`、`A`、`B`、`X`、`Y`，区分大小写。

| `action` | `pressed` | 游戏端处理 |
| --- | --- | --- |
| `down` | `true` | 开始按住，处理即时按下。 |
| `tap` | `false` | 短按松开，结束按住。 |
| `long_press` | `true` | 按住约 500 ms 时发送一次，可触发长按功能。 |
| `long_release` | `false` | 长按松开，结束按住。 |
| `sync` | 当前状态 | 恢复按键状态，不触发单次操作。 |

`duration_ms` 是已按住的毫秒数，`down` 和 `sync` 为 0。连接断开时清除该连接的按键状态，重连后以新一轮 `sync` 为准。游戏侧边使用实际客户端 ID 配合席位区分手柄，断开后更新对应标识。现有固件与 Python SDK 均未上报 RSSI。[字段与参考实现](../../puretv-joystick/README.md)

### 联调验收

启动游戏，在电脑进入 `puretv-joystick/`，运行下面的命令，把示例 IP 和端口换成游戏实际地址。用浏览器打开虚拟手柄，选择「连接游戏」，验证九键、长按、同序号 ACK 与断线重连。若要观察手柄实际发送的消息，可单独运行参考服务并打开监测页。[虚拟手柄、监测页与 SDK 用法](../../puretv-joystick/README.md)

```sh
python3 bridge.py 192.168.1.100 --port 63485
```

虚拟手柄按地址直连。服务发现需要用实体 ESP32 另测 GPIO 23 在零个、一个及多个服务时的行为，并确认单个服务发布的是本次实际监听的端口。

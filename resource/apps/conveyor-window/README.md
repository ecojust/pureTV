# 窗口装配 · Conveyor Window

<!-- apk-resource:start -->
[Android 0.2.3 APK](conveyor-window-0.2.3.apk?raw=1) · [图标与安装验证](docs/releases/0.2.3/android-icon-receipt.json) · [文件校验](SHA256SUMS.txt) · [0.2.1 实玩录像](docs/releases/0.2.1/gameplay.mp4?raw=1)
<!-- apk-resource:end -->

<!-- controller-client-status:start -->
## 历史版本 0.2.2 · 手柄连接标识

[下载签名 APK](conveyor-window-0.2.2.apk?raw=1) · [校验值](SHA256SUMS.txt) · [签名与来源](resource.json) · [源码](src/) · [图标](logo.svg)

Android **0.2.2 / versionCode 4**：手柄连接后，侧边显示手柄图标、玩家席位（按游戏人数显示 1P/2P）和设备完整连接 ID；断开后隐藏。默认 TCP 端口仍为 **63485**。当前手柄固件未上报 RSSI，因此不显示信号强弱。

[连接截图](docs/releases/0.2.2/connected.png) · [连接状态专项录像](docs/releases/0.2.2/controller-status.mp4?raw=1) · [版本验证](docs/releases/0.2.2/verification.json) · [20 款更新记录](../../../docs/controller-client-status/README.md)

安装包沿用原发布证书。本轮在 Android TV 模拟器中验证连接身份、断开／重连状态及同证书覆盖安装；截图和录像记录菜单中的连接状态专项，没有重做完整玩法验收。未改规则模型按精确哈希复用历史依据，旧版报告继续保留。尚未验证实体电视、手机、ESP32 或带已有存档的升级与数据保留。

![Android 0.2.2 手柄已连接及完整 ID](docs/releases/0.2.2/connected.png)
<!-- controller-client-status:end -->

历史 0.2.0：[签名安装包](conveyor-window-0.2.0.apk) · [六关实际游玩录像](docs/gameplay-0.2.0.mp4) · [旧版验证记录](https://github.com/ecojust/pureTV/blob/bf58393ba8fa8bb3bdf731ab24f9ab09d90f5075/resource/apps/conveyor-window/docs/verification.json)。这些旧版记录作为未改变规则的回归依据，不代表本轮界面、手柄链路或 Android 实包验收。

原创双键传送线装配游戏，版本 `0.2.2`（versionCode 4），包名 `com.ecojust.conveyorwindowtv`。作者：ecojust / 桔子桑。

左右移动磁性夹具，从上层传送带抓取零件，调整朝向，在快门开放时投送到下层匹配槽位。零件的完整宽度必须处于窗口内，目标槽位还必须满足距离、空闲、形状和朝向要求。游戏始终选择最近槽位，不会跳过已占用或不匹配的近处槽位。

正确装配增加连续计数；错误投送损坏手中零件并清零连续计数。累计三次损坏或到达关卡期限失败。达到要求的连续装配数获胜；同一最终时间步同时达到目标和期限时，胜利优先。单纯横向持物等待不会因快门关闭而损坏零件。

## 操作

| 输入 | 作用 |
| --- | --- |
| 左 / 右 | 移动夹具 |
| A / 空格 | 空手时抓取；持物时投送 |
| B | 将手中零件顺时针旋转 90° |
| Enter | 从菜单开始 |
| P | 暂停 / 继续 |
| R | 重新开始当前关卡 |

A、B 每次按住只触发一次，松开后可再次操作。两键同时触发时先旋转再抓取或投送。暂停冻结模拟；重新开始恢复初始零件、槽位和计数。

## 六张工单

| 关卡 | 传送带方向 | 连续装配目标 | 期限 |
| --- | --- | --- | --- |
| 铜件初装 | 上、下层向右，不同速度 | 6 件 | 84 秒 |
| 逆送三件 | 上层向左、下层向右 | 6 件 | 90 秒 |
| 对流精装 | 上层向右、下层向左 | 5 件 | 90 秒 |
| 双向换线 | 两层向左，下层更快；四种部件 | 7 件 | 110 秒 |
| 窄窗快装 | 上层高速向右；120 单位窄窗 | 6 件 | 110 秒 |
| 夜班协同 | 上层向左、下层高速向右；错相快门 | 8 件 | 120 秒 |

菜单蓝图显示各关零件、目标朝向与快门周期。已装入的零件随槽位移动，到出口进入完成区，不重复增加装配计数。

0.2.0 保留原三关，新增不同带速、方向、窗口宽度和快门节奏的三张工单。界面采用工厂操作台：左侧控制柜放连接和操作说明，右侧双层传送线占据主舞台，底部仪表显示当前生产状态。菜单展开完整工单蓝图和六关选择。

## 0.2.0 规则与操作验证

```bash
node --test resource/apps/conveyor-window/tests/game-model.test.cjs
node resource/apps/conveyor-window/tests/browser-checks.mjs --assets /absolute/build/assets --output /absolute/scratch/browser
```

23 项规则测试包含原有形式化边界，以及全部六张工单的正常输入通关、零件归属、旋转、重开、自然失败、取消隔离和终局冻结。浏览器专项检查六关菜单、普通输入以及 960×540 / 1280×720 的文字边界和滚动。

共享 QA 使用 `tests/automation.mjs`，可从实际未操作过的短暂停留状态开始观察；六关连续录像使用 `tests/recording-automation.mjs` 和 `tests/recipe.json`。自动器只读取当前公开快照、投送回执和有限的快门时段，再发送正常按键；切关也使用结果页的方向键与 Enter。

## 0.1.0 安装与历史证据

历史安装包：签名安装包为 [conveyor-window-0.1.0.apk](conveyor-window-0.1.0.apk)。完整规则和公开状态接口见 [模型合同](docs/model-contract.md)。

以下均为原 0.1.0 发布证据，保留原样，不作为 0.2.0 的画面或验证证据。旧版通过 20 项正式机制测试、最终来源的三胜三负普通输入回合及基于这些记录的独立审计。正式测试包含明确标注的合成边界 fixture；独立审计没有重玩游戏。早期六回合在导航停止策略修正前已通过，仍作为历史证据保留，未冒充最终策略的结果。

最终浏览器检查包含 10 项共享检查、8 项界面检查和 1 项 QR 信息布局检查。两次候选菜单布局问题及其修正保留在发布证据中；最终候选界面通过审阅。一次实际录制自然取得 6 连装、零失误、1900 分；成片长 50.6 秒。最终 9 张成片抽帧和 12 张界面原图均经 root 与 QA 代理分别逐张审阅。封面取自实际成片中已审阅的游戏画面。

详细来源、签名、检查范围和历史记录见 [发布验证](docs/verification-0.1.0.json)、[独立审计](docs/independent-conveyor-review.json)、[美术审阅](docs/art-review.json) 和 [录像说明](docs/gameplay-0.1.0.json)。

验证环境为软件 Chromium。尚未进行实体电视、实体手机或真实扫码连接测试；QR 图仅验证布局。视频导出帧率不代表设备实测帧率，抽帧审阅也不等于逐帧检查整段录像。

本文件作为发布文档生成，不属于已签名安装包的冻结源码；补充此说明不改变安装包、游戏规则或录像。

本项目采用 [MIT 许可证](LICENSE)。

## pureTV Wi-Fi 手柄

从 0.2.1 起，电视游戏提供 pureTV TCP 手柄服务，默认端口 **63485**。电视和手柄连同一个局域网，在游戏显示连接地址后按手柄 GPIO23 搜索键；同网仅保留一个目标游戏服务，固件才会自动选中。若端口被占用，以游戏显示的实际端口为准。

- 方向键：对应游戏内方向操作和菜单选关。
- START：开始、暂停或继续。
- A / X：抓取 / 投放。
- B / Y：旋转零件。

断线或切换控制来源会暂停并清除旧输入；重新连接后松开按键，再按 START 继续。临时失焦时保留TCP连接并隔离输入，真正退出游戏时关闭服务。遥控器、键盘和扫码手机入口继续可用。

虚拟手柄联调：`python3 puretv-joystick/bridge.py 电视IP --port 63485`，再打开 `http://127.0.0.1:8767/`。使用备用端口时替换命令中的端口。验证范围见[20款游戏接入记录](../../../docs/readme-controller-support/README.md)。

<!-- controller-client-status-history:start -->
<details>
<summary>历史 0.2.1 安装包与验收记录</summary>

以下为旧版发布记录，其测试与画面不代表本次连接 ID 界面验收。[原提交中的完整说明](https://github.com/ecojust/pureTV/blob/9af9f197855eb7a0ce7174c0e6295c8974b3250d/resource/apps/conveyor-window/README.md)。

**0.2.1 · pureTV 手柄更新：** [签名安装包](conveyor-window-0.2.1.apk) · [Android 实包手柄回归录像](docs/releases/0.2.1/gameplay.mp4) · [版本验证](docs/releases/0.2.1/verification.json) · [当时接入记录](../../../docs/readme-controller-support/README.md)

新增 pureTV Wi-Fi 手柄支持，默认端口 **63485**，显示真实连接状态，断线时暂停并清除输入。保留原六关及规则，遥控器和扫码手机仍可使用。

该历史版 APK 已签名，并在 Android TV API 36 模拟器中完成同证书覆盖安装验证，通过全部 8 项手柄验收，覆盖开始、实际游戏操作、暂停恢复、断线重连、九键输入及逐消息 ACK。下图和上方录像来自该历史版本实际 APK；录像记录手柄回归过程，不是六关通关录像。尚未进行实体电视、手机或 ESP32 测试。

![0.2.1 实际 Android APK 菜单](docs/releases/0.2.1/menu.png)

</details>
<!-- controller-client-status-history:end -->

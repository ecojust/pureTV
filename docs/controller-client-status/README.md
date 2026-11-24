# 游戏手柄连接标识

该版首页展示的 **20 款 Android 游戏**和**霓虹飞车 macOS 0.1.4**增加了手柄连接标识。新版 APK、Mac 安装包及截图已发布到 GitHub 仓库各游戏目录，提交为 [`7a4e852b`](https://github.com/ecojust/pureTV/commit/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af)。210 份公开文件已完成下载、大小和 SHA256 核对，见[下载验证](public-download-verification.json)及[交付清单](rollout.json)。

[查看当前游戏及安装包](../../README.md#games)

## 显示方式

连接后，游戏侧边显示手柄图标、1P／2P 席位和设备的完整 `controller_id`。双手柄分别显示，断开时移除对应卡片，同一手柄重新连接后恢复原 ID 和席位。进入游戏、暂停或收起二维码面板后，标识继续显示。

固定侧栏的游戏将卡片放在侧栏顶部；Cozy 的连接区和音乐按钮独立于滚动详情，二维码不会被连接卡片覆盖。霓虹飞车、孤胆枪手和极品二手车按各自 HUD 位置安排独立侧标。正常固件和 SDK 的 ID 完整可读。较长 ID 自动换行，少数横向栏在 96 字符的极端测试中需要内部滚动。

当前固件和 SDK **没有上报 RSSI**，因此不显示信号强度，也不使用电视 Wi-Fi 信号或心跳延迟代替。默认 TCP 端口仍为 **63485**。

## 下载与连接

Android 游戏需要 **Android 8.0 及以上**。各游戏目录提供安装包、当前截图、连接状态录像与版本验证；安装包沿用原包名及发布证书。Mac 版需要 macOS 11+ 和 WebGL，下载入口见[霓虹飞车 Mac 说明](https://github.com/ecojust/pureTV/blob/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/neon-rush/macos/README.md)。

电视／Mac 与手柄连接同一局域网，按 GPIO 23 搜索游戏，START 开始／暂停。按键和双人支持仍按[原手柄接入说明](../readme-controller-support/README.md#按键与双人)执行。

| 游戏 | 本轮 Android 版本 | versionCode |
| --- | --- | ---: |
| [霓虹飞车](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/neon-rush/) | 0.1.3 | 4 |
| [四则二十四](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/twenty-four/) | 0.2.2 | 4 |
| [夜桥接力](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/torch-bridge/) | 0.2.2 | 4 |
| [叠塔工匠](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/tower-overlap/) | 0.2.2 | 4 |
| [异形装箱](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/packing-sculptor/) | 0.2.2 | 4 |
| [窗口装配](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/conveyor-window/) | 0.2.2 | 4 |
| [折光工坊](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/glass-fold/) | 0.2.2 | 4 |
| [拉索桥梁](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/tension-span/) | 0.2.3 | 5 |
| [镜光接力](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/prism-relay/) | 0.2.3 | 6 |
| [孤胆枪手 TV](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/alien-shooter/) | 0.1.4 | 5 |
| [极品二手车](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/used-car-racing/) | 0.1.5 | 6 |
| [Cozy Island TV](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/cozy-island/) | 0.5.4 | 6 |
| [Coast Kart TV](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/coast-kart/) | 0.5.4 | 6 |
| [Super Mario TV](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/super-mario/) | 0.5.4 | 6 |
| [Mighty Bomb Jack TV](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/bomb-jack/) | 0.5.4 | 6 |
| [Adventure Island TV](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/adventure-island/) | 0.5.4 | 6 |
| [Tetris TV](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/tetris/) | 0.5.4 | 6 |
| [Magic Jewelry TV](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/jewel/) | 0.5.4 | 6 |
| [Jackal TV](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/jackal/) | 0.5.4 | 8 |
| [Tank TV](https://github.com/ecojust/pureTV/tree/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/tank/) | 0.5.4 | 11 |

## 验证范围

本轮聚焦连接标识。20 款玩法模型与上一正式 APK 及原源码逐字节一致，见[模型复用核对](model-reuse.json)；原玩法记录保留，不把新 UI 状态录像当作重新通关全部关卡。

浏览器布局检查覆盖 20 款 × 两种尺寸（960×540、1280×720），另含霓虹 Mac 收起连接栏的两个展示检查。连接 ID 来自缓存输入状态，渲染界面不会额外读取会消费短按的原生快照。浏览器合成连接布局、原 SDK 通信、Android 安装包和原生 Mac 验证分别记录。

20个正式Android包已通过菜单中的原版SDK连接身份、图标、双席区分、断开／重连和覆盖安装专项，共110项状态检查、667条消息与ACK对应通过，20张当前封面均逐张查看。见[选定产物与画面核对](acceptance-set.json)。当前截图和录像是连接状态专项，不是完整玩法测试。此前极品二手车完整 Android 玩法受模拟器宿主 RenderThread 崩溃阻塞，本次菜单专项不代表该限制已解决。

Mac的ARM原生、默认端口被占用、Rosetta三种图形模式各通过11组及真实ID六阶段检查；原生Intel运行机无WebGL，仅通过7组通信／生命周期及菜单ID检查，未计为3D驾驶通过。详细范围见[Mac验证记录](https://github.com/ecojust/pureTV/blob/7a4e852b9fa6c47cb2cc5e14ce5f9c3882f225af/resource/apps/neon-rush/macos/docs/verification-0.1.4/README.md)。

尚未进行实体电视、手机和ESP32联调，也未验证带已有存档的升级与数据保留。Mac包为ad-hoc签名，未做Apple公证。本轮没有上传`apps.b14f.com`。

## 可复查记录

- [共享组件和协议核对](../../resource/game-kit/docs/controller-client-status/component/)；[Mac 只读诊断预检](../../resource/game-kit/docs/controller-client-status/mac-diagnostics/)。
- [9 款 GameKit 布局](../../resource/game-kit/docs/controller-client-status/gamekit/README.md)：18/18，Mac 展示 2/2，原输入回归 16/16。
- [7 款街机布局](arcade-ui/README.md)：最终 14/14，生产资产与最终报告哈希一致。
- [4 款 3D 游戏布局](../../resource/game-kit/docs/controller-client-status/worlds/README.md)：当前8/8场、112项检查，另有Cozy两尺寸16个焦点/滚动状态，修正前记录保留。
- [Android实际安装包与画面](acceptance-set.json)：110项、667条ACK，原始失败和被拒预览完整保留；部分非主截图仅作为卡片证据，限制见原图复核记录。
- [原 SDK 和 Observer 预检](qa-tools/README.md)：真实 TCP、断线、重连及心跳边界；Android 只读 Observer 编译通过。
- [实际来源范围](source-scope.json)：19款Android、Cozy布局修正及Mac测试夹具来源分别绑定，原APK/失败记录保留。
- [签名与交付流程](../../tools/README-controller-status-release.md)；[任务记录](../../history/2026-11-16-001.md)。

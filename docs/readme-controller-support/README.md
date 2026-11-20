# README 20款游戏的pureTV手柄接入

> 这是上一轮首次接入手柄的历史记录。最新安装包、连接图标与 ID 显示见[本次连接标识更新](../controller-client-status/README.md)。

本轮为根 README 展示的 **20 款游戏**加入 pureTV Wi-Fi 手柄支持，全部提供沿用原证书的新签名 APK。19 款通过完整 Android 模拟器手柄验收；极品二手车通过完整浏览器手柄验收，Android 后续玩法因模拟器宿主渲染线程崩溃而受阻。该限制未记为通过，详见下方验证范围。完整资源目录中的另外 92 款未展示游戏不属于本次更新。

新版已发布到仓库各游戏目录；[186项公开下载核验](public-download-verification.json)通过。电视商城的仓库目录已同步，尚未向 `apps.b14f.com` 上传文件。

## 连接方式

这些Android游戏需要 **Android 8.0及以上**。安装各目录中的本轮新版APK后再连接手柄；完整版本与校验状态保存在[交付清单](rollout.json)。

所有本次更新默认监听TCP `63485`，仅首次占用时选择备用端口并显示实际值。电视和手柄同一局域网，按GPIO23搜索；当前固件仅在发现恰好一个`_puretv._tcp`服务时自动连接。START开始／暂停，断线后清键并暂停，松开按键后重新按START继续。保留扫码手机与遥控器入口。

二维码旁的地址用于手机控制页面，它的端口与pureTV手柄的TCP端口不同；连接pureTV手柄时以专用连接卡片显示的地址为准。

短暂失焦、授权弹框或网络房间重建时保持已选择的TCP端口；后台输入隔离。Android Activity真正结束时关闭服务，不将退出后的新进程视为旧TCP连接。

## 按键与双人

9款Game Kit使用A/X与B/Y两组动作；11款旧游戏使用A/X主动作、B副动作、Y原SELECT，确保换枪、工具和模式选择仍可操作。具体用途见每款游戏README与画面说明。除单人的孤胆枪手，10款旧双人宿主可接入两只Wi-Fi手柄，按controller_id区分席位；新连接不会共用一套按键。

## 本轮版本

| 游戏 | 原版 → 新版 | versionCode | 宿主 |
| --- | --- | ---: | --- |
| [霓虹飞车](../../resource/apps/neon-rush/) | 0.1.1 → 0.1.2 | 2 → 3 | game-kit |
| [四则二十四](../../resource/apps/twenty-four/) | 0.2.0 → 0.2.1 | 2 → 3 | game-kit |
| [夜桥接力](../../resource/apps/torch-bridge/) | 0.2.0 → 0.2.1 | 2 → 3 | game-kit |
| [叠塔工匠](../../resource/apps/tower-overlap/) | 0.2.0 → 0.2.1 | 2 → 3 | game-kit |
| [异形装箱](../../resource/apps/packing-sculptor/) | 0.2.0 → 0.2.1 | 2 → 3 | game-kit |
| [窗口装配](../../resource/apps/conveyor-window/) | 0.2.0 → 0.2.1 | 2 → 3 | game-kit |
| [折光工坊](../../resource/apps/glass-fold/) | 0.2.0 → 0.2.1 | 2 → 3 | game-kit |
| [拉索桥梁](../../resource/apps/tension-span/) | 0.2.1 → 0.2.2 | 3 → 4 | game-kit |
| [镜光接力](../../resource/apps/prism-relay/) | 0.2.1 → 0.2.2 | 4 → 5 | game-kit |
| [孤胆枪手 TV](../../resource/apps/alien-shooter/) | 0.1.2 → 0.1.3 | 3 → 4 | legacy |
| [极品二手车](../../resource/apps/used-car-racing/) | 0.1.3 → 0.1.4 | 4 → 5 | legacy |
| [Cozy Island TV](../../resource/apps/cozy-island/) | 0.5.2 → 0.5.3 | 4 → 5 | legacy |
| [Coast Kart TV](../../resource/apps/coast-kart/) | 0.5.2 → 0.5.3 | 4 → 5 | legacy |
| [Super Mario TV](../../resource/apps/super-mario/) | 0.5.2 → 0.5.3 | 4 → 5 | legacy |
| [Mighty Bomb Jack TV](../../resource/apps/bomb-jack/) | 0.5.2 → 0.5.3 | 4 → 5 | legacy |
| [Adventure Island TV](../../resource/apps/adventure-island/) | 0.5.2 → 0.5.3 | 4 → 5 | legacy |
| [Tetris TV](../../resource/apps/tetris/) | 0.5.2 → 0.5.3 | 4 → 5 | legacy |
| [Magic Jewelry TV](../../resource/apps/jewel/) | 0.5.2 → 0.5.3 | 4 → 5 | legacy |
| [Jackal TV](../../resource/apps/jackal/) | 0.5.2 → 0.5.3 | 6 → 7 | legacy |
| [Tank TV](../../resource/apps/tank/) | 0.5.2 → 0.5.3 | 9 → 10 | legacy |

所有包沿用原 applicationId 和固定发布证书，并在模拟器中成功从上一正式版覆盖安装；旧包与旧证据保留。本轮未进行带既有存档的升级验证，不能把安装成功当作存档保留已验证。

## 验证范围

- **19 款完整 Android 验收通过**：原版 SDK 的实际操作、开始／暂停、断线清键与重新连接、九键输入和逐消息 ACK；双人宿主另验独立席位。每款目录提供对应 APK 的实际截图、录像与版本验证记录。
- **极品二手车**：完整浏览器手柄验收通过，正式 APK 的签名、来源、覆盖安装、菜单、握手同步及 START 开始通过；A 加速后的 Android 流程未完成。官方模拟器 37.2.13 和 35.6.11 均发生宿主 `RenderThread` 段错误并导致虚拟机离线，缺少调用栈，具体根因尚未定位。其菜单来自真实 APK，玩法录像来自使用模拟原生桥的 Chromium，不能作为 Android 玩法已通过的证据。
- **实体设备尚未联调**：没有实体电视、手机或 ESP32 测试结果。最低系统版本为安装要求，不代表所有 Android 8.0 及以上电视均已验证。

逐款来源与状态见[验收清单](acceptance-set.json)。原始失败报告和后续有效检查分别保留，没有把失败的整批工作流改写为成功。

## 验证记录

- [玩法模型复用核对](../../resource/game-kit/docs/readme-controller-support/model-reuse.json)：19款模型与上一正式Android包逐字节相同；霓虹采用已交付macOS 0.1.3的转向修复源码。原关卡验证保留，不把本轮手柄录像当作重新通关全部关卡。
- [旧包基线盘点](../../tools/readme-controller-qa/baseline-inventory.json)：仅旧霓虹APK已有TCP服务，其他19款旧包未包含。
- [共享协议与输入前测](../../resource/game-kit/docs/readme-controller-support/preflight/README.md)：27真实TCP测试、16合成runtime测试及未签名编译；各阶段来源哈希保留。
- [11旧宿主原生编译](../../resource/game-kit/docs/readme-controller-native/README.md)：384项原生JUnit通过，其中包含44项新增Activity回归；保留历次构建失败与修正记录。
- [实际SDK浏览器预检](../../resource/game-kit/docs/readme-controller-support/sdk-browser/README.md)：20款方向和主要动作通过，原始失败和实际执行脚本保留；不等同于Android设备验收。
- [构建与签名流程](../../tools/README-controller-release.md)：构建不接触发布密钥，签名核对来源、包名、递增版本和旧证书；测试观察器单独标为测试产物。
- [任务记录](../../history/2026-11-15-003.md)。

浏览器和Android模拟器记录与实体电视／ESP32分开。未做实体设备联调时明确标false；普通输入录像不通过写模型或强制时间制作，旧版画面不冒充本轮UI验证。

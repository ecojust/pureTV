# README 20款游戏的pureTV手柄接入

当前状态：20款签名APK均已独立验证，384项原生JUnit与24项发布边界测试通过；实际Android TV模拟器验收正在[43731392410](https://github.com/ecojust/pureTV/actions/runs/43731392410)运行，公开下载尚未更新。范围来自根README游戏表，未把完整资源目录中另外92款未展示游戏自动计入本次。

## 连接方式

这些Android游戏需要 **Android 8.0及以上**。安装各目录中的本轮新版APK后再连接手柄；完整版本与校验状态保存在[交付清单](rollout.json)。

所有本次更新默认监听TCP `63485`，仅首次占用时选择备用端口并显示实际值。电视和手柄同一局域网，按GPIO23搜索；当前固件仅在发现恰好一个`_puretv._tcp`服务时自动连接。START开始／暂停，断线后清键并暂停，松开按键后重新按START继续。保留扫码手机与遥控器入口。

短暂失焦、授权弹框或网络房间重建时保持已选择的TCP端口；后台输入隔离。Android Activity真正结束时关闭服务，不将退出后的新进程视为旧TCP连接。

## 按键与双人

9款Game Kit使用A/X与B/Y两组动作；11款旧游戏使用A/X主动作、B副动作、Y原SELECT，确保换枪、工具和模式选择仍可操作。具体用途见每款游戏README与画面说明。除单人的孤胆枪手，10款旧双人宿主可接入两只Wi-Fi手柄，按controller_id区分席位；新连接不会共用一套按键。

## 待交付版本

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

所有包沿用原applicationId和固定发布证书，用于覆盖升级；旧包与旧证据保留。正式包交付前不能把源码支持或未签名编译产物当作已安装支持。

## 验证记录

- [玩法模型复用核对](../../resource/game-kit/docs/readme-controller-support/model-reuse.json)：19款模型与上一正式Android包逐字节相同；霓虹采用已交付macOS 0.1.3的转向修复源码。原关卡验证保留，不把本轮手柄录像当作重新通关全部关卡。
- [旧包基线盘点](../../tools/readme-controller-qa/baseline-inventory.json)：仅旧霓虹APK已有TCP服务，其他19款旧包未包含。
- [共享协议与输入前测](../../resource/game-kit/docs/readme-controller-support/preflight/README.md)：27真实TCP测试、16合成runtime测试及未签名编译；各阶段来源哈希保留。
- [11旧宿主原生编译](../../resource/game-kit/docs/readme-controller-native/README.md)：真实Android资源/Java编译和待CI执行的44项新增Activity回归。
- [实际SDK浏览器预检](../../resource/game-kit/docs/readme-controller-support/sdk-browser/README.md)：20款方向和主要动作通过，原始失败和实际执行脚本保留；不等同于Android设备验收。
- [构建与签名流程](../../tools/README-controller-release.md)：构建不接触发布密钥，签名核对来源、包名、递增版本和旧证书；测试观察器单独标为测试产物。
- [任务记录](../../history/2026-11-15-003.md)。

浏览器和Android模拟器记录与实体电视／ESP32分开。未做实体设备联调时明确标false；普通输入录像不通过写模型或强制时间制作，旧版画面不冒充本轮UI验证。

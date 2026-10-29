# 海岸卡丁车 TV

<!-- apk-resource:start -->
[下载 APK](coast-kart-0.5.2.apk?raw=1) · [校验值](SHA256SUMS.txt) · [签名及构建来源](resource.json) · [源码](src/) · [64×64 SVG 图标](logo.svg)

此目录内 APK 使用 pureTV 发布证书签名。若设备中存在使用旧证书的同包应用，Android 无法直接覆盖安装；需先备份数据并卸载旧包。
<!-- apk-resource:end -->

[中文](README.md) · [English](README.en.md)

一款参考现代卡丁车竞速玩法、独立制作的电视游戏。采用实际 WebGL 1 三维场景与跟随镜头，包含四条原创赛道、三级漂移加速、尾流超车、道具、电脑对手和手机扫码双人分屏。

当前版本 **0.5.2**，适用于 Android 8.0 及以上电视，包名 `com.ecojust.coastkarttv`。
<!-- visual-release:start -->
## 0.5.2 视觉更新与验证

当前发布版本为 **0.5.2**，本目录提供对应签名安装包。本轮沿用 0.5.0／0.5.1 的 pureTV 发布证书，可覆盖更新并保留本机数据。逐款改动、检查范围和实机验证状态见[0.5.2 视觉更新记录](../../../docs/game-visuals-0.5.2.md)。

本轮以《Mario Kart 8 Deluxe》的三维竞速表现为参考，用 WebGL 1 实际 3D 场景重建赛车、赛道与镜头。赛道和角色由本项目独立制作，现有漂移、道具、竞赛和局域网双人流程保留，专项检查结果见下文。这不是商业原作的完整移植。

具体还原范围见[参考说明](docs/reference.md)。3D 渲染使用随应用本地打包的 Three.js r124（MIT），无需 CDN。

<!-- final-verification -->
最终源码 0752b658aecbb1322cb7294e3176500639db1b54 已通过 Android CI 40843467072：280 项模型／渲染行为回归、36 个兼容场景、131 个手柄场景及 18 个双语集成场景；Cozy Island 输入运行时 9／9、两款 WebGL 1 渲染脚本及 Coast Kart 道具攻防专项也通过。Android 构建、lint、体积和 staging 成功，15 个模块实际执行 JUnit 任务（含全部 9 款游戏），不推断未输出的 JUnit 用例数。签名运行 40846148068 已核验九款 APK 的源码资源、签名与资源目录。Chrome 61 语法和现代 Chromium 旧 API 模拟不等于真实旧 WebView 验收；真实电视／手机、设备 FPS、覆盖安装和数据保留均未测试。

此前本轮 WebGL 1 专项已验证四种赛道主题、双人视口、资源复用、无 WebGL 兼容画面、上下文丢失／恢复、无实例化扩展的三维路径和退出释放；连续分屏绘制保持 25 份几何、5 份纹理。使用 Chromium 的 ANGLE／SwiftShader 软件渲染，不能据此推断电视 GPU 帧率。最终源码 0752b65 已通过 Android CI 40843467072 的完整浏览器与原生检查，包括近场对手车体避开追车镜头的回归。真实电视画质、FPS、温度与长时间运行未测试。
<!-- visual-release:end -->

## 0.5.1 还原度升级

加入持物防御、前后投掷、名次道具策略及来袭提示，修复高速与终点线碰撞。

沿用 0.5.0 证书，可直接覆盖更新；本轮核对结果与剩余差距见[还原度复核](../../../docs/game-fidelity-0.5.1.md)。

## 安装与签名

0.5.2 沿用 0.5.0／0.5.1 的 pureTV 统一发布证书，可以覆盖安装这些版本并保留本机数据。使用旧证书的 0.4.x 及更早安装不能直接覆盖，请先备份可导出的数据再卸载；卸载会清除本机存档和记录，本项目没有跨证书自动迁移工具。

## 开始游玩

1. 手机和电视接入同一局域网，在电视上打开游戏。
2. 手机浏览器扫描房间二维码，每位玩家使用一部手机，无需安装手机端应用。
3. 标题画面选择人数，再按 START 开始。
4. 左侧浮动摇杆以落指位置为中心；拖动控制，松开释放。右侧屏幕三分之一整块用于动作，上半区 B、下半区 A，任意位置按下都有效，可与摇杆同时操作。START／SELECT 独立位于左侧底部；游戏操作区禁止选中文字和长按菜单。

| 控件 | 功能 |
| --- | --- |
| 浮动摇杆 | 左右转向；向下刹车／倒车，默认自动加速 |
| A | 加速/护盾按下使用；路障/脉冲按住防御、松开投掷；摇杆 ↑↓ 选择前后 |
| B | 速度足够且转向时按住漂移，积蓄 0.65／1.6／2.4 秒后松开，获得三级加速 |
| SELECT | 标题选择单人／双人；暂停时切换音乐 |
| START | 开始、暂停／继续 |

标题画面用摇杆左右选择赛道、上下选择模式。可选择单场比赛、四站锦标赛或计时挑战。单场与锦标赛支持 1–2 名玩家及 6 名电脑对手；计时挑战只使用 1P，不设电脑对手或道具。每场比赛三圈；注意赛道检查点、路外减速和对手道具。跟随前车保持同车道约 1.2 秒可获得尾流冲刺；漂移火花和蓄力条显示当前加速等级。道具按名次分配不同概率；前排更多防御，后排更多冲刺与攻击。持物可挡一次后方脉冲，电视会提示来袭与拦截。最佳计时与音乐偏好保存在电视本机。具体模式、计分和重建范围见[游戏说明](docs/reference.md)。

## 画面

截图来自实际游戏页面在 Chromium 中的渲染，使用模拟房间桥接，不是电视实机截图。

![海岸卡丁车 TV](docs/coast-kart-tv.png)

![Controller](docs/controller.png)

![Floating joystick](docs/controller-active.png)

## 存档、房间与退出

比赛不会跨退出保存；最佳计时与偏好会保留。

最多两部手机通过本地 HTTP/WebSocket 房间连接，每次启动产生新的端口与随机令牌。触控中断、失焦和断线会释放按键；正在参与游戏的手机断线会自动暂停，重连恢复自动暂停，手动暂停仍然保留。

按电视 Home 离开或确认退出，会关闭房间、断开手机、释放线程与唤醒锁、销毁 WebView 和音频并结束应用进程。重新打开后请扫描新的二维码。

## 开发与实现范围

地图、画面、角色与合成音乐均独立制作，不包含任天堂软件、ROM 或提取素材，也不代表 Switch 商业原作的完整内容。具体实现与差异见[参考说明](docs/reference.md)。项目自写代码和素材使用 [MIT](LICENSE)。

```sh
node --test resource/apps/coast-kart/tests/*.test.cjs
node resource/apps/coast-kart/tests/controller.mjs
node resource/apps/coast-kart/tests/combat.mjs
node resource/apps/coast-kart/tests/compatibility.mjs
node resource/apps/coast-kart/tests/capture.mjs

cd resource/launcher/puretv
./gradlew :coast-kart:assembleRelease :coast-kart:testDebugUnitTest :coast-kart:lintDebug :coast-kart:verifyReleaseSize
```

浏览器测试使用 desktop 的 npm 依赖和 Chromium，可通过 `CHROMIUM_PATH` 指定浏览器。尚未完成电视／手机实机验证。

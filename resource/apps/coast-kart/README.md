# 海岸卡丁车 TV

## Android 0.5.5 · 手柄与手机连接

<!-- apk-resource:start -->
[下载签名 APK](coast-kart-0.5.5.apk?raw=1) · [校验值](SHA256SUMS.txt) · [安装包与源码](resource.json)
<!-- apk-resource:end -->

可用键盘、pureTV Wi-Fi 手柄，或用同一局域网内的手机扫描电视房间二维码。连接标识区分玩家，连接与断开时保留游戏画布尺寸。[连接手柄指南](../../../docs/guide/README.md#安装游戏与连接手柄)

此签名 APK 已从 0.5.4 在 Android TV 模拟器完成覆盖安装。原版手柄 SDK 通过 9 项检查，实际发出的 109 条消息全部收到同序号确认。[游戏截图](docs/releases/0.5.5/gameplay.png) · [Android 玩法录像](docs/releases/0.5.5/gameplay.mp4?raw=1) · [验证记录与测试范围](docs/releases/0.5.5/verification.json)

[中文](README.md) · [English](README.en.md)

<!-- controller-client-status:start -->
## 历史版本 0.5.4 · 手柄连接标识

<!-- previous-apk-resource:start -->
[下载签名 APK](coast-kart-0.5.4.apk?raw=1) · [校验值](SHA256SUMS.txt) · [签名与来源](resource.json) · [源码](src/) · [图标](logo.svg)
<!-- previous-apk-resource:end -->

Android **0.5.4 / versionCode 6**：手柄连接后，侧边显示手柄图标、玩家席位（按游戏人数显示 1P/2P）和设备完整连接 ID；断开后隐藏。默认 TCP 端口仍为 **63485**。当前手柄固件未上报 RSSI，因此不显示信号强弱。

[连接截图](docs/releases/0.5.4/connected.png) · [连接状态专项录像](docs/releases/0.5.4/controller-status.mp4?raw=1) · [版本验证](docs/releases/0.5.4/verification.json) · [20 款更新记录](../../../docs/controller-client-status/README.md)

安装包沿用原发布证书。本轮在 Android TV 模拟器中验证连接身份、断开／重连状态及同证书覆盖安装；截图和录像记录菜单中的连接状态专项，没有重做完整玩法验收。未改规则模型按精确哈希复用历史依据，旧版报告继续保留。尚未验证实体电视、手机、ESP32 或带已有存档的升级与数据保留。

![Android 0.5.4 手柄已连接及完整 ID](docs/releases/0.5.4/connected.png)
<!-- controller-client-status:end -->

一款参考现代卡丁车竞速玩法、独立制作的电视游戏。采用实际 WebGL 1 三维场景与跟随镜头，包含四条原创赛道、三级漂移加速、尾流超车、道具、电脑对手和手机扫码双人分屏。

当前版本 **0.5.5**，适用于 Android 8.0 及以上电视，包名 `com.ecojust.coastkarttv`。
<!-- visual-release:start -->
## 历史：0.5.2 视觉更新与验证

以下保留 **0.5.2** 发布时的视觉更新、源码和验收记录；这些旧版结果不代表本轮 pureTV 手柄更新已经通过验收。当时沿用 0.5.0／0.5.1 的 pureTV 发布证书。逐款改动、检查范围和实机验证状态见[0.5.2 视觉更新记录](../../../docs/game-visuals-0.5.2.md)。

该次视觉更新以《Mario Kart 8 Deluxe》的三维竞速表现为参考，用 WebGL 1 实际 3D 场景重建赛车、赛道与镜头。赛道和角色由本项目独立制作，现有漂移、道具、竞赛和局域网双人流程保留，专项检查结果见下文。这不是商业原作的完整移植。

具体还原范围见[参考说明](docs/reference.md)。3D 渲染使用随应用本地打包的 Three.js r124（MIT），无需 CDN。

<!-- final-verification -->
当时冻结源码 0752b658aecbb1322cb7294e3176500639db1b54 已通过 Android CI 40843467072：280 项模型／渲染行为回归、36 个兼容场景、131 个手柄场景及 18 个双语集成场景；Cozy Island 输入运行时 9／9、两款 WebGL 1 渲染脚本及 Coast Kart 道具攻防专项也通过。Android 构建、lint、体积和 staging 成功，15 个模块实际执行 JUnit 任务（含全部 9 款游戏），不推断未输出的 JUnit 用例数。签名运行 40846148068 已核验九款 APK 的源码资源、签名与资源目录。Chrome 61 语法和现代 Chromium 旧 API 模拟不等于真实旧 WebView 验收；当时尚未测试真实电视／手机、设备 FPS、覆盖安装和数据保留。

该次发布前的 WebGL 1 专项已验证四种赛道主题、双人视口、资源复用、无 WebGL 兼容画面、上下文丢失／恢复、无实例化扩展的三维路径和退出释放；连续分屏绘制保持 25 份几何、5 份纹理。使用 Chromium 的 ANGLE／SwiftShader 软件渲染，不能据此推断电视 GPU 帧率。当时冻结源码 0752b65 已通过 Android CI 40843467072 的完整浏览器与原生检查，包括近场对手车体避开追车镜头的回归。真实电视画质、FPS、温度与长时间运行未测试。
<!-- visual-release:end -->

## 历史：0.5.1 还原度升级

加入持物防御、前后投掷、名次道具策略及来袭提示，修复高速与终点线碰撞。

沿用 0.5.0 证书，可直接覆盖更新；0.5.1 的核对结果与剩余差距见[还原度复核](../../../docs/game-fidelity-0.5.1.md)。

## 安装与签名

历史 0.5.3 已沿用 0.5.0／0.5.1／0.5.2 的 pureTV 统一发布证书，并在 Android TV 模拟器完成 0.5.2 → 0.5.3 覆盖安装；未验证带存档升级及数据保留。使用旧证书的 0.4.x 及更早安装不能直接覆盖，请先备份可导出的数据再卸载；卸载会清除本机存档和记录，本项目没有跨证书自动迁移工具。

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

## 历史画面（0.5.2）

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

## pureTV Wi-Fi 手柄

电视与手柄连接同一局域网，打开游戏后按手柄 GPIO 23 搜索键。界面显示真实地址、端口和发现状态；默认 TCP 端口为 **63485**，仅首次被占用时选备用端口，临时失焦期间保持已选端口；按 Home 或切换应用退出会关闭服务。同网只运行一个游戏接收服务时才能自动选中。

START 开始、暂停或继续。左右键转向，下键刹车／倒车；A / X 使用道具；B 按住漂移；Y 在标题页切换人数、暂停时切换音乐。 手机扫码、遥控器和键盘仍可使用；此游戏的 Y 是 SELECT 功能，X 与 A 为同一动作。

断线、手柄会话替换或控制来源切换会取消旧输入并暂停。重新连接后先松开按键，再按 START 继续，保持的按键不会自动触发操作。双人模式可连接两只独立 Wi-Fi 手柄，按各游戏标题页选择人数。

<!-- controller-client-status-history:start -->
<details>
<summary>历史 0.5.3 安装包与验收记录</summary>

以下为旧版发布记录，其测试与画面不代表本次连接 ID 界面验收。[原提交中的完整说明](https://github.com/ecojust/pureTV/blob/9af9f197855eb7a0ce7174c0e6295c8974b3250d/resource/apps/coast-kart/README.md)。

[下载 APK](coast-kart-0.5.3.apk?raw=1) · [校验值](docs/controller-status-baseline/0.5.3/SHA256SUMS.txt) · [签名及构建来源](docs/controller-status-baseline/0.5.3/resource.json) · [源码](src/) · [64×64 SVG 图标](logo.svg)

APK 已使用原 pureTV 发布证书签名，已在 Android TV 模拟器完成 0.5.2 → 0.5.3 覆盖安装；未验证带存档升级及数据保留。若设备中存在使用旧证书的同包应用，Android 无法直接覆盖安装；需先备份数据并卸载旧包。

## 0.5.3 pureTV 手柄更新

历史版本 **0.5.3 / versionCode 5** 新增 pureTV Wi-Fi 手柄输入，默认 TCP 端口 **63485**，保留扫码手机手柄和电视遥控器。APK 已沿用原发布证书正式签名。Android TV 模拟器中的实际 APK 手柄验收已通过 9/9，覆盖 START、实际玩法输入、暂停恢复、断线重连和同序号 ACK。

实际结果和限制见[当时 20 款游戏验收记录](../../../docs/readme-controller-support/README.md)及[发布进度](../../../docs/readme-controller-support/rollout.json)。下文保留的旧版 CI、录像和截图均为历史依据。

该历史版本验收资源：[菜单截图](docs/releases/0.5.3/menu.png) · [实际 APK 运行录像](docs/releases/0.5.3/gameplay.mp4?raw=1) · [验证记录](docs/releases/0.5.3/verification.json)。截图和录像来自 Android TV 模拟器，未做实体电视测试。完整归档、具体检查范围与限制见验证记录。

</details>
<!-- controller-client-status-history:end -->

# 极品二手车

[中文](README.md) · [English](README.en.md)

**极品二手车 / Used Car Racing TV** 是一款原创三维赛车游戏。开局随机获得车辆和车况，检车台展示车型、动力、重量、驱动形式以及故障说明；比赛支持一人或两人手机操控，其余车位由 AI 补齐，总计六车同场。

首版 **0.1.0**，包名 `com.ecojust.usedcartv`，适用于 Android 8.0 及以上电视。APK、签名和真实截图会在成功构建、校验后加入本目录。

## 开始比赛

1. 手机和电视连接同一局域网，在电视上打开游戏。
2. 扫描电视房间二维码；每位玩家使用一部手机，最多两人。
3. 在检车台查看随机车辆及故障，选择赛道和人数，再开始比赛。
4. 手机左侧大区域转向，右侧三分之一分为上方油门、下方刹车；油门、刹车可与转向同时操作。操作区禁止文字选择和长按菜单。

检车台按 SELECT 重新抽取车辆。赛中短按 SELECT 切换追车／引擎盖镜头；车速低于 **1.2 m/s** 时，长按 SELECT 约 **0.8 秒** 切换 D 前进／R 倒车，然后使用油门驱动。START 开始或暂停比赛。

键盘调试：1P 使用左右方向键转向、Z 油门、X 刹车、Enter 开始／暂停；Shift 短按切镜头，低速长按切 D/R，R 键也可在低速换向。2P 使用 A/D 转向、W 油门、S 刹车。

刹车采用**虚拟踏板力**：持续按住逐渐蓄力，松开快速释放。抽到“脆弱刹车踏板”的车辆在模拟踏板力达到 **1600 N** 时断裂，本场比赛中永久失去脚刹；画面显示受力和故障状态。普通手机不测量真实脚力或手指压力，这个数值由游戏输入与模型计算。

## 赛车与赛道

六类原创二手车外形覆盖紧凑车、轿车、跑车、旅行车、美式肌肉车和拉力车；车型、驱动形式、扭矩、质量、轮胎和刹车条件共同影响驾驶。轮毂、轮胎、灯组、玻璃、内饰、后视镜及车身磨损由本地三维模型呈现。

三条闭合赛道分别为霓虹港湾、峭壁山路与太阳能荒漠高速，包含弯道、高差、护栏、道路标识及独立环境主题。采用实际 WebGL 1 三维渲染，本地打包 Three.js，无需网络下载图形资源。

## 操控模型

以固定小时间步更新车辆，模拟发动机扭矩和转速、自动变速箱、轮胎侧偏与摩擦圆抓地限制、制动和载荷转移、气动阻力及机械故障。转向输入、车速与抓地力会共同决定车辆响应，见[设计与物理说明](docs/design.md)。

这是面向手机触控与电视的简化车辆动力学游戏；模型测试和浏览器渲染不等同于真实车辆标定，也不能证明电视 GPU 性能。实机测试记录应以发布后的验证结果为准。

## 构建与验证

```sh
node --test resource/apps/used-car-racing/tests/*.test.cjs
node resource/apps/used-car-racing/tests/compatibility.mjs
node resource/apps/used-car-racing/tests/rendering.mjs
node resource/apps/used-car-racing/tests/controller.mjs
node resource/apps/used-car-racing/tests/integration.mjs

cd resource/launcher/puretv
./gradlew :used-car-racing:assembleRelease :used-car-racing:testDebugUnitTest :used-car-racing:lintDebug :used-car-racing:verifyReleaseSize
```

浏览器检查使用 `desktop/` 的 npm 依赖，可通过 `CHROMIUM_PATH` 指定 Chromium。`USED_CAR_UI_CAPTURE_DIR` 指定真实页面截图输出目录。发布使用统一 pureTV v2 证书及独立版本标签 `android-used-car-v0.1.0`。

原创代码、车身模型、赛道与合成音效使用 [MIT](LICENSE)；Three.js 保留其[上游 MIT 许可](src/main/assets/THREE-LICENSE.txt)。游戏不包含商业赛车游戏的 ROM、车型资产或地图提取文件。[64×64 SVG 图标](logo.svg)由本项目绘制。

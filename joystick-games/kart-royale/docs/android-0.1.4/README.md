# Kart Royale 0.1.4 · Android TV 手柄验收

Android TV 14（API 34、1280 × 720）上安装了同一份 0.1.4 签名 APK。原 pureTV TCP SDK 在默认端口与回退端口各通过 58 项检查，覆盖九键、选车、起跑、加速、转向、漂移、道具、暂停、断线和明确恢复。[签名 APK](../../kart-royale-0.1.4.apk) · [核验数据](verification.json) · [原始签名收据](signing-receipt.json)

| 场景 | 端口 | 唯一匹配的 SDK 消息与 ACK | 取得可操作菜单 | 加速后速度 | 原始报告 |
| --- | ---: | ---: | ---: | ---: | --- |
| 系统服务稳定后的首次默认端口 | 63485 | 922 / 922 | 24.1 秒 | 6.667 m/s | [58 项](https://github.com/ecojust/pureTV/blob/2b458d7349455282287f2f59c666412d91673e12/evidence/joystick-android-runtime-kart-royale/kart-royale-normal/report.json) |
| 默认端口被占用后的回退 | 35045 | 849 / 849 | 19.5 秒 | 8.128 m/s | [58 项](https://github.com/ecojust/pureTV/blob/f42bad392bf2444cfe4573653805d83f2f8a6a90/evidence/joystick-android-runtime-kart-royale/kart-royale-occupied/report.json) |

菜单时间从启动游戏前建立观察端口算起。首次默认端口运行在安装游戏前，先只读观察新建模拟器的 Google 系统服务。字体服务进程在 16.10 秒变更，77.11 秒时确认稳定。游戏随后首次启动，取得可操作菜单、原赛道和移动中的赛车。该模拟器的 WebView 报告 WebGL 2 和 SwiftShader 5。[启动前系统记录](https://github.com/ecojust/pureTV/blob/2b458d7349455282287f2f59c666412d91673e12/evidence/joystick-android-runtime-kart-royale/kart-royale/boot-services.json)

两个场景均核对原数据包中的序列号、按键和对应 ACK，油门后车辆世界坐标发生变化。另一次独立回退端口 37889 收到 880 条唯一确认。调换顺序时，第二轮默认端口 63485 收到 884 条唯一确认，两轮各通过 58 项。顺序对照和首次开机遇到 Google 字体服务退出的记录见[Android TV 实测](../android-tv-20261120.md)。

## 原始驾驶画面

两张 1280 × 720 原图均可见红白玩家车辆、前方对手、赛道起跑线、场边观众、第一圈 HUD 和连接中的手柄。默认端口截图显示第五名，回退端口截图显示第四名。[默认端口原图](https://raw.githubusercontent.com/ecojust/pureTV/2b458d7349455282287f2f59c666412d91673e12/evidence/joystick-android-runtime-kart-royale/kart-royale-normal/driving-checkpoint.png) · [端口占用原图](https://raw.githubusercontent.com/ecojust/pureTV/f42bad392bf2444cfe4573653805d83f2f8a6a90/evidence/joystick-android-runtime-kart-royale/kart-royale-occupied/driving-checkpoint.png)

![默认端口进入比赛后加速](race-normal.png)

![端口占用后在相同赛道驾驶](race-occupied.png)

APK 为 1,225,991 字节，SHA-256 为 `4783d3117050c20e6f56c7117c358f7ed2dba8049c7642aa8660dc7df950fb70`。包名为 `com.ecojust.joystick.kartroyale`，versionCode 为 5，最低 API 26，目标 API 35。十个 APK 资产、五个冻结分发文件、APK 的 V1/V2/V3 签名和已发布 0.1.3 的签名证书均已复核。实体电视、实体 ESP32 手柄和全程比赛仍待实测。[冻结源码](https://github.com/ecojust/pureTV/commit/a10c8c82b204faf151001beaeed7d3aa85a751e0) · [签名构建](https://github.com/ecojust/pureTV/actions/runs/44692259891) · [上一版 0.1.3 原始验收](../android-delivery/README.md)

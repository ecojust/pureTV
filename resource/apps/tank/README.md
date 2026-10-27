# Tank TV · 坦克前线

<!-- apk-resource:start -->
[下载 APK](tank-0.1.0.apk?raw=1) · [校验值](SHA256SUMS.txt) · [签名及构建来源](resource.json) · [源码](src/)

此目录内 APK 使用 pureTV 发布证书签名。
<!-- apk-resource:end -->

[中文](README.md) · [English](README.en.md)

在电视上守住基地，用手机当手柄。Tank TV 是一款原创的经典坦克防守游戏，支持 1–2 人在同一局域网合作游玩。电视显示战场和房间二维码，手机无需安装应用，扫码后在浏览器中加入房间。游戏画面、关卡和手机控制页均随 APK 提供，游玩不依赖互联网服务。

适用于 Android 8.0 及以上电视，包名 `com.ecojust.tanktv`，版本 `0.1.0`。电视界面跟随系统语言，手机界面跟随浏览器语言，支持中文和英文。本项目使用原创画面和实现，不包含商业坦克游戏的 ROM、素材或商标。

## 开始游玩

1. 使用 pureTV 管理器或 ADB 将 APK 安装到电视上，打开 Tank TV。
2. 将手机和电视连接到同一个局域网。电视可以连接网线；手机应连接同一路由器提供的 Wi-Fi。
3. 扫描电视右侧二维码，用手机浏览器打开房间地址。第一部手机加入 P1，第二部手机加入 P2。
4. 按手机上的 **A** 开始游戏。建议横屏使用；竖屏也可以操作。

| 控件 | 功能 |
| --- | --- |
| 左侧摇杆 | 控制坦克移动及朝向 |
| 右侧 A | 开始游戏、射击；按住可以连续射击 |
| 右侧 B | 启用短时护盾，冷却后可再次使用 |
| 电视返回键 | 退出游戏确认 |

保护基地，清除不断出现的敌方坦克。砖墙可以被炮弹破坏，钢墙和水域限制行进路线，树木提供视觉掩护；坦克被击毁后消耗生命并重生。关卡中两位玩家共享战场、各自控制一辆坦克。

![实际游戏页面在 Chromium 中渲染，使用模拟房间连接；非电视实机截图](docs/tank-tv.png)

![手机控制器](docs/controller.png)

## 局域网连接

房间由电视上的应用提供 HTTP 和 WebSocket 服务，监听启动时分配的端口。二维码包含当前电视地址、端口和随机房间令牌；每次启动应用以电视当前显示的二维码为准。手机控制请求不会发送到 pureTV 的云端服务器。

最多同时接入两名玩家。短暂断线会清空操作输入，手机恢复连接后尝试回到原来的玩家位置，避免坦克持续移动或开火。手机切到后台或锁屏时也会释放摇杆和按钮。按 Home 离开应用会关闭房间；确认退出游戏时，会关闭房间服务、断开所有手机连接、销毁游戏页面并结束本应用进程。再次打开会创建新房间。

扫码后无法连接时，先检查手机与电视是否在同一局域网，以及路由器是否启用了访客网络或 AP 隔离。二维码中的本地 HTTP 地址需要由能够访问局域网的手机浏览器打开；应用没有公网中转功能。

## 构建与验证

从仓库根目录执行：

```bash
node --test resource/apps/tank/tests/game.test.cjs
npm ci --prefix desktop
cd desktop && npx playwright install chromium && cd ..
node resource/apps/tank/tests/controller.mjs
node resource/apps/tank/tests/capture.mjs
cd resource/launcher/puretv
./gradlew :tank:assembleDebug :tank:testDebugUnitTest :tank:lintDebug :tank:verifyReleaseSize
```

APK 输出在 `resource/apps/tank/build/outputs/apk/`。Release 开启代码与资源压缩，体积上限为 5 MiB；正式资源 APK 使用 pureTV 发布证书签名。Android 测试验证房间服务及生命周期，Node 测试验证游戏规则，浏览器测试验证手机触控。

设置 `TANK_UI_CAPTURE_DIR` 后运行 `tests/capture.mjs`，可导出中英文游戏页面预览。这些图片由随 APK 打包的真实页面在 Chromium 中渲染，原生桥接使用测试房间数据，不代表电视实机性能或真实手机网络时延。正式更新可使用 Android CI 的资源暂存流程，再运行 `tools/prepare-app-resources.py --app tank`；见[资源维护说明](../../../docs/resource-maintenance.md)。

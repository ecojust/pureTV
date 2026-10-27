# Jackal TV · 赤色要塞

[中文](README.md) · [English](README.en.md)

驾驶吉普车深入敌军阵地，炸开囚室，营救人质，再将他们送往直升机撤离点。Jackal TV 是一款向经典红白机赤色要塞致敬的原创像素游戏，支持 1–2 人局域网合作。电视显示纵向卷轴战场和房间二维码，手机扫码后在浏览器里显示左侧摇杆、右侧 A/B 按钮，无需安装手机应用。

适用于 Android 8.0 及以上电视，包名 `com.ecojust.jackaltv`，版本 `0.1.0`。游戏采用 256×240 原生像素画布，放大后保留像素边缘；关卡、像素图形、音效和控制页均随 APK 提供，游玩无需互联网。游戏没有使用原作 ROM 或提取的图像、音频资源。电视界面跟随系统语言，手机界面跟随浏览器语言，支持中文和英文。

## 开始游玩

1. 使用 pureTV 管理器或 ADB 将 APK 安装到电视，打开 Jackal TV。
2. 将手机与电视连接到同一局域网。电视可使用网线，手机连接同一路由器的 Wi-Fi。
3. 扫描电视右侧的房间二维码。第一部手机加入黄色吉普车 P1，第二部手机加入绿色吉普车 P2。
4. 按 **A** 出发。手机横屏操作更方便，竖屏也可以使用。

| 控件 | 功能 |
| --- | --- |
| 左侧摇杆 | 八方向驾驶，改变吉普车朝向 |
| 右侧 A | 开始游戏、机枪射击；按住连续射击，枪口始终朝北 |
| 右侧 B | 沿吉普车朝向投掷榴弹；按住重复投掷 |
| 电视返回键 | 显示退出确认 |

机枪适合清除步兵，吉普车也能直接碾压步兵；榴弹可摧毁装甲目标和囚室。炸开囚室后，靠近人质即可接上车，每辆吉普车最多搭载 8 人。停在直升机停机坪内会逐个卸载人质，每救出一人获得 250 分；累计送达 3 人、6 人后，榴弹分别升级。榴弹无需补充弹药，两次投掷之间有短暂冷却。

战役共有丛林、沙漠、港口三关。沿道路向北推进，通过桥梁跨越水域，击败各关末尾的要塞首领后进入下一关，完成第三关获胜。两名玩家共享画面，每人有三条生命；重生后获得短暂无敌保护。

![实际游戏页面在 Chromium 中渲染，使用模拟房间连接；非电视实机截图](docs/jackal-tv.png)

![手机控制器](docs/controller.png)

## 房间与退出

应用在电视上提供 HTTP 和 WebSocket 服务，端口在启动时分配，二维码中包含本次房间的随机令牌。控制请求只在手机与电视之间传输，不经过云端服务器。房间最多容纳两名玩家，重新启动应用后请扫描新的二维码。

手机短暂断线、切到后台或锁屏时，会释放摇杆和按钮，避免吉普车持续移动或开火。断线后手机会尝试回到原玩家位置；全部控制器断开时，游戏自动暂停。按 Home 离开应用会关闭房间；确认退出时，会断开所有手机连接，关闭监听端口与服务线程，销毁游戏页面并结束本应用进程。再次打开应用会创建新房间。

扫码后无法连接时，检查手机与电视是否在同一局域网，以及路由器是否启用了访客网络或 AP 隔离。此应用不提供公网中转，手机浏览器需要能访问电视的局域网 HTTP 地址。

## 构建与验证

从仓库根目录执行：

```bash
node --test resource/apps/jackal/tests/game.test.cjs
npm ci --prefix desktop
cd desktop && npx playwright install chromium && cd ..
node resource/apps/jackal/tests/controller.mjs
node resource/apps/jackal/tests/capture.mjs
cd resource/launcher/puretv
./gradlew :jackal:assembleDebug :jackal:testDebugUnitTest :jackal:lintDebug :jackal:verifyReleaseSize
```

APK 输出在 `resource/apps/jackal/build/outputs/apk/`。Release 开启代码和资源压缩，体积上限为 5 MiB；正式资源 APK 使用 pureTV 发布证书签名。Android 测试验证房间服务与生命周期，Node 测试验证游戏规则，浏览器测试验证控制器和游戏页面。

设置 `JACKAL_UI_CAPTURE_DIR` 后运行 `tests/capture.mjs`，可导出中英文游戏与手机页面预览。截图来自实际打包页面在 Chromium 中的渲染，使用模拟原生桥接与测试房间，不代表电视实机性能或真实手机网络时延。资源更新使用 Android CI 暂存流程，再运行 `tools/prepare-app-resources.py --app jackal`；见[资源维护说明](../../../docs/resource-maintenance.md)。

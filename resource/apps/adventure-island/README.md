# 冒险岛 TV

[中文](README.md) · [English](README.en.md)

以《冒险岛 1》为参考的独立重写：8 个区域、32 关，森林、洞穴、海岸与冰原；包含体力消耗、水果、斧头、火球、滑板、隐藏蛋和区域首领。

当前版本 **0.1.0**，适用于 Android 8.0 及以上电视，包名 `com.ecojust.adventureislandtv`。电视显示游戏与房间二维码，手机扫码作为手柄。

<!-- apk-resource:start -->
[下载 APK](adventure-island-0.1.0.apk?raw=1) · [校验值](SHA256SUMS.txt) · [签名及构建来源](resource.json) · [源码](src/) · [64×64 SVG 图标](logo.svg)

此目录内 APK 使用 pureTV 发布证书签名。
<!-- apk-resource:end -->

## 开始游玩

1. 手机和电视连接同一局域网，在电视上打开游戏。
2. 手机浏览器扫描二维码加入。单人一部手机；双人各用一部手机。
3. 标题画面按 SELECT 选择人数，按 START 开始。
4. 左侧摇杆默认隐藏，手指按下的位置就是中心；拖动控制，松开停止并隐藏。右侧 A、B 可以与摇杆同时使用。

| 控件 | 功能 |
| --- | --- |
| 左侧浮动摇杆 | 左右移动 |
| A | 跳跃；按住可以跳得更高 |
| B | 投掷武器／加速跑 |
| SELECT | 标题切换人数；暂停时开关音乐 |
| START | 开始、暂停／继续 |
| 电视返回键 | 退出确认 |

双人模式采用**轮流游玩**：各自保留生命、积分和关卡，失命后交给下一名玩家。手机会显示当前轮次，等待中的手机不会控制当前角色。当前操作者断线会自动暂停，重新连接后继续；手动暂停不会被重连取消。最高分和音乐偏好保存在电视本机。

## 画面

以下截图来自实际游戏页面在 Chromium 中的渲染，房间连接由测试桥接模拟，不是电视实机截图。

![游戏画面](docs/adventure-island-tv.png)

![手机控制器](docs/controller.png)

![拖动时显示浮动摇杆](docs/controller-active.png)

## 房间与退出

最多两部手机通过本地 HTTP/WebSocket 服务连接；二维码包含本次启动的端口和随机令牌。游戏不依赖云端服务。手机失焦、触控中断或断线会释放按键。

按电视 Home 离开或确认退出，会关闭房间、断开手机、释放线程与唤醒锁、销毁 WebView 和音频并结束应用进程。重新打开需扫描新的二维码；本局进度不会跨退出保存。

## 实现与验证

关卡路线、画面、图标、音效和音乐由项目独立制作，未包含原作 ROM、提取图像或原声音轨。规则和地图的具体重建范围见[参考说明](docs/reference.md)；不宣称与原作逐帧或逐格一致。项目自写代码和素材使用 [MIT](LICENSE)。

```sh
node --test resource/apps/adventure-island/tests/*.test.cjs
node resource/apps/adventure-island/tests/controller.mjs
node resource/apps/adventure-island/tests/compatibility.mjs
node resource/apps/adventure-island/tests/capture.mjs

cd resource/launcher/puretv
./gradlew :adventure-island:assembleRelease :adventure-island:testDebugUnitTest :adventure-island:lintDebug :adventure-island:verifyReleaseSize
```

浏览器测试使用 desktop 的 npm 依赖和 Chromium，可通过 `CHROMIUM_PATH` 指定浏览器。尚未完成电视／手机实机验证。

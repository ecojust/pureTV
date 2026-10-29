# 俄罗斯方块 TV

[中文](README.md) · [English](README.en.md)

独立重写经典红白机俄罗斯方块：10×20 棋盘、七种四连块、经典方向旋转、软降、消行计分、等级加速和 NEXT 预览。

当前版本 **0.1.0**，适用于 Android 8.0 及以上电视，包名 `com.ecojust.tetristv`。电视显示棋盘与房间二维码，手机扫码作为手柄；不需要导入 ROM。

<!-- apk-resource:start -->
[下载 APK](tetris-0.1.0.apk?raw=1) · [校验值](SHA256SUMS.txt) · [签名及构建来源](resource.json) · [源码](src/) · [64×64 SVG 图标](logo.svg)

此目录内 APK 使用 pureTV 发布证书签名。
<!-- apk-resource:end -->

下述玩法与手柄升级属于源码改动；链接中的 0.1.0 APK 仍是此前发布版本，需要重新构建才能包含本次改动。


## 开始游玩

1. 将手机和电视连接同一局域网，在电视上打开游戏。
2. 手机浏览器扫描电视二维码；单人一部手机，双人分别扫描加入。
3. 在标题画面按 SELECT 选择人数，按 START 开始。双人模式需要两名玩家都连接。
4. 左侧摇杆默认隐藏，按下的位置就是本次中心；拖动控制，松开停止并隐藏。右侧屏幕三分之一都是动作区，可在区域内任意位置操作。START／SELECT 独立位于左侧底部；操作区禁止文字选择和长按菜单。

| 控件 | 功能 |
| --- | --- |
| 左侧浮动摇杆 | 左右移动，下拉软降；标题左右选等级；A-TYPE 上下跨 10 级，B-TYPE 上下选障碍高度 |
| 右侧下半区 A | 顺时针旋转；标题切换 A-TYPE／B-TYPE |
| 右侧上半区 B | 逆时针旋转；标题切换 A-TYPE／B-TYPE |
| SELECT | 标题画面切换单／双人；游戏或暂停时开关音乐 |
| START | 开始、暂停／继续 |
| 电视返回键 | 退出确认 |

保留经典无踢墙旋转和等级速度规则；没有现代 HOLD、幽灵方块或一键硬降。A-TYPE 标题可选 0–19 起始等级；新增 B-TYPE 固定等级挑战，选择 0–9 级和 0–5 档初始障碍高度，消除 25 行即通关。B-TYPE 双人使用相同障碍布局，一人通关后另一人可继续。双人模式提供两块独立棋盘与相同的方块序列，分别消行、计分，不发送垃圾行；这是新增的局域网比拼模式。

最高分保存在电视本机，覆盖更新可保留；卸载会清除应用数据。

## 画面

以下截图由实际游戏页面在 Chromium 中渲染，使用模拟房间连接；不是电视实机截图。

![游戏画面](docs/tetris-tv.png)

![手机控制器：默认隐藏摇杆](docs/controller.png)

![手机控制器：拖动时显示摇杆](docs/controller-active.png)

## 房间与退出

最多两部手机通过本地 HTTP/WebSocket 房间连接。二维码包含本次启动的端口与随机房间令牌，不经过云端中转。手机切到后台、触控中断或断线会释放按键；参与游戏的玩家断线时暂停棋盘，重连后恢复。

按电视 Home 离开会关闭房间；确认退出会关闭端口与服务线程、断开手机、销毁 WebView 和音频并结束应用进程。重新打开后请扫描新的二维码。

## 构建与验证

```sh
# 仓库根目录
node --test resource/apps/tetris/tests/*.test.cjs
node resource/apps/tetris/tests/controller.mjs
node resource/apps/tetris/tests/compatibility.mjs
node resource/apps/tetris/tests/capture.mjs

cd resource/launcher/puretv
./gradlew :tetris:assembleRelease :tetris:testDebugUnitTest :tetris:lintDebug :tetris:verifyReleaseSize
```

浏览器测试需要 desktop 的 npm 依赖及 Chromium，可用 `CHROMIUM_PATH` 指定浏览器。Gradle 默认生成未签名 release APK，公开目录中的安装包使用 pureTV 发布证书签名。

玩法依据与独立实现的差异见[参考说明](docs/reference.md)。画面、图标、音效和 8-bit 配乐由项目独立制作，不包含原作 ROM、图像提取或原声音轨；项目自写代码与素材使用 [MIT](LICENSE)。尚未完成电视／手机实机及逐帧对照验证。

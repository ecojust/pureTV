# 十二款资源游戏的电视扫码与手机操作验收

[逐款实测记录](report.json) 包含手机加入前、加入后和游玩中两个视口的画布位置、连接卡位置、游戏输入前后的原模型值及断开后的席位状态。视口为 960 × 540 和 1280 × 720。三维关卡的冷启动和正常游戏操作另记录在每款的 `gameplayViewport` 字段。电视游戏和手机页分别在桌面 Chromium 的独立浏览器配置中运行，三维游戏沿用各自的原渲染器。每款使用的指针事件见 `inputContact`。

测试从电视原游戏页面显示的二维码读取像素，用 ZXing 解码，随后在手机视口打开这一地址。游戏原有 Java `LanGameServer` 通过套接字提供原手机网页、WebSocket 连接、输入快照与房间状态。游戏通过平时使用的 Android JavaScript 接口读取这些快照。测试替身仅将接口转发到桌面 JVM，并使用与 Android 相同的 ZXing 参数生成二维码，PNG 编码使用 Java ImageIO。游戏模型和游戏时钟均由游戏自己的循环运行。这里的结果覆盖桌面 JVM 和双浏览器，独立 Android 主机测试见各项目的发布收据。实体电视、实体手机摄像头、ESP32 搜寻、Used Car 的选配 TLS 和陀螺仪均未在本套件中实测。

[原始资源和源码指纹](source.json) 给出基线 APK、实际加载的源码覆盖项和房间服务器。新版签名 APK 的所有 585 个资源条目都与测试时读取的目录按 SHA-256 比对。文件名、签名包 SHA-256 与每款相符的条目数见[签名包资源对照](signed-assets.json)。以下重跑直接从这些签名包提取完全相同的资源。

Neon Rush 的 Android 菜单会自动显示二维码。另一次检验从真实屏幕裁下 122 × 122 像素，在另一浏览器进入该房间，再从手机按 START 验证原比赛界面会收起面板。见[屏幕扫码复验](visible-qr-panel.json)。

## 重跑

需要 Python 3.11 或以上、JDK 17 或以上、Node、Playwright、Chromium、`org.json:json:20240303` 与 `com.google.zxing:core:3.5.3`。从本目录运行。每份签名 APK 放在 `$QA_SIGNED_APKS/<slug>/<signed-assets.json 中的原文件名>`。工作目录用于提取资产、编译测试工具和保存本次输出。

```sh
export QA_REPO=/path/to/pureTV
export QA_SIGNED_APKS=/path/to/signed
export QA_WORKDIR="$(mktemp -d)"
export QA_JSON_JAR=/path/to/json-20240303.jar
export QA_ZXING_JAR=/path/to/core-3.5.3.jar
export QA_CHROMIUM=/path/to/chromium
export QA_PLAYWRIGHT=/path/to/node_modules/playwright

python3 prepare.py
javac -cp "$QA_JSON_JAR:$QA_ZXING_JAR" -d "$QA_WORKDIR/classes" \
    ActualPhoneRoom.java Qr.java $(find "$QA_WORKDIR/sources" -name LanGameServer.java)

QA_2D=1 node phone-room.cjs tetris super-mario adventure-island bomb-jack jewel jackal tank
QA_2D=1 QA_TOUCH=1 node phone-room.cjs tower-overlap
node phone-room.cjs alien-shooter used-car-racing neon-rush
LP_NUM_THREADS=2 QA_MESA=1 node phone-room.cjs coast-kart
QA_QR_PANEL=1 node phone-room.cjs neon-rush
```

各游戏逐一运行。结果写入 `$QA_WORKDIR/results/<slug>.json`，操作证据保存在 `assertions` 中。首次图形初始化可能耗时较长。游戏进入标题或车库后测量两种视口。在接受真实启动输入后，检查正常玩法值，并确认可见手机席位卡与游戏画布无相交区域。

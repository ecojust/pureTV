# Coast Kart 房间与道具输入复验

Coast Kart 修复了两处输入时序问题。游戏模型或第一帧未能启动时，房间计时器继续轮询原输入源，因此电视能显示玩家加入和离开。电视键盘 A 失焦时，游戏从原房间读取当前的远端 A 状态，避免把先前一帧的按键当作此时仍按住。此次原生采样随后交给游戏循环，其他席位同时发生的 WiFi 短按仍会投递一次。

[原回归与新增单帧断言](runtime-checks.json) 涵盖中英文正常游戏、首次脚本或渲染错误、房间显示、原两手机道具流程，以及一名玩家失焦时另一名玩家的一帧 B。原脚本分别为 `resource/apps/coast-kart/tests/compatibility.mjs` 和 `resource/apps/coast-kart/tests/combat.mjs`。新增断言仅扩展了最后一个场景。

[正常游玩的手机实测](report.json) 使用原 Java 房间和桌面双浏览器，记录扫码、进入比赛、制动至倒车、两个电视尺寸的画布以及断开的席位。[签名包与游戏资源](signed-assets.json) 给出最终 APK 与前端资源的一致性。实体手机摄像头与 Android Activity 不在这套浏览器测试范围内。

从[父目录](../README.md)使用同样的依赖和环境变量。将最终 APK 放在 `$QA_SIGNED_APKS/coast-kart/`，使用独立工作目录，并执行以下命令。

```sh
export QA_COAST_FIX=1
python3 prepare.py
javac -cp "$QA_JSON_JAR:$QA_ZXING_JAR" -d "$QA_WORKDIR/classes" \
    ActualPhoneRoom.java Qr.java $(find "$QA_WORKDIR/sources" -name LanGameServer.java)
LP_NUM_THREADS=2 QA_MESA=1 node phone-room.cjs coast-kart
```

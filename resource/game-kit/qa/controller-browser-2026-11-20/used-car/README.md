# Used Car Racing 手机手柄与弹窗恢复

0.1.5 和 0.1.6 的手机玩家关闭电视原生弹窗后，有时仍需手动点击「继续」。弹窗占用输入时，Android 宿主返回空玩家列表。游戏原先在关闭弹窗时读取上一帧的席位，错过下一次真实房间快照。

0.1.7 在重新获得焦点后等待游戏循环采样，原手机席位恢复才自动继续比赛。玩家自己暂停的比赛继续等待 START。[逐版原用例结果](runtime-checks.json)

[双浏览器手机操作记录](report.json) 使用原 Java 房间服务器和真实 WebSocket。测试从游戏显示的二维码读出地址，使用手机页面加入房间、开赛并加速，再复测弹窗与窗口失焦。桌面测试通过原游戏入口调用挂起和恢复，按 Android 宿主合同返回暂时的空房间。报告注明运行环境，并记录恢复前后的真实采样数。[签名 APK 与逐文件 SHA-256](signed-assets.json)

参照[父目录](../README.md)安装依赖并设置相同环境变量。将签名 APK 放入 `$QA_SIGNED_APKS/used-car-racing/`，使用单独的工作目录，从父目录执行以下命令。

```sh
export QA_USED_CAR_FIX=1
python3 prepare.py
javac -cp "$QA_JSON_JAR:$QA_ZXING_JAR" -d "$QA_WORKDIR/classes" \
    ActualPhoneRoom.java Qr.java $(find "$QA_WORKDIR/sources" -name LanGameServer.java)
LP_NUM_THREADS=2 QA_MESA=1 node phone-room.cjs used-car-racing
```

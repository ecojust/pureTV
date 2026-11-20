# 720 × 480 双手机房间回归

在原有 12 款记录之后，七款共享侧栏布局修正了仅有手机入座时的高度。Tank、Jackal、Tetris、Jewel、Bomb Jack、Super Mario 和 Adventure Island 的中文及英文在 720 × 480 均曾把侧栏上缘放到视口之外。在相同画布上，修正将侧栏限制在 y = 12 至 450，超长内容由侧栏内部滚动。两名手机玩家的席位和二维码位于可视区。[逐语言修复前后测量](layout-before-and-after.json)

新测试为每款真实运行一个原 Java 房间，用两份独立的手机浏览器配置打开原房间地址。测试保留手机角色、触屏输入、游戏循环和真实连接收据，省略可选 TCP 服务公告。在 720 × 480、960 × 540、1280 × 720 分别比较游戏区、面板、二维码和两个席位。手机实际启动并操作游戏，第二部离开后第一部仍然可用，最后离开后无剩余席位。[每款游戏的坐标、模型值与证据](report.json) · [签名包原件和资源核对](signed-assets.json)

Tank 原版双语 `capture.mjs` 通过手机 START/SELECT、移动、A/B、暂停和重连场景，以及从 720 × 480 到 1920 × 1080 的四种输出尺寸。六款首帧绘制失败后继续显示房间的修复，和 Tank 的相应用例，已使用既有断言逐款验证。[Tank 原始输出](tank-capture.txt) · [七款原兼容性测试](https://github.com/ecojust/pureTV/actions/runs/44763872313)

重跑沿用[父目录](../README.md)的工具与环境变量。让 `QA_SIGNED_APKS` 指向按 slug 存放这里所列最终 APK 的目录，另建空的 `QA_WORKDIR`，在父目录运行以下命令。

```sh
export QA_COMPACT=1
python3 prepare.py
javac -cp "$QA_JSON_JAR:$QA_ZXING_JAR" -d "$QA_WORKDIR/classes" \
    ActualPhoneRoom.java Qr.java $(find "$QA_WORKDIR/sources" -name LanGameServer.java)
QA_2D=1 QA_TOUCH=1 node phone-room.cjs tank jackal tetris jewel bomb-jack super-mario adventure-island
```

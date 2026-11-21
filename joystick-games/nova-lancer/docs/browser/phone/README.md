# Nova Lancer 手机手柄验收

在独立的 Chromium 页面中打开电视游戏与触摸版手机手柄，电视视口为 960 × 540，手机视口为 844 × 390。用 ZXing 解码电视菜单截图中的二维码，再从手机打开对应房间。触摸输入通过游戏原有的 WebSocket 连接进入 Java 房间服务器，验证出击、射击、驾驶、离开时自动暂停、返回后继续以及再次暂停。每次加入和断开都测量画布尺寸，飞行中另检查连接提示与 HITS 及得分的位置。[实测记录](phone.json) · [电视菜单](tv-menu.jpg) · [手机手柄](phone-pad.jpg) · [飞行画面](tv-playing.jpg)

测试从指定 APK 提取游戏和手机页，使用仓库的生产类 `LanGameServer.java`。`ActualPhoneRoom.java` 在桌面 JVM 启动该房间，把电视网页平时调用的 Android 桥接方法转发到服务器。`Qr.java` 使用与 Android 相同的尺寸和边距生成二维码，随后解码从电视画面截取的像素。游戏始终使用自己的时钟和输入处理。本测试在桌面 JVM 与浏览器上运行，未使用实体电视或实体手机摄像头。[生产房间服务器](../../../../../resource/game-kit/android/src/main/java/com/ecojust/gamekit/LanGameServer.java) · [公共扫码测试工具及方法](../../../../../resource/game-kit/qa/controller-browser-2026-11-20/README.md)

此前的长按 START 回归会在连续两帧内先继续、再暂停。现在持续按住 800 毫秒只继续一次，松手后航程继续增加。再次触摸才暂停。[修复前的逐帧记录](held-start-before.json)

## 复验

需要 Python 3、Playwright 对应的 Chromium、JDK 17 或更高版本，以及 Nova Lancer 的发布 APK。下面的命令在本目录运行，Java 依赖分别为 JSON-java 20240303 和 ZXing Core 3.5.3。将 `--apk` 改为实际下载文件的位置。[游戏与下载说明](../../../README.md)

```sh
curl -fLO https://repo.maven.apache.org/maven2/org/json/json/20240303/json-20240303.jar
curl -fLO https://repo.maven.apache.org/maven2/com/google/zxing/core/3.5.3/core-3.5.3.jar
python -m pip install playwright
python -m playwright install chromium
python verify.py --apk nova-lancer-0.1.0.apk \
  --json-jar json-20240303.jar --zxing-jar core-3.5.3.jar \
  --output phone-qa-result
```

使用已安装的 Chromium 时可传入 `--chromium` 指定其可执行文件。结果目录包含游戏包及各项资源的 SHA-256、输入前后的游戏状态与实际截图。

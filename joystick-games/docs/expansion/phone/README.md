# 手机扫码输入回归

电视窗口为 960 × 540。测试从菜单截图读取二维码，在第二个启用触摸输入的 Chromium 窗口打开解码出的地址。手机页面通过 Game Kit 的 Java 房间服务发送方向键 DOWN，电视端检查按下、松开和退出后的连接状态。两个浏览器和服务运行在同一台 Linux 主机的回环网络上。实体手机、Wi-Fi 路由和 Android WebView 需单独测试。

每个游戏的 JSON 保留素材包、电视入口和扫码截图的 SHA-256；同名 PNG 来自实际解码的画面。ZIP 的摘要覆盖全部游戏资源、手机控制页面及游戏配置。之前的尝试保存在 [earlier](earlier/)。

六款均通过二维码解码、手机连接、按下和松开方向键以及断线清除输入。逐款重新打包后，六个 ZIP 和六份菜单截图的 SHA-256 均与相应报告一致。

| 游戏 | 原始记录 | 扫码菜单 |
| --- | --- | --- |
| Clawd Pop | [JSON](clawd-pop.json) | [960 × 540](clawd-pop-menu.png) |
| Kart Royale | [JSON](kart-royale.json) | [960 × 540](kart-royale-menu.png) |
| Lumenrift | [JSON](lumenrift.json) | [960 × 540](lumenrift-menu.png) |
| Operation Ironhold | [JSON](operation-ironhold.json) | [960 × 540](operation-ironhold-menu.png) |
| 光刃魔塔 | [JSON](saber-magic-tower.json) | [960 × 540](saber-magic-tower-menu.png) |
| Turbo Kart Rally | [JSON](turbo-kart-rally.json) | [960 × 540](turbo-kart-rally-menu.png) |

首轮使用仓库提交 `7b55f152bb7df074948c1367e6fb7d77af9b7e5f` 中的扫码脚本。Clawd Pop 的二维码已可读取，脚本随后在查询连接状态时触发其脚本执行策略。使用当前目录对应的测试代码从 Python 轮询只读快照后，同一游戏素材包通过全部步骤。

五款新增游戏升级到 Android 0.1.1 后，已按新配置生成全部素材包，逐款重新执行扫码、触摸和断线检查。Kart Royale 仍使用 0.1.6。先前通过的 0.1.0 测试和截图可从[历史提交](https://github.com/ecojust/pureTV/tree/da8a9d9/joystick-games/docs/expansion/phone)复查。

## 复现

从仓库根目录运行。Python Playwright、Chromium、JDK 及两个 JAR 的版本与校验值见 [测试环境说明](../../../qa/controller-input/README.md)。

```bash
games=(lumenrift saber-magic-tower operation-ironhold kart-royale turbo-kart-rally clawd-pop)
python joystick-games/qa/controller-input/payloads.py \
  --output /tmp/phone-payloads "${games[@]}"
python joystick-games/qa/controller-input/phone.py \
  --payloads /tmp/phone-payloads --output /tmp/phone-results --timeout 240 \
  --android-json /path/to/android-json.jar --zxing /path/to/core-3.5.3.jar \
  --chromium /usr/bin/chromium "${games[@]}"
sha256sum /tmp/phone-payloads/*.zip
```

本次 Linux 软件 WebGL 测试的 Chromium 启动器使用 ANGLE Mesa，传入 `--use-gl=angle --use-angle=gl-egl --ignore-gpu-blocklist --disable-accelerated-2d-canvas` 并设置 `LP_NUM_THREADS=2`。

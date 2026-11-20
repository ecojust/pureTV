# The Story Thief of Greymantle · 灰斗篷山的故事大盗

[下载当前 Android TV 手柄版 0.1.2](https://github.com/ecojust/pureTV/releases/download/catalog-tv-controls-v1.0.1/story-thief-0.1.2.apk) · [用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

在一年中最长的夜晚，布拉肯福德村的故事从书页上消失了。扮演 Rowan，从祖母的小屋出发，检查场景、收集和组合物品、与人物交谈，走入灰斗篷山的高塔。保留原作十个原版像素场景、四种行动、分支对话、结局、手动保存及场景切换时的自动存档。[Andrew Wooldridge 的原作](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-044) · [MIT 许可证](LICENSE)

| 手柄 | 效果 |
| --- | --- |
| 左、右 | 选择场景中可操作的对象、出口或 Rowan 本人，在菜单及背包中切换选项 |
| 上、下 | 切换步行、查看、使用、交谈四种行动，在菜单及对话中选择 |
| A | 对目标执行选定行动、选择对话、翻页、使用背包物品 |
| B | 打开或收起背包、立即读完当前一行对话、返回菜单 |
| X | 打开或关闭故事书 |
| Y | 打开或关闭原作菜单，可保存、读取、设置声音与文字速度 |
| START | 从标题进入故事、暂停、明确恢复 |

场景提示会标明当前目标和行动。用“使用”收走小屋桌上的蜂蜜蛋糕，再与祖母交谈并答应上山，可得到故事书和幸运铜币，村口的门这时才会放行。断开 Wi-Fi 手柄、窗口失焦和切到后台会暂停当前故事，重新连接后按 START 恢复。键盘方向键、Enter、Z/X/C/V 与 P 支持相同的操作；原作的鼠标、触屏和数字键仍可使用。

## 离线构建与检查

```sh
npm ci
npm test
npm run build
npm run build:check
python3 -m http.server 8000 --directory dist
```

在浏览器打开 http://localhost:8000/tv.html 。分发页在本地生成全部场景、像素画和声音。原作固定提交为 `a7051c34fe2e7550fd206e6272f758df171855b0`。[固定源文件及校验值](upstream.json) · [控制器测试步骤](qa-plan.json)

已安装 Chromium 和 Python Playwright 的环境可运行 `python tests/browser_sdk.py /tmp/story-thief-evidence`。此脚本通过原 Python SDK、本机 TCP 与浏览器宿主测试夹具操作游戏，生成截图并验证真实游戏状态。各平台安装版与实体手柄的验收单独记录。

960×540 与 1280×720 各完成 42 步：小屋取得蜂蜜蛋糕、与祖母对话领取故事书和铜币、出门到村广场，获得 7 分。两次都实测了断线暂停、重连后显式恢复及刷新后用原存档继续。[浏览器 SDK 核验](docs/browser/sdk-verification.json) · [小屋拾物画面](docs/browser/cottage-960.png) · [村广场画面](docs/browser/green-1280.png)

<!-- puzzle-downloads -->
## 安装包 0.1.1

| 平台 | 安装文件 |
| --- | --- |
| Android TV | [APK](https://github.com/ecojust/pureTV/releases/download/joystick-story-thief-v0.1.1/story-thief-0.1.1.apk) |
| macOS | [DMG](https://github.com/ecojust/pureTV/releases/download/joystick-story-thief-v0.1.1/StoryThief-0.1.1-macos-universal.dmg) · [ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-story-thief-v0.1.1/StoryThief-0.1.1-macos-universal.zip) |
| Windows x64 | [安装版 EXE](https://github.com/ecojust/pureTV/releases/download/joystick-story-thief-v0.1.1/StoryThief-0.1.1-windows-x64-setup.exe) · [便携 ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-story-thief-v0.1.1/StoryThief-0.1.1-windows-x64.zip) |

Android TV 和 Windows x64 均已通过默认端口和端口占用两种手柄实玩测试。macOS 通用版已通过 Apple Silicon 原生、Apple Silicon 端口占用、Rosetta 2 及 Intel 原生四项实玩验收。 macOS 包采用 ad-hoc 签名，尚未经过 Apple 公证。实体电视和 ESP32 实物手柄仍待验证。

[SHA-256 校验](SHA256SUMS.txt) · [平台验收记录](packages.json)

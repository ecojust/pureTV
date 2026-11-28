# pureTV 在线游戏

[下载 Android TV 安装包](hosted-games-0.1.0.apk?raw=1) · [网页游玩](https://ecojust.github.io/pureTV/) · [六款游戏的作者和原作入口](../../../joystick-games/catalog/hosted-originals.md)

安装在 Android 8.0 或更高版本的电视上，从应用列表打开「pureTV 在线游戏」。六款游戏都需要联网，由系统 WebView 打开作者网站。菜单、游戏目标、常用词和按键说明可用中文查看。绘制在游戏画布内的文字和剧情对白仍使用原作语言。

用遥控器选择游戏，按确定键开始。手机与电视接入同一局域网后，可直接扫描电视上的二维码，用手机选游戏和游玩。pureTV Wi-Fi 手柄支持局域网发现，也可以使用面板显示的 TCP 端口连接。

| 游戏 | 在电视上操作 |
| --- | --- |
| 金库大盗 | 在光标模式下建房或输房间码。劫案至少需要两位玩家。开局后切换移动模式，方向键移动，A 互动、X 冲刺、Y 使用技能。 |
| 鱼群环线 | 移动光标到鱼车上，按确定键把车尾相连的同色鱼放入管道。 |
| 黑色侦探：雨夜 | 点击 BEGIN 进入餐馆首章。在移动模式用 A 互动，观察模式可用方向键转动视角。原作的鼠标锁定效果取决于系统 WebView。 |
| 飞天涂色巴士 | 切到驾驶模式，用左右转向、下键爬升、上键俯冲，按住 A 喷彩，X 升档、Y 降档。 |
| 暮海点灯人 | 点标题第一项，再选 ROW OUT 出航。用光标划船，X 点灯，Y 回岸。 |
| 大田都市科学高中专业探索 | 选「입장하기」参观或「미니게임」进入专业小游戏。用光标点击游戏控件，在中文指南中可查六个小游戏的韩文名称。 |

《黑色侦探：雨夜》初次加载餐馆场景可能较慢。使用浏览器游玩时，可以打开作者提供的低分辨率入口。[低分辨率餐馆首章](https://noircity.vercel.app/?start=diner&dpr=0.45)

按返回键打开中文指南，查看当前游戏的操作模式、画面词汇和手机连接状态。面板提供「继续游戏」「重新加载」「返回游戏列表」。普通电视遥控器也可在面板切换模式、选取该游戏的附加动作。光标指向已收录的网页菜单文字时，屏幕会显示中文对照。

## 构建

使用 JDK 17、Android Platform 35、Build Tools 34.0.0 和 ZXing core 3.5.3。在仓库根目录执行以下命令，用本地 SDK 和 JAR 的路径替换参数。

```sh
python3 resource/apps/hosted-games/build.py --sdk /path/to/android-sdk \
  --zxing /path/to/core-3.5.3.jar --output /tmp/hosted-games-unsigned.apk
```

构建单款时安装 Pillow 11.3.0，并在相同命令中加上 `--game fish-loop` 等清单 ID。可用 ID 为 `bandit`、`fish-loop`、`noir-extreme`、`struggle-bus`、`vespertine`、`daejeon-campus`。每款使用自己的包名、中文名称和封面，启动后直接打开该游戏。返回键可查看原作指南和手机配对二维码，选择「退出游戏」返回系统。这六个独立包可与合集一起安装在一台电视上，各自保存游戏进度。

构建脚本核对 ZXing 校验和，从网页目录的同一份清单打包六款游戏的地址及中文指南。常规提交执行未签名构建。在 master 上手动运行「Hosted games for Android TV」发布流程，会使用 pureTV 固定证书签名，再在 Android TV 模拟器上安装测试。[工作流](../../../.github/workflows/hosted-games-tv.yml) · [手机手柄二维码组件许可](src/main/assets/ZXing-LICENSE.txt)

在仓库根目录运行 `resource/launcher/puretv/gradlew -p tools/hosted-games-tv/native testDebugUnitTest`，可复验应用进入后台后释放端口、回到前台后保留同一游戏画面，以及离开作者站点后返回原入口。测试使用 Robolectric API 28 和真实的本地 TCP 连接。[签名包资源校验](docs/signed-package.json)

[查看六款游戏的 Android TV 模拟器验收结果](docs/android-tv.md) · [网页版和电脑管理器的逐款指南验收](../../../joystick-games/catalog/hosted-guides-qa.json)

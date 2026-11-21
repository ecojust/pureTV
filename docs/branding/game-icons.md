# 客户端游戏图标

![Kart Royale、Nova Lancer、俄罗斯方块、宝石消除和 Starsling 的方形客户端图标](gameplay-icon-examples.png)

Android TV、macOS 和 Windows 从同一张游戏截图生成各自的启动图标。默认素材是游戏目录中的 `thumb.png`。游戏缺少缩略图，或缩略图停在菜单时，[截图索引](../../tools/game-icon-sources.json) 指向仓库已有的实际游玩画面。例如，Kart Royale 采用海岬之冠赛道上的驾驶截图，Prism Relay 采用第四关的光路，Starbase Spooky 采用空间站内调查线索的场景。索引中的路径均相对于仓库根目录，可直接打开查看原图。

[方形裁切范围](../../tools/game-icon-crops.json) 以游戏目录为键，数值依次为左、上、右、下边界，占原图宽或高的比例。裁切保留赛车、角色、场景或棋盘，避开侧栏与配对二维码。Android TV 的横幅使用整张宽幅截图。

安装 Pillow 后，在仓库根目录运行以下命令即可复现方形 PNG、Android TV 横幅和 Windows 多尺寸 ICO。

```sh
python3 tools/game_icons.py joystick-games/kart-royale /tmp/kart-royale.png --size 512
python3 tools/game_icons.py joystick-games/kart-royale /tmp/kart-royale-banner.png --banner
python3 tools/game_icons.py joystick-games/kart-royale /tmp/kart-royale.ico
```

更换截图时，先在游戏详情或验收记录中找到可识别的游玩场景，并核对游戏、关卡和画面来源。更新截图路径后重新确定方形裁切范围，缩小到启动器尺寸检查主体是否仍然清楚。

电视商城的“添加到首页”使用有大小限制的 SVG 快捷方式图标。运行 `python3 tools/update-game-store-logos.py` 可从同一取景更新这些图标，添加 `--check` 可核对结果。

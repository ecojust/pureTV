# Nova Lancer · 新星枪骑兵

这是 たぬ 制作的单人 3D 轨道射击游戏。战机会自动前进，玩家负责驾驶、瞄准和调速。第一关 Azure Coast 从海上编队飞行开始，穿过峡谷和要塞城，最后迎战机械海龙。第二关 Violet Sargasso 将战场移到太空。游戏保留原版日语界面。网页试玩直接打开作者的版本。[原版试玩](https://tanuu5.github.io/nova-lancer/) · [上游源码与 MIT 许可](https://github.com/tanuu5/nova-lancer/tree/63b63953299994baa05ac27c15c6b836fff0179b)

## 操作

在标题画面按 START 快速出击，或按 A 浏览原版菜单。游戏需要 WebGL 2。[电视扫码和电脑手柄连接指南](../../docs/guide/README.md#安装游戏与连接手柄)

| 动作 | pureTV 手柄 | 电脑键盘 |
| --- | --- | --- |
| 驾驶、选择菜单项 | 方向键 | 方向键或 WASD |
| 射击、确认 | A；按住蓄力，松开发射 | J 或空格；菜单可用 Enter |
| 投放智能炸弹、返回 | B | K |
| 加速、减速 | X、Y | L、I |
| 翻滚 | 按住 X，快速按两次左或右 | 快速按两次 Q 或 E |
| 快速出击、暂停及继续 | START | P |

## 本地运行

在仓库根目录运行 `python3 -m http.server 8000 --bind 127.0.0.1`，在浏览器打开 `http://127.0.0.1:8000/joystick-games/nova-lancer/dist/tv.html`。重新生成离线游戏时，在本目录执行 `npm ci`、`npm run build` 和 `npm run build:check`。[来源和第三方声明](NOTICE.md)

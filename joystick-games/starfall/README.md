# 星落舰队 · Starfall

[网页游玩](https://ecojust.github.io/pureTV/games/starfall/tv.html) · [Android TV 安装包](starfall-0.1.0.apk?raw=1) · [校验值](SHA256SUMS.txt)

在《星落舰队》中指挥三维舰队，命令采集船开采小行星、建造和研究舰船，并在遭遇战中保护母舰。13 类舰船、星云、地表和特效都由原作程序生成，六首配乐及音效从本地加载。

| 输入 | 操作 |
| --- | --- |
| 鼠标 | 左键选择舰船，框选舰队，右键向光标处下令，滚轮缩放。 |
| 键盘 | 方向键或 W 平移，Ctrl+A 选中整支舰队，F 聚焦所选舰船，F1 查看原作完整操作说明。 |
| pureTV 或标准手柄 | 方向键或左摇杆移动指挥光标，A 选择界面或舰船，B 向光标处下令。X 切换我方舰船，Y 聚焦当前选择。 |
| 暂停 | START 或 Esc 暂停与继续。Wi‑Fi 手柄断线时可在重连后按 START 继续。 |

## 构建

在本目录运行以下命令。需要 Node.js、npm 和 Git，首次构建从固定提交获取游戏代码和 CC0 音频。

```sh
npm ci
npm run build
npm run build:check
```

已有干净的固定版本工作副本时可将 `STARFALL_UPSTREAM` 设置为其绝对路径。运行 `build:check` 将重新生成游戏并比较 dist 中每个文件的 SHA-256。网页入口为 `dist/tv.html`。正常桌面硬件沿用原作 Ultra 画质，Android 与软件渲染器按设备减少阴影、粒子和渲染分辨率。

[原作、音频及依赖来源](upstream.json) · [作者与许可](NOTICE.md) · [实玩验证](docs/README.md)

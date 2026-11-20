# 墨绘地图集 · 浏览器实测

2026 年 11 月 20 日在 Linux Chromium 中加载 0.1.1 离线页面。页面 SHA-256 为 `38246a47a4696639d6b5c8815e97954342002f100de614f54b076a89520664c3`。现场通过本地 HTTP 服务加载页面，浏览器手柄接口按帧提供九键状态。

960 × 540 玩法检查依次完成十项验收，包括打开委托、移动羽毛笔、按住 A 再松开施术、查看交图确认以及主动暂停和恢复。随后向客户交图，进入第二个委托，测试手柄断开、重连、应用失焦及重载存档。页面未发出外网请求，浏览器未记录脚本异常。[现场数据](report.json) · [主菜单](menu.png) · [羊皮纸地图](playing.png)

860 × 484 的独立复验直接检查游戏 Web Audio 上下文。主动暂停、手柄断开或应用失焦后，声音状态变为 suspended。连接恢复后按 A、切回应用时维持暂停，按 START 时恢复 running。重新加载页面后从原存档继续。[声音与存档记录](focus-and-audio.json) · [最终双尺寸浏览器运行](https://github.com/ecojust/pureTV/actions/runs/44715165610)

在安装了 Python Playwright 和 Chromium 的机器上，从此目录运行以下命令。脚本从本款 `dist` 启动，结果写入系统临时目录，`CHROMIUM_BIN` 和 `PURETV_QA_OUTPUT` 可指定浏览器与输出位置。

```sh
python gameplay.py
python focus-and-audio.py
```

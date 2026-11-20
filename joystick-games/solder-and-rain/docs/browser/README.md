# 雨夜维修铺 · 浏览器实测

2026 年 11 月 20 日在 Linux Chromium 中加载 0.1.0 离线页面，窗口为 860 × 484。页面 SHA-256 为 `011717bf60dea56f0690cdb0b9373224ab8140211d474e59409dbfdc1d381078`。现场通过同一个本地 HTTP 服务加载页面，浏览器手柄接口按帧提供九键状态。

自由工作台中选取 1 级面条机器人，把种子从 1 调到 2。方向键将光标移到原工具栏，A 选中螺丝刀，再按一次后批头标识发生变化。Y 对准原提示指向的螺丝。按住 A 后，游戏在 `hole:s5.0` 记录 11 次转动，零件盘新增一颗螺丝。X 随后触发原电气测试。报告的 `afterBit` 在拆卸后采样，此时自动工具选择已为该螺丝装好 Phillips 批头。[现场数据](report.json) · [工作台画面](workbench.png)

声音检查从新存档进入剧情，直接读取游戏 Web Audio 上下文的运行状态。主动暂停、断开手柄以及应用失焦均挂起声音。重新连接并按 A、重新取得焦点时维持暂停，START 同时恢复原音乐和游戏。页面重载后通过原菜单继续了先前的维修铺存档。[声音与存档记录](focus-and-audio.json)

完整的首次接单流程使用项目中央验收计划，其中包含 23 步剧情、工作台和暂停检查。[最终双尺寸浏览器运行](https://github.com/ecojust/pureTV/actions/runs/44715165610)

在安装了 Python Playwright 和 Chromium 的机器上，从此目录运行以下命令。脚本从本款 `dist` 启动，结果写入系统临时目录，`CHROMIUM_BIN` 和 `PURETV_QA_OUTPUT` 可指定浏览器与输出位置。

```sh
python gameplay.py
python focus-and-audio.py
```

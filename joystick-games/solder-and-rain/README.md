# 雨夜维修铺 · Solder & Rain

在雨夜维修铺接待顾客，按工单拆开设备、诊断故障、修复并测试，从线索追查失踪的父亲。原版自由工作台也可从标题菜单进入。场景、工具、零件、灯光与雨景均由本地 Three.js 生成，需要 WebGL 2。

方向键移动维修光标，A 按下、拖动和松开，也可以直接点击工具栏。B 轮换工具，X 在工作台通电测试、在对白中翻到下一句，Y 把光标移到当前可见提示指向的零件。商店的 A 呼叫顾客；B 打开线索板，X 查看升级。 START 从标题开始、暂停或继续。Wi-Fi 中断或应用失焦后，按 START 继续。原版键盘及触控操作也可用。

本目录提供 0.1.0 的离线源包。三端宿主通过 `game.json` 加载 `dist/tv.html`，以 `qa-plan.json` 核验实际玩法和存档。

使用 Node.js 运行 `npm ci`、`npm test`、`npm run build` 和 `npm run build:check`。

[上游固定版本](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-105) · [许可与归属](NOTICE.md)

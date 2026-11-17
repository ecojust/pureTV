# Emberbrood · pureTV

保留原种子世界、28地点、龙种/遗传繁育、五幕剧情、捕捉、队伍回合战和任务；原DOM像素界面与Canvas精灵保持。方向键选择、A确认、B返回，X滚动长页，Y切页签。文本A编辑、方向改字/光标、X删除、Y确认。START暂停，剧情和战斗菜单均无需鼠标。

原UI/音频定时器改为游戏唯一RAF的可暂停调度器，暂停、失焦、断线同时停止计时，取消输入后重连不会继续。游戏快照只读实际状态；每RAF仅一次消费pureTV输入。侧栏显示真实ID，默认TCP63485。原四个存档键登记供macOS跨HTTP端口保存。

原作 Andrew Wooldridge / triptych `web-games-andrew/game-038`，固定commit `a7051c34fe2e7550fd206e6272f758df171855b0`，MIT。原规则/生成/数据模块字节一致，31项原回归通过（docs/upstream-simtest.log、source-model-integrity.json）。无需Three或网络资源。

运行 `npm ci && npm test && npm run build && npm run build:check`。浏览器测试正常按键进入剧情、实际地图旅行与遭遇战；使用禁GPU Chromium验证原DOM/2D，不冒称3D或电视实机。各次失败/截图/报告保留于docs/browser-attempt-*；当前源码适配验收中，未提供正式签名Android/macOS包，实体设备未验。

当前dist已通过960×540/1280×720完整输入及画面复验。短屏战斗卡紧凑排列，命令重建后焦点保持在战斗区；实际方向导航证明敌方名称与选中命令可完整读取，长内容仍按焦点滚动。旧裁切截图与修正依据均保留，汇总docs/verification.json；原生Android/macOS包仍未交付。

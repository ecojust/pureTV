# 铁垒行动 · Operation Ironhold

[Android TV 0.1.0 签名 APK](operation-ironhold-0.1.0.apk?raw=true) · [扫码连接手机](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上游玩](../../docs/guide/README.md#在电脑上玩)

单人第一人称游戏。玩家在第七区货柜场开局，须在三分钟内击败十名守卫。结算画面显示命中率、完成时间和战绩，可直接开始下一局。场景、对手、装备和音效沿用 StarKnightt 的原作，Three.js 已打入本地发行目录。

## 游玩

在仓库根目录运行 `python3 -m http.server 8000`，浏览器访问 `http://localhost:8000/joystick-games/operation-ironhold/dist/tv.html`。需要支持 WebGL 的浏览器。

| 动作 | 键盘／鼠标 | pureTV 九键手柄或手机 |
| --- | --- | --- |
| 开局、暂停、继续、再次部署 | Enter 或 P。Esc 可暂停 | START |
| 前进、后退 | W、S | ↑、↓ |
| 横移 | A、D | — |
| 左右转向 | ←、→ 或鼠标 | ←、→ |
| 抬头、低头 | ↑、↓ 或鼠标 | 按住 B 再按 ↑、↓ |
| 瞄准 | 鼠标右键切换 | 按住 B |
| 射击 | Z 或鼠标左键 | A |
| 跳跃／二段跳 | 空格 | X |
| 切换装备 | 数字 1–4 或滚轮 | Y |
| 装填 | R，空仓继续射击也会装填 | 空仓继续按 A |
| 冲刺／屏息、蹲伏、射击模式 | Shift、Ctrl、V | — |

键盘可独立完成一局。点击开始／继续会请求鼠标锁定。桌面和电视原生宿主通过共享输入桥读取局域网无线手柄，电视菜单／暂停页提供手机配对入口。失焦、系统挂起或手柄断开会清空按键并暂停，重新连接后按 START 继续。

## 构建和验证

在本目录运行 `npm ci && npm run build && npm run build:check`。构建过程从固定版本的 Three.js 和仓库内共享输入桥生成 `dist/`，游戏运行时无需网络加载素材。

`python3 tests/browser.py [截图输出目录]` 使用 Python Playwright 与 Chromium，从游戏入口检查键盘、桥接手机和无线手柄、射击、镜头、切换装备、暂停以及断开重连。原生宿主的可观察动作列在 `qa-plan.json`。浏览器测试以输入快照模拟宿主，结果仅代表该条输入路径。

[原作仓库](https://github.com/StarKnightt/operation-ironhold) · [许可和移植说明](NOTICE.md)

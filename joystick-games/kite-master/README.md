# 风筝大师 · Kite Master

按住 A 收紧风筝线，追逐高空的云朵。

风力不断变化，调整线长保持风筝飞行并捕捉云朵。
风筝掉落或任一云朵落地都会结束。

| 操作 | pureTV 手柄 | 浏览器 |
| --- | --- | --- |
| 原版单键操作 | A（按下/按住/松开） | 回车 / A / 空格 / 点击画面 |
| 开始、暂停、继续 | START | P |
| 菜单选择 | 上 / 下 | 方向键 |
| 难度选择 | 左 / 右（主菜单） | 左 / 右 |
| 暂停、说明、返回主菜单 | B | B / Esc |

断线、失焦和后台会清除输入并真实暂停规则时钟。重新连接不会自动继续；暂停/取消不等于主动松键，不会触发释放奖励。主菜单可选标准（原始难度）、进阶和挑战；难度仍按原始游戏时间增长。重开、帮助、难度均可只用遥控操作。

`src/game.js` 是固定上游原件；在 `src/config.json` 编辑电视文案，在 `../shared/crisp/` 编辑共用适配。每款 npm 锁不引入在线构建依赖；预置运行库锁和原许可在 shared/crisp。执行 `npm ci --ignore-scripts && npm run build && npm run build:check`；输出是全离线平铺 `dist/`。Android TV 与 macOS 宿主应使用同一份已验证 dist。

来源：[Kite Master 原源码](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/docs/kite-master/main.js)，MIT © 2026 ABA Games。保留原渲染、单键规则、合成音效和全部音频；依赖/改动说明见 [NOTICE.md](NOTICE.md)。上游原页面没有 npm 锁；本目录为确定性离线封装新增 npm 锁。

`window.JoystickGameQA.snapshot()` 只读返回 stage、真实原版 state/ticks/score/实体、缓存手柄与菜单状态。没有测试专用写状态或改钟入口。浏览器结果与安装包宿主/实体设备结果分别记录；尚未验证实体电视和实体手机。

浏览器验收：[完整记录](docs/browser-qa/verification.json)与[实际画面](thumb.png)。960×540、1280×720 的菜单、帮助、正常 A 操作、真实暂停、断线取消、明确重连恢复和缓存输入检查均通过；两尺寸实际玩法画面已目视复核。测试中的连接卡和取消使用单独标注的合成桥接，不代表实体手柄或已安装原生包验证。

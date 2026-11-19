# Kart Rush · pureTV 手柄适配

固定源为 [stevkazt/kart-rush](https://github.com/stevkazt/kart-rush/tree/4b0cf276d84e76171feb765d87b5e8a6159cc421)。保留原始程序化 3D 美术、8 条正式赛道、7 场大奖赛、8 名车手、车辆与涂装选择、道具、自动漂移、三圈规则、原创合成音效及存档。每场仍为玩家和 5 名 AI。

当前提供源码、离线 dist、回归和浏览器验证记录；安装包与原生 SDK 验收由整批交付另行记录。未在实体电视或手机上测试，不把桌面 SwiftShader 帧率当作电视性能。

| 按键 | 比赛 | 菜单 |
| --- | --- | --- |
| ↑ / ↓ | 油门 / 刹车及倒车 | 上下选择 |
| ← / → | 转向；持续转向触发原有漂移 | 左右选择 |
| A | 使用道具 | 确认；姓名键盘输入 |
| B | 反向投掷道具 | 返回 |
| X | 原有车辆复位 | 姓名删除 |
| Y | 暂停并打开帮助 | 姓名完成 / 返回 |
| START | 暂停 / 恢复 | 开始比赛 / 确认 |

所有视角均需明确按 ↑ 加速，默认横屏。手机手柄 ID 来自宿主实际连接数据，面板不生成示例身份，也不虚构信号强度。断线、后台或失焦取消油门、道具和漂移蓄力；重连不会自动恢复，松开按键后按 START / A 继续。原版漂移释放奖励保留，取消操作不奖励。

首次运行通过原版姓名键盘设置名字：A 进入字母键、方向选择、A 输入、X 删除、Y 完成，全程不需鼠标。方向逐项遍历所有原版菜单。键盘方向/WASD、Enter/A（Space）、B/Q、X/R、Y/H、START/Esc/P 同样可用。

```sh
npm run build
npm run build:check
npm test
```

构建无 npm 依赖，直接复制固定本地模块。`upstream.json`、`dependency-lock.json` 与 `dist/asset-provenance.json` 记录逐文件来源和 SHA-256。原始规则/美术的保留由内容哈希与输入回归检查；`qa-plan.json` 是只读观察、正常输入的原生验收方案，并不代表已经在原生包中执行。

**许可状态未明确**：检查的上游固定源码树没有项目 LICENSE/COPYING。根 `LICENSE.txt` 仅记录此事实，不向原游戏授予新许可；Three.js 与 cannon-es 分别保留 MIT 许可。正式对外分发前需要落实上游授权。详情见 [NOTICE.md](NOTICE.md)。

# Kart Rush · pureTV 手柄适配

固定源为 [stevkazt/kart-rush](https://github.com/stevkazt/kart-rush/tree/4b0cf276d84e76171feb765d87b5e8a6159cc421)。保留原始程序化 3D 美术、8 条正式赛道、7 场大奖赛、8 名车手、车辆与涂装选择、道具、自动漂移、三圈规则、原创合成音效及存档。每场仍为玩家和 5 名 AI。

已提供 [Android TV 0.1.0 APK](kart-rush-0.1.0.apk)（948,563 字节，Android 8.0+），使用固定发布证书。原生模拟器正常端口与端口占用两种模式各通过52项实际手柄检查，详见[签名、源码及运行核验](docs/android-attempt-2/)。macOS 与 Windows 包仍在验证。未在实体电视或手机上测试。

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

首次运行通过原版姓名键盘设置名字：A 进入字母键、方向选择、A 输入、X 删除、Y 完成，全程不需鼠标。方向逐项遍历所有原版菜单。电脑键盘：方向/WASD 驾驶；Enter/Space/E 对应 A，B/Q 对应 B，X/R 对应 X，Y/H 对应 Y，Esc/P 对应 START。

```sh
npm run build
npm run build:check
npm test
```

构建无 npm 依赖，直接复制固定本地模块。`upstream.json`、`dependency-lock.json` 与 `dist/asset-provenance.json` 记录逐文件来源和 SHA-256。`game.json` 的资产预算与根注册表保持一致。`qa-plan.json` 已在上述 Android 原包中通过正常输入执行；各平台证据分别记录。安装文件来源与哈希见 [packages.json](packages.json) 和 [SHA256SUMS.txt](SHA256SUMS.txt)。

**许可状态未明确**：检查的上游固定源码树没有项目 LICENSE/COPYING。根 `LICENSE.txt` 仅记录此事实，不向原游戏授予新许可；Three.js 与 cannon-es 分别保留 MIT 许可。详情见 [NOTICE.md](NOTICE.md)。

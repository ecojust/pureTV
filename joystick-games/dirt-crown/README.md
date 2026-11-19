# Dirt Crown · 尘土王冠

Andrew Wooldridge 的乡间赛车生涯游戏。保留原版程序美术、20 条赛道、7 个地区、26 个生涯赛事、六类升级，以及竞速、淘汰、计时、单挑和故事。

目前是 **pureTV 适配源码阶段**，尚未发布 Android、macOS 或 Windows 安装包。原版固定提交和逐文件来源见 [upstream.json](upstream.json)，依赖锁定见 [dependency-lock.json](dependency-lock.json)，美术/玩法比较与此前未到驾驶的限制见 [比较记录](../../docs/racing-nine/reviews/rally/dirt-crown/review.json)。旧的未提交适配丢失，本目录是重新从固定原源实现。

| 手柄键 | 比赛 | 菜单 |
| --- | --- | --- |
| ↑ / ↓ | 油门 / 刹车 | 上一项 / 下一项 |
| ← / → | 左右转向 | 焦点移动、数值调整 |
| A | 按住漂移 | 确认；剧情下一句 |
| B | 按住氮气 | 返回 |
| X | 复位车辆 | 剧情跳过、编辑删字 |
| Y | 切换镜头 | 车库换页；编辑保存 |
| START | 暂停 / 继续 | 开始、暂停剧情 |

电视端没有隐式自动油门；按住 ↑ 才供油。文本输入支持手柄逐字编辑。窗口失焦、原生暂停或手柄断线会清除控制并冻结当前场景；重连后需松开按键，再主动继续。侧边卡片读取原生快照中的实际客户端 ID，不推算信号强度。电脑键盘也保留 WASD/方向驾驶、空格漂移、Shift/B 氮气、R/X 复位、C/Y 镜头、Esc/P 暂停。

构建不需要 npm 下载依赖：

```sh
npm test
npm run build
npm run build:check
```

`src/` 为适配源，`dist/tv.html` 与其同目录资源是可离线重建的多文件页面。Three.js 0.165.0 及原 Bungee/Rubik 字体已锁定到本地，整个 dist 约 2.7 MB。运行需要 WebGL2；保留原 High/Medium/Low 图形设置。默认档位未为软件渲染测试强制降画质。

`game.json` 的 storageKeys 保留原生涯和设置两个存档键，assetPolicy 用于本地字体扩展，必须与根注册表匹配。原生宿主负责 `_puretv._tcp`、默认 63485、占用回退和存档，不在游戏中另开 socket。

MIT 原文见 [LICENSE](LICENSE)，Three MIT 与字体 OFL 详见 [NOTICE.md](NOTICE.md)。浏览器合成输入、真实 SDK、原生包与实体设备结果必须分别记录；当前没有平台签名或发布通过声明。

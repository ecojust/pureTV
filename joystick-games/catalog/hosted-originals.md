# 六款游戏的作者原版入口

六款游戏共用一套中文指南，包括游戏目标、开局步骤和画面词汇。网页版可在游戏画面上方选择「中文指南」。Android TV 版由同一个客户端打开作者网站，可用遥控器、标准手柄或局域网手机手柄游玩。[电视版下载与按键说明](../../resource/apps/hosted-games/)

打开卡片后，浏览器从作者网站加载游戏，使用原作的语言和输入方式。下表的仓库链接固定到 2026 年 11 月 27 日审查的提交，游戏入口会随作者部署更新。

| 编号与游戏 | 作者网站的版本 | 原版操作 | 实际试玩 | 来源 |
| --- | --- | --- | --- | --- |
| 769 金库大盗 | 英文。原候选 *Bandit* 已演变为作者运营的多人游戏 *Vault Breakers*。劫案至少 2 人，捉迷藏至少 3 人。 | WASD 或方向键移动，Shift 冲刺，E 互动，Q 使用技能。原作也读取标准手柄。 | 两个浏览器通过邀请码进入同一私局，双方准备后进入 The Estate 第一轮，分别收到破坏者和逃脱者任务。 | [固定仓库](https://github.com/yashnimde-ship-it/sonions/tree/00ee8dd03351655aa93118e5c43e1e1909c5445b) · [作者原版](https://vault-breakers.onrender.com/) |
| 1457 鱼群环线 | 关卡标签使用英语，设置、结算与重玩按钮使用越南语。*Fish Loop* 的 `/demo/` 是作者 README 指定的竖屏 Phaser 试玩版。 | 点鱼车，将车尾相连的同色鱼放入管道。鱼会自动进入车尾同色且有空位的车，没有匹配车时可进入空车。也可点击道具。 | 作者页面在 1080 × 1920 竖屏画布载入第一关。用鼠标点击鱼车，步数由 0 增至 1，车上的鱼由 4 条减至 3 条。 | [固定仓库](https://github.com/huykc1/fish-loop-phaser-demo/tree/83146181fdb9071db6e0c00f344b5f9b9db66622) · [作者原版](https://huykc1.github.io/fish-loop-phaser-demo/demo/) |
| 2286 黑色侦探：雨夜 | 英文。作者现行首页名为 *NOIR CITY*。卡片采用作者的 `?start=diner` 选章入口，跳过开场漫画，直达原 *NOIR EXTREME* 的餐馆首章。 | 点 BEGIN 开始，WASD 移动，鼠标转动视角，E 互动，Esc 暂停。原作支持标准双摇杆手柄。 | 在软件 GPU 上降低渲染比例后点 BEGIN，游戏进入游玩状态并锁定指针，原引擎记录餐馆首章 `diner` 的起始过场 `settle`。 | [固定仓库](https://github.com/evancodez/noircity/tree/7491535d0307b3ef28387e57c2c8fffec568469e) · [作者首章](https://noircity.vercel.app/?start=diner) |
| 2980 飞天涂色巴士 | 英文。*Struggle Bus* 从旧金山地图自动起飞。 | ←/→ 转向，↓ 拉升，↑ 俯冲，空格喷彩，E/Q 升降档，Esc 打开设置。触屏可拖动转向、轻点喷彩。 | 默认入口加载 9 个城市区块并开始飞行。聚焦游戏后，Esc 能打开和关闭设置。另用作者的跳过开场参数实测，持续按右键使航向由 1.745 变为 1.770 弧度。 | [固定仓库](https://github.com/patrickscaptainslog/Struggle-Bus-World/tree/058217ce441b15e1dc4d93689ea9a53d1b4b709b) · [作者原版](https://struggle-bus-world.vercel.app/) |
| 3266 暮海点灯人 | 英文。*Vespertine* 提供五夜航行，原作在作者站点的浏览器存储中保存进度。嵌入页面能否续玩取决于浏览器是否允许第三方存储。 | 选标题页第一项开始、续玩或重玩，再选 ROW OUT。移动指针或拖动手指划船，靠近微光收集，点击或按空格放出灯火，Esc 回岸。 | 进入第一夜 The Shallow Drift，移动指针、按空格点灯后看到灯火重新充能，Esc 返回标题。 | [固定仓库](https://github.com/sunkencity999/vespertine/tree/4fc5ca2d8f01d2ac8b77e4c73332d321918a7864) · [作者原版](https://sunkencity999.github.io/vespertine/) |
| 3570 大田都市科学高中专业探索 | 韩文。作者将学校的学科参观和 6 款小游戏发布在公开站点，原始工作仓库为私有。 | 「입장하기」进入参观，点击、空格或回车推进对白。「미니게임」选小游戏，「시작」开始。糕点游戏可点击配料，或按 1–2 选蛋糕胚、3–4 选奶油、5–7 选装饰。 | 进入糕点游戏，依照顾客订单按数字键完成第一件蛋糕，营业额从 0 增至 1,500 韩元。 | [固定仓库](https://github.com/kcmjj371-art/dush-game-site/tree/791ab153bd3a930d979a6965dd5c1b029256b7a1) · [作者原版](https://kcmjj371-art.github.io/dush-game-site/) |

这六个公开仓库的当前版本和可查历史中，均未找到覆盖整部游戏的翻译、改编或再分发许可。飞天涂色巴士为地图、天文数据列出独立条款，大田学校项目中的 SIL OFL 1.1 适用于 Pretendard 字体。pureTV 分发入口和操作说明，游戏程序与美术由作者站点提供。[巴士地图](https://github.com/patrickscaptainslog/Struggle-Bus-World/blob/058217ce441b15e1dc4d93689ea9a53d1b4b709b/public/city/DATA_LICENSE.md) · [巴士天空数据](https://github.com/patrickscaptainslog/Struggle-Bus-World/blob/058217ce441b15e1dc4d93689ea9a53d1b4b709b/public/sky/DATA_LICENSE.md) · [学校项目字体许可](https://github.com/kcmjj371-art/dush-game-site/blob/791ab153bd3a930d979a6965dd5c1b029256b7a1/fonts/Pretendard-LICENSE.txt)

本轮在 Chromium 中核查了六个跨站内嵌入口。表中的标准手柄支持来自金库大盗和黑色侦探的原作实现，实体手柄尚未实测。2026 年 11 月 27 日检查的六款网页原作均未发现接收 pureTV 手机手柄的接口。电视客户端接收手柄输入后，将它转换为原作使用的指针或按键。

[六款中文指南的网页与管理器验收](hosted-guides-qa.json) · [原作管理器实测记录](hosted-manager-qa.json) · [复现脚本](../../tools/pc-games/qa/manager-hosted.mjs)

# Manager 0.6.1 客户端游戏栏目验收

0.6.0 正式 Linux 安装包在左侧「游戏」显示 46 张卡片。0.6.1 从提交 `5e7145fdbf713a09957705771e373a6580687df9` 构建，游戏栏目内置 56 张卡片。Windows、macOS 两种架构和 Linux 均通过正式构建及升级安装检查。[正式构建](https://github.com/ecojust/pureTV/actions/runs/46108778463) · [下载 0.6.1](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.6.1)

五个公开下载文件均返回 HTTP 200。实际字节数与 GitHub 资产记录一致，各包 SHA-256 与 GitHub 摘要及发行校验清单逐一匹配。[下载记录](public-downloads.json)

| 客户端「游戏分类」 | 本次验收的游戏卡片 |
| --- | --- |
| 动作、角色扮演与探索 | 金库大盗、黑色侦探：雨夜、暮海点灯人、大田都市科学高中专业探索 |
| 解谜与益智 | 鱼群环线 |
| 飞行模拟 | 飞天涂色巴士 |

从公开 DEB 的可执行文件中提取实际内嵌的 HTML、CSS 和 JavaScript，在 Chromium 中按分类打开六款。每个 pureTV 入口与作者页面均返回 HTTP 200。六款均能打开中文指南，关闭指南后焦点返回游戏，退出后焦点返回刚才选择的卡片。该项测试使用真实网络，Tauri 的系统窗口命令由测试夹具模拟。[逐款结果与包内资产哈希](game-menu-acceptance.json)

在 Debian 13、WebKitGTK 2.52.6 上从同一份公开 DEB 运行原生客户端，用鼠标从左侧「游戏」逐一打开上述六款。六款全都显示作者原作画面、进入同窗全屏并打开中文指南。关闭指南后恢复原作画面，返回列表后窗口还原，焦点回到刚才选择的卡片。确认了《鱼群环线》的第一关、《飞天涂色巴士》的大桥与巴士，以及其余四款的作者标题或菜单。[原生窗口逐款记录](linux-native.json) · [鱼群环线原生窗口截图](fish-loop-guide.png)

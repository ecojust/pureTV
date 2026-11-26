# 0.6.0 游戏验证

管理器的完整构建及安装验证见 [PR #71 的四平台检查](https://github.com/ecojust/pureTV/actions/runs/45778903910)。正式版本使用合并提交 ca7505b，网页资源使用 gh-pages 提交 003ec61。[正式构建](https://github.com/ecojust/pureTV/actions/runs/45780557881) · [游戏站部署](https://github.com/ecojust/pureTV/actions/runs/45779058665)

- 对全部 46 个网页入口进行 Chromium 加载检查，每项记录了标题、宿主初始化、资源请求与 JavaScript 错误。随后通过 HTTPS 核对了公开游戏页面、封面、首页和共享脚本的 SHA-256，96 个文件均匹配。[逐款加载结果](browser-entry-checks.json)
- Linux 原生 Manager 使用 Tauri 正式自定义协议和 WebKitGTK 2.54.3。通过侧栏打开线上 Tetris，虚拟手柄经 TCP 加入，START 使游戏从标题切换到游玩。断开连接后页面反映手柄状态，关闭游戏后监听端口释放。[原生记录](linux-webkit.txt) · [游玩截图](tetris-linux.png)
- Chromium 中另用 Python JoystickClient 向 Rust 服务发送按键，Tetris 正在下落的方块右移一格。在系统浏览器入口用键盘开始游戏，再左移一格。Emberbrood 的玩家数在收到 START 后从 0 变为 1。该组 Chromium 用例模拟了 Tauri 的事件投递。
- 桌面 UI 回归验证 174 个场景。共享输入桥接覆盖会话、短按、失焦及消息来源。Rust 用例验证两个玩家同时连接、断线、重连、重复序号与端口回退。手柄验证使用软件 SDK，未使用实体手柄或电视。

已完整下载 GitHub Release 的五份安装文件并核对大小与 SHA-256。[公开下载核验](public-downloads.json) · [版本下载](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.6.0)

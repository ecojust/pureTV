# Manager 0.8.1 游戏部署验收

游戏栏目保留 56 张卡。电脑可从安装包中的 48 个本地项目启动游戏，或从同一项目在电脑上打包并部署到电视。另有 8 个明确标注的联网入口。

| 场景 | 实际核对 |
| --- | --- |
| 客户端的本地项目 | 48 个可读的 `project.zip` 含游戏网页、Android 清单及宿主代码，正式签名资料单独存放。整库不含成品 APK。逐款检查全部项目的 ZIP 和签名状态，2,578 个游戏资源、363,162,556 字节与来源包内的原作内容相同。[文件核对](local-projects.json) · [48 个项目检查](unsigned-projects.json) |
| 断网打包 | 在没有外部网络路由的环境中，为每款使用空缓存，从 48 个本地项目和六款在线游戏的内置宿主资料分别生成并导出 APK。54 个文件共 311,238,496 字节，逐款核对了正式签名包的字节数、SHA-256、包名和证书。对逾 100 MB 的《Backroad Rally》另测了中途取消、重新打包及损坏缓存修复。[逐包结果](local-apk-export.json) |
| 电脑断网游玩 | 生产前端配合真实本地 Rust 资源服务，56 张封面均无外部请求。《Tetris》用键盘从标题开局、移动方块，退出后焦点恢复。独立回环端口保持存档来源，游戏页不能读取主窗口或调用 Tauri。此项测试使用模拟 Tauri 窗口桥。[实际键盘输入与请求](offline-player.json) |
| 部署弹窗 | 卡片显示打包、安装、完成三步。对准备中取消、安装中取消、设备或 Android 用户切换、安装失败和旧响应都做了回归，仅本次 APK 获确认成功后显示向启动器主屏幕添加的提示。[部署场景](../../../desktop/tests/game-deployment.mjs) |
| 已有的联网版电视包 | 《Kart Rush》和《CF 运输船》首次从冻结发布提交取得对应的官方 APK。首次断网会显示失败，已有通过校验的缓存可以离线取出。两款均已验证首次获取、损坏检测和恢复。[逐包记录](online-packages.json) |

另外六款作者游戏通过各自的独立电视客户端加载作者站点。在线合作玩法、作者原作及素材的分发范围见[游戏来源](../../../joystick-games/catalog/hosted-originals.md)。

在逐款隔离的 Chromium 浏览器会话中核对了 48 款本地游戏的冷启动。对俄罗斯方块的方块移动、光球挑战的得分、OpenAero 的起飞和倾斜、Backroad Rally 的快速赛段及油门分别做了实际操作。《Backroad Rally》使用原作提供的低画质设置，软件 GPU 在默认画质下未于测试时限内驶出起跑位。[逐款操作和画面记录](../offline-games-gameplay.json)

## 实际安装和部署

0.8.0 发布前预检使用实际安装的 Linux 管理器和 Android TV 36 模拟器。两者只有回环网络，电视安装前没有《霓虹飞车》。点击卡片部署后，测试从 Android 安装目录读回了 566,855 字节的 APK，SHA-256 与原件一致，并验证了电视启动器入口和打开后的前台状态。[断网预检](https://github.com/ecojust/pureTV/actions/runs/46118410846)

0.8.0 候选在 Windows 上发现两个进程同时修复损坏缓存时的文件共享冲突，因此未公开发布。0.8.1 会复查另一进程已写好的缓存，并重试临时的 Windows 文件共享错误。[缓存修复](https://github.com/ecojust/pureTV/commit/3519e72018c6cb41fd3abfb569d7e7dfbb87d131)

使用 0.8.1 正式构建生成的 Linux DEB 独立重跑了同一流程。无公网路由时，先用已安装的管理器在电脑上打开《Tetris》，实际开局、移动方块和暂停。再在设备连接页连接 Android TV 36 模拟器，通过《霓虹飞车》卡片部署，读回核对 APK 并启动游戏。管理器的成功弹窗显示三个完成标记及「前往启动器」。电视端验证使用模拟器，未使用实体电视。[原生窗口与设备记录](linux-native.json) · [安装包来源](linux-installer.json) · [成功弹窗](deployment.png) · [同包独立实测](https://github.com/ecojust/pureTV/actions/runs/46119607785)

## 下载与升级

0.8.1 于 2026-11-28 07:17 UTC 公开发布。四个原生平台构建均验证了安装文件，Windows 同时验证了没有随附文件的单个便携 EXE。旧版更新器对文件大小的限制会影响本次升级，0.7.0 及更早版本请从发布页下载对应平台安装包。[下载 0.8.1](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.8.1) · [正式构建与部署验收](https://github.com/ecojust/pureTV/actions/runs/46118763989)

从公开链接匿名读取了全部五个安装文件，共 1,621,779,121 字节。每个文件均返回 HTTP 200，长度、SHA-256 与发布清单和 GitHub 的文件摘要相符。公开 Linux DEB 的字节也与上述两次 Android TV 部署使用的安装包一致。[逐包地址、大小和 SHA-256](public-downloads.json)

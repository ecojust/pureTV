# Manager 0.7.0 游戏栏目验收

提交 `37d067ebfa7a50ce8f45281ace505f0f55e32a73` 已构建并于 2026-11-28 05:48 UTC 发布。Windows x64、macOS Apple Silicon、macOS Intel 以及 Linux x64 均通过构建和安装升级验证，Windows 同时提供安装版和便携版。[发布页及校验清单](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.7.0) · [四个平台的构建记录](https://github.com/ecojust/pureTV/actions/runs/46113023059)

发布后匿名完整下载了五份客户端，全部返回 HTTP 200。逐包计算的 SHA-256 均与 GitHub 资产摘要、发行清单一致，字节数也与 GitHub 记录一致。[逐包下载核对](public-downloads.json)

| 来源 | 验证内容 |
| --- | --- |
| 50 款已有电视版 | 按发布收据逐项核对 308,631,164 字节 APK 的 SHA-256、证书和包名。目录里的全部下载地址都返回 APK 文件头和预期长度。Backroad Rally 的 Git LFS 地址实际返回 105,176,121 字节游戏包。[逐包核对](published-game-apks.json) |
| 6 款作者在线游戏 | 在屏蔽网络的环境用客户端 Rust 代码执行准备与导出。六份结果共 4,298,386 字节，逐一与正式签名原件比对，并通过 Android SDK 验签、包名与中文名称检查。还验证了缓存被同长度错误内容替换后的修复，以及取消或失败时保留原目标文件。[逐款导出与签名记录](assembled-game-apks.json) · [正式签名原件](https://github.com/ecojust/pureTV/tree/ec8ae301945dd4eb3046d9b94f2a6671cac14571) |

Manager 的 182 项 Chromium 界面回归全部通过。其中覆盖了网页游戏保存、取消、失败重试和未连接电视时加入待安装队列，也覆盖了从「电视游戏市场」搜索、选择历史版本、下载和查看同一待安装列表。浏览器测试通过夹具调用 Tauri 命令，APK 实际组装和导出另用上述 Rust 入口验证。[单款宿主和签发流程](https://github.com/ecojust/pureTV/pull/94) · [正式桌面构建和回归](https://github.com/ecojust/pureTV/actions/runs/46113023059)

从公开 DEB 启动 Linux 原生 Manager，在全新配置中逐款点击六张游戏卡，六份 APK 的签名、独立电视入口、作者地址及内置中文指南均与签名原件一致。用系统保存窗口给《金库大盗》的 APK 自选文件名，并将它加入待安装列表。未连接电视时仍可保存，安装按钮保持禁用。《Tetris》从现有目录实际下载，文件 SHA-256 匹配。[原生窗口逐项记录](linux-native.json) · [生成、保存与入队截图](game-apk-dialog.png)

在同一正式客户端从「游戏 → 电视游戏市场」读取到 29 款游戏、37 个版本。搜索 `cf-transport-ship`，将版本从 0.1.2 更改为 0.1.0，实际下载了选中的 521,271 字节 APK。[市场搜索与下载结果](linux-native.json)

在 Android TV API 36 模拟器上，同一批六份签名 APK 同时安装成功，系统可分别启动，每款均请求了对应的作者域名。分两轮复核，六款各自都完成过用遥控器打开中文指南、继续、按返回键再开指南、选择退出并返回先前的电视设置页。四款在受控网络下取得完整按键记录，《金库大盗》和《飞天涂色巴士》在真实作者页上完成全流程。真实网络轮次中其余四款的焦点或界面快照取证未走完，未使用实体电视。[逐款对照和原始记录](android-tv.json) · [既有六款原作的电视游玩进度](../../../resource/apps/hosted-games/docs/android-tv.md)

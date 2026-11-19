# Windows 0.1.0 原包交付

[安装 EXE](../../NightRacer-0.1.0-windows-x64-setup.exe)（21,423,109 字节）与 [便携 ZIP](../../NightRacer-0.1.0-windows-x64.zip)（21,323,745 字节）均为原始 Windows CI 产物，未重新编译或打包。来源与哈希见 [Windows 清单](../../windows-release.json) 和 [SHA256](../../SHA256SUMS.txt)。需要 Windows 10 1903+／Windows 11 x64、Microsoft Edge WebView2 Runtime 及 WebGL 2；未做 Authenticode 签名。

构建与实际运行来自 [流程 44615299245](https://github.com/ecojust/pureTV/actions/runs/44615299245)，源码 `6c7cb4fdb99dce236b634c842326bae6aed5f232`。本款 `verify (night-racer)` 成功，正常端口 63485 与占用回退两种模式各 10 项通过，包含原 SDK、实际游戏、暂停/断线/失焦取消、重连不自动继续、真实存档重启。原安装、卸载、重装与无关文件保留检查也通过。96 DPI 下实际窗口为 960×540、1280×720，结束后恢复显示模式。

同批 Ponpoko Kart、Backroad Rally、Turbo Kart Rush、Kart Royale 的原运行仍为失败，整批结论仍为 failure。本次原导出任务成功，四款成功游戏分别保留，不把整批失败改成通过；不可变导出为 `6dc14b79a364dc8679f370f17099e0636acef356`。更早 Windows 失败也保留在共享 attempts 目录，本次没有重新运行原包。

原包审计检查本款 213 个固定 Git 输入、ZIP 内全部 37 个应用文件、AMD64 PE 身份与当前 dist 对应字节，并绑定原安装和两份运行报告。实际审计脚本为 [executed-original-package-audit.py](executed-original-package-audit.py)，执行结果为 [original-package-audit.json](original-package-audit.json)；独立检查见 [independent-verification.json](independent-verification.json)。脚本中的 scratch 路径记录当时实际执行环境，不能把本文当作新执行结果。

本目录的 [原文件索引](retained-original-files.json) 保存逐字节相同的构建、安装、bootstrap、两模式报告和全部 12 张原截图，是完整证据的子集；原 evidence-manifest 中其余文件可由共享 [原证据核验索引](../../../shared/windows/docs/attempts/44615299245/bounded-report-verification.json) 和固定导出查找。目视范围及具体布局观察见 [visual-review.json](visual-review.json)。960×540 截图为连接前菜单，完整 ID 的目视检查来自 1280×720 赛中、暂停和重连图，未把首屏菜单视为 960 连接卡验证。

尚未测试其他 DPI 缩放、实体手柄或完整通关。Android、macOS 的原包、签名和各自限制保持原记录。开发环境通过硬链接放置原包与证据，Git 提交中的文件字节保持相同。

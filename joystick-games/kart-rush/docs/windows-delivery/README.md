# Windows 0.1.0 原包交付

安装 EXE 为 1,037,069 字节，便携 ZIP 为 957,533 字节，均为原始 Windows CI 产物，未重打包。版本与哈希见 [Windows 清单](../../windows-release.json)。需要 Windows 10 1903+ / Windows 11 x64 及 Microsoft Edge WebView2 Runtime；包未做 Authenticode 签名。

原生构建与运行来自 `44606210717`，源码 `c5ad63e8c6a0ccfada5f763d1d26afa27f45002e`。原 `verify (kart-rush)` 任务成功，正常端口 63485 与占用回退 56507 两种模式各 10 项通过；实际安装／卸载／重装及无关文件保留也通过。96 DPI 下实际窗口为 960×540 和 1280×720，显示模式结束后恢复。两次原生存档重启均删除 WebView 缓存后重新加载，保存内容与初始恢复内容一致。

原同批七款游戏失败，导出任务也因 Windows 路径分隔符问题失败，原流程整体结论仍为 failure。只读复验 `44610944515` 使用读取器源码 `ce7599f58a5f6228622c0b3949a3e43aea5ac146`，仅选择已成功的 Kart Rush；未重编译或重新运行游戏。其验证原始源、原始包、安装报告与两份运行报告后导出到不可变提交 `86a2367b8e814942b1782f1e08316f8ef7af3b5a`。

本地独立复核 113 份导出文件、129 个原始 Git 源文件、便携 ZIP 中全部 32 个应用文件及 AMD64 PE 身份，当前 `dist/` 与包内对应资源逐字节一致。64 份相同证据按 SHA256 复用既有归档，仅下载 49 份独有文件；两个安装文件最终各保留一份。已查看原 960×540 菜单与 1280×720 实际赛中截图，姓名键盘、比赛 HUD、手柄身份可见，身份长文本换行显示。详见 [独立验证](independent-verification.json) 和 [原始证据索引](../../../shared/windows/docs/attempts/44610944515/local-verification-index.json)。

以上为原 SDK 与 Windows CI 的实际运行，未声明实体手柄、其他 DPI 缩放或完整通关。Android 和 macOS 的包与限制保持各自记录。

# Windows 0.1.0 原包交付

安装 EXE 为 392,836 字节，便携 ZIP 为 310,608 字节。两个文件均为原始 Windows CI 产物，没有重打包；版本与哈希见 [Windows 清单](../../windows-release.json)。Windows x64 包未做 Authenticode 签名，需要系统安装 Microsoft Edge WebView2 Runtime。

原生构建与运行来自 `44605307930`，源码 `b7b7af12f1eb61f777d89edad7368a69a14bb9e3`。原 `verify (sugarplum-drop)` 任务成功，正常端口 63485 与占端口回退 49753 两种模式各 10 项通过；原安装／卸载／重装及无关文件保留也通过。96 DPI 下实际窗口为 960×540 和 1280×720，CI 显示模式在每种模式结束后恢复。两次原生存档重启均删除 WebView 缓存后重新加载，保存内容和初始恢复内容一致。

原流程的导出任务因 Windows 路径分隔符无法被 Linux 直接读取而失败，原整体结论保留。只读复验 `44610221220` 使用独立读取器源码 `ce7599f58a5f6228622c0b3949a3e43aea5ac146`，未重编译或重新运行游戏；它验证原始源、原始包、原始安装报告和两份运行报告后导出到不可变提交 `90537327e856c6a570097372746f6c56086fb5aa`。

本地独立复核了 115 份导出文件、111 个原始 Git 源文件、便携 ZIP 内全部 12 个应用文件及实际 AMD64 PE 身份。当前 `dist/` 与包内对应资源逐字节一致。103 份相同原证据直接按 SHA256 复用既有归档，仅下载 12 份独有文件，安装包最终各保留一份于本游戏目录。详见 [独立验证](independent-verification.json)、[原始证据索引](../../../shared/windows/docs/attempts/44610221220/local-verification-index.json) 和 [原生运行记录](../../../shared/windows/docs/attempts/44605307930/README.md)。

原 SDK 与 Windows CI 图形运行不等于实体手柄测试；未声明其他 DPI 缩放或完整通关。这是既有 Sugarplum Drop 的 Windows 宿主样本，不计入九款新赛车交付。

# 远端 Mac 发布包不应阻断 Windows 源选择

固定源 `232d5440` 的 Backroad 已将超过 Git 大小限制的 Mac 包放在明确的 GitHub Release 资产中。本地执行该固定源的原 windows-inputs.py 必然在“Missing or symlinked published package”停止，因为它仍要求源码目录里存在两份远端包。原 Windows run 44628818020 的 Backroad build 已失败，但整体运行进行中时原 build.log 尚未可取；本记录不把本地复现冒称已读到原 CI 首个错误。

修复仅用于显式 `storage: github-release-asset` 的 Mac 项：原文件名、扩展、别名、大小、SHA 校验仍先执行；releaseTag 必须匹配本游戏/version，URL 必须是本仓库该 tag 下的精确文件，releaseId/assetId 为正整数。本地若出现同名文件、目录或链接则拒绝。远端文件名不会加入任何 output 排除集合，因此不能隐藏 checkout 中缺失的原 Git 文件。

若存在 macos 索引目录，只接受 README.md 与逐项匹配全部声明的 SHA256SUMS.txt，以及原本已严格校验的本地包。两份索引自身作为源配置参与哈希；未知脚本、未声明二进制、链接、缺失/错误校验行仍拒绝。未下载或重验远端 Mac 包，不把其历史交付状态变成新 Windows 验收。

32 个 source-scope 边界和 2 个真实 Git 输入测试通过；实际 Backroad 928 文件（含 333 个 dist 文件）的完整固定 Git 路径集合检查通过。原本地失败、原元数据与实际执行源码/日志均保留；下一次只需重建 Backroad，本次 Pon/Royale 原运行保持。

# pureTV Manager 0.5.1 发布验证

- 正式发布：[desktop-v0.5.1](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.5.1)；发布时间 `2026-11-05T13:21:21Z`，非草稿、非预发布，已设为最新版本。
- 冻结源码：[`7e6959c7`](https://github.com/ecojust/pureTV/commit/7e6959c73833501a9588637c083f462b06c3accb)。发布后仅补充记录，不改变此标签或安装包。
- 正式流程：[42031341690](https://github.com/ecojust/pureTV/actions/runs/42031341690)；Windows x64、macOS ARM64、macOS Intel、Linux x64 和发布任务全部成功。

## 验证范围

- 本地生产构建与 661 条界面文案校验通过；全部 169 项 UI、7 项 SVG、3 项网络逻辑测试通过。浏览器使用模拟 bridge，未做实体电视测试。
- 四个平台均通过 Rust 核心／原生测试、官方及腾讯镜像 ADB 下载验证。Windows 和两种 macOS 完成实际 0.4.10 → 0.5.1 更新安装、正常退出／重启及数据保留验证；两种 macOS 另通过 DMG、完整签名和安装副本启动检查。
- Linux 验证实际 DEB 身份及原生更新元数据准备，**未执行系统安装**；完整 UI／SVG 及真实客户端进程与 MCP 检查通过，其中电视操作使用模拟 ADB。不能把工作流步骤名称视作实际系统安装证明。
- 原先的外部图标问题通过修复资源解决，未缩小测试范围或放宽协议，见[图标审计](release-0.5.1-logo-audit.md)。
- 发布后重新下载全部五份产物及 `SHA256SUMS.txt`，逐项核对文件集合、API 大小和 SHA256；全部一致。另读取 DEB 元数据，包名 `pure-tv-manager`、版本 `0.5.1`、架构 `amd64`。

## 正式下载文件

| 文件 | 字节数 | SHA256 |
| --- | ---: | --- |
| [pureTV-Manager-0.5.1-linux-x64.deb](https://github.com/ecojust/pureTV/releases/download/desktop-v0.5.1/pureTV-Manager-0.5.1-linux-x64.deb) | 4159606 | `cf2df79cca8efe5c4f9b232c7bf5d8ac1110a13cd509fb421ddb267c82e3eb35` |
| [pureTV-Manager-0.5.1-macos-arm64.dmg](https://github.com/ecojust/pureTV/releases/download/desktop-v0.5.1/pureTV-Manager-0.5.1-macos-arm64.dmg) | 9790181 | `65f1a7693dd12bed1687f48b5e0a6e44d3b59d86097e404bf32599ec11958560` |
| [pureTV-Manager-0.5.1-macos-x64.dmg](https://github.com/ecojust/pureTV/releases/download/desktop-v0.5.1/pureTV-Manager-0.5.1-macos-x64.dmg) | 10035420 | `b7ed4ac5e6e719bfefdf9794857d5cad097cece9d38cc1603d063e294de99f68` |
| [pureTV-Manager-0.5.1-windows-x64-portable.exe](https://github.com/ecojust/pureTV/releases/download/desktop-v0.5.1/pureTV-Manager-0.5.1-windows-x64-portable.exe) | 5519872 | `d1f3d1bf402ea496e9ac8d8a5f0d7d87dbbcacbff53c6efcda92481bfc4ddc00` |
| [pureTV-Manager-0.5.1-windows-x64-setup.exe](https://github.com/ecojust/pureTV/releases/download/desktop-v0.5.1/pureTV-Manager-0.5.1-windows-x64-setup.exe) | 2253817 | `607f9e4bb1eb3401bceaff4fa725208691ee048774eeda1ad054463609a0afb8` |

完整步骤结果及附件元数据见[机器可读验证记录](release-0.5.1-validation.json)。

## 更新渠道与限制

本次已完成 GitHub 正式发布。Gitee 固定商店的 `client/` 目录仍为 0.5.0 的 Windows 与两种 macOS 安装包；当前环境无可用上传凭据，因此未同步 0.5.1。应用内检查更新依赖该目录，GitHub 发布成功不代表应用内已能升级。可从上述正式发布页手动下载安装。

macOS 使用 ad-hoc 签名、未进行 Apple 公证；Windows 未进行商业代码签名。此次验证不包含实体电视／手机兼容性测试。

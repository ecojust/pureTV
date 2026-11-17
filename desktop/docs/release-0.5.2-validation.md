# Desktop 0.5.2 验证记录

本次补丁修复 Android 4.4 当前用户查询和旧版 df 输出导致的连接／信息读取失败，并新增离线 Info 页，解释 8 组、21 项操作的实际命令、参数和兼容性。

## 冻结源码与本地验证

- 发布源码：`12fb632ac101e877ae7db8c89a8037ec2248a049`，新注解标签 `desktop-v0.5.2`；旧版本标签保持不变。
- 核心测试：88 passed、0 failed、1 ignored。新增 12 项回归覆盖 SDK 19 用户读取、非法输出拒绝、用户切换、取消、写后核验及旧 df 格式。
- 前端：TypeScript、750 条三语文案及 Vite 构建通过；Info 专项 3/3，完整 UI 171/171 通过。
- Info 检查覆盖离线访问、三种语言／主题、命令文本保持、分组锚点、滚动保持及无执行入口。主 agent 目视 960×640 简中 emerald、英文 graphite 首屏及下方操作卡片，无页面横向越界。
- Android 4.4 能力说明已与 AOSP `android-4.4_r1` 和客户端实际实现逐项核对，详见 [ADB 调研](adb-research.md)。SDK 19 回退严格解析 `mUserLru` 最后一项，不猜测用户 0；无法确认当前用户或 HOME 时保留修改保护。

## 验证边界

- 未连接用户的实体电视；自动化核心／GUI／MCP 使用测试设备响应，不能替代厂商固件验收。
- 原生 Android 4.4 缺少管理器要求的现代 HOME 及部分用户限定写入接口。本补丁恢复信息与列表读取，不承诺安装、卸载、切换桌面等全部功能。
- macOS 使用 ad-hoc 签名且未进行 Apple 公证；Windows 未使用商业代码签名。
- 本次未向 Gitee 上传安装包；应用内更新取决于 `client/` 的实际同步版本。

## 正式发布与平台验证

- [正式标签流程 42053380987](https://github.com/ecojust/pureTV/actions/runs/42053380987) 的四个平台及发布任务全部成功，没有失败或重跑；仅取消相同源码的 master 重复流程 42053380502，标签流程保留全部门禁。
- [desktop-v0.5.2](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.5.2) 于 **2026-11-05T15:41:39Z** 公开并设为最新稳定版本；API 再核验标签解析到上述冻结源码。

| 平台 | Core 通过／忽略 | Native 通过／忽略 | 安装验证范围 |
| --- | --- | --- | --- |
| Windows x64 | 88／2 | 99／8 | 实际 0.4.10 → 0.5.2 helper 升级、关闭、重启和数据保留 |
| macOS ARM64 | 88／1 | 101／8 | 同上，另验证 DMG／安装副本签名及 5 秒启动 |
| macOS Intel | 88／1 | 101／8 | 同上，另验证 DMG／安装副本签名及 5 秒启动 |
| Linux x64 | 88／1 | 100／8 | DEB 身份和原生更新元数据准备，未执行系统安装 |

各平台核心及原生测试均 0 失败，原有忽略项保持不变。官方和腾讯两路 ADB 实际下载验证在四个平台均通过。Linux 另完成 171 项 UI、7 项 SVG、3 项 network 测试，以及实际 GUI／MCP 进程配合模拟 ADB 的保护、取消和关闭验证。

## 下载复核

五份公开产物均已重新下载，逐一核对与 Release API 的文件集合、字节数和 `SHA256SUMS.txt`；全部一致。详细 SHA256、完整 CI 步骤结果、源码与临时日志哈希保存在 [机器可读记录](release-0.5.2-validation.json)。

- `pureTV-Manager-0.5.2-linux-x64.deb`：4177234 字节。
- `pureTV-Manager-0.5.2-macos-arm64.dmg`：9804887 字节。
- `pureTV-Manager-0.5.2-macos-x64.dmg`：10049259 字节。
- `pureTV-Manager-0.5.2-windows-x64-portable.exe`：5535744 字节。
- `pureTV-Manager-0.5.2-windows-x64-setup.exe`：2268087 字节。

发布后再次读取 Gitee 公开 `client/`，现有 Windows 安装版及两个 Mac DMG 为 **0.5.1**，与本次 0.5.2 GitHub 发布不同。本次没有 Gitee 上传凭据，也未执行上传；应用内更新暂不会提供此补丁，需使用上述 GitHub 下载。

原始本地及 Actions 日志位于本次临时工作区 `/workspace/scratch/legacy-android-0.5.2/`，不是仓库永久资源；正式流程链接、计数、哈希与能力边界已在本记录和 JSON 中保留。

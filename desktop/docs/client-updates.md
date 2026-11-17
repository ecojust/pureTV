# Manager 客户端更新

Manager 会在启动后后台检查一次更新，也可点击左下角版本旁的「检查更新」。0.5.9 的检查和下载来源固定为 [apps.b14f.com/client/](https://apps.b14f.com/client/)。检查只读取目录及候选文件的元数据，用户点击「下载并安装」后才下载和启动安装。**0.5.7 及更早版本请先从 [0.5.9 发布页](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.5.9) 手动安装一次**，再使用新服务器检查后续更新。仅把文件上传到新服务器不能改变旧客户端的地址。

## 使用流程

1. 查看新版本、当前系统、包大小和来源。
2. 点击「下载并安装」，等待下载、校验与安装准备。下载和准备阶段可以取消；正在执行其他设备操作时不能开始客户端安装。
3. 管理器尝试关闭 ADB 服务后退出，由独立助手完成安装并重新打开。系统可能要求管理员授权；安装交接开始后不能取消。0.4.16 起，ADB 服务未启动会按正常情况处理，ADB 清理失败只记录日志，不再阻止 Manager 自身更新。

Windows 使用 NSIS 安装版更新；从便携版启动时会安装为标准安装版，不把安装程序当作便携文件覆盖。macOS 更新已安装的 `.app`，替换前验证新包，保留失败回退路径；如果当前直接运行在 DMG 或 App Translocation 中，需要先把应用移入 Applications。Linux 在服务器提供对应 DEB 时调用系统授权与包管理器安装，需要可用的 `pkexec` 和 `dpkg`。

检查失败会显示无法查询，缺少当前平台的包会显示尚未发布该平台，不会误报可更新。[2026-11-15 发布后核验](release-0.5.9-evidence/client-directory-after.json)时，新服务器 `client/` 目录仅提供 0.5.6 的 Windows x64、macOS ARM64 和 macOS x64 包，没有 0.5.9 或 Linux 包。本次发布未上传服务器，实际可更新版本以该目录后续上传内容为准。首次从不具备更新功能的 0.4.10 或更早版本升级，需要先手动安装一次带更新功能的新版本。

### 旧版提示无法结束 ADB

0.4.11–0.4.15 可能在下载和校验完成后提示「无法安全结束 ADB，客户端更新未启动」。例如 ADB 服务本来没有启动，官方 `adb kill-server` 仍会输出 `cannot connect to daemon`，旧版把这条正常结果误判成错误。

遇到此错误时，从 [0.5.9 发布页](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.5.9) 下载对应系统安装包，退出 Manager 后手动覆盖安装一次；无需卸载电视应用或清除 Manager 配置。macOS 将新 `.app` 拖入原安装位置并选择替换。仅在服务器上传新包不能改变旧客户端已经存在的交接逻辑。

## 服务器文件约定

把构建通过的正式发布附件原样放进服务器的 `client/` 目录，保持以下文件名即可被发现：

- `pureTV-Manager-X.Y.Z-windows-x64-setup.exe`
- `pureTV-Manager-X.Y.Z-macos-arm64.dmg`
- `pureTV-Manager-X.Y.Z-macos-x64.dmg`
- `pureTV-Manager-X.Y.Z-linux-x64.deb`

`X.Y.Z` 使用稳定的数字版本，例如 `0.5.9`。管理器对当前平台分别选择最高版本，只接受比正在运行的版本更新的包。Windows portable EXE 不作为安装器候选。目录须公开支持 HTTPS 浏览、HEAD 和文件下载，不需要 Token 或额外更新服务。发布者仍须把对应平台的正式安装包上传到该目录；GitHub Release 发布成功不会自动同步此服务器。

目录采用 Nginx HTML 自动索引，页面显示的 `9M` 等大小是近似值，不能作为校验依据。管理器选择当前平台的最高版本后，通过 HEAD 获取精确字节数和 ETag／Last-Modified，将文件路径与这些元数据形成快照。下载绑定用户看到的版本及快照，使用条件请求并复核响应元数据、实际字节数；若检测到服务器文件变化，需要重新检查更新。校验失败、取消和下载错误不会进入安装，失败或取消会清理临时文件。

当前 `client/` 目录没有提供源端内容哈希，使用 HTTP 元数据检查及本地 SHA256 回执。管理器在完整下载时计算 SHA256，复用缓存和交接安装前重新计算并核对该值，用于发现下载后或缓存中的内容变化；这不等于与发布者提供的哈希比对。市场中个别 APK 目录提供的清单不适用于客户端安装包，旧 Gitee 更新缓存也不用于新源。

## Update behavior (English)

Version 0.5.9 checks the fixed [apps.b14f.com/client/](https://apps.b14f.com/client/) directory once after startup and through the sidebar's **Check for updates** action. Only **Download and install** starts a package download. The manager matches the running platform, compares numeric stable versions, and binds the download to the displayed version and a snapshot of the selected file's path, exact byte count and HTTP validators. Missing platform packages and network failures are distinguished from an up-to-date client. Clients at 0.5.7 or earlier do not switch download sources automatically. First manually install [0.5.9 from GitHub](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.5.9), then use the new server to check for later updates.

The server was checked after release on 2026-11-15: `client/` contains only the 0.5.6 Windows setup and two macOS packages, with no 0.5.9 or Linux package. This release did not upload files to the server; get 0.5.9 from the GitHub link above.

The HTML listing has rounded sizes, so the selected file is checked with HEAD. Conditional downloads and response metadata checks reject detected changes. The `client/` directory currently supplies no publisher content hash. SHA256 calculated during the complete download is saved in a local receipt and checked again before cache reuse and installation; this is local integrity verification. Checksums published for individual APKs do not cover client installers. Old Gitee download caches are isolated from the new source. Uploading a GitHub Release does not automatically upload packages to this server.

After verification and preparation, the manager attempts to stop ADB, exits and hands installation to a separate helper. Starting with 0.4.16, an absent ADB daemon is a normal result and cleanup failures are logged without blocking Manager updates. Package verification and installer errors still stop the update. Windows uses the standard NSIS installer; portable users move to the installed edition. macOS replaces an installed app bundle with recovery on replacement failure; first move an app running inside a DMG or App Translocation to Applications. Linux requires a published DEB plus `pkexec` and `dpkg`. Native authorization may be requested. Versions without this updater need one manual upgrade first.

Clients at 0.4.11–0.4.15 can reject a successful `adb kill-server` command when its output says `cannot connect to daemon`. If an update stops with an ADB shutdown error, close Manager and manually install 0.5.9 from the release page above. Replace the existing app and keep its settings. Uploading a newer package to the server cannot fix the handoff code already running in the old client.

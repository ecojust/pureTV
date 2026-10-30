# Manager 客户端更新

Manager 0.4.11 起会在启动后后台检查一次更新，也可点击左下角版本旁的「检查更新」。检查来源固定为 [pure-tv-store 的 client 目录](https://gitee.com/juzisang331/pure-tv-store/tree/master/client)。检查只读取目录，用户点击「下载并安装」后才下载和启动安装。

## 使用流程

1. 查看新版本、当前系统、包大小和来源。
2. 点击「下载并安装」，等待下载、校验与安装准备。下载和准备阶段可以取消；正在执行其他设备操作时不能开始客户端安装。
3. 管理器结束 ADB 连接后退出，由独立助手完成安装并重新打开。系统可能要求管理员授权；安装交接开始后不能取消。

Windows 使用 NSIS 安装版更新；从便携版启动时会安装为标准安装版，不把安装程序当作便携文件覆盖。macOS 更新已安装的 `.app`，替换前验证新包，保留失败回退路径；如果当前直接运行在 DMG 或 App Translocation 中，需要先把应用移入 Applications。Linux 在仓库提供对应 DEB 时调用系统授权与包管理器安装，需要可用的 `pkexec` 和 `dpkg`。

检查失败会显示无法查询，缺少当前平台的包会显示尚未发布该平台，不会误报可更新。当前 `client` 目录已有 Windows x64、macOS ARM64 和 macOS x64 包；尚无 Linux 包。首次从不具备更新功能的 0.4.10 或更早版本升级，需要先手动安装一次带更新功能的新版本。

## 仓库文件约定

把构建通过的发布附件原样放进 `client/`，保持以下文件名即可被发现：

- `pureTV-Manager-X.Y.Z-windows-x64-setup.exe`
- `pureTV-Manager-X.Y.Z-macos-arm64.dmg`
- `pureTV-Manager-X.Y.Z-macos-x64.dmg`
- `pureTV-Manager-X.Y.Z-linux-x64.deb`

`X.Y.Z` 使用稳定的数字版本，例如 `0.4.12`。管理器对当前平台分别选择最高版本，只接受比正在运行的版本更新的包。Windows portable EXE 不作为安装器候选。仓库不需要新增 Token、更新服务或 manifest；发布者仍须把对应平台的正式安装包上传到该目录。

检测先将默认分支解析为固定提交，下载绑定用户看到的版本及该提交；校验 Git blob SHA、字节数，并在交接安装前复核 SHA256。原始下载接口返回 403 时，32 MiB 以内的包会尝试同一提交对应的 Git blob 接口，校验规则相同。校验失败、取消和下载错误不会进入安装。

## Update behavior (English)

Manager 0.4.11 and later check the fixed Gitee `client/` directory once after startup and through the sidebar's **Check for updates** action. Only **Download and install** starts a package download. The manager matches the running platform, compares numeric stable versions, and binds the download to the displayed version and repository commit. Missing platform packages and network failures are distinguished from an up-to-date client.

After verification and preparation, the manager stops its ADB connection, exits and hands installation to a separate helper. Windows uses the standard NSIS installer; portable users move to the installed edition. macOS replaces an installed app bundle with recovery on replacement failure; first move an app running inside a DMG or App Translocation to Applications. Linux requires a published DEB plus `pkexec` and `dpkg`. Native authorization may be requested. Versions without this updater need one manual upgrade first.

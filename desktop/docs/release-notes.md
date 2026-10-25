# pureTV Manager 0.4.2

- 在「启动器」后新增「市场」，分为应用和启动器，动态读取 [pure-tv-store](https://gitee.com/juzisang331/pure-tv-store) 仓库中的 APK 和封面，支持搜索与刷新。
- 无需连接电视即可下载到对应待安装列表；连接后支持下载并安装，安装失败保留已下载文件，启动器安装后可自行选择默认桌面。
- 下载固定仓库提交，核对文件大小与 Git blob SHA，支持取消；网络失败可使用已缓存目录并显示提示。
- 市场支持三种界面语言、现有主题与列表内部滚动；下载安装共用全局进度和结果反馈。
- MCP 新增市场目录、下载与安装工具，共 34 个工具；Agent 操作与界面同步。

[全部电视 APK、源码与截图](https://github.com/ecojust/pureTV/tree/master/resource)。电视 APK 位于资源目录，Release 仅发布电脑管理器。

Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；SHA256SUMS.txt 提供校验。macOS 为 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。原生渲染和自动测试不等于电视实机测试。

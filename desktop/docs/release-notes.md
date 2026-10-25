# pureTV Manager 0.3.9

- 启动器卡片自动跟随 layout.json 的 Home 背景颜色和图片，支持未激活启动器与纯色背景；进入列表、扫描及应用／重置布局后同步刷新。
- 移除启动器列表中的选择／移除封面操作。背景统一通过「调整布局」修改并应用，本地旧封面不覆盖协议背景。
- 待安装 APK 优先预览内置 Home 背景，只有没有可用布局背景时才使用同目录缩略图。
- 配套更新 10 款启动器与 Music TV、ShortVideo TV、WebTV 的英文支持。切换语言保留启动器用户布局，系统组件仍只读。
- 英文 README 使用真实英文界面预览及全英文资源表，保留 APK 大小、来源、作者与校验信息。

[全部电视 APK、源码与截图](https://github.com/ecojust/pureTV/tree/master/resource)。电视 APK 位于资源目录，Release 仅发布电脑管理器。

Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；SHA256SUMS.txt 提供校验。macOS 为 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。原生渲染和自动测试不等于电视实机测试。

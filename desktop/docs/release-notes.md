# pureTV Manager 0.3.8

- 修复布局画布的小尺寸组件被通用按钮最小高度撑大，v5 的位置和尺寸按 JSON 正确重现。
- 按已安装 HOME 启动器的标准接口动态检测布局能力，符合协议即可编辑，无需注册包名；GUI 与 MCP 共用读写和校验路径。
- 配套发布八款独立 v5 启动器：Aster、Sol、Moss、Forma、Mono、Drift、Circuit、Pixel。每款提供 APK、源码、布局示例及原生渲染预览。
- Nova TV 0.1.1 重新设计为大幅峡湾背景、底部六个应用入口、小号状态信息与控制中心；保留旧版自定义配置。

[全部启动器与 APK 下载](https://github.com/ecojust/pureTV/tree/master/resource/launcher)。电视 APK 位于资源目录，Release 仅发布电脑管理器。

Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；SHA256SUMS.txt 提供校验。macOS 为 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。原生渲染和自动测试不等于电视实机测试。

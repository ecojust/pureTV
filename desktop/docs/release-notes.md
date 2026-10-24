# pureTV Manager 0.3.7

- 动态检测已安装启动器的布局协议接口，符合规范即可编辑；不再按包名硬编码，第三方接入无需更新管理器。
- 新增 Nova TV 启动器的 layout v5 布局读写与背景预览支持，可从管理器安装、激活并调整其已安装用户应用。
- Nova TV 0.1.0 采用 Apple TV 风格的深色桌面、圆角应用卡片与清晰的遥控器焦点；Home / Apps 页面、背景、用户应用位置和颜色均由 layout v5 描述。
- 修复布局属性失焦时重复渲染导致的错误提示。
- 继续支持 pureTV Launcher 0.3.6，两个启动器使用独立包名和布局存储，可以并存。

[Nova TV APK、界面预览及源码](https://github.com/ecojust/pureTV/tree/master/resource/launcher/nova)。电视 APK 位于资源目录，Release 仅发布电脑管理器。

Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；SHA256SUMS.txt 提供校验。macOS 为 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。自动渲染测试不等于电视实机测试。

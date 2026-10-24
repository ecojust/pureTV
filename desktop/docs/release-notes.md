# pureTV Manager 0.3.6

- 配套 Launcher 0.3.6 使用 layout v5，文字 textColor、SVG iconColor 和 backgroundColor 独立定义；系统背景默认透明。
- 启动器改用浅色底、柔和配色卡片与常用应用 SVG；SVG 栅格化后显示，避免 TV 硬件画布不绘制 PictureDrawable。
- 调整布局弹窗的屏幕基准仅显示，按钮缩小；顶部单个按钮添加应用块，新增后在右侧切换 action。
- 当前组件名称和选择入口放在右侧，「显示组件」switch 紧跟组件类型；系统组件保持只读。
- v3/v4 用户布局升级迁移，保留用户应用、位置与背景；新管理器仍支持旧协议。
- Music TV 0.1.2 修复音频分段解析、加入超时和随机播放；启动器资源统一放在 resource/launcher/<名称>/。
- 开发与完整协议规范见 resource/README-development.md，资源表显示 APK 实际大小。

使用新布局请同时升级管理器和 [pureTV Launcher 0.3.6](https://github.com/ecojust/pureTV/tree/master/resource/launcher/puretv)。电视 APK 位于资源目录，Release 仅发布电脑管理器。

Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；SHA256SUMS.txt 提供校验。macOS 为 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。自动渲染测试不等于电视实机测试。

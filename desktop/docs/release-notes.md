# pureTV Manager 0.3.5

- 布局协议升级为 v4：screen 定义坐标基准；Home/Apps 各自保存 users、只读 system、background、navigation。
- 组件统一提供 id、名称、文案、坐标尺寸、显隐、SVG 图标、action 应用标识、前景色和背景色。系统组件不可移动或修改，GUI、导入、MCP、电视接口采用同一保护。
- 添加应用、屏幕基准和只读 JSON 查看器移到顶部；移除列数与层级，统一下拉框高度。
- 支持框选、多选移动、上下左右对齐、居中、水平／垂直分散以及水平／垂直／网格平铺。
- 启动器列表默认采用 Home 背景，支持未激活启动器的只读背景查询，保留手动封面覆盖。
- 两页独立自定义背景图片，修复 hover 导致背景平铺；Mac 背景导入支持 JPEG 回退。
- 恢复 Home 最后一行按下进入 Apps；Apps 最上面按上返回，行为由 navigation 定义。
- 同步更新电视启动器为 0.3.5（沿用原签名）、文档、源码和场景示例。使用新布局需升级两端。

保留 0.3.4 的退出清理 ADB、网段提醒、多语言、换肤和全局关闭滚动回弹。Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；校验清单见 SHA256SUMS.txt。

macOS 为 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。电视 APK 从 [resource/launcher](https://github.com/ecojust/pureTV/tree/master/resource/launcher) 下载，Release 仅发布电脑管理器。测试渲染不是电视实机录屏。

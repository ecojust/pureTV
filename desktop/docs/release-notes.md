# pureTV Manager 0.4.4

- 修复重新打开布局编辑器时恢复旧缓存的问题。安装、停用或卸载应用后，MossTV 等支持 layout.json 的启动器会使用重新读取的布局，避免旧应用块阻止添加央视直播等新应用。
- 应用布局前重新读取电视的应用状态，保留当前正在编辑的草稿。只有当前用户已安装、已启用且可启动的用户应用可以作为应用块的目标。
- 不可用的应用块会标明所在页面、组件名称和包名，并可定位到对应组件修改或移除；Home 与 Apps 两页都会检查，隐藏的旧组件也会明确提示。

[全部电视 APK、源码与截图](https://github.com/ecojust/pureTV/tree/master/resource)。电视 APK 位于资源目录，Release 仅发布电脑管理器。

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；文件校验值见 SHA256SUMS.txt。macOS 为 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。电视实机兼容性仍需安装验证。

# pureTV Manager 0.4.6

- 市场下载应用或启动器时，一并获取同目录的 `logo.svg`，校验后保存在本机。根据 APK 内的真实包名关联图标，重新打开管理器后仍可使用。
- 在启动器布局编辑器中新增应用块、或明确切换 action 对应应用时，自动将已保存的 SVG 填入 `icon` 属性。读取已有布局、选择组件和刷新应用列表时，保留用户手动修改的图标；缺失图标的旧应用继续使用默认图标。
- 图标使用现有 layout.json 的静态 SVG 子集和 8 KiB 限制，不增加启动器协议版本。图标下载失败或文件不符合规则时，不阻止 APK 下载和安装。
- 资源目录中的 9 个电视应用均提供 `64×64` 的 `logo.svg`，附下载链接、校验值和第三方图标来源说明；开发文档新增后续应用的交付规范。

同步更新 [Tank TV 0.3.0](https://github.com/ecojust/pureTV/tree/master/resource/apps/tank)：修复旧电视 WebView 的黑屏及扫码后玩家状态不更新，提供新的坦克图标。真实 Chromium 61 已验证 APK 网页资源的游戏运行与玩家连接，尚未完成电视实机验证。

提供 Windows x64 安装版／便携版、macOS ARM64／Intel DMG、Linux x64 DEB；文件校验值见 SHA256SUMS.txt。macOS 为 ad-hoc 签名，未进行 Apple 公证；Windows 未进行商业代码签名。电视 APK 和源码继续在 [resource](https://github.com/ecojust/pureTV/tree/master/resource) 分发。

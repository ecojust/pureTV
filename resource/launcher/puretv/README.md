# pureTV Launcher 0.3.7

作者：ecojust / 桔子桑。包名 com.ecojust.puretv，沿用 0.2.0 发布证书，可直接升级。

[下载 APK](pureTV-0.3.7.apk?raw=1) · [对应源码](source.tar.gz) · [layout.json 示例](layout.example.json) · [规范与画面对照](../../README-development.md#layoutjson-协议规范与画面对照) · [SHA256](SHA256SUMS.txt)

支持 layout.json v5：screen 屏幕基准，Home/Apps 独立 users、只读 system、背景和方向键导航。用户块对应已安装 APK，使用包名 action 与原始 SVG 图标；textColor 和 iconColor 分别设置文字与图标颜色。系统组件背景默认透明，SVG 栅格化为位图后显示，兼容 TV 硬件画布。默认块来自已安装用户应用；可由管理器框选、多选对齐／分散／平铺。系统组件只能查看。管理器的屏幕基准只读，顶部用单个按钮添加应用块，action 在右侧选择；显隐 switch 位于组件类型下方。两页支持独立背景，Home 按下进入 Apps、Apps 按上返回，由 JSON 配置。

![首页渲染示例](thumb.png)

![其他应用页渲染示例](apps.png)

图片由对应版本的实际 Android 页面在 Robolectric 原生图形环境中渲染，非实机录屏。源代码树、构建记录、APK 哈希与发布证书见 [resource.json](resource.json)。许可证及上游致谢见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。

升级会迁移旧版 v3/v4 的用户应用、位置和背景，并采用新版系统组件样式。编辑新布局需配套 Manager 0.3.6；发布 APK 沿用原证书，可覆盖安装。

已有自定义布局会保留。若要采用新版默认排版与配色，请在管理器的「调整布局」中选择「恢复默认」。

界面语言跟随 Android 的应用／系统语言：中文使用 `layout.json`，英文及其他非中文语言使用 `layout.en.json`。切换语言会保留已保存的用户应用位置、颜色、操作和背景，只读系统组件采用当前语言的文案。英文布局示例见 [layout.example.en.json](layout.example.en.json)；用户自己填写的应用名称不会自动翻译。

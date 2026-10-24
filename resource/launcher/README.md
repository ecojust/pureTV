# pureTV Launcher 0.3.5

作者：ecojust / 桔子桑。包名 com.ecojust.puretv，沿用 0.2.0 发布证书，可直接升级。

[下载 APK](pureTV-0.3.5.apk?raw=1) · [对应源码](source.tar.gz) · [layout.json 示例](layout.example.json) · [规范与画面对照](../../README.md#layoutjson-规范与画面对照) · [SHA256](SHA256SUMS.txt)

支持 layout.json v4：screen 屏幕基准，Home/Apps 独立 users、只读 system、背景和方向键导航。用户块对应已安装 APK，使用包名 action 与原始 SVG 图标。默认块来自已安装用户应用；可由管理器框选、多选对齐／分散／平铺。系统组件只能查看。两页支持独立背景，Home 按下进入 Apps、Apps 按上返回，由 JSON 配置。

![首页渲染示例](thumb.png)

![其他应用页渲染示例](apps.png)

图片由对应版本的实际 Android 页面在 Robolectric 原生图形环境中渲染，非实机录屏。源代码树、构建记录、APK 哈希与发布证书见 [resource.json](resource.json)。许可证及上游致谢见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。

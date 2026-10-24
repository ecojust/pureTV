# users/system 布局编辑

pureTV Manager 和 Launcher 0.3.5 使用版本 4 布局。顶层 screen 设置屏幕基准；Home、Apps 分别定义 users、system、background、navigation。完整字段与示例见[README](../../README.md#layoutjson-规范与画面对照)及[示例文件](../../resource/launcher/puretv/layout.example.json)。

## 编辑工作区

顶部切换 Home/Apps、设置屏幕基准、选择已安装用户应用并添加块、设置当前页背景／上下键切页规则、导入配置或查看完整 JSON。没有每行列数；所有块都有明确坐标和尺寸。查看 JSON 只显示可选择复制的文本。

右侧显示名称与 id，然后是坐标／宽高、显隐、SVG、action、颜色和背景色。系统组件的值全部只读，不能移动；用户块可以修改。action 选择器只提供已安装、启用、可启动的用户 APK。SVG 是原始文本，不再使用图标枚举；不接受脚本或外部资源。

空白处拖动框选用户块；Ctrl/Command 点击增减选择，Shift 点击追加。选中多个块后可一起拖动，或从顶部使用上下左右对齐、水平／垂直居中、水平／垂直分散、水平／垂直／网格平铺。分散保持选区边界并均分空隙，空间不足则提示；平铺使用可用页面区域自动计算位置和尺寸。系统组件不参与批量排布。

## 背景与导航

Home 和 Apps 的背景分别保存于各自 background。颜色与图片覆盖整个设计画面，图片居中 cover、不重复；不是可 hover 的组件。管理器支持本地 PNG/JPEG/WebP 图片，自动压缩嵌入 JSON；Mac 使用 JPEG 编码回退。启动器列表卡片默认跟随 Home 背景图片，未激活的已适配启动器也可读取；手动封面或 thumb.png 可覆盖此默认图片。

navigation.down="apps" 使 Home 在最后一行用户块按下进入 Apps；navigation.up="home" 使 Apps 在最上面按上返回。无用户块时也可切页；删除方向键定义则不切页。切换默认启动器通常无需重启电视，按 Home 即可。

## 保存与兼容

导入、拖动或属性编辑只改本地草稿；取消放弃。应用前检查真实应用、SVG、屏幕边界及只读系统列表，电视写入后读回核对。MCP get_launcher_layout / apply_launcher_layout 使用相同结构和保护规则，不能绕过系统只读约束。

版本 3 的用户包名、名称、坐标及两页背景迁移到 v4；旧图标枚举使用默认 SVG，可再自定义。系统组件采用新版启动器模板。旧 apps.json 不读取。未升级 APK 时管理器保留旧 v2/v3 网格或场景编辑。

整个文件最多 90 KiB，单 SVG 最多 8 KiB，单背景 data URI 最多 33,000 字符；只允许数据配置，无任意 Intent 或 shell。

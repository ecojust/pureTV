# pureTV 开发与协议文档

本文面向启动器作者、管理器开发者和 MCP 集成开发者。普通安装和使用见[项目首页](../README.md)，APK 资源见[资源目录](README.md)。下列构建命令从仓库根目录开始。

<a id="layoutjson-规范与画面对照"></a>

## layout.json 协议规范与画面对照

### 协议的职责与结构

`layout.json` 是连接电视启动器与电脑管理器显示的**协议文件**，不是管理器私有的草稿格式。启动器负责提供系统组件、可启动应用及当前配置，管理器按同一坐标和字段绘制画布；用户确认后，将修改后的协议写回启动器并读回核对。电视端与管理器共同验证字段，不能只改一端的 JSON 格式。

pureTV Manager 与 Launcher **0.3.5 使用 layout.json v4**。布局由电视和管理器共同读取：顶层 `screen` 定义坐标基准，`home` 和 `apps` 各自包含 `users`、`system`、`background`、`navigation`。不要把屏幕物理分辨率与设计坐标混为一谈；例如基准为 1920×1080，x=960 表示设计画面的水平中点。不同电视分辨率等比缩放，比例不同则留边。

- **users**：可编辑的应用块，`action` 直接使用当前用户已安装、启用且可启动的非系统 APK 包名。可修改位置、尺寸、名称、文案、显示状态、SVG 图标、颜色与背景色。
- **system**：启动器提供的时钟、日期、天气、桌面设置、收藏、输入源、网络、设置、页面入口等系统组件。可以选择和查看，不能拖动、框选排布或修改属性；导入、MCP 和电视接口同样保护这些组件。调整屏幕基准时仅按比例转换其坐标，不改变布局位置。
- **background**：该页独立的背景颜色与可选图片，与组件属性分开。Home 与 Apps 可以使用不同图片。图片存储在 JSON 中，不引用电脑路径；hover 不改变图片的覆盖与居中方式。
- **navigation**：方向键到达当前用户块最上／最下边缘时的切页规则。默认 Home `down: "apps"`，Apps `up: "home"`，恢复首页按下进入应用页的行为；省略某个方向则不切页。

完整示例：[layout.example.json](launcher/layout.example.json)。示例应用来自资源目录，需要先在电视安装对应 APK。`system` 必须使用当前启动器返回的完整内容，不要自行增删或修改。以下为用户块和页面属性的结构片段：

```json
{
  "version": 4,
  "screen": {"width":960,"height":540},
  "home": {
    "background": {"color":"#101419"},
    "navigation": {"down":"apps"},
    "users": [{
      "id":"app-webtv",
      "name":"WebTV",
      "text":"电视直播",
      "frame":{"x":48,"y":220,"width":200,"height":150},
      "action":"com.ecojust.webtv",
      "visible":true,
      "icon":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M2 2h20v20H2z\"/></svg>",
      "color":"#EEEEEE",
      "backgroundColor":"#374959"
    }],
    "system": []
  },
  "apps": {
    "background":{"color":"#16222D"},
    "navigation":{"up":"home"},
    "users":[],
    "system":[]
  }
}
```

上例省略了只读 system 内容以便阅读，不能直接替代完整配置；请使用完整示例或 MCP 返回的配置。

### 每个字段的含义

| 字段 | 规则 |
| --- | --- |
| `version` | 必需整数，当前为 4，用来识别协议版本；不接受未知版本 |
| `screen` | 必需对象，包含 width 和 height，不是组件，也没有 action |
| `home` / `apps` | 必需页面对象，分别代表主页与其他应用页；每页必须包含下面四个字段 |
| `users` | 用户组件数组，可增删、移动和改属性；同一页 action 包名不能重复 |
| `system` | 启动器提供的系统组件数组，顺序及每个字段均只读；变更屏幕基准时坐标按各轴比例换算 |
| `background` | 必需页面外观对象；color 必需、image 可选，作用于整页背景，不是可交互的组件 |
| `navigation` | 必需对象，可为空；up/down 分别定义到达用户块上／下边缘时的页面切换，值为 home/apps |
| `screen.width` / `screen.height` | 320–7680 的整数；所有 frame 坐标和尺寸均以此为基准。界面修改基准会按各轴比例换算已有块；直接编辑 JSON 时则按文件中的具体数值显示 |
| `users` / `system` | 每页内 id 不重复；首页最多 24 个用户块，应用页最多 100 个；system 为启动器提供的只读列表 |
| `id` | 组件标识，1–100 字符，字母、数字、短横线或下划线；右侧显示，应用块创建后保持稳定 |
| `name` / `text` | 组件名称／画面文案，各最多 100 字；时钟、天气、网络等系统内容按电视实时状态或语言显示 |
| `frame` | 必需 `{x,y,width,height}`；整数，x/y≥0，宽高≥1，边界不能超出 screen |
| `action` | 必需的 `com.xxx.xxx` 形式标识。用户块为真实 APK 包名；系统组件没有独立 APK 时使用启动器定义的组件标识，由 id 和 action 一起表示固定功能 |
| `visible` | 必需布尔值。用户块可显隐；系统值只读。编辑器中隐藏块淡显以便恢复，电视上不显示 |
| `icon` | 直接存储 SVG 文本，最多 8 KiB，不再使用 music/apps 等枚举名。支持 svg/g/path/rect/circle/ellipse/line/polyline/polygon 与常用静态绘制属性；不支持脚本、事件、外部资源、image、style、DTD。`currentColor` 使用组件 color |
| `color` / `backgroundColor` | 组件前景／背景颜色，必需 #RRGGBB；没有层级属性，也没有每行列数 |
| `background.color` / `background.image` | 页面背景色，以及可选 PNG/JPEG/WebP data URI。单张图片最多 33,000 字符、解码尺寸≤1920×1080；导入时自动缩放压缩，WebKit 不支持 WebP 编码时使用 JPEG |
| `navigation` | 可选方向 up/down 的目标 home/apps；上下键在用户块边缘生效，Home 下键和 Apps 上键默认切到另一页 |

`frame.x`、`frame.y` 分别是组件外框左上角到屏幕基准左边、上边的距离；`frame.width`、`frame.height` 是整个组件外框的宽和高（应用块包含图标卡面与下方文案）。它们都是设计坐标单位，不是当前管理器窗口的 CSS 像素，也不是固定电视 dp。改变管理器窗口大小不改变 JSON。

`name` 用于编辑器识别组件；`text` 是画面文案，二者可以不同。`color` 用于文案与 SVG 的 currentColor，SVG 内显式 fill/stroke 保持原值。空 SVG 表示没有自定义静态图形；时钟、天气等系统组件的实时内容和内部图形仍由相应功能生成。`visible=false` 不删除数据，之后可从组件列表重新选择用户块并恢复显示。组件不包含层级字段，固定系统组件由启动器管理，用户块按列表顺序绘制。

`background.image` 是完整 `data:image/png;base64,...`、`data:image/jpeg;base64,...` 或 `data:image/webp;base64,...` 字符串；省略表示只绘制 color。图片按 cover 居中覆盖，不重复平铺。图片只保存在其所在页面，不会自动覆盖另一页。启动器列表卡片默认使用 Home 背景图，已有手动封面优先；从 APK 导入时也可读取 assets/layout.json 中的默认 Home 背景。

读取接口额外返回只读 `systemBasis` 元数据（screen/home/apps），保存启动器提供的系统组件原始基准。它不写入 layout.json，用于屏幕基准多次缩放时避免整数舍入累积，确保管理器与电视仍计算出相同系统位置。

读取：管理器仅对已适配并验证的布局接口绘制可编辑画布；写入：检查 action 是否仍可启动、SVG 是否有效、frame 是否越界、system 是否发生修改。任一失败都不覆盖上一份有效布局。MCP 与 GUI 走同一读写路径；读取未激活启动器的 Home 背景不需要先激活它。

文件为 UTF-8，整体最多 **90 KiB**。旧版 v3 已保存的用户应用块及背景可迁移；原系统组件回到新版启动器提供的位置。管理器仍能连接旧 APK 的 v2/v3 接口；要使用新协议，需同时升级电视启动器。**不读取旧版 apps.json。**

### 文件与画面对照

| 配置与画面 | 管理器示例 |
| --- | --- |
| 完整示例的 Home：上方固定系统组件，下方可框选的用户应用块 | ![Home 用户与系统组件](../docs/previews/layout-v4-home-035.png) |
| 完整示例的 Apps：独立背景与用户应用布局 | ![Apps 页面](../docs/previews/layout-v4-apps-035.png) |
| 框选用户块后，上对齐、左右分散、水平／垂直／网格平铺 | ![多选排布](../docs/previews/layout-v4-multiselect-035.png) |

添加应用、屏幕基准、背景设置和「查看 layout.json」均在顶部；JSON 查看器只显示文本，不写入电视。右侧按组件名称/id、坐标尺寸、显隐、SVG、action、颜色顺序显示。Ctrl/Command 点击可切换多选，Shift 点击追加；空白处拖动框选，只选择用户块。系统组件固定，批量操作不会改写它们。所有修改都是本地草稿，确认「应用到电视」后才保存并读回核对。

示例图为管理器测试数据，时钟天气为示意；资源目录封面由对应 APK 的 Android 页面渲染测试生成。完整使用说明见[布局文档](../desktop/docs/launcher-layout.md)。

## 开发与验证

电脑端：[构建与运行](../desktop/README.md)。电视端使用 JDK 17／21、Android SDK Platform 35、Build Tools 34.0.0：

```bash
cd resource/launcher
./gradlew assembleDebug assembleRelease lintDebug testDebugUnitTest
```

资源校验：`python tools/resource_catalog.py --build-tools <Build Tools 34.0.0 路径>`。资源索引：`python tools/update-resource-index.py`。

项目使用核心、界面、四平台构建、原生管理器 MCP 联调与 Android 布局测试验证。尚未进行电视实机测试。


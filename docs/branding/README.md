# pureTV 生肖龙 Logo

品牌图采用中国生肖龙：鹿角、长须、鳞片、盘曲身体和龙爪，以黑色与米白色雕刻线条呈现，搭配青绿色圆角底板。风格参考 [Open Office](https://github.com/ecojust/open-office) 的青牛图标和 [Open Media](https://github.com/ecojust/open-media) 的生肖鸡图标。

`puretv-dragon-source.png` 是按用户要求通过图像生成工具绘制的透明 PNG 原稿，尺寸 1254 × 1254。SHA-256：`ef348e822f8e02f0075bea36c25c1424837e5c87475d541bedc38ec1b43a230d`。

`puretv-logo.png` 是用于 README 的 256 × 256 导出图，与 `desktop/public/puretv-logo.png` 内容相同。桌面 PNG、Windows ICO 和 macOS ICNS 均从同一原稿生成。

在 `desktop/` 中运行：

```sh
node scripts/generate-brand-icons.mjs
```

该命令只转换图标尺寸和格式，并同步网页与 README 图标，不构建应用。pureTV Launcher 的 Android 图标也使用同一原稿；其他启动器和电视应用保留各自的品牌图。

在仓库根目录重新生成 Android 图标：

```sh
node resource/launcher/puretv/tools/generate-brand-icons.mjs
```

Android 自适应图标的前景将原图置于 108dp 透明画布中央的 60dp 区域，给系统圆形等遮罩留出安全边距。脚本使用桌面工程已安装的 Tauri 图标转换器，需先在 `desktop/` 执行 `npm ci`。

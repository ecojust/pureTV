# Nova TV

采用 Apple TV 风格的独立 Android 电视启动器：深色光影背景、简洁导航、大尺寸圆角卡片，以及遥控器焦点的平滑放大与清晰描边。应用标识 `com.ecojust.novatv`，可与 pureTV Launcher 同时安装。

[下载 NovaTV-0.1.0.apk](NovaTV-0.1.0.apk) · [源码归档](source.tar.gz) · [layout.json 示例](layout.example.json) · [layout v5 协议](../../README-development.md#layoutjson-协议)

## 界面

| 首页 | 应用页 |
| --- | --- |
| ![Nova TV 首页](thumb.png) | ![Nova TV 应用页](apps.png) |

截图来自原生 Android 界面在 Robolectric 中的渲染，使用测试应用；不是电视实拍。实际卡片根据电视已安装的用户应用生成。

## 安装与自定义

1. 使用 pureTV Manager 导入 APK，在启动器页面安装并激活 Nova TV。
2. 使用管理器 **0.3.7 或更新版本**中的“调整布局”编辑首页和应用页。可以修改应用、位置、尺寸、文案、SVG、文字颜色、图标颜色和背景。
3. 两个页面使用独立背景图片。默认图片已嵌入 layout v5 文件，管理器与电视读取同一内容。
4. 系统组件由启动器定义，管理器中只读。可编辑用户应用必须已经安装且可启动。
5. 首页向下进入应用页，应用页向上返回；可在管理器中调整页面切换规则。

默认首页展示前四个已安装用户应用；应用页展示已安装用户应用。无用户应用时可以先在管理器安装应用。网络、输入源、常用应用、桌面与系统设置入口均支持遥控器操作。

## 构建

需要 JDK 17、Android SDK 35 与 Build Tools 34.0.0。在本目录执行：

```sh
./gradlew --no-daemon :app:assembleRelease :app:lintDebug :app:testDebugUnitTest
```

发布 APK 使用仓库发布证书签名，SHA-256 与构建来源见 [resource.json](resource.json) 和 [SHA256SUMS.txt](SHA256SUMS.txt)。许可与上游信息见 [NOTICE.md](NOTICE.md)。

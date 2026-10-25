# WebTV

<!-- apk-resource:start -->
[下载 APK](webtv-0.1.0.apk?raw=1) · [校验值](SHA256SUMS.txt) · [签名及构建来源](resource.json) · [源码](src/)

此目录内 APK 使用 pureTV 发布证书签名。若设备中存在使用旧证书的同包应用，Android 无法直接覆盖安装；需先备份数据并卸载旧包。
<!-- apk-resource:end -->

Android TV 卫视／央视直播应用，包名 `com.ecojust.webtv`，版本 0.1.0，支持 Android 8.0 以上。原生 Java View、SurfaceView、MediaPlayer 和 MediaSession，无生产环境第三方依赖。

## 使用

独立安装 WebTV APK 后，从系统应用列表或本项目桌面的「全部应用 → WebTV 直播」打开。

- 左侧卫视、央视、收藏和全部频道；上下选择，确定播放，再次确定进入全屏。
- 全屏上下切台，确定显示控制栏，返回恢复频道列表；支持媒体播放／暂停和上一台／下一台按键。
- 下方可收藏、切换线路。最多保存 50 个收藏及上次频道；暂停后恢复会重新连接直播，不提供时移。
- 菜单键或「直播源」支持更新当前列表、导入网络 M3U、系统文件选择器导入本地 M3U，以及恢复内置列表。
- 导入验证成功后才替换元数据缓存，失败保留旧列表。首次启动使用缓存或内置快照，不等待频道目录网络请求。

## 语言 / Language

界面跟随电视系统语言。中文界面保留；英语系统使用英文分类、按钮、播放状态、导入错误和内置频道名称。用户导入的 M3U 频道名称保持原文，频道标识、收藏和缓存不随语言改变。

WebTV follows the TV system language. English includes navigation, playback status, source and stream dialogs, import errors, and built-in channel names. Imported channel names are preserved exactly as provided; changing language does not change channel IDs, favorites, or playlist caches.

## 体积与资源

Release 开启 R8 和资源压缩，签名 APK 37,731 字节（约 36.8 KiB）；CI 限制不超过 5 MiB。仅申请联网权限，无存储权限、后台服务、视频磁盘缓存、台标下载或多频道并行解码。

仅保留一个播放器，切台先释放旧解码器；退到后台释放播放器、音频焦点和媒体会话。频道列表复用行视图，一个有界后台任务处理元数据；空闲线程自动回收。

M3U 最大 512 KiB、300 个频道、每台最多 4 条线路；元数据快照最大约 528 KiB。HTTP 连接／读取超时 8 秒，网络导入另有 24 秒期限，播放器加载／缓冲超时 25 秒。失败提供手动重试，避免无限重连。实际运行内存还取决于系统解码器、码率和分辨率，未做电视实机内存测量。

## 直播源与验证

内置快照筛选自 [iptv-org 中国频道列表](https://iptv-org.github.io/iptv/countries/cn.m3u)，项目及许可见 [iptv-org/iptv](https://github.com/iptv-org/iptv)。此第三方公开索引不保证线路持续有效或各地区均可访问。内置 36 条候选线路，不代表全部已通过播放验证；不包含账户参数。

2026-10-23 开发网络验证：广东卫视为 720p H.264／AAC，湖南卫视为 4K HEVC／AAC；两路均通过 FFprobe 探测及 FFmpeg 前三秒解码。默认优先广东卫视，降低首播解码负担。湖南 4K HEVC 能否播放取决于电视硬解能力。北京 HD 返回 503、东方国际版 404，部分其他候选 IP 请求超时；失效时可换线路或导入自己的可用源。

支持 HTTP(S) 直播地址及 M3U 频道目录；允许 HTTP 以兼容公开直播和局域网源。不支持 UDP、RTSP、DRM、登录／付费限制绕过、M3U 自定义请求头、EPG 或回看。导入的是频道目录，不是单条 HLS 媒体播放列表。

离线测试覆盖解析上限、原子缓存、导入失败回退、遥控器、收藏、超时和播放器释放，另有英文界面、弹窗、错误、内置名称与中文保留测试。中英文控件均提供 960×540dp 与 640×360dp 原生渲染测试；未进行电视实机安装、长期直播或所有内置线路逐一解码测试。

## 构建

复用根项目工具链，从 `resource/launcher/puretv/` 运行：

```bash
./gradlew :webtv:assembleDebug :webtv:testDebugUnitTest :webtv:lintDebug
./gradlew :webtv:verifyReleaseSize
```

APK 位于 `resource/apps/webtv/build/outputs/apk/`。正式签名与目录内 APK 更新见[资源维护说明](../../../docs/resource-maintenance.md)。

## 设计

[已确认的设计提案](docs/design-proposal.png)中的节目画面与状态仅为布局示意。以下是原生控件渲染预览，不包含 Surface 视频层，非电视实机截图；预览使用三个测试频道，实际默认目录包含更多候选频道。

![WebTV 控件渲染预览](docs/controls-render.png)

English and Chinese previews are captured from the real `MainActivity` with native Robolectric graphics and localized fixture channels. The video surface is not included, and these are not device playback screenshots.

To export both languages, set `WEBTV_UI_CAPTURE_DIR` when running `:webtv:testDebugUnitTest`. Outputs are `webtv-controls.png` (Chinese), `webtv-controls.en.png` (English), and their `webtv-compact` equivalents for the smaller screen. No external stream is opened by these capture tests.

# ShortVideo TV

简体中文 | [English](README.en.md)

<!-- apk-resource:start -->
[下载 APK](shortvideo-0.1.0.apk?raw=1) · [校验值](SHA256SUMS.txt) · [签名及构建来源](resource.json) · [源码](src/)

此目录内 APK 使用 pureTV 发布证书签名。若设备中存在使用旧证书的同包应用，Android 无法直接覆盖安装；需先备份数据并卸载旧包。
<!-- apk-resource:end -->

面向遥控器的轻量原生 Android TV 短视频播放器。Android 8.0（API 26）以上，包名 `com.ecojust.shortvideo`，版本 `0.1.0`。不需要账号或 API Key。

界面跟随电视系统语言，支持简体中文和英语。英文界面包含播放状态、错误提示、视频源名称和选择弹窗；视频内容由第三方来源提供，不做翻译。

![原生控件渲染预览，SurfaceView 视频层不包含在此截图中，非电视实机截图](docs/controls-preview.png)

## 使用

启动后自动获取随机短视频并播放，播放结束自动获取下一条。竖屏居中保留黑边，横屏按比例适配，不裁切、不拉伸。播放时控件自动隐藏。

| 遥控器操作 | 功能 |
| --- | --- |
| 上／下方向键 | 上一条／下一条 |
| 控件隐藏时按确定 | 暂停／继续并显示控件 |
| 控件显示时按左右、确定 | 移动焦点并操作按钮 |
| 菜单键／视频源按钮 | 切换视频源 |
| 返回 | 关闭弹窗或退出应用 |
| 媒体播放、暂停、前后曲键 | 对应播放控制 |
| 媒体快进／快退键 | 前后跳转 10 秒 |

原生 MediaSession 接收系统媒体按键，音频焦点让位于其他音频应用。退出页面后释放播放器，不提供后台视频播放。网络或解码失败会停止并提供重试、切换源，不无限循环请求。

安装后可从系统应用列表启动，也可通过 pureTV 桌面的「全部应用 → 短视频」打开。桌面和播放器分别安装。

## 视频来源

- [酷乐随机](https://api.kuleu.com/api/MP4_xiaojiejie?type=json)：默认源，响应字段为 `mp4_video`。
- [小渡随机](https://openapi.dwo.cc/api/4qb_sp)：备用源，可从菜单选择，响应字段为 `data.video.url`。

两个接口均按本次实测无需 Key／登录。内容由服务商决定，当前样本来自快手 CDN，接口内容偏人物类短视频；不是官方推荐流，不承诺抖音来源、账号个性化推荐或特定分类。应用显示接口服务商名称，不编造作者、标题或点赞数。源选择在本机保存。

免费服务可能变化、限流或失效，实测结果及其他候选见 [调研记录](docs/source-research.md)。

## 体积与内存

- 3 个 Java 文件，复用仓库 Gradle；无生产环境第三方依赖，没有 WebView 或内置解码库。
- 一个原生 MediaPlayer 和 SurfaceView；同时只解码一条视频，不预解码下一条。
- 只在内存保留最近 10 个视频地址供前后切换，不保存视频文件或历史到磁盘，不申请存储权限。
- 一个网络工作线程、有界任务队列；JSON 响应最多 64 KiB、地址最多 8192 字符。
- 视频源请求至少间隔 1.5 秒，重复地址最多再请求一次；切换源会清空本次历史。网络请求可取消，媒体加载／缓冲 25 秒超时后停止。
- 无封面图片、模糊背景或常驻动画；离开页面释放媒体解码器和媒体会话。
- 当前目录已签名 APK 为 **29,427 字节（约 28.7 KiB）**；使用 R8 和资源压缩，CI 限制 APK 不超过 5 MiB。安装后 dex 优化占用、峰值内存和硬件解码兼容性仍需在目标电视实测。

## 构建

```bash
cd resource/launcher/puretv
./gradlew :shortvideo:assembleDebug
./gradlew :shortvideo:verifyReleaseSize :shortvideo:lintDebug :shortvideo:testDebugUnitTest
```

Debug 输出 `resource/apps/shortvideo/build/outputs/apk/debug/shortvideo-debug.apk`。未配置签名时 Release 输出 `shortvideo-release-unsigned.apk`；正式签名与目录内 APK 更新见[资源维护说明](../../../docs/resource-maintenance.md)。测试依赖不打入 APK，设计图和文档也不打入 APK。

```bash
adb install -r apps/shortvideo/build/outputs/apk/release/shortvideo-release.apk
adb shell am start -n com.ecojust.shortvideo/.MainActivity
```

## 验证

- 离线测试覆盖两类响应、坏地址／错误响应、JSON 大小与重定向上限、请求间隔、重复内容、历史上限、取消、播放控制、解码超时、自动下一条、前后台资源释放／进度恢复、系统媒体控制，以及 960dp 与 640dp TV 控件布局。
- 中英文界面使用同一原生 Activity 渲染并测试，包含视频源选择、状态、错误提示和按钮边界。设置 `SHORTVIDEO_UI_CAPTURE_DIR` 可导出 `shortvideo-tv.png` 与 `shortvideo-tv.en.png`，以及对应的紧凑尺寸截图。
- 2026-10-23 使用应用相同的接口及请求头，分别获取并下载两个源各一条样本：均为 720 × 1280 H.264 + AAC，约 2.29 MB／1.09 MB；FFmpeg 对前三秒解码均成功。验证下载文件保存在开发环境外部目录，未放入仓库或安装包。
- 上述解码检查在开发机器完成；没有 Android TV 实机，不能代替电视硬件解码、连续播放稳定性或峰值内存测试。Robolectric 截图只包含控件，无法捕获独立 Surface 视频层。

已确认的 [设计提案](docs/design-proposal.png) 中风景与标题仅用于示意；实现使用实际视频流和通用编号。

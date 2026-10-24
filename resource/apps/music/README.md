# Music TV

<!-- apk-resource:start -->
[下载 APK](music-0.1.1.apk?raw=1) · [校验值](SHA256SUMS.txt) · [签名及构建来源](resource.json) · [源码](src/)

此目录内 APK 使用 pureTV 发布证书签名。若设备中存在使用旧证书的同包应用，Android 无法直接覆盖安装；需先备份数据并卸载旧包。
<!-- apk-resource:end -->

面向 Android TV 遥控器的独立原生音乐播放器。Android 8.0（API 26）及以上，包名 `com.ecojust.music`，当前版本 `0.1.2`。

![原生 TV 界面渲染预览，曲目为测试示例，非线上搜索结果或电视实机截图](docs/music-tv.png)

## 功能

- 关键词搜索 B 站音乐分区公开视频，或粘贴 BV 号／完整 BV 链接。
- 仅获取 AAC 音轨，优先兼容电视的 AAC-LC，并在同编码中选择较低带宽版本；交给系统 MediaPlayer 流式播放，不下载视频。
- 上一首、播放／暂停、下一首、进度调整、连续播放、全屏播放页。
- 搜索、收藏和最近播放列表可「播放全部」或「随机播放」；底部及全屏页可切换顺序／随机模式，自动记住选择。随机队列一轮内不重复，上一首按实际播放历史返回。
- 按需打开队列；长按歌曲可加入队列、收藏或取消收藏。
- 收藏、最近播放和队列只保存在本机；不需要账号。
- 通过系统文件选择器打开本地音频，不申请整盘存储权限。
- 原生音频焦点、后台播放通知及媒体按键；离开页面后可继续播放，暂停后退出页面会释放播放器。
- 安装后，配套桌面的「音乐」优先启动此应用；未安装时桌面继续打开 SomaFM。

方向键移动焦点，确定键选择；长按确定键打开歌曲菜单，返回键关闭弹窗或退出。搜索需要系统输入法，也可从其他设备粘贴 BV 链接。电视若没有系统文件选择器，本地音频入口会明确提示。

## 轻量策略

- Java + Android 原生 View，**没有生产环境第三方依赖**，没有 WebView、跨端运行时或内置解码库。
- 一个 Activity、一个播放 Service；列表复用行视图，队列不常驻侧栏。
- 封面最多缓存 **1 MiB**，解码尺寸最多 160 × 160，单张下载最多 512 KiB；页面离开或系统要求回收时清理缓存。
- 最多 50 首队列、100 首收藏、30 条最近记录；不保存音频文件或临时音频地址。
- 网络搜索和封面下载使用有界任务队列；旧搜索结果不会覆盖新搜索，播放请求可取消，音频加载会超时退出。
- Release 启用 R8 和资源压缩；CI 检查 APK 不超过 **5 MiB**。当前目录已签名 APK 为 **37,675 字节（约 36.8 KiB）**；安装后占用会因系统 dex 优化而增加。内存峰值及启动速度仍需在目标电视实测。

## 构建

复用仓库现有 Gradle、SDK 和签名配置，无需独立工程或第二份 Wrapper：

```bash
cd resource/launcher
./gradlew :music:assembleDebug
./gradlew :music:verifyReleaseSize :music:lintDebug :music:testDebugUnitTest
```

Debug：`resource/apps/music/build/outputs/apk/debug/music-debug.apk`。Release：`resource/apps/music/build/outputs/apk/release/music-release-unsigned.apk`；正式签名与目录内 APK 更新见[资源维护说明](../../../docs/resource-maintenance.md)。测试依赖只用于开发，不打进 APK。

```bash
adb install -r resource/apps/music/build/outputs/apk/release/music-release.apk
adb shell am start -n com.ecojust.music/.MainActivity
```

## 验证边界

搜索、BV 信息和音轨来自 B 站公开接口。接口可能变化，或因网络、地区、验证、下架、登录及授权要求而不可用；应用会显示失败原因，不绕过这些限制，也不保证全部视频可播放。首版仅播放视频默认分 P 的公开 AAC 音轨。

### 0.1.2：音频解析与随机播放

播放已有搜索结果时，通过公开 `/x/player/pagelist?bvid=...` 取得默认分段 CID，再请求 `/x/player/playurl`，不再为 CID 额外请求完整视频详情。开发网络复现了完整详情 HTTP 412、分段列表与音轨接口返回 code 0 的差异。粘贴 BV 时也通过分段列表读取标题与时长，不再依赖完整详情接口；此入口暂不补取封面及作者。

音轨优先 AAC-LC，在同编码中选低带宽音轨；播放器与 API 使用一致的浏览器请求头。连接失败或超时可切换该音轨响应中提供的备用 CDN 地址，最多 3 个地址，不访问其他解析服务。仅参数错误 -400 时尝试一次 WBI 请求；登录或验证要求直接提示，不自动重试其他接口。

界面分别显示获取分段、请求音轨、连接音频的阶段。解析阶段最多 20 秒，单个音频连接最多 10 秒，整个加载流程最多 45 秒；超时后停止加载并释放播放器，可取消或重新播放。后台旧请求的返回值不会覆盖新曲目。

「播放全部／随机播放」使用当前列表替换播放队列，最多 50 首。底部与全屏页可切换播放模式；随机模式一轮内不重复，队列至少两首时不连续随机到同一首；上一首按实际历史返回，已播放超过 3 秒时先回到曲首。模式保存在本机，恢复应用不会自动播放。

自动测试覆盖公开分段请求、错误及验证响应、AAC-LC 与备用地址、解析和连接超时、取消、队列恢复、随机不重复及 TV 布局。开发环境网络和媒体解码测试不能代替电视所在网络及系统 MediaPlayer 实测。

## 交互参考

参考 [HanversionOvO/BiliMusic](https://github.com/HanversionOvO/BiliMusic) 和 [NaivG/bilimusic](https://github.com/NaivG/bilimusic) 的搜索、收藏、播放队列等产品思路，独立实现 TV 交互及请求代码；音轨请求参数／响应兼容流程也参考了两者的公开实现，未复制其源码或美术资源。

早期 [设计提案](docs/design-proposal.png) 中的曲目与封面仅为示意。轻量实现将常驻右侧队列改为按需弹窗。

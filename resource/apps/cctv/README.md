# CCTV Live · 央视直播

[中文](README.md) · [English](README.en.md)

pureTV 项目的独立央视频道播放器，适用于 Android TV / Google TV 遥控器。包名 `com.ecojust.cctvlive`，版本 `0.1.0`，要求 Android 8.0 及以上。界面跟随系统语言，支持中文和英文。这是第三方客户端，不是央视官方应用。

## 页面与遥控器

- 左侧显示央视频道，方向键移动焦点，确定键选择并播放；支持全部频道和收藏列表。
- 频道信息与播放区域跟随当前选择，提供播放／暂停、收藏、线路切换和全屏。
- 全屏时，上／下键切换频道，返回键回到频道列表；菜单键打开线路选择。
- 当前线路失败时自动尝试该频道其他未尝试的线路；全部失败后，保留当前页面和频道，显示错误及重试入口。

![Android 原生页面预览，非电视实机直播截图](docs/cctv-live.png)

## 固定频道文件

频道清单位于 [`src/main/assets/channels.m3u`](src/main/assets/channels.m3u)。应用启动时直接读取并解析这个固定文件，不从网页抓取频道目录，也不在 Java 代码中拼接直播地址。增删频道、调整顺序或更换线路时，编辑此文件并重新构建 APK；已经安装的旧 APK 不会自动取得仓库中的文件更新。

当前清单来自用户提供的、标注为 **2026-10-25 从 `tv.cctv.com/live` 页面播放器抓取**的数据：21 个频道，21 条主线路和 18 条备用线路，包含 CCTV-4 亚洲／欧洲／美洲及 CCTV-4K。备用地址已从原始说明注释整理为可解析的 M3U 条目。

同一 `tvg-id` 的条目合并为一个频道，首次出现的位置决定频道顺序。每个条目的一行 HTTP(S) 地址代表一条线路；重复地址去重，线路按文件顺序排列。不要把单个频道的 HLS 媒体播放列表内容当作频道目录。

```m3u
#EXTM3U
#EXTINF:-1 tvg-id="cctv1.cn" tvg-name="CCTV-1 综合" tvg-name-en="CCTV-1 General" group-title="CCTV" route-name="主线路" route-name-en="Primary",CCTV-1 综合
https://ldncctvwbcdtxy.liveplay.myqcloud.com/ldncctvwbcd/cdrmldcctv1_1/index.m3u8
#EXTINF:-1 tvg-id="cctv1.cn" tvg-name="CCTV-1 综合" tvg-name-en="CCTV-1 General" group-title="CCTV" route-name="备用线路 · 1080P" route-name-en="Backup · 1080P",CCTV-1 综合
https://ldncctvwbcdcnc.v.wscdns.com/ldncctvwbcd/cdrmldcctv1_1_1080P/playlist.m3u8?wsApp=HLS
```

`tvg-name-en`、`route-name` 与 `route-name-en` 是本应用读取的可选扩展属性，分别提供英文频道名和中英文线路名；没有英文名称时保留原名。`#` 开头的说明行只作为注释，不能代替实际线路条目。解析器限制文件不超过 512 KiB、100 个频道、每频道 4 条线路。内置清单全部使用 HTTPS；本应用不允许明文 HTTP 播流。

## 播放与验证

使用 Android 原生 `MediaPlayer`、`SurfaceView` 和 `MediaSession`，同一时间只有一个播放器；切台释放旧解码器，退到后台释放播放器及音频焦点。无生产环境第三方依赖，仅申请联网权限，不下载整段直播或保存视频缓存。

当前线路加载或缓冲超过 25 秒，或播放器报告错误时，会按文件顺序自动尝试该频道尚未尝试的线路。每轮播放中，每条线路最多尝试一次，避免主备线路之间无限循环。全部线路失败后停留在当前页面，可手动重试或选择线路开始新一轮播放；切换频道、暂停或离开前台会取消待执行的自动切换。

线路标签中的“1080P”来自提供的源说明，不表示实际播放已经达到该分辨率。真实画面、码率和编码以服务器及电视解码能力为准；页面预览和离线测试不代表所有线路均已实机播放验证。测试使用受控媒体状态，不为截图伪造真实节目画面。

2026-10-25 开发环境的地址检查中，CCTV-1、CCTV-2 的 M3U 清单可以读取，CCTV-5 主线路与备用线路均返回 HTTP 403。这项检查仅确认清单访问结果，没有验证全部 21 个频道的电视端解码或持续播放。

## 构建

从仓库根目录执行：

```bash
cd resource/launcher/puretv
./gradlew :cctv:assembleDebug :cctv:testDebugUnitTest :cctv:lintDebug
./gradlew :cctv:verifyReleaseSize
```

APK 输出在 `resource/apps/cctv/build/outputs/apk/`。Release 开启代码和资源压缩，体积上限为 5 MiB；正式资源 APK 使用 pureTV 发布证书单独签名。

设置 `CCTV_UI_CAPTURE_DIR` 后运行 `:cctv:testDebugUnitTest`，可导出 `cctv-live.png` 与 `cctv-live.en.png` 中英文原生页面预览。正式更新使用 Android CI 的资源暂存流程，再运行 `tools/prepare-app-resources.py --app cctv`；完整步骤见[资源维护说明](../../../docs/resource-maintenance.md)。

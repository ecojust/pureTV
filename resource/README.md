# 电视 APK 资源目录

目录分为 `launcher/`（启动器）和 `apps/`（应用）。源码与 APK 放在同一软件目录。每个软件文件夹至少包含一个真实 APK，以及 resource.json、许可证和校验文件；可附对应源码及封面。点击软件名称进入文件夹下载。第三方 APK 保持上游原始二进制与签名。

“支持自定义”指管理器可识别的 layout.json 接口，当前配套启动器使用 v5 users/system 协议。上游截图、纯 TV 渲染示例与相关许可见各文件夹说明。

### 启动器

| 名称 | 作者 | 版本 | APK 大小 | 支持自定义 | 封面截图 |
| --- | --- | --- | --- | --- | --- |
| [Aster TV · 星轨](launcher/aster/) | ecojust / 桔子桑 | 0.1.1 | 443.7 KB | 是 | <img src="launcher/aster/thumb.png" width="180" alt="Aster TV · 星轨 界面"> |
| [Circuit TV · 回路](launcher/circuit/) | ecojust / 桔子桑 | 0.1.1 | 435.7 KB | 是 | <img src="launcher/circuit/thumb.png" width="180" alt="Circuit TV · 回路 界面"> |
| [Drift TV](launcher/drift/) | ecojust / 桔子桑 | 0.1.1 | 475.7 KB | 是 | <img src="launcher/drift/thumb.png" width="180" alt="Drift TV 界面"> |
| [Forma TV](launcher/forma/) | ecojust / 桔子桑 | 0.1.1 | 443.7 KB | 是 | <img src="launcher/forma/thumb.png" width="180" alt="Forma TV 界面"> |
| [Mono TV 墨白](launcher/mono/) | ecojust / 桔子桑 | 0.1.1 | 443.7 KB | 是 | <img src="launcher/mono/thumb.png" width="180" alt="Mono TV 墨白 界面"> |
| [Moss TV](launcher/moss/) | ecojust / 桔子桑 | 0.1.1 | 487.7 KB | 是 | <img src="launcher/moss/thumb.png" width="180" alt="Moss TV 界面"> |
| [Nova TV](launcher/nova/) | ecojust / 桔子桑 | 0.1.2 | 495.7 KB | 是 | <img src="launcher/nova/thumb.png" width="180" alt="Nova TV 界面"> |
| [Pixel TV 像素](launcher/pixel/) | ecojust / 桔子桑 | 0.1.1 | 443.7 KB | 是 | <img src="launcher/pixel/thumb.png" width="180" alt="Pixel TV 像素 界面"> |
| [pureTV Launcher](launcher/puretv/) | ecojust / 桔子桑 | 0.3.7 | 740.1 KB | 是 | <img src="launcher/puretv/thumb.png" width="180" alt="pureTV Launcher 界面"> |
| [Sol TV](launcher/sol/) | ecojust / 桔子桑 | 0.1.1 | 439.7 KB | 是 | <img src="launcher/sol/thumb.png" width="180" alt="Sol TV 界面"> |

### 电视应用

| 名称 | 作者 | 版本 | APK 大小 | 用途 | 封面截图 |
| --- | --- | --- | --- | --- | --- |
| [CCTV Live](apps/cctv/) | ecojust / 桔子桑 | 0.1.0 | 40.9 KB | 央视官网播放器与电视频道导航 | <img src="apps/cctv/thumb.png" width="180" alt="CCTV Live 界面"> |
| [HIFINi TV](apps/hifini/) | ecojust / 桔子桑 | 0.1.4 | 201.1 KB | 基于 HiFiNi 的电视音乐播放器 | <img src="apps/hifini/thumb.png" width="180" alt="HIFINi TV 界面"> |
| [Jellyfin for Android TV](apps/jellyfin-tv/) | Jellyfin contributors | 0.19.10 | 20.93 MB | Jellyfin 媒体服务器的 Android TV 客户端 | <img src="apps/jellyfin-tv/thumb.png" width="180" alt="Jellyfin for Android TV 界面"> |
| [Music TV](apps/music/) | ecojust / 桔子桑 | 0.1.3 | 48.8 KB | 原生电视音乐播放器 | <img src="apps/music/thumb.png" width="180" alt="Music TV 界面"> |
| [ShortVideo TV](apps/shortvideo/) | ecojust / 桔子桑 | 0.1.1 | 32.7 KB | 遥控器短视频播放器 | <img src="apps/shortvideo/thumb.png" width="180" alt="ShortVideo TV 界面"> |
| [TV Bro](apps/tvbro/) | Fedir Tsapana (truefedex) | 2.1.6 | 6.48 MB | 适配遥控器的电视浏览器，使用系统 WebView | <img src="apps/tvbro/thumb.png" width="180" alt="TV Bro 界面"> |
| [WebTV](apps/webtv/) | ecojust / 桔子桑 | 0.1.1 | 44.8 KB | 电视直播与 M3U 播放器 | <img src="apps/webtv/thumb.png" width="180" alt="WebTV 界面"> |

开发者请参阅 [开发与协议 README](README-development.md)，包含 layout.json 字段说明、画面对照、构建与测试。

维护校验：`python tools/resource_catalog.py --build-tools <Android Build Tools 34.0.0 目录>`。索引由 `python tools/update-resource-index.py` 根据资源元数据生成。

# 电视 APK 资源目录

目录分为 `launcher/`（启动器）和 `apps/`（应用）。源码与 APK 放在同一软件目录。每个软件文件夹至少包含一个真实 APK，以及 resource.json、许可证和校验文件；可附对应源码及封面。点击软件名称进入文件夹下载。第三方 APK 保持上游原始二进制与签名。

“支持自定义”指管理器可识别的 layout.json 接口，当前配套启动器使用 v4 users/system 协议。上游截图、纯 TV 渲染示例与相关许可见各文件夹说明。

### 启动器

| 名称 | 作者 | 版本 | APK 大小 | 支持自定义 | 封面截图 |
| --- | --- | --- | --- | --- | --- |
| [pureTV Launcher](launcher/puretv/) | ecojust / 桔子桑 | 0.3.5 | 736.1 KiB（753,746 B） | 是 | <img src="launcher/puretv/thumb.png" width="180" alt="pureTV Launcher 界面"> |

### 电视应用

| 名称 | 作者 | 版本 | APK 大小 | 用途 | 封面截图 |
| --- | --- | --- | --- | --- | --- |
| [Jellyfin for Android TV](apps/jellyfin-tv/) | Jellyfin contributors | 0.19.10 | 20.93 MiB（21,950,619 B） | Jellyfin 媒体服务器的 Android TV 客户端 | <img src="apps/jellyfin-tv/thumb.png" width="180" alt="Jellyfin for Android TV 界面"> |
| [Music TV](apps/music/) | ecojust / 桔子桑 | 0.1.1 | 36.8 KiB（37,675 B） | 原生电视音乐播放器 | <img src="apps/music/thumb.png" width="180" alt="Music TV 界面"> |
| [ShortVideo TV](apps/shortvideo/) | ecojust / 桔子桑 | 0.1.0 | 28.7 KiB（29,427 B） | 遥控器短视频播放器 | <img src="apps/shortvideo/thumb.png" width="180" alt="ShortVideo TV 界面"> |
| [TV Bro](apps/tvbro/) | Fedir Tsapana (truefedex) | 2.1.6 | 6.48 MiB（6,790,605 B） | 适配遥控器的电视浏览器，使用系统 WebView | <img src="apps/tvbro/thumb.png" width="180" alt="TV Bro 界面"> |
| [WebTV](apps/webtv/) | ecojust / 桔子桑 | 0.1.0 | 36.8 KiB（37,731 B） | 电视直播与 M3U 播放器 | <img src="apps/webtv/thumb.png" width="180" alt="WebTV 界面"> |

开发者请参阅 [开发与协议 README](README-development.md)，包含 layout.json 字段说明、画面对照、构建与测试。

维护校验：`python tools/resource_catalog.py --build-tools <Android Build Tools 34.0.0 目录>`。索引由 `python tools/update-resource-index.py` 根据资源元数据生成。

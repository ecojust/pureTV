# 视频源调研记录

2026-10-23 的调研快照。用户后续已确认允许多平台来源，并确认 TV 设计稿。当前版本接入酷乐和小渡，运行状态以实际请求为准。

## 视频源实测（2026-10-23）

所有请求均未提供 API Key 或用户登录 Cookie。以下是开发网络的抽样结果，不能代表长期可用性或电视实机播放结果。

| 候选 | 接口检查 | 媒体检查 | 来源与接入判断 |
| --- | --- | --- | --- |
| [酷乐随机视频](https://api.kuleu.com/api/MP4_xiaojiejie?type=json) | 连续两次 HTTP 200，`code: 200`，`mp4_video` 返回两个不同地址 | 抽取一条地址，Range 请求返回 HTTP 206、`video/mp4`，读到 4096 字节且包含 MP4 `ftyp` 文件头 | 样本地址为 `alimov2.a.kwimgs.com`，属于快手 CDN；接口本身定位为人物类随机视频，不能当作纯抖音推荐流 |
| [小渡随机视频](https://openapi.dwo.cc/api/4qb_sp) | 连续两次 HTTP 200，`code: 200`，`data.video.url` 返回两个不同地址 | 抽取一条地址，Range 请求返回 HTTP 206、`video/mp4`，读到 4096 字节且包含 MP4 `ftyp` 文件头 | 样本同样来自快手 CDN；可以作为随机短视频候选，但尚不符合纯抖音来源要求；文档标注每分钟 50 次 |
| [遇见抖音随机视频文档](https://api.yujn.cn/?action=interface&id=380) | 文档可打开，但 `https://api.yujn.cn/api/dy_sj.php?num=1` 与 `num=10` 均返回 HTTP 500 | 未取得视频地址 | 暂不接入 |
| [遇见抖音热点视频文档](https://api.yujn.cn/?action=interface&id=327) | `https://api.yujn.cn/api/dy_hot.php` 返回 HTTP 500 | 未取得视频地址 | 暂不接入 |
| [远梦随机短视频文档](https://api.qzqi.com/api-doc/Randclip.html) | 免费免认证；抽查 `https://api.qzqi.com/api/v1/Randclip?id=HanFu&type=json` 两次均 HTTP 200 | 实际 JSON 使用 `code: 1`、`data.link`，与文档示例的字段层级不一致；本轮没有请求其媒体文件 | 返回的样本地址为快手 CDN；不是已确认的抖音推荐流 |

以上 Range 检查仅确认文件头可访问，没有完整下载、解码或实机播放视频，也没有检验内容分布、长期稳定性或持续翻页。两次返回不同地址只能说明这些抽样请求发生变化，不能证明无限不重复。

## 排除的方案

- [TikHub OpenAPI 文档](https://api.tikhub.io/openapi.json)：`POST /api/v1/douyin/web/fetch_home_feed` 声明支持游客通用推荐，参数为 `count`、`refresh_index` 和可选的 `cookie`，但接口需要服务商 Bearer Token。无 Key 实测 HTTP 401，因此不满足用户要求，不采购或接入。
- [Douyin_TikTok_Download_API](https://github.com/Evil0ctal/Douyin_TikTok_Download_API)：当前公共服务的 OpenAPI 没有找到 `feed`／`recommend` 路由。项目作者明确将演示实例定位为体验用途，不适合正式应用依赖；自建服务还需要服务器维护，不能按“现成免费免 Key 推荐流”处理。未复制该项目代码。
- 若干聚合 API 站点在开发网络出现代理拒绝或源站不可达，未验证其接口或视频可用性，不据此认定它们在所有网络失效。

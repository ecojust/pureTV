# 梨园 TV 公开节目来源调查

2026-11-10，只读网络核查与原生应用 backend 实现依据。没有执行七星 APK、复用其接口或搬运其程序代码。

## 官方公开栏目

| 栏目 | 官方页 | topicID |
|---|---|---|
| CCTV空中剧院 | https://tv.cctv.com/lm/cctvkzjy/index.shtml | TOPC1451558856402351 |
| 角儿来了 | https://tv.cctv.com/lm/jll/index.shtml | TOPC1508747509633692 |
| 跟我学 | https://tv.cctv.com/lm/gwx/ | TOPC1451558178940505 |
| 梨园闯关我挂帅 | https://tv.cctv.com/lm/lycgwgs/ | TOPC1451558484007800 |
| 名家书场 | https://tv.cctv.com/lm/mjsc/index.shtml | TOPC1579401761622774 |

ID 从官方栏目页的 topicID 读取；频道首页 https://tv.cctv.com/cctv11/ 提供节目导航。最初尝试的 /lm/kzjy/ 与 /lm/jell/ 返回404，随后按官方首页实际链接修正。

公开列表接口由官方页面脚本 https://r.img.cctvpic.com/photoAlbum/templet/common/DEPA1631586652441415/index.js 使用：

`https://api.cntv.cn/NewVideo/getVideoListByColumn?id=<topicID>&n=20&sort=desc&p=<page>&mode=0&serviceId=tvcctv`

JSON结构 `data.total` 和 `data.list`；每条包含 guid、title、url、image、brief、length、time 等。App仅依赖 guid/title/url/image；分页最多20项/页、50页，不把空列表或异常响应变成成功节目。跟我学等栏目更新停止在较早年份，内容日期由官网负责，不能把“精选”当作近期新播。

## 点播解析与播放边界

`https://vdn.apps.cntv.cn/api/getHttpVideoInfo.do?pid=<32hex guid>` 无账号或额外token即返回公开JSON。App只有在 ack=yes、public=1、play=1、is_protected=0、is_invalid_copyright=0、is_preview=0 均成立时才使用返回的 HTTPS hls_url；缺失/拒绝/版权或预览限制返回可重试错误，不拼接绕过地址。播放时重查信息，不把临时流地址当固定节目源保存。

已核对跟我学视频 `d5198f0ae8834a03b4dc6d95628d1cc6`：HLS master HTTP200、variant HTTP200，VOD playlist没有EXT-X-KEY；首TS仅请求并读取65536字节，返回206/video-MP2T且首字节0x47。此结果证明当时网络可取得公开流片段，不代表Android解码/声画同步、整片播放、所有地区或实体电视已验证。

生产User-Agent OperaTV/0.1.0 (Android) 与 Referer https://tv.cctv.com/ 的独立五栏目探测见 [public-column-probes.json](public-column-probes.json)，媒体片段证据见 [public-hls-probe.json](public-hls-probe.json)；保留实际失败，不自动改换私有来源。

## 现有项目参照

pureTV 的 CCTV Live 使用 WebView 加载官方直播页面并保留官网播放器限制。本项目改用公开点播API与Android系统播放器，不复用官网直播的短期HLS地址。节目及图文权利归对应权利人，第三方客户端提供官方内容的公开访问与清晰来源；不保证长期接口稳定或地区可用。

## 实现与验证状态

Backend: OperaItem.java / OperaHttp.java / CctvCatalog.java。HTTP正文/重定向/总时限受限；TLS1.2旧系统适配不替换信任管理器或主机验证。导入HTTP与SAF内容源均与内置CCTV公开权限判断分离。模型及provider/HTTP边界测试已编写，具体执行结果由后续Gradle记录补充，不能把上述网络探测当作单元/原生运行测试通过。

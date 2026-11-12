# 霓虹飞车 0.1.1 验证

本版本新增 pureTV Wi-Fi 手柄 TCP/JSONL 与 Android mDNS 服务，支持九键、hello/sync/ping、同序号 ACK、断线清键和重连暂停。正式 APK 为 443,884 字节，签名沿用仓库固定证书。

- [完整验证](verification.json)：源码 `edf469934b759c481fd171730b0d5e7739e4981c`，签名 [CI 43264059582](https://github.com/ecojust/pureTV/actions/runs/43264059582)。
- [原生回归](native/README.md)：66 项和 lint 通过；保留基线及失败记录。
- [官方虚拟手柄实跑](wire/README.md)：原版网页、桥和 SDK，最终 6 项通过，237 条消息逐条 ACK。
- [Web/UI 证据](web/manifest.json)：输入取消与控制来源切换，中英文 960/1280 布局，以及扫码和 Wi-Fi 连接状态区分。
- [新版录像](gameplay.mp4)和[原始录制元数据](gameplay.json)：普通键盘赤岩两圈，第 1 名；181.648 秒、6,585,443 字节，全片解码通过。
- [资产一致性](asset-consistency.json)：14 份正式 APK 资源与最终 UI、官方 SDK 实跑、录像相同。
- [基线复用](baseline-reuse.json)：未改变规则的 45 项检查保留；0.1.0 三赛道整局结果不冒充本版复测。
- [商城校验](store-verification.json)：129 个严格签名资源、119 条商城数据，其他 118 条未变。

真实 TCP 指本机环回 socket。游戏的联调 bridge 是只读测试适配器；NSD 字段和生命周期由 Robolectric shadow 验证。尚未验证实体电视安装、实体 ESP32 同网自动发现和操作。视频导出帧率不代表设备性能。

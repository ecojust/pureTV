# 超过10 MB的应用清单与收录状态

与归档目录使用同一上游快照：[`08ec332c`](https://github.com/youhunwl/TVAPP/tree/08ec332c0a25e9ae97fb73d3b3e40784dab65fc3)。228个APK文件包含23个小包和 **205个超限文件 / 199份不同Git blob内容**，按名称和用途整理为 **84个参考家族**。超限文件中 **5个已按用户指定收录，200个尚未收录**；本页保留全部205条原始记录。超限文件总大小 **8,711,445,311字节（约8.71 GB，含重复文件）**。

阈值按10,000,000字节计算；本快照没有刚好等于阈值的APK。本清单保留全部版本、手机/电视变体及同内容别名，家族数不代表已经核验的包名数量。

[全部205个APK明细](planning/oversized-apks.md) · [逐应用复刻参考](planning/replication-notes.md) · [JSON](planning/oversized.json) · [CSV](planning/oversized.csv) · [已收录应用](README.md)

大小和Git blob来自固定目录树；用途来自上游说明或明确标注的名称推断。版本、架构、系统支持列保留文件名线索；已收录条目的实际包名、签名和minSDK见对应manifest及JSON，其他条目尚未下载核验。所有条目均未在实体电视运行，服务可用性仍待核实。下列优先级、难度、首版范围和包体建议是开发评估，当前所有复刻项目均未开始，收录原包不代表完成复刻。

## 怎么选第一批

先选择功能闭环明确、内容可自行提供的方向：电视文件管理/局域网传文件、应用安装管理、训练计时与自有课程播放、儿童本地内容播放。影音类可先做一个共用播放器和收藏/历史框架，再针对直播、音乐、戏曲扩展。

K歌依赖伴奏和歌词，教育/健身依赖课程，聚合直播依赖服务接口；界面相似不等于这些能力已具备。游戏三项主要是游戏集合或模拟器平台，首版可从本地游戏库和手柄导航开始，再单独评估模拟核心。复刻以独立实现功能为目标，使用自己的名称、界面与素材。

P1：优先验证轻量核心功能；P2：需要先确认内容/接口或较多功能；P3：多平台接口、脚本/模拟器/解码能力等依赖较重。难度针对表中建议首版，不代表完整替代原产品的难度；小于10 MB仍需实际构建测量。

可优先复用本仓库已有能力：

| 方向 | 建议起点 | 已有基础 |
| --- | --- | --- |
| 应用管理 / 局域网传APK | [应用管家](planning/replication-notes.md#app-housekeeper)、[野草助手](planning/replication-notes.md#wild-grass-assistant) | [putrtv商城](../resource/apps/putrtv-store/)已有安装流程，可评估复用其校验和遥控器交互。 |
| 原创儿童练习 | [宝宝趣学类功能](planning/replication-notes.md#baby-fun-learning) | [Game Kit](../resource/game-kit/README.md)已有输入和关卡机制，可用于新的数字、颜色、图形练习。 |
| 哔哩哔哩客户端功能 | [BV](planning/replication-notes.md#bv)、[上游BiliTV](planning/replication-notes.md#bili-tv-upstream) | [现有哔哩哔哩应用](../resource/apps/bilibili/)已有搜索、登录和播放实现，可先评估完善；与上游同名软件不推定同源。 |

同类K歌产品可共用一个轻量点歌和播放内核；17个品牌条目不必对应17个新项目。上述方向尚未开工，复用也需要逐项验证。


| 分类 | 参考家族 | APK文件 |
| --- | ---: | ---: |
| 影音 / media | 68 | 179 |
| 游戏 / game | 3 | 3 |
| 教育 / education | 5 | 8 |
| 工具 / tools | 5 | 9 |
| 健身 / fitness | 3 | 6 |

## 影音 / media（68个家族）

| 应用/系列 | APK数 | 大小范围 MB | 用途与定位 | 优先 / 首版难度 | 收录状态 |
| --- | ---: | ---: | --- | --- | --- |
| [电视家（修复版）](planning/replication-notes.md#live-dianshijia) | 1 | 47.21 | 上游收录的电视直播客户端；快照README标注“目前无节目”。 上游标红，状态待核实。 | P3 / 中 | 尚未收录 |
| [DongYuTvWeb](planning/replication-notes.md#live-dongyu-tvweb) | 3 | 16.15–61.64 | 上游描述为使用网页播放的电视直播客户端，覆盖央视、卫视和地方台。 | P2 / 中 | 尚未收录 |
| [HTV直播](planning/replication-notes.md#live-htv) | 1 | 21.31 | 上游描述为支持多种直播源的电视客户端，并标称兼容Android 4.4、IPv4与RTP。 | P2 / 中 | 尚未收录 |
| [酷9直播](planning/replication-notes.md#live-ku9) | 17 | 19.66–56.41 | 上游描述为通过列表订阅配置频道的电视直播客户端；目录同时含内置源、空壳、lite及Python命名变体。 | P2 / 中 | 尚未收录 |
| [mytv-android](planning/replication-notes.md#live-mytv-android) | 2 | 30.29–30.29 | 依据目录和文件名推断为电视直播客户端，提供正常版与“伪装版”两种命名变体。（名称推断） | P2 / 中 | 尚未收录 |
| [OurTV（我们的电视）](planning/replication-notes.md#live-ourtv) | 3 | 27.96–28.62 | 上游收录的电视直播客户端；快照README标注已停止转播电视信号。 上游标红，状态待核实。 | P3 / 中 | 尚未收录 |
| [七星电视](planning/replication-notes.md#live-qixing-tv) | 1 | 44.08 | 上游描述为提供央视、卫视及地方频道的简洁电视客户端。 | P2 / 中 | 尚未收录 |
| [全网通电视](planning/replication-notes.md#live-quanwangtong) | 1 | 20.85 | 上游描述为电视直播客户端，并标称支持Android4。 | P2 / 中 | 尚未收录 |
| [电视直播（v1.1.0）](planning/replication-notes.md#live-tv-stream) | 1 | 11.62 | 上游描述为内置直播并支持用户导入频道源和EPG的应用。 | P1 / 中 | 尚未收录 |
| [VsTV（超限变体）](planning/replication-notes.md#live-vstv-large) | 1 | 15.05 | 上游描述为跨电视、盒子、平板和手机的直播频道客户端。 | P3 / 中 | 尚未收录 |
| [小飞电视](planning/replication-notes.md#live-xiaofei) | 1 | 55.47 | 上游描述为播放央视、卫视及地方台的电视与手机直播客户端。 | P2 / 中 | 尚未收录 |
| [星火直播](planning/replication-notes.md#live-xinghuo) | 2 | 22.01–22.72 | 上游描述为以频道观看为核心、无需登录的简洁电视直播应用。 | P2 / 中 | 尚未收录 |
| [你的电视](planning/replication-notes.md#live-yourtv) | 1 | 14.63 | 上游描述支持网页源与IPTV源切换，并提供远程配置入口。 | P2 / 中 | 尚未收录 |
| [悠悠电视](planning/replication-notes.md#live-youyou) | 1 | 14.44 | 上游描述为无需登录、打开后即可选择频道观看的电视直播客户端。 | P2 / 中 | 尚未收录 |
| [云影空蒙](planning/replication-notes.md#live-yunying) | 3 | 24.38–80.56 | 上游描述为简洁的电视直播空壳客户端，快照含basic与complete命名变体。 | P2 / 中 | 尚未收录 |
| [直播电视（zbds）](planning/replication-notes.md#live-zbds) | 3 | 13.57–13.95 | 上游描述为手机与电视通用的直播应用，含定时更新的频道源。 | P2 / 中 | 尚未收录 |
| [嗨库KTV](planning/replication-notes.md#karaoke-haiku) | 1 | 85.40 | K歌点歌应用；上游将其归为手机/电视点歌、扫码点歌的同类软件。 | P2 / 中 | 尚未收录 |
| [和音元 / 爱唱KTV（上游别名）](planning/replication-notes.md#karaoke-heyinyuan-aichang) | 2 | 73.51 | 上游爱唱KTV说明包含手机/电视点歌、曲库浏览和扫码点歌；“和音元”文件与其中一个爱唱文件为同一Git blob。 | P2 / 中 | 尚未收录 |
| [家庭KTV](planning/replication-notes.md#karaoke-home) | 2 | 16.36–16.54 | 家庭电视点歌应用；上游README记录部分机型的扫码点歌异常。 | P2 / 中 | 尚未收录 |
| [IKTV](planning/replication-notes.md#karaoke-iktv) | 1 | 96.70 | 电视K歌应用；上游README将该包标为修复版，并记录过激活提示现象。 | P3 / 中 | 尚未收录 |
| [金调KTV](planning/replication-notes.md#karaoke-jindiao) | 1 | 62.65 | K歌点歌应用；上游将其列为手机/电视通用点歌的同类软件。 | P2 / 中 | 尚未收录 |
| [金音KTV](planning/replication-notes.md#karaoke-jinyin) | 3 | 77.66–87.34 | 手机/电视K歌应用；上游介绍包含扫码点歌、曲库更新和语音助手，目录有多个命名版本。 | P2 / 中 | 尚未收录 |
| [蓝调KTV](planning/replication-notes.md#karaoke-landiao) | 1 | 74.06 | K歌点歌应用；上游将其列为手机/电视通用点歌的同类软件。 | P2 / 中 | 尚未收录 |
| [蓝音](planning/replication-notes.md#karaoke-lanyin) | 1 | 104.20 | 手机/电视K歌应用；上游介绍包含扫码点歌、曲库更新和语音助手。 | P2 / 中 | 尚未收录 |
| [隆庭KTV](planning/replication-notes.md#karaoke-longting) | 1 | 60.96 | K歌点歌应用；上游将其列为手机/电视通用点歌的同类软件。 | P2 / 中 | 尚未收录 |
| [麦动KTV](planning/replication-notes.md#karaoke-maidong) | 1 | 52.75 | 电视K歌点歌应用；上游README称其为开源版，具体源码与许可尚未核实。 | P2 / 中 | 尚未收录 |
| [咪咕爱唱](planning/replication-notes.md#karaoke-migu) | 2 | 15.61–54.89 | 咪咕爱唱电视K歌应用；上游README提到账号登录。 | P3 / 高 | 尚未收录 |
| [全民K歌 TV / MV版](planning/replication-notes.md#karaoke-quanmin) | 4 | 38.28–77.52 | 面向电视的MV点歌/K歌应用，上游收录多个命名版本。 | P2 / 高 | 尚未收录 |
| [时光KTV](planning/replication-notes.md#karaoke-shiguang) | 1 | 61.57 | K歌点歌应用；上游将其列为手机/电视通用点歌的同类软件。 | P2 / 中 | 尚未收录 |
| [随畅KTV](planning/replication-notes.md#karaoke-suichang) | 1 | 44.59 | K歌点歌应用；上游将其列为手机/电视通用点歌的同类软件。 | P2 / 中 | 尚未收录 |
| [想唱就唱](planning/replication-notes.md#karaoke-xiangchang) | 2 | 57.77–57.89 | 支持手机/电视点歌的K歌应用；上游介绍含扫码点歌、曲库更新和语音助手。 | P2 / 中 | 尚未收录 |
| [智能K歌](planning/replication-notes.md#karaoke-zhineng) | 7 | 72.89–88.84 | 手机/电视K歌应用；上游介绍包含扫码点歌、曲库更新和语音助手，目录保留多个版本与修复命名变体。 | P2 / 中 | 尚未收录 |
| [智享K歌](planning/replication-notes.md#karaoke-zhixiang) | 1 | 74.09 | 手机/电视K歌应用；上游介绍包含扫码点歌、曲库更新和语音助手。 | P2 / 中 | 尚未收录 |
| [纯粹直播](planning/replication-notes.md#live-pure-live) | 4 | 32.43–79.01 | 上游描述为聚合多个热门直播平台的大屏客户端。 | P3 / 高 | 尚未收录 |
| [SimpleLive](planning/replication-notes.md#live-simplelive) | 11 | 32.74–79.33 | 上游描述为聚合哔哩哔哩、斗鱼、虎牙、抖音等平台的直播客户端。 | P3 / 高 | 尚未收录 |
| [MX Player（含Pro命名变体）](planning/replication-notes.md#mx-player) | 3 | 33.00–44.97 | 上游将MX Player作为本地视频播放器，说明多个变体集成解码器，Pro和普通版的本地播放功能接近。 | P1 / 中 | 尚未收录 |
| [宝盒（FM内置版）](planning/replication-notes.md#baohe-fm) | 4 | 56.99–64.66 | 上游明确描述为基于FongMi壳子内置开发的宝盒，保留TV及手机变体。 | P2 / 中 | 尚未收录 |
| [动漫鸭](planning/replication-notes.md#dongmanya) | 1 | 13.60 | 上游称为内置多线路的影视播放器，并非仅播放动漫。 | P2 / 中 | 尚未收录 |
| [饭太硬（未收录的大包变体）](planning/replication-notes.md#fantaiying-large) | 1 | 30.16 | 上游描述饭太硬为内置本地源的影视应用；此次条目仅为超限文件名变体。 上游标红，状态待核实。 | P3 / 中 | 尚未收录 |
| [FongMi影视](planning/replication-notes.md#fongmi-vod) | 4 | 83.12–97.10 | 蜂蜜影视；快照实际包含电视端、手机端及32/64位命名变体。 | P2 / 中 | 尚未收录 |
| [好好看TV](planning/replication-notes.md#haohaokan-tv) | 4 | 22.78–23.99 | 上游描述为聚合影视内容的电视客户端，提供多条播放线路、投屏和影评等功能。 | P2 / 中 | 尚未收录 |
| [及时雨影视（JSYBOX）](planning/replication-notes.md#jsybox) | 1 | 36.29 | 上游介绍为基于小苹果TV增加缓存下载功能的影视应用。 | P2 / 中 | 尚未收录 |
| [MediaMix（原521影视）](planning/replication-notes.md#mediamix) | 2 | 69.04–78.64 | 上游称由蜂蜜版修改的空壳应用，包含电视版和手机版，原名521影视。 | P2 / 中 | 尚未收录 |
| [魔内（名称待核实）](planning/replication-notes.md#monei-vod) | 1 | 42.12 | 影视目录中的“魔内6.1.7”安装包；当前已保存README未直接描述该文件。（名称推断） | P3 / 中 | 尚未收录 |
| [OK影视（标准版及旧系统变体）](planning/replication-notes.md#ok-vod) | 5 | 56.07–86.78 | 上游列有标准版、安卓5专版；树中还保留手机、电视与海信命名变体。 | P2 / 中 | 尚未收录 |
| [欧歌影视](planning/replication-notes.md#ouge-vod) | 1 | 35.84 | 上游描述为基于影视仓、内置欧歌源的影视客户端。 | P2 / 中 | 尚未收录 |
| [欧歌影视魔改](planning/replication-notes.md#ouge-vod-mod) | 1 | 36.01 | 上游单独列出的欧歌影视修改变体，描述同为基于影视仓并内置欧歌源。 | P3 / 中 | 尚未收录 |
| [七星影仓](planning/replication-notes.md#qixing-yingcang) | 3 | 29.52–35.96 | 上游描述为基于影视仓的内置源应用，另有V3旧系统版本。 上游标红，状态待核实。 | P2 / 中 | 尚未收录 |
| [TVBox · q215613905](planning/replication-notes.md#tvbox-q215613905) | 6 | 19.80–52.63 | 上游TVBox为需配置接口源的空壳播放器；本组按文件名q215613905分支归类。 | P2 / 高 | 尚未收录 |
| [TVBox · takagen99](planning/replication-notes.md#tvbox-takagen99) | 8 | 28.05–41.86 | 上游TVBox空壳播放器的takagen99命名分支，文件名区分架构、generic/hisense和java/python。 | P2 / 高 | 尚未收录 |
| [小苹果影视](planning/replication-notes.md#xiaopingguo-vod) | 1 | 34.98 | 上游介绍为内置多条线路、无需手动输入接口的电视影视应用。 | P2 / 中 | 尚未收录 |
| [新五岳影视TV](planning/replication-notes.md#xinwuyue-vod) | 1 | 36.52 | 上游描述为内置内容、可点播及直播的电视影视应用。 | P2 / 中 | 尚未收录 |
| [XMBOX](planning/replication-notes.md#xmbox) | 6 | 35.61–39.87 | 上游描述为需自行添源的Android视频播放器，提供电视及手机等界面变体。 | P2 / 中 | 尚未收录 |
| [XPGBOX（待核实名称）](planning/replication-notes.md#xpgbox) | 1 | 34.83 | 影视目录中的XPGBOX安装包，具体功能与产品名称尚待核实。（名称推断） | P3 / 中 | 尚未收录 |
| [影视仓](planning/replication-notes.md#yingshicang) | 8 | 29.60–61.08 | 影视仓需设置接口源；上游另外保留面向旧Android的V3稳定版以及手机/平板变体。 | P2 / 高 | 尚未收录 |
| [月光宝盒Box](planning/replication-notes.md#yueguang-box) | 8 | 27.87–41.86 | 上游称Box为单仓版本并内置数据源。 | P2 / 中 | 尚未收录 |
| [月光宝盒Max](planning/replication-notes.md#yueguang-max) | 5 | 37.12–37.57 | 上游称Max为可更换来源的多仓版本。 | P2 / 高 | 尚未收录 |
| [月光宝盒PLUS](planning/replication-notes.md#yueguang-plus) | 3 | 24.28–24.29 | 上游称PLUS支持点播和直播并内置数据源。 | P2 / 中 | 尚未收录 |
| [囧次元](planning/replication-notes.md#jiongciyuan) | 2 | 17.03–45.48 | 上游介绍为覆盖动漫内容的安卓/电视应用；目录包含两个不同版本标称文件。 | P2 / 中 | 尚未收录 |
| [BiliTV（上游1.2.2）](planning/replication-notes.md#bili-tv-upstream) | 1 | 22.83 | 上游称其为另一款第三方哔哩哔哩客户端。 | P1 / 中 | 尚未收录 |
| [BV](planning/replication-notes.md#bv) | 1 | 12.52 | 上游列为第三方哔哩哔哩电视客户端。 | P1 / 中 | 尚未收录 |
| [梨园行戏曲 / 4K梨园戏](planning/replication-notes.md#liyuan-opera) | 1 | 36.55 | 上游介绍为电视戏曲播放应用，具体资源目录和检索能力待进一步调查。 | P2 / 中 | 尚未收录 |
| [七星戏曲](planning/replication-notes.md#qixing-opera) | 1 | 78.73 | 上游列为box风格的戏曲播放应用。 | P2 / 中 | 1/1个APK已收录 |
| [云视听快TV](planning/replication-notes.md#kuaishou-tv) | 1 | 18.01 | 上游将其描述为快手的电视客户端旧版。 | P3 / 高 | 尚未收录 |
| [音悦](planning/replication-notes.md#yinyue-music) | 1 | 64.60 | 上游介绍为音乐播放、下载工具，并明确支持自定义音乐源。 | P2 / 中 | 尚未收录 |
| [茉莉音乐](planning/replication-notes.md#jasmine-music) | 2 | 24.99–25.07 | 上游介绍为音乐播放与下载应用。 | P2 / 中 | 1/2个APK已收录 |
| [魔音MORIN](planning/replication-notes.md#morin-music) | 1 | 25.09 | 上游介绍为音乐播放器和音频下载工具。 | P2 / 中 | 尚未收录 |
| [TG音乐台](planning/replication-notes.md#tg-music) | 1 | 89.25 | 上游描述为基于TVBox的音乐/MV客户端，附带本地配置的资源目录。 | P2 / 中 | 尚未收录 |

## 游戏 / game（3个家族）

| 应用/系列 | APK数 | 大小范围 MB | 用途与定位 | 优先 / 首版难度 | 收录状态 |
| --- | ---: | ---: | --- | --- | --- |
| [小鸡模拟器TV版](planning/replication-notes.md#xiaoji-emulator) | 1 | 50.33 | 上游描述为可浏览和运行经典游戏的电视模拟器，并标注目前无法下载新游戏。 上游标红，状态待核实。 | P3 / 高 | 尚未收录 |
| [酷咖游戏](planning/replication-notes.md#kuka-games) | 1 | 24.68 | 上游描述涵盖街机、FC、MD、SFC等经典游戏，并称支持联机。 | P3 / 高 | 尚未收录 |
| [茱元游戏TV](planning/replication-notes.md#zhuyuan-games) | 1 | 72.40 | 上游介绍为支持搜索、下载和手柄操作的游戏集合平台。 | P3 / 高 | 尚未收录 |

## 教育 / education（5个家族）

| 应用/系列 | APK数 | 大小范围 MB | 用途与定位 | 优先 / 首版难度 | 收录状态 |
| --- | ---: | ---: | --- | --- | --- |
| [宝宝趣学](planning/replication-notes.md#baby-fun-learning) | 2 | 26.11–28.35 | 上游明确介绍包含儿童和家长两种模式。 | P1 / 中 | 1/2个APK已收录 |
| [贝乐虎儿歌](planning/replication-notes.md#beilehu-rhymes) | 1 | 30.34 | 上游介绍为电视儿歌应用，并注明目前无法获取数据。 上游标红，状态待核实。 | P2 / 中 | 尚未收录 |
| [儿歌多多TV](planning/replication-notes.md#ergeduoduo) | 2 | 14.10–17.82 | 按应用名称和上游教育分类，可作为电视儿歌播放应用参考；细节尚未运行核验。（名称推断） | P2 / 中 | 1/2个APK已收录 |
| [七星智教](planning/replication-notes.md#qixing-education) | 2 | 42.73–55.67 | 上游介绍为面向儿童、结合教育与娱乐的资源应用。 | P2 / 中 | 尚未收录 |
| [淘知学堂TV](planning/replication-notes.md#taozhi-classroom) | 1 | 25.27 | 上游描述为面向学生、提供学习内容播放的应用。 | P3 / 高 | 1/1个APK已收录 |

## 工具 / tools（5个家族）

| 应用/系列 | APK数 | 大小范围 MB | 用途与定位 | 优先 / 首版难度 | 收录状态 |
| --- | ---: | ---: | --- | --- | --- |
| [应用管家](planning/replication-notes.md#app-housekeeper) | 3 | 18.46–18.46 | 上游明确描述应用/文件管理、应用提取及传送到电视安装等功能。 | P1 / 中 | 尚未收录 |
| [MT管理器](planning/replication-notes.md#mt-manager) | 1 | 27.28 | 上游称其为文件管理和APK分析/修改工具。 | P3 / 高 | 尚未收录 |
| [NP管理器](planning/replication-notes.md#np-manager) | 1 | 45.14 | 上游称其为文件管理和APK分析/修改工具。 | P3 / 高 | 尚未收录 |
| [ES文件浏览器](planning/replication-notes.md#es-file-explorer) | 2 | 46.12–73.08 | 文件名和上游列表表明其为文件浏览器；具体网络协议与完整功能尚未核验。（名称推断） | P1 / 中 | 尚未收录 |
| [野草助手](planning/replication-notes.md#wild-grass-assistant) | 2 | 16.14–16.29 | 上游描述通过口令和远程传输等方式辅助电视安装应用。 | P1 / 中 | 尚未收录 |

## 健身 / fitness（3个家族）

| 应用/系列 | APK数 | 大小范围 MB | 用途与定位 | 优先 / 首版难度 | 收录状态 |
| --- | ---: | ---: | --- | --- | --- |
| [Keep健身TV版](planning/replication-notes.md#keep-tv) | 2 | 19.10–19.16 | 按名称和上游运动健身分类，为电视健身应用；README未提供可核实的完整功能表。（名称推断） | P2 / 中 | 尚未收录 |
| [CIBN糖豆 / 糖豆广场舞](planning/replication-notes.md#tangdou-dance) | 3 | 21.51–26.72 | 文件名和上游名称表明其为广场舞电视应用；具体课程与播放功能待调查。（名称推断） | P2 / 中 | 尚未收录 |
| [每日瑜伽](planning/replication-notes.md#daily-yoga) | 1 | 21.25 | 按名称和上游运动健身分类，属于瑜伽训练内容应用；具体训练结构未核验。（名称推断） | P2 / 中 | 尚未收录 |

## 同内容文件与已收录小版本

共有6组Git blob完全相同的别名文件，逐文件表已互相标出。和音元与爱唱KTV的两份文件内容相同，已合为一个参考家族。

VsTV的ARM/x86_64/HarmonyOS小包已在[收录目录](media/vstv/)与[HarmonyOS目录](media/vstv-harmony/)；本清单只补充较大的arm-av3a变体。饭太硬同名系列已有[小包](media/fantaiying/)，本次列出的是另一个大文件；没有解包核实其与小包的升级关系。

只列入固定树中实际存在的超限APK。README中指向其他仓库、外站或仅有说明而未存放APK的条目不计入这205份。

维护：编辑[应用评估](planning/app-notes.json)，运行 `python3 tools/update-tvapp-oversized.py`；用 `--check` 核对所有文件恰好覆盖一次以及生成文档一致。

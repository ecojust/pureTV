**简体中文** | [English](README.en.md)

<div align="center">
  <img src="docs/branding/puretv-logo.png" width="112" alt="pureTV 生肖龙 Logo">
</div>

pureTV 是电脑端的 Android TV / Google TV 系统管理器。通过 ADB 连接电视，查看系统信息，安装、卸载、启停应用，选择启动器，并用可视化画布自定义支持的桌面。也可通过 MCP 让 Agent 控制已打开的管理器。

[![GitHub release](https://img.shields.io/github/v/release/ecojust/pureTV?style=flat-square&label=release&color=0f766e&sort=date)](https://github.com/ecojust/pureTV/releases/latest)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-2563eb?style=flat-square)](desktop/README.md)
[![启动器数量](https://img.shields.io/badge/launchers-10-7c3aed?style=flat-square)](resource/launcher/)
[![应用数量](https://img.shields.io/badge/apps-115-f97316?style=flat-square)](resource/apps/)
[![MCP tools](https://img.shields.io/badge/MCP-34%20tools-5c4ee5?style=flat-square)](desktop/docs/mcp.md)
[![Layout protocol](https://img.shields.io/badge/layout-v5-0891b2?style=flat-square)](resource/README-development.md#layoutjson-协议规范与画面对照)
[![Android TV via ADB](https://img.shields.io/badge/Android%20TV-ADB-3ddc84?style=flat-square&logo=android&logoColor=white)](#连接与应用管理)
[![MIT license](https://img.shields.io/badge/license-MIT-f4c430?style=flat-square)](LICENSE)

![管理器界面示例，使用模拟设备数据](docs/previews/manager-0415.png)

## 连接与应用管理

1. 电脑和电视接入可互通的网络，在电视开发者选项中开启 ADB／网络调试。
2. 首页输入电视 IP／主机名与调试端口，在电视上允许电脑连接。常见端口为 5555，以电视实际设置为准。
3. 缺少 ADB 时，阅读并同意 Android SDK 许可后点击「下载并配置 ADB」；优先 Google，失败时使用腾讯镜像。也可选择已有 ADB。

连接后首页显示型号、Android／SDK／安全补丁、CPU、内存、`/data` 磁盘容量、分辨率及运行时间。其他页面顶部保留当前连接状态。

- **应用管理**：搜索和分类，批量启用／停用、为当前用户卸载、恢复仍保有安装包的系统应用。
- **包名说明**：点击应用行中的圆圈 **i**，查询包的用途、卸载风险、资料来源与获取时间；未知包明确提示，当前默认桌面与核心组件的保护优先。
- **客户端更新**：启动后或手动检查 Gitee 商店 `client` 目录，按系统匹配新版本；点击「下载并安装」后校验安装包并自动安装、重启。首次从旧版升级及各平台说明见[客户端更新](desktop/docs/client-updates.md)。
- **待安装应用**：导入本地 APK，可在行尾安装单个，也可勾选批量安装；成功项移出队列，失败与未执行项保留。
- **启动器**：导入启动器 APK 后在该页面直接安装，选择／恢复默认桌面；支持接口的当前启动器显示「调整布局」。
- **市场**：动态浏览 [pure-tv-store](https://gitee.com/juzisang331/pure-tv-store) 的应用与启动器，搜索、预览并下载到待安装列表，或连接电视后直接安装；同一应用或启动器的多个版本合并展示，可从下拉框选择最近 5 个版本，默认最新版；仓库新增 APK 后刷新即可发现。下载时一并保存同目录的 `logo.svg`，布局编辑器新增应用块或切换应用时自动使用该图标。
- 应用与启动器均显示主 APK 与分包的合计大小，不含私有数据、缓存与优化文件，无法读取时明确显示未知。
- 列表内部滚动，表头和顶部批量操作固定；核心系统组件与当前默认启动器受保护。

系统应用卸载只针对当前 Android 用户，保留数据，不删除系统分区 APK。新安装且具备启动入口的用户应用可加入启动器排布。

主动执行连接、刷新、应用管理、启动器切换或布局应用等操作时，管理器显示等待状态，完成后弹窗反馈结果。批量任务区分成功、失败和未执行项；后台自动读取不会反复弹窗。

## 启动器与电视应用资源

公共目录为 [resource/](resource/)，分为 [launcher/](resource/launcher/) 与 [apps/](resource/apps/)，原根目录的启动器和应用源码已整体移入。启动器和电视应用 APK 放在各自软件目录，也可通过独立的 `android-v*` Release 下载；电脑管理器保留单独的 `desktop-v*` 版本与最新发布入口。每个软件文件夹至少包含一个实际 APK，可同时提供对应版本源码、封面、作者、许可证及 SHA256。点击软件名称进入对应文件夹。每个电视应用目录还提供 64×64 的 `logo.svg`，供启动器布局使用；后续应用遵循[资源约定](resource/README-development.md#应用资源与-logosvg-约定)。

九款游戏的 0.5.1 规则与交互改进见[还原度复核](docs/game-fidelity-0.5.1.md)。沿用 0.5.0 统一证书，可覆盖更新 0.5.0；文档同时列出仍未精确还原的地图与内容。

启动器布局自定义使用本管理器的 **layout.json 版本 5 users/system 接口**。支持布局协议的启动器卡片自动显示 Home 背景颜色和图片，包括未激活的启动器；修改并应用布局后同步更新。列表不提供选择或移除封面的操作，桌面背景统一在「调整布局」中修改。待安装 APK 优先预览内置布局的 Home 背景，仅在无法读取布局背景时使用同目录的 `thumb.png`／`APK名.thumb.png`。

<!-- resource-index:start -->

### 启动器

<table>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/aster/"><img src="resource/launcher/aster/thumb.png" width="180" alt="Aster TV · 星轨 界面"><br>Aster TV · 星轨</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/circuit/"><img src="resource/launcher/circuit/thumb.png" width="180" alt="Circuit TV · 回路 界面"><br>Circuit TV · 回路</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/drift/"><img src="resource/launcher/drift/thumb.png" width="180" alt="Drift TV 界面"><br>Drift TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/forma/"><img src="resource/launcher/forma/thumb.png" width="180" alt="Forma TV 界面"><br>Forma TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/mono/"><img src="resource/launcher/mono/thumb.png" width="180" alt="Mono TV 墨白 界面"><br>Mono TV 墨白</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/moss/"><img src="resource/launcher/moss/thumb.png" width="180" alt="Moss TV 界面"><br>Moss TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/nova/"><img src="resource/launcher/nova/thumb.png" width="180" alt="Nova TV 界面"><br>Nova TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/pixel/"><img src="resource/launcher/pixel/thumb.png" width="180" alt="Pixel TV 像素 界面"><br>Pixel TV 像素</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/puretv/"><img src="resource/launcher/puretv/thumb.png" width="180" alt="pureTV Launcher 界面"><br>pureTV Launcher</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/sol/"><img src="resource/launcher/sol/thumb.png" width="180" alt="Sol TV 界面"><br>Sol TV</a></td>
    <td width="25%"></td>
    <td width="25%"></td>
  </tr>
</table>

### 应用-影音

<table>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/cctv/"><img src="resource/apps/cctv/thumb.png" width="180" alt="CCTV Live 界面"><br>CCTV Live</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/hifini/"><img src="resource/apps/hifini/thumb.png" width="180" alt="HIFINi TV 界面"><br>HIFINi TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/shortvideo/"><img src="resource/apps/shortvideo/thumb.png" width="180" alt="ShortVideo TV 界面"><br>ShortVideo TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/webtv/"><img src="resource/apps/webtv/thumb.png" width="180" alt="WebTV 界面"><br>WebTV</a></td>
  </tr>
</table>

### 应用-游戏

<table>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/adjacency-forge/"><img src="resource/apps/adjacency-forge/thumb.png" width="180" alt="邻接铸造 界面"><br>邻接铸造</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/adventure-island/"><img src="resource/apps/adventure-island/thumb.png" width="180" alt="Adventure Island TV 界面"><br>Adventure Island TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/airlock-budget/"><img src="resource/apps/airlock-budget/thumb.png" width="180" alt="气闸值守 界面"><br>气闸值守</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/alien-shooter/"><img src="resource/apps/alien-shooter/thumb.png" width="180" alt="孤胆枪手 TV 界面"><br>孤胆枪手 TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/arrow-harvest/"><img src="resource/apps/arrow-harvest/thumb.png" width="180" alt="箭田收获 界面"><br>箭田收获</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/assembly-kitchen/"><img src="resource/apps/assembly-kitchen/thumb.png" width="180" alt="装配厨房 界面"><br>装配厨房</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/battery-exchange/"><img src="resource/apps/battery-exchange/thumb.png" width="180" alt="电芯交换 界面"><br>电芯交换</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/beat-braid/"><img src="resource/apps/beat-braid/thumb.png" width="180" alt="双线节律 界面"><br>双线节律</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/binary-weave/"><img src="resource/apps/binary-weave/thumb.png" width="180" alt="二元织格 界面"><br>二元织格</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/bomb-jack/"><img src="resource/apps/bomb-jack/thumb.png" width="180" alt="Mighty Bomb Jack TV 界面"><br>Mighty Bomb Jack TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/brick-paddle/"><img src="resource/apps/brick-paddle/thumb.png" width="180" alt="弹板清砖 界面"><br>弹板清砖</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/cable-unweaver/"><img src="resource/apps/cable-unweaver/thumb.png" width="180" alt="解线工 界面"><br>解线工</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/clockwork-align/"><img src="resource/apps/clockwork-align/thumb.png" width="180" alt="齿轮同刻 界面"><br>齿轮同刻</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/coast-kart/"><img src="resource/apps/coast-kart/thumb.png" width="180" alt="Coast Kart TV 界面"><br>Coast Kart TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/codebreaker/"><img src="resource/apps/codebreaker/thumb.png" width="180" alt="纹码破译 界面"><br>纹码破译</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/color-frontier/"><img src="resource/apps/color-frontier/thumb.png" width="180" alt="染色连疆 界面"><br>染色连疆</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/color-paths/"><img src="resource/apps/color-paths/thumb.png" width="180" alt="彩径连点 界面"><br>彩径连点</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/conveyor-window/"><img src="resource/apps/conveyor-window/thumb.png" width="180" alt="窗口装配 界面"><br>窗口装配</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/cozy-island/"><img src="resource/apps/cozy-island/thumb.png" width="180" alt="Cozy Island TV 界面"><br>Cozy Island TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/domino-chain/"><img src="resource/apps/domino-chain/thumb.png" width="180" alt="骨牌接龙 界面"><br>骨牌接龙</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/dots-boxes/"><img src="resource/apps/dots-boxes/thumb.png" width="180" alt="点线围格 界面"><br>点线围格</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/draughts-trail/"><img src="resource/apps/draughts-trail/thumb.png" width="180" alt="跳吃棋径 界面"><br>跳吃棋径</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/echo-cartographer/"><img src="resource/apps/echo-cartographer/thumb.png" width="180" alt="回声探图 界面"><br>回声探图</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/firebreak-planner/"><img src="resource/apps/firebreak-planner/thumb.png" width="180" alt="防火带 界面"><br>防火带</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/fleet-ledger/"><img src="resource/apps/fleet-ledger/thumb.png" width="180" alt="舰队账册 界面"><br>舰队账册</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/four-in-row/"><img src="resource/apps/four-in-row/thumb.png" width="180" alt="四子列阵 界面"><br>四子列阵</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/frost-brake/"><img src="resource/apps/frost-brake/thumb.png" width="180" alt="冰面刹停 界面"><br>冰面刹停</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/glass-fold/"><img src="resource/apps/glass-fold/thumb.png" width="180" alt="折光工坊 界面"><br>折光工坊</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/gravity-courier/"><img src="resource/apps/gravity-courier/thumb.png" width="180" alt="引力快递 界面"><br>引力快递</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/greenhouse-dials/"><img src="resource/apps/greenhouse-dials/thumb.png" width="180" alt="温室旋钮 界面"><br>温室旋钮</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/harbor-counterweight/"><img src="resource/apps/harbor-counterweight/thumb.png" width="180" alt="港口配重 界面"><br>港口配重</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/hex-connection/"><img src="resource/apps/hex-connection/thumb.png" width="180" alt="六角连线 界面"><br>六角连线</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/hidden-corridors/"><img src="resource/apps/hidden-corridors/thumb.png" width="180" alt="隐墙测绘 界面"><br>隐墙测绘</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/island-dominoes/"><img src="resource/apps/island-dominoes/thumb.png" width="180" alt="双岛联结 界面"><br>双岛联结</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/island-ink/"><img src="resource/apps/island-ink/thumb.png" width="180" alt="岛海墨图 界面"><br>岛海墨图</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/jackal/"><img src="resource/apps/jackal/thumb.png" width="180" alt="Jackal TV 界面"><br>Jackal TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/jewel/"><img src="resource/apps/jewel/thumb.png" width="180" alt="Magic Jewelry TV 界面"><br>Magic Jewelry TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/kaleido-keys/"><img src="resource/apps/kaleido-keys/thumb.png" width="180" alt="万花钥匙 界面"><br>万花钥匙</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/knight-circuit/"><img src="resource/apps/knight-circuit/thumb.png" width="180" alt="马步巡游 界面"><br>马步巡游</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/lane-bowling/"><img src="resource/apps/lane-bowling/thumb.png" width="180" alt="球道击柱 界面"><br>球道击柱</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/lantern-rhythm/"><img src="resource/apps/lantern-rhythm/thumb.png" width="180" alt="灯塔节拍 界面"><br>灯塔节拍</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/lens-distance/"><img src="resource/apps/lens-distance/thumb.png" width="180" alt="焦距实验室 界面"><br>焦距实验室</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/liberty-stones/"><img src="resource/apps/liberty-stones/thumb.png" width="180" alt="围子夺星 界面"><br>围子夺星</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/light-chambers/"><img src="resource/apps/light-chambers/thumb.png" width="180" alt="光室布灯 界面"><br>光室布灯</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/logic-workbench/"><img src="resource/apps/logic-workbench/thumb.png" width="180" alt="逻辑工坊 界面"><br>逻辑工坊</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/loop-orchard/"><img src="resource/apps/loop-orchard/thumb.png" width="180" alt="环线果园 界面"><br>环线果园</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/magnetic-warehouse/"><img src="resource/apps/magnetic-warehouse/thumb.png" width="180" alt="磁极仓库 界面"><br>磁极仓库</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/measure-pour/"><img src="resource/apps/measure-pour/thumb.png" width="180" alt="量杯转运 界面"><br>量杯转运</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/memory-gallery/"><img src="resource/apps/memory-gallery/thumb.png" width="180" alt="记忆陈列 界面"><br>记忆陈列</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/merge-tiles/"><img src="resource/apps/merge-tiles/thumb.png" width="180" alt="数字汇聚 界面"><br>数字汇聚</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/metronome-gates/"><img src="resource/apps/metronome-gates/thumb.png" width="180" alt="节拍闸道 界面"><br>节拍闸道</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/mine-survey/"><img src="resource/apps/mine-survey/thumb.png" width="180" alt="雷纹勘探 界面"><br>雷纹勘探</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/moire-atelier/"><img src="resource/apps/moire-atelier/thumb.png" width="180" alt="纹幕校准 界面"><br>纹幕校准</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/nim-orbit/"><img src="resource/apps/nim-orbit/thumb.png" width="180" alt="取石回合 界面"><br>取石回合</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/number-dunes/"><img src="resource/apps/number-dunes/thumb.png" width="180" alt="沙丘数列 界面"><br>沙丘数列</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/orbit-turret/"><img src="resource/apps/orbit-turret/thumb.png" width="180" alt="环轨炮台 界面"><br>环轨炮台</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/orchard-snake/"><img src="resource/apps/orchard-snake/thumb.png" width="180" alt="果园游蛇 界面"><br>果园游蛇</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/packing-sculptor/"><img src="resource/apps/packing-sculptor/thumb.png" width="180" alt="异形装箱 界面"><br>异形装箱</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/parallax-skyline/"><img src="resource/apps/parallax-skyline/thumb.png" width="180" alt="视差天际 界面"><br>视差天际</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/parity-garden/"><img src="resource/apps/parity-garden/thumb.png" width="180" alt="奇偶花圃 界面"><br>奇偶花圃</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/path-glyphs/"><img src="resource/apps/path-glyphs/thumb.png" width="180" alt="路径刻印 界面"><br>路径刻印</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/pixel-clues/"><img src="resource/apps/pixel-clues/thumb.png" width="180" alt="像素线索 界面"><br>像素线索</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/pocket-golf/"><img src="resource/apps/pocket-golf/thumb.png" width="180" alt="口袋果岭 界面"><br>口袋果岭</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/pocket-solitaire/"><img src="resource/apps/pocket-solitaire/thumb.png" width="180" alt="口袋接龙 界面"><br>口袋接龙</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/pollinator-contract/"><img src="resource/apps/pollinator-contract/thumb.png" width="180" alt="传粉契约 界面"><br>传粉契约</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/pressure-seal/"><img src="resource/apps/pressure-seal/thumb.png" width="180" alt="压力封装 界面"><br>压力封装</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/prism-relay/"><img src="resource/apps/prism-relay/thumb.png" width="180" alt="镜光接力 界面"><br>镜光接力</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/pulse-vault/"><img src="resource/apps/pulse-vault/thumb.png" width="180" alt="脉冲储库 界面"><br>脉冲储库</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/quadrant-five/"><img src="resource/apps/quadrant-five/thumb.png" width="180" alt="旋盘五子 界面"><br>旋盘五子</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/queen-constellation/"><img src="resource/apps/queen-constellation/thumb.png" width="180" alt="星盘皇后 界面"><br>星盘皇后</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/rectangle-atlas/"><img src="resource/apps/rectangle-atlas/thumb.png" width="180" alt="矩形图册 界面"><br>矩形图册</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/reservoir-seasons/"><img src="resource/apps/reservoir-seasons/thumb.png" width="180" alt="四季蓄水 界面"><br>四季蓄水</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/resonance-bridge/"><img src="resource/apps/resonance-bridge/thumb.png" width="180" alt="共振浮桥 界面"><br>共振浮桥</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/reversi-relay/"><img src="resource/apps/reversi-relay/thumb.png" width="180" alt="翻面棋局 界面"><br>翻面棋局</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/ring-towers/"><img src="resource/apps/ring-towers/thumb.png" width="180" alt="环塔迁移 界面"><br>环塔迁移</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/river-guard/"><img src="resource/apps/river-guard/thumb.png" width="180" alt="渡河守则 界面"><br>渡河守则</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/river-hopper/"><img src="resource/apps/river-hopper/thumb.png" width="180" alt="渡河跃步 界面"><br>渡河跃步</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/rooftop-runner/"><img src="resource/apps/rooftop-runner/thumb.png" width="180" alt="天台疾跑 界面"><br>天台疾跑</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/rook-rescue/"><img src="resource/apps/rook-rescue/thumb.png" width="180" alt="王车合围 界面"><br>王车合围</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/rotor-locksmith/"><img src="resource/apps/rotor-locksmith/thumb.png" width="180" alt="旋环锁匠 界面"><br>旋环锁匠</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/sandglass-split/"><img src="resource/apps/sandglass-split/thumb.png" width="180" alt="分流沙漏 界面"><br>分流沙漏</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/seed-mancala/"><img src="resource/apps/seed-mancala/thumb.png" width="180" alt="播子棋盘 界面"><br>播子棋盘</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/shade-duplicates/"><img src="resource/apps/shade-duplicates/thumb.png" width="180" alt="去重留白 界面"><br>去重留白</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/shadow-foundry/"><img src="resource/apps/shadow-foundry/thumb.png" width="180" alt="影形铸坊 界面"><br>影形铸坊</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/shadow-shutter/"><img src="resource/apps/shadow-shutter/thumb.png" width="180" alt="影窗快门 界面"><br>影窗快门</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/skyline-numbers/"><img src="resource/apps/skyline-numbers/thumb.png" width="180" alt="数塔天际 界面"><br>数塔天际</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/sliding-order/"><img src="resource/apps/sliding-order/thumb.png" width="180" alt="滑格归序 界面"><br>滑格归序</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/solar-shift/"><img src="resource/apps/solar-shift/thumb.png" width="180" alt="逐日供电 界面"><br>逐日供电</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/sorting-wires/"><img src="resource/apps/sorting-wires/thumb.png" width="180" alt="比较器工坊 界面"><br>比较器工坊</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/stack-dispatch/"><img src="resource/apps/stack-dispatch/thumb.png" width="180" alt="序栈货运 界面"><br>序栈货运</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/star-formation/"><img src="resource/apps/star-formation/thumb.png" width="180" alt="星阵防线 界面"><br>星阵防线</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/stone-bay/"><img src="resource/apps/stone-bay/thumb.png" width="180" alt="石箱归位 界面"><br>石箱归位</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/sum-crossings/"><img src="resource/apps/sum-crossings/thumb.png" width="180" alt="交叉数和 界面"><br>交叉数和</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/super-mario/"><img src="resource/apps/super-mario/thumb.png" width="180" alt="Super Mario TV 界面"><br>Super Mario TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/switchyard-minute/"><img src="resource/apps/switchyard-minute/thumb.png" width="180" alt="分岔调度 界面"><br>分岔调度</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tank/"><img src="resource/apps/tank/thumb.png" width="180" alt="Tank TV 界面"><br>Tank TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tension-span/"><img src="resource/apps/tension-span/thumb.png" width="180" alt="拉索桥梁 界面"><br>拉索桥梁</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tetris/"><img src="resource/apps/tetris/thumb.png" width="180" alt="Tetris TV 界面"><br>Tetris TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tetro-islands/"><img src="resource/apps/tetro-islands/thumb.png" width="180" alt="四格岛群 界面"><br>四格岛群</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/thermal-glider/"><img src="resource/apps/thermal-glider/thumb.png" width="180" alt="热流滑翔 界面"><br>热流滑翔</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tide-lock/"><img src="resource/apps/tide-lock/thumb.png" width="180" alt="潮汐闸门 界面"><br>潮汐闸门</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tile-garden/"><img src="resource/apps/tile-garden/thumb.png" width="180" alt="叠牌花园 界面"><br>叠牌花园</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/torch-bridge/"><img src="resource/apps/torch-bridge/thumb.png" width="180" alt="夜桥接力 界面"><br>夜桥接力</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tower-overlap/"><img src="resource/apps/tower-overlap/thumb.png" width="180" alt="叠塔工匠 界面"><br>叠塔工匠</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/traffic-escape/"><img src="resource/apps/traffic-escape/thumb.png" width="180" alt="车阵出口 界面"><br>车阵出口</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/triangle-pegs/"><img src="resource/apps/triangle-pegs/thumb.png" width="180" alt="三角跳珠 界面"><br>三角跳珠</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/triangular-tessera/"><img src="resource/apps/triangular-tessera/thumb.png" width="180" alt="三角拼域 界面"><br>三角拼域</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/twenty-four/"><img src="resource/apps/twenty-four/thumb.png" width="180" alt="四则二十四 界面"><br>四则二十四</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/used-car-racing/"><img src="resource/apps/used-car-racing/thumb.png" width="180" alt="极品二手车 界面"><br>极品二手车</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/weight-ledger/"><img src="resource/apps/weight-ledger/thumb.png" width="180" alt="砝码账本 界面"><br>砝码账本</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/word-ladder/"><img src="resource/apps/word-ladder/thumb.png" width="180" alt="词阶接龙 界面"><br>词阶接龙</a></td>
    <td width="25%"></td>
  </tr>
</table>

<!-- resource-index:end -->

桔子桑开发的电视应用 APK 与源码见 [resource/apps/](resource/apps/)。

## MCP / Agent

在「设备连接 → MCP · Agent 调试」复制配置到客户端，保持管理器窗口打开。34 个工具覆盖系统信息、连接、应用管理、APK 安装、启动器切换与布局、市场目录／下载／安装、背景图、ADB 配置、语言与主题、取消及记录；Agent 与界面共享状态。

[完整 MCP 接入与参数](desktop/docs/mcp.md)。

## 开发文档

构建与测试说明见 [resource 开发 README](resource/README-development.md)。

<a id="layoutjson-规范与画面对照"></a>

<a id="layoutjson-协议规范与画面对照"></a>

### 自定义启动器布局

`layout.json` 是连接启动器与管理器显示的协议文件：电视和电脑使用同一份布局，管理器可以重现桌面并调整应用块。Home 和 Apps 支持独立背景、布局与切页设置；用户应用可编辑，系统组件仅供查看。

在启动器页面选择「调整布局」，可添加已安装用户应用、拖动、框选、对齐或平铺排布，确认后应用到电视。使用新版布局需同时更新管理器与配套启动器。

完整字段说明、JSON 示例与画面对照见 [layout.json 协议规范](resource/README-development.md#layoutjson-协议规范与画面对照)。

## 许可与致谢

pureTV 使用 [MIT](LICENSE) 许可。部分电视端启动器代码参考 [Gathin23/cleanyourtv](https://github.com/Gathin23/cleanyourtv)，原作者版权与许可保留于 [NOTICE.md](NOTICE.md)。字体见 [OFL 许可](resource/launcher/puretv/FONT-LICENSE-OFL.txt)。应用使用的第三方代码、字体和其他素材保留各自的版权及许可声明。

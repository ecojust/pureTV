# 电视与盒子兼容性验收清单

本清单用于给 pureTV Manager 的每项能力建立可复查的兼容结果，适用于连接、读取、应用管理、HOME 和布局操作。**品牌、Android 版本或“ADB 已连接”都不能单独证明全部功能可用。** 结论必须限定到型号、销售地区、固件、实际 Android API、电视 ABI、管理器版本及电脑环境。

发布基线为 Manager 0.5.2。已有[发布验证](release-0.5.2-validation.md)证明桌面构建、模拟设备回归及列明的安装验证；它不构成任何品牌的实体电视通过记录。本文件是待执行清单，不新增实机通过结论。命令语义与已知限制见[ADB 调研](adb-research.md)，布局协议见[开发约定](../../resource/README-development.md)。

当前用户查询的版本边界必须随证据记录，不能把新源码能力套到旧安装包：

| 被测版本 | `am` 与 `cmd activity` 均不可用时的 `mUserLru` 回退范围 | 证据边界 |
| --- | --- | --- |
| 已发布 0.5.2 | 仅实时查询的 SDK 19 | 已有发布回归；没有本清单目标电视的 E4 实测证据 |
| 本轮当前源码 | 实时查询的 SDK 19、21、22、23；其余 SDK 不使用此回退 | 对应 AOSP 不变量已核对；以[当前实现](../core/src/current_user.rs)和后续冻结提交为准，不表示新安装包已发布或实机已通过 |

扩展用户识别不等于扩展安装、HOME 或布局接口；各能力仍须分别验证。

## 1. 先识别平台，再选择样本

下表只是采购、借测和用户反馈的候选分组，不是已验证设备名单。每组先选一个实际可获得的型号；发现不同地区、系统分支或限制后再补样本，不建立品牌 × 全版本 × 全主机的巨大组合表。

| 候选组 | 常见候选品牌或产品系列 | 必须核实的差异 |
| --- | --- | --- |
| 大陆电视厂商系统 | 小米／Redmi、TCL／雷鸟、海信／Vidda、创维／酷开、长虹、康佳、海尔；另补乐视等存量旧电视 | 实际是否基于 Android、开发者入口、网络 ADB、系统包分类及默认 HOME 限制；营销系统名称不能替代 SDK |
| 国际 Android TV／Google TV 电视 | Sony BRAVIA，以及**明确搭载该平台的具体型号**：TCL、海信、Philips、Sharp、Panasonic 等 | 同品牌可能因地区、授权厂商或产品代际使用不同 OS；记录 Google TV 界面之下的实际 Android API |
| Android TV／Google TV 盒子、电视棒 | NVIDIA SHIELD、小米盒子／电视棒、Chromecast with Google TV、Google TV Streamer，以及经核实的 onn、Homatics、MECOOL 等型号 | 盒子与电视的 HOME、休眠和遥控差异；旧 Chromecast／单纯 Cast 接收器不能当作 Google TV 设备 |
| 厂商 AOSP 盒子、投影设备 | 经核实为 Android 的天猫魔盒、当贝、泰捷、海美迪、Zidoo、MINIX、Ugoos；投影可补极米等具体型号 | 无 Google 服务不等于非 Android；定制包管理器、应用自启限制、32 位用户空间和非标准 HOME |
| 运营商盒子 | 经核实为 Android 的中兴、华为、烽火、创维等运营商定制型号 | 型号与运营商固件一起登记；ADB 被关闭或限制时记录阻塞，不用解锁、刷机或 root 作为通过前提 |
| Android 派生 Fire OS | **已确认使用 Android 派生 Fire OS** 的 Amazon Fire TV 设备或电视 | Fire OS 编号不等于 Android API；Fire TV 品牌不能证明所有型号都是 Android；厂商升级后的 ADB／HOME 限制须重验 |
| 非 Android 平台识别样本 | Samsung Tizen、LG webOS、VIDAA、Roku OS、Apple TV 的 tvOS，以及已确认为非 Android 的 Harmony 系统 | 标记 Android ADB 功能“不适用”，不能计为 Android 适配失败或通过；海信／TCL／华为／荣耀等品牌名本身不决定系统 |

识别记录至少包含系统“关于”页和型号铭牌／官方支持页。若已开放 ADB，再读取下列字段；不能读取的字段写 `unknown`，不要按产品名称补造版本。

```text
adb version
adb devices -l
adb -s SERIAL shell getprop ro.product.manufacturer
adb -s SERIAL shell getprop ro.product.brand
adb -s SERIAL shell getprop ro.product.model
adb -s SERIAL shell getprop ro.build.version.release
adb -s SERIAL shell getprop ro.build.version.sdk
adb -s SERIAL shell getprop ro.build.version.security_patch
adb -s SERIAL shell getprop ro.build.fingerprint
adb -s SERIAL shell getprop ro.product.cpu.abilist
adb -s SERIAL shell getprop ro.product.cpu.abi
```

`SERIAL` 必须来自当前设备列表。上述命令仅用于证据采集，不是“所有命令返回非空即兼容”的自动判据。记录厂商定制系统名称与底层 Android 版本两个字段。

### 本轮首要实机样本

用户新增反馈：“电视有有一个小米4，安卓6的需要兼容”。这条反馈定义首要目标，但尚不足以确定完整型号、实际 SDK 或固件能力；此前 Android 4.4 目标继续保留。

| 样本 ID | 优先级与用户报告 | 待设备确认 | 实机验收状态 |
| --- | --- | --- | --- |
| `mi-tv-4-android-6` | **P0 首要：小米电视 4／用户报告 Android 6** | 完整型号后缀、销售地区、厂商系统版本、fingerprint、ABI 均 `unknown`；Android 6 通常对应 API 23，但须由该电视 `getprop ro.build.version.sdk` 确认 | C／I／S／L／A／H／R 的全部适用实机项初始为 `NOT_RUN/E0`；`physicalTvTested: false`，目前无 E4 证据 |
| `legacy-tv-android-4-4` | **P0 保留：此前用户报告 Android 4.4** | 品牌、完整型号、地区、fingerprint、ABI 均 `unknown`；API 19 同样需设备查询确认 | 全部适用实机项仍为 `NOT_RUN/E0`；源码和模拟回归不能替代该台电视验收 |

取得小米电视 4 后先完成平台字段及 C01、I01–I03、S01–S03、L01–L02，核对 Android 6 命令路径和默认 HOME 能力，再执行有条件的写入项。无设备或输出时保留 `NOT_RUN`／`BLOCKED`，不能把本轮扩展的 SDK 23 回退写成“小米电视 4 已兼容”。

## 2. Android／API、ABI 与电脑交叉抽样

API 分桶用于选择命令边界，不表示每个 Android 大版本都有对应量产电视。SDK 20 属于特殊平台分支，也不能作为“4.4 就是 SDK 19”的替代。遇到表外 API，建立独立待验证样本，不自动沿用相邻版本结论。

| Android／API 候选桶 | 优先级 | 主要检查点 |
| --- | --- | --- |
| 4.0–4.3／API 14–18 存量设备 | P1，有用户反馈则升 P0 | 全局读取与用户探测分别验收；0.5.2 和当前源码均不对这些 SDK 使用 LRU 回退，身份未知时拒绝修改 |
| 4.4／API 19 | P0，保留既有目标 | `am` usage、`cmd activity` 缺失、受版本约束的 `mUserLru`、旧 `df`、缺少 HOME／用户限定修改接口 |
| 5.x／API 21–22 | P1 | 当前源码新增的受限 LRU 回退，旧 `am`／`pm` 与现代 `cmd` 能力边界；不能把新回退套到已发布 0.5.2 |
| 6／API 23 | **P0，小米电视 4 首要目标** | 先核实用户报告的系统与 API，再验证当前源码的用户回退；HOME、安装、恢复及 APK 最低版本逐项判断，不从用户查询成功推导全部可用 |
| 7–7.1／API 24–25 | P1 | 当前用户查询、HOME 子命令、系统应用恢复、分包路径与缺失命令行为；不使用本轮限定的 LRU 回退 |
| 8–9／API 26–28 | P0 | 常见存量 TV；HOME、provider、用户限定操作；启动器 APK 自身 `minSdk` 单独核对 |
| 10–11／API 29–30 | P0 | 多用户、厂商 HOME 限制、ADB 授权与恢复连接；不按手机 Android 11 推定电视有无线配对入口 |
| 12／12L／13，API 31–33 | P0 | Google TV 与厂商固件差异、无线调试能力、用户限制、待机恢复 |
| 14／API 34 及实际取得的 API 35、36 等后续设备 | P0 新平台样本 | 用户权限与安装行为变化、旧 targetSdk APK 拒绝、后台与 HOME 策略；具体能力按查询和实机记录确认 |

ABI 至少覆盖 `armeabi-v7a` 与 `arm64-v8a`；另外保留 **64 位 SoC + 32 位 Android 用户空间** 的样本。模拟器的 `x86`／`x86_64` 可补协议测试，不替代 ARM 电视。以电视声明的 ABI 及 APK 的实际原生库为准，不能以芯片宣传或管理器电脑架构推断 APK 能否运行。

电脑抽样覆盖正式产物：Windows x64、macOS ARM64、macOS Intel、Linux x64 DEB。记录确切 OS 版本、架构、安装形式、ADB 版本和 WebView／系统依赖；Windows 至少保留 Windows 10／11 的实际目标环境，macOS 最低声明版本与当前版本分开，Linux 以实际具备所需 WebKitGTK 依赖的发行版为准。发布构建成功不替代目标电脑上的安装、启动和联网测试。

采用以下成对分配，样本不足时明确留空：

1. 每个已选择的电视固件先在一台主力电脑执行完整 P0，Android 平台分支和 ARM ABI 在整个样本集中都要出现。
2. 同一参考电视再跨 Windows、两种 macOS 和 Linux 执行连接、读取、取消、目标隔离、安装及退出重连，分离电脑问题与电视问题。
3. 先安排小米电视 4／待确认 API 23 与保留的 API 19 目标，再将普通 AOSP、Android TV／Google TV、Android 派生 Fire OS 分配到不同主机；需要声称支持的分支必须有对应证据，不能用另一分支代替。
4. 以太网／Wi-Fi、同子网／路由可达的跨子网、用户 0／可切换的非 0 用户、32／64 位及受限 HOME 至少各覆盖一个样本。电视没有相应能力时记“不适用”，不要构造不存在的设置。
5. 电脑安装／更新可以在 CI 或 VM 独立覆盖；电视的 OEM 限制、遥控、待机和显示体验必须保留实体设备验证项。

## 3. 结果与证据分开记录

每个测试项记录一个结果和一个证据等级；不要把“模拟通过”写成某品牌通过。

| 结果 | 使用条件 |
| --- | --- |
| `PASS` | 该项全部预期达成，附对应证据；必须与证据等级一起展示 |
| `LIMITED` | 部分能力可用，或固件明确不提供某能力；列出可用项、限制及管理器实际拒绝行为 |
| `FAIL` | 实际行为与预期不符，保留首次失败、复现条件和问题链接 |
| `BLOCKED` | 设备、授权、恢复条件、测试 APK 或环境不足，未完成验证；不能计为通过 |
| `NOT_RUN` | 尚未执行，默认状态 |
| `N/A` | 该具体项不适用，并写依据，例如非 Android 平台或无多用户功能 |

| 证据等级 | 能证明的范围 |
| --- | --- |
| E0：未验证 | 需求、假设或候选设备；没有执行证据 |
| E1：文档／源码核对 | 官方产品资料、AOSP 分支或命令源码；不能证明该 OEM 固件实际开放接口 |
| E2：固定输出／模拟回归 | Rust fixture、mock bridge、录制输出回放、桌面 CI；标明模拟的部分 |
| E3：Android 模拟器 | 实际 Android 系统服务及 APK 行为；注明镜像、API、ABI、是否 root，不替代厂商电视 |
| E4：实体设备 | 该型号、固件、主机组合的实际操作及复查；不能推广到同品牌全部产品 |

例如 `S02 PASS/E2` 表示系统信息的模拟回归通过；`H01 LIMITED/E4` 表示该实机不能提供 HOME 查询。对于身份未知、跨用户、受保护包等拒绝场景，**保护测试可以 `PASS`，对应安装／卸载能力仍应记为 `LIMITED` 或 `BLOCKED`**。不可用功能不进入“功能通过数”的分子；同时公布通过、受限、失败、未执行各项数量，不只公布一个比例。

## 4. 可执行验收项

P0 先处理错误目标、数据或状态保护，以及最基本的连接和读取；P1 再覆盖恢复性与体验。每次只对一台明确标识的电视执行写入测试，使用有恢复步骤的专用测试应用和测试数据，不选真实核心包或当前默认桌面做破坏性样本。已有界面确认流程保留；自动回归可模拟拒绝场景。

准备两个同签名测试 APK 版本、一个不同签名版本和一个明确不兼容的版本，记录包名、versionCode、minSdk、targetSdk、ABI、签名及 SHA256。测试 APK 必须符合目标设备最低要求；例如当前 pureTV 启动器声明 `minSdk 26`，不能用它证明 API 19 或 API 23 的安装或布局能力。恢复系统应用测试需要可恢复的专用预装样本，没有条件则记 `BLOCKED`，不能随意卸载生产系统包。

### 连接、授权与目标身份

| ID | 优先级 | 操作与预期 | 证据重点 |
| --- | --- | --- | --- |
| C01 | P0 | 输入设备实际地址连接；首次拒绝授权、随后允许授权、再次连接。`unauthorized`／`offline` 不显示为可操作；授权在线后才读取应用 | `adb devices -l`、连接结果、界面状态及时间 |
| C02 | P0 | 在两台测试设备都可见时选择其中一台，断开并重新连接；电视 shell／install 等目标命令带正确 `-s SERIAL`，connect／disconnect 显式指定目标，devices 仅枚举。连接前清理电脑 ADB 会影响其他 ADB 会话，应如实反馈 | 完整命令目标、两台设备前后状态；不要求保留被清理的旧会话 |
| C03 | P0 | 测试错误 IP／端口、拒绝连接、离线与超时；保留可诊断错误，不能保留另一台旧电视作为活动写入目标 | 原始退出码／输出、快照、没有后续写入命令 |
| C04 | P1 | 测试电脑有效多网卡、VPN／路由、同网段与不同网段提示。不同网段但实际可达时不能误称绝对无法连接；本机地址不能冒充电视地址 | 网络拓扑摘要、网卡／子网、实际连接结果 |
| C05 | P1 | 仅对提供无线配对的电视验证其入口与端口；配对端口和调试端口分别记录。当前 GUI／MCP 没有配对操作入口时记“需外部 ADB 预配对”，不宣称一键支持 | 配对能力来源、实际使用入口；不记录配对码或 ADB 私钥 |
| I01 | P0 | 记录 `am` → `cmd activity` → 受被测版本 SDK 白名单约束的 LRU 回退实际命中路径：0.5.2 仅 19，当前源码为 19／21／22／23。空、usage、重复／歧义／越界字段及未知版本不能被解释为用户 0 | 被测版本／提交、探测顺序、SDK、原始输出、解析结果；异常输出用 E2 补齐 |
| I02 | P0 | 先读用户 A 的列表，切到用户 B 后尝试原目标操作；必须拒绝或要求重新扫描。重扫后列表、HOME、原桌面记录归属于正确用户，不沿用 A 的结果 | 真实非 0 用户或明确的模拟方式；命令与前后用户快照 |
| I03 | P0 | 当前用户始终不可确认时刷新系统信息；设备全局信息仍可读，应用修改没有发出。身份能力恢复后再扫描，不能沿用猜测身份 | 已读取全局字段、拒绝错误、写命令零记录 |

### 系统信息与应用目录

| ID | 优先级 | 操作与预期 | 证据重点 |
| --- | --- | --- | --- |
| S01 | P0 | 刷新型号、Android／SDK、制造商、CPU／ABI、内存、容量、分辨率和运行时间；逐项与原始只读输出比对。缺字段显示未知，不能填 0 或依据型号猜值 | 属性输出、解析值、截图；记录缓存时间 |
| S02 | P0 | API 19 覆盖 `am` usage 和旧 `df`；当前源码另对 API 21／22／23 验证用户回退，存储格式按设备实际输出识别，不假设 Android 6 与 4.4 相同。旧容量记录舍入精度，内存回退记录估算来源 | 被测版本及原始输出、命中路径、单位／精度；白名单外 SDK 不套用 LRU |
| S03 | P1 | 分别制造权限拒绝、异常容量、缺少 meminfo 字段和不可用 `wm`；其余字段仍可读取，不把整次连接错误等同于全部字段无效 | 部分成功快照、未知字段、错误原文 |
| L01 | P0 | 扫描并与同用户 `pm list packages`、`-s -u`、`-d`、`-u` 对照；可恢复包不计作已安装，同名不同包不混淆 | 包名集合、分类和计数；不要只比较名称 |
| L02 | P0 | HOME 查询不可用／默认桌面未知时仍能看目录，但停用和卸载被阻止；核心组件和已确认当前 HOME 始终受保护 | 目录可读、保护原因、无修改命令；不能靠白名单猜默认 HOME |
| L03 | P1 | 检查 base／split APK 大小合计，包含中文／空格电脑路径对应的安装包；`pm path --user` 或 `stat` 缺失时显示未知，不影响应用列表 | 电视 APK 路径、逐文件大小、汇总及未知状态 |

### 安装、启停、卸载与恢复

| ID | 优先级 | 操作与预期 | 证据重点 |
| --- | --- | --- | --- |
| A01 | P0 | 从本地待安装、启动器入口、市场下载后分别安装同一测试 APK，核对目标用户、安装结果和新列表；批量混入一个无效 APK，成功项移除、失败和未执行项保留 | 安装包 SHA256／签名／版本、原始安装输出、逐项队列结果 |
| A02 | P0 | 用同签名新版覆盖，检查版本和测试数据哨兵；再用不同签名、较低版本、过高 minSdk 或错误 ABI 样本验证明确失败。不能自动卸载旧版或删除数据后冒充升级成功 | 前后 versionCode、数据哨兵、失败代码及未改旧应用的证据 |
| A03 | P0 | 对专用应用停用、启用，分别测试原状态 DEFAULT 和显式 ENABLED；读回实际状态。缺少 HOME 或 `default-state` 时明确受限，不以命令返回冒充恢复 | 原始 enabled state、保存的恢复状态、写后目录与实际启动 |
| A04 | P0 | 对可恢复的专用样本执行当前用户卸载并保留数据，再恢复安装；确认只改变指定用户，系统 APK 仍在，启用状态按实际读取显示 | 当前用户、其他用户对照、APK 保留、恢复前后数据；条件不足记阻塞 |
| A05 | P0 | 在不支持 `--user`、恢复接口或 HOME 查询的固件上尝试对应测试操作；必须明确失败／拒绝，不去掉用户参数回退为全用户修改，不隐式 root | 发出的完整参数和拒绝结果；API 19 单独登记限制 |
| A06 | P0 | 多项操作过程中取消，核对正在执行的一项完成状态验证，其余项未执行；写入期间断线时报告结果不确定，不把下载、发送命令或退出码 0 当作设备成功 | 操作时间线、每项结果、取消后的实际设备状态和重扫结果 |

### HOME 与布局

| ID | 优先级 | 操作与预期 | 证据重点 |
| --- | --- | --- | --- |
| H01 | P0 | 查询 HOME 组件与默认值；测试无默认值、解析失败和厂商拒绝。未知时不得推测组件或放开停用／卸载保护 | query／resolve 输出、组件与包名对应关系 |
| H02 | P0 | 在具备恢复条件的测试设备上切换兼容启动器并恢复原桌面；每次保存原组件并读回默认 HOME。重启后核对厂商是否覆盖选择 | 切换前后 HOME、恢复结果、重启后的差异；恢复失败单独记录 |
| H03 | P0 | 读取兼容 provider 的 status，修改小范围布局并应用、reset；读回布局一致。切用户／换 HOME、非法 SVG／JSON、拒绝访问或写后不一致时不报告成功 | 布局版本、provider URI、前后 JSON／哈希、实际电视截图 |
| H04 | P1 | 非兼容启动器、旧协议、缺少 provider、缺少安装目标分别测试；保留可编辑草稿或提示重读，不直接改未知文件。导入／导出／草稿编辑不产生电视写入 | 本地草稿、命令记录、兼容性提示及恢复后的操作 |

### 重启、升级、遥控和资源边界

| ID | 优先级 | 操作与预期 | 证据重点 |
| --- | --- | --- | --- |
| R01 | P0 | 在只读刷新及安装前后分别断网／重启电视，再重连；重新核验授权、用户、目录和 HOME，迟到结果不能覆盖新目标 | 事件顺序、重连结果、旧／新目标快照 |
| R02 | P1 | 电视待机唤醒、DHCP 地址改变、撤销调试授权后重连；界面状态与实际可达性一致，不反复自动执行修改 | 地址变更、授权与待机设置、恢复耗时 |
| R03 | P1 | 电视 OTA 前后重跑 C01、I01–I03、S01、L01–L02、A01 和 H01–H02 的适用项；管理器升级前后保留地址、原 HOME 与操作记录，按新版本重新判定能力 | 两份 fingerprint、Manager／ADB 版本、差异与回归结果 |
| R04 | P1 | 用实体遥控方向键、确定、返回、HOME 验证已安装测试应用／启动器能启动、焦点可见、可退出并恢复原桌面；分别覆盖实际 720p／1080p／4K 输出、缩放或 overscan 设置 | 遥控输入录像、设备实际输出分辨率；桌面截图不能替代电视画面 |
| R05 | P1 | 在真实低内存或存储不足样本上重复扫描／安装／启动；管理器保持可取消和可诊断，失败保留原应用及队列，不宣称内存／磁盘未知值为零 | 可用资源、耗时、系统回收或安装失败原文；仅记录实际测量，不预设 FPS |
| R06 | P1 | 安装包正常启动后，按具体应用需要验证音频、视频、遥控输入、网络及休眠恢复；DRM／编解码／Google 服务依赖单独登记 | 应用版本与素材、播放／输入证据；Manager 安装成功不等于内容播放兼容 |

## 5. 执行顺序与退出标准

1. 先登记环境和证据目录，识别平台；非 Android 样本在平台识别处结束，不尝试 Android 写入流程。
2. 先跑 C／I／S／L 只读与保护项。未知身份、默认 HOME 保护或目标隔离失败时停止该样本的后续写入验收，保留问题复现；修复后重验受影响路径。
3. 使用测试 APK 执行 A 项，再执行适用的 H 项和 P1。Android 4.4 缺少接口等已确认限制，记录到能力结果，不用修改保护规则换取“全绿”。
4. 同一配置下关键 P0 连接／读取／取消／目标隔离至少连续完成 3 轮；HOME 恢复及数据保留每次核对。间歇失败保留，重试成功不能覆盖首次失败。
5. 自动回归运行与改动相关的核心、UI、SVG／网络检查，桌面发布仍执行既有四平台门禁。只有证据能定位到确切源码／APK 时，才将结果绑定到版本；无需为本清单文字重复跑整套构建。

验收退出分为两个目标：

- **清单和自动化交付完成**：范围、命令、已知限制、用例及对应 E1／E2／E3 证据齐备，相关回归通过，未执行的实机项明确保留。没有硬件时可以完成此目标，但不能称“常见品牌全面兼容已验证”。
- **某型号／固件兼容声明可发布**：该组合声明支持的适用 P0 功能必须有 E4 实机通过证据且无未解决失败，P1 结果与限制完整，写入项具有实际写后复查和恢复证据。E2／E3 可以补充异常与保护分支，但不能替代型号功能通过所需的 E4。想声称一个平台分支已覆盖，须列出该分支的 E4 样本与缺口；不能只引用模拟器或另一品牌。

错误设备／用户上的写入、未知身份继续修改、默认 HOME 保护失效、取消造成状态未复查、失败被显示成功均是 P0 阻断项。受限固件的预期拒绝不是缺陷，但功能必须保持“受限”。如发现这类真实回归，不用通过率平均值掩盖；修复并重验相关样本后更新结论。

## 6. 实机记录模板

每个组合保存一份记录，建议放在 `desktop/docs/compatibility-results/<record-id>/`，包含说明、下列元数据和证据索引。不要只保留本机临时路径。原始失败与后续重试分别归档；发布证据中脱敏设备序列号、内网地址及个人内容，不记录配对码、ADB 私钥或账号凭据。若需脱敏原始日志，记录脱敏规则及文件 SHA256。

```yaml
recordId: tv-model-region-build-manager-date
recordedAt: unknown
scope: selected_model_and_firmware
manager: {version: unknown, sourceCommit: unknown, artifactSha256: unknown}
host: {os: unknown, version: unknown, architecture: unknown, installFormat: unknown}
adb: {version: unknown, source: unknown}
device:
  brand: unknown
  model: unknown
  region: unknown
  platformFamily: unknown # Android TV / Google TV / AOSP / Android-derived Fire OS / non-Android
  marketingOs: unknown
  androidRelease: unknown
  sdk: unknown
  firmwareFingerprint: unknown
  securityPatch: unknown
  soc: unknown
  supportedAbis: []
  ramBytes: null
  serialAlias: tv-a
transport: {kind: unknown, network: unknown, pairingMethod: unknown}
physicalTvTested: false
physicalRemoteTested: false
testApks: [] # package/versionCode/minSdk/targetSdk/ABI/signer/SHA256/data sentinel
results:
  - id: C01
    result: NOT_RUN
    evidenceLevel: E0
    expected: authorization_and_target_verified
    actual: unknown
    attempts: [] # time / outcome / raw log / snapshot / screenshot or recording
    evidence: [] # relative path / SHA256; command logs include exit code and target alias
    issue: null
limitations: []
recovery: {originalHomeRestored: null, testAppsRestored: null, notes: unknown}
reviewer: unknown
```

对照命令、UI／MCP 显示和电视实际状态三者后再判定结果。新增固件或修复影响命令路径时新增记录并链接旧结果，保留版本边界，不直接把旧“通过”覆盖成当前状态。

## 7. 先采集小米电视 4 的只读能力报告

[只读采集工具](../scripts/probe-tv-compatibility.py) 需要 Python 3.10 以上（CI 使用 3.12）及电脑上已有的 ADB。先连接并在电视授权，运行 `adb devices -l` 确认实际 SERIAL 为 `device`。以下地址仅为文档示例，必须替换成列表中的真实目标；ADB 路径及输出目录也要替换。

Linux／macOS 示例（在仓库根目录）：

```bash
python3 desktop/scripts/probe-tv-compatibility.py \
  --adb /absolute/path/to/adb \
  --serial 192.0.2.10:5555 \
  --output /absolute/path/to/mi-tv4-android6-report
```

Windows PowerShell 示例：

```powershell
py -3 desktop/scripts/probe-tv-compatibility.py --adb "C:\Android\platform-tools\adb.exe" --serial "192.0.2.10:5555" --output ".\compatibility-results\mi-tv4-android6-report"
```

工具只使用明确选择的已授权设备，读取有限属性、内存／容量／分辨率、当前用户及应用／HOME 查询能力；每条命令和总时间都有上限。不自动连接或扫描网络，不安装、卸载、停用、切换桌面或写入布局。测试期间保持目标设备及用户不变；这是逐项采样，不是设备状态的原子快照。

输出为新目录内的 `compatibility-report.json`，已有报告不会覆盖。报告包含主机／ADB 版本、必要型号／系统／ABI／固件字段、有限解析结果、命令状态及计数；不持久化地址／序列号、完整 getprop／进程 dump、应用名单或错误原文。脱敏摘要用于定位能力缺口，需要更详细证据时再按第6节的规则采集与复核。

- `deviceAccessVerified` 只表示起始时明确目标在线且授权。
- `probeCompleted`／退出码0只表示采集完成；查询不支持、无默认HOME、字段无效等必须逐项阅读，不能转换成“全面兼容”。
- HOME 候选计数不代表默认桌面；默认值只有唯一规范组件且非 Resolver／Chooser 才能确认。
- `physicalTvTested` 和 `fullPhysicalCompatibilityVerified` 保持 false，写操作为 `not_verified_on_device`。工具不知道被测目标是不是实体电视，也不执行完整实机验收；人工 E4 记录须另行绑定到真实型号和功能证据。

首轮小米样本的待办：

- [ ] 确认完整型号、地区、实际 SDK23、固件及 ABI，保存只读报告。
- [ ] 用当前源码构建的管理器验证连接、信息及同用户应用列表；0.5.2 发布版没有 API23 回退。
- [ ] 用明确支持 API23 的专用 APK 验证安装与覆盖、失败结果和数据保留。
- [ ] 根据实际 HOME 查询结果记录可用或受限；不以取消保护或安装 minSdk26 的 APK 作为兼容手段。
- [ ] 对其余适用 P0、遥控、待机／重连项目逐项保存 E4 证据，再形成型号兼容声明。

运行采集工具的自动测试：

```bash
python3 -m unittest discover -s desktop/tests -p test_probe_tv_compatibility.py -v
```

这些测试使用 fake ADB 与受控 Python 子进程，属于 E2；四平台 CI 运行相同测试不等于四个平台都连接过小米电视。

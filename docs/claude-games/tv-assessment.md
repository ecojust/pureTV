# Claude游戏：Android TV与macOS适配评估

评估日期：2026-11-17。覆盖[原始93项快照](porting-baseline-93.json)全部93条参考；Ink Arcade两个入口仍算一条。本文件是静态源码和许可路线评估，**没有运行上游游戏、实玩或测设备**，不代表已交付APK/Mac包。精确字段、固定提交和逐项原始证据见[tv-assessment.json](tv-assessment.json)。

当前51条可以开展现Web宿主封装/适配；其余42条保留明确的后续路线。另有3条Clawd作品可从MIT规则代码开始做完整替代角色/名称，原样素材发布仍待解决，未混入51条。

| 分类 | 数量 | 含义 |
| --- | ---: | --- |
| 可封装候选 | 25 | 核心动作可用九键表达，无已知须换运行层的障碍；完成共性桥接/菜单/离线/布局后进入打包验证，绝不等于现成包或已证兼容。 |
| 交互或性能适配后封装 | 26 | 代码许可允许开展，现Web技术有路线，但需显式交互模式、焦点重构、资产替代/导入、服务裁剪或性能适配。 |
| 需另宿主或运行路线 | 10 | 固定源码运行层不适合当前WebView/WKWebView；另建原生/渲染/Web导出路线可继续，不是永久排除。技术阻塞与许可阻塞可同时存在，后者仍逐项记录。 |
| 许可或素材条件待解决 | 32 | 原样修改再分发的代码许可或特定素材/非商用条件尚未解决；技术方案照常给出。源码公开和第三方依赖MIT不是游戏本体授权。 |

## 共用边界与实施顺序

eligibleNow表示具明确代码许可且当前Web宿主有技术路线，可开始封装/适配；仍须满足逐项许可、素材、离线、性能与实际验收。可封装候选也未构建/实测。Quake采用不带PAK的用户导入路线；Backroad/长风原资产须复核或替换。

Android目标为8+，Mac目标为11+ Universal。它们是宿主声明下限，**不是已经实证的逐游戏最低运行版本**：WebGL2需要相应System WebView/系统WebKit和GPU；早期Big Sur不保证WebGL2。下表与明细记录每项实际技术门槛，不凭空指定未验证的浏览器版本或最低内存。

优先完成11款abagames单键和低动作Canvas/现成手柄作品，再进入赛车/3D、焦点密集经营和复杂光标作品。序号为建议实施顺序，不是质量排名；来源序号保留catalog顺序。Godot、LÖVE、Bevy、Java和CLI项目可以走独立运行层路线，无须一概重写规则；鼠标操作可改焦点、网格或虚拟指针，不构成永久排除理由。

Quake当前路线是引擎包加用户合法PAK导入，包内没有可直接游玩的原作关卡；长风、Backroad先用权利明确素材适配，原模型/生成音频发布前核条款或替换。不能把它们的eligible状态理解成允许原资产无条件再分发。

九键统一为方向四键、A/B/X/Y、START；无双模拟摇杆。所有下述映射是**拟实现方案**，已有Gamepad API不等于已支持pureTV。63485/TCP、NSD、真实客户端ID及缺RSSI时不伪造数值，均沿现协议。断线/失焦/后台清键并冻结游戏；重连需显式恢复，取消不得被当成开火、蓄力释放、漂移奖励或投币。

## 93条路线表

| 来源序号 | 建议顺序 | 项目 | 分类 | 优先档 | 判断依据与下一步 |
| ---: | ---: | --- | --- | ---: | --- |
| 1 | 56 | [鹈鹕骑自行车](#item-1) | 许可或素材条件待解决 | P5 | 同仓已有骑行状态与抓鱼逻辑；技术上可复用Web宿主，但本项无根许可，不能因同仓CF/QQ已适配推定授权。 |
| 2 | 16 | [Kart Royale](#item-2) | 交互或性能适配后封装 | P1 | 已读Input.ts有数字转向平滑、Gamepad及热插拔；Race.ts有检查点、倒计时、重生，可直接复用规则。 现成模拟Gamepad不能直接解决九键输入；需要直接注入动作状态并降低后处理开销。 |
| 3 | 17 | [Turbo Kart Rally](#item-3) | 交互或性能适配后封装 | P1 | 已读输入和kart模块，漂移/道具动作可直接映射数字键，既有追尾镜头适合电视。 现import map从jsDelivr取Three.js，离线宿主必须改成本地bundle，菜单需要九键焦点。 |
| 4 | 57 | [Frostline Kart](#item-4) | 许可或素材条件待解决 | P5 | 单HTML程序化竞速可以封装；需数字转向、菜单和低GPU档，当前仓库没有再分发许可。 |
| 5 | 58 | [Robo Tennis](#item-5) | 许可或素材条件待解决 | P5 | 移动与挥拍只需方向加动作键，不存在硬件输入障碍；阻塞为代码许可未明确。 |
| 6 | 20 | [Dirt Crown](#item-6) | 可封装候选 | P2 | 已有Gamepad竞速、升级和杯赛，核心九键能覆盖；需离线化和取消漂移语义。 |
| 7 | 30 | [backroad rally](#item-7) | 交互或性能适配后封装 | P2 | controls.ts支持数字键；Rapier单线程compat物理可运行于WebView/WKWebView，追尾镜头不需要双摇杆。 须强制可用WebGL2路径、清点WASM/GLB/音频加载，赛段和天气负载要做实机分档。 |
| 8 | 52 | [Slide Rush](#item-8) | 许可或素材条件待解决 | P2 | 转向+跳跃是九键非常合适的技术候选，已读Input.js/Racer.js有边沿跳跃与固定子步。 当前固定源码树未发现明确根许可证；公开源码和模型制作声明不足以授权修改后打包再分发。 |
| 9 | 59 | [FORE LIGHT-YEARS](#item-9) | 许可或素材条件待解决 | P5 | 射程、升级和最终结算完整，键鼠可改为瞄角/蓄力/焦点商店；代码没有许可，不能直接分发。 |
| 10 | 53 | [Kart Rush](#item-10) | 许可或素材条件待解决 | P3 | main.js已有数字转向速率限制，Cannon固定物理步与完整比赛循环；无需永久排除手机项目。 未发现明确根许可证；另有强制手机横屏/触屏菜单，需要转换为电视布局与九键动作。 |
| 11 | 21 | [Kırkpınar／土耳其摔跤](#item-11) | 可封装候选 | P2 | 现有D-pad/ABXY/Start覆盖单人核心玩法；双人功能需独立席位扩展，先实现单人不等于双人已支持。 |
| 12 | 22 | [Peri Golf](#item-12) | 可封装候选 | P2 | 左右瞄准和蓄力释放已是数字键方案，核心交互无需重写；补全焦点与取消击球。 |
| 13 | 60 | [Tidewater](#item-13) | 需另宿主或运行路线 | P5 | 当前是自写WebGPU/WGSL渲染器，没有WebGL回退，现Android8 WebView/mac11 WKWebView基线不具备可保证的WebGPU。 即使完成九键，当前宿主也不能承诺加载；需独立WebGL2渲染移植或升级宿主/系统/GPU路线。 |
| 14 | 31 | [The Long Silence](#item-14) | 交互或性能适配后封装 | P3 | WebGL2源码可进入现Web宿主适配；Input.js已统一键鼠/手柄，但六自由度飞行、星图、扫描和步行交互超过简单一一键位。 需模式菜单、稳定相机、场景/地表资源与渲染档位，不能因现有Gamepad而当可直接打包。 |
| 15 | 32 | [Three.js Quake](#item-15) | 交互或性能适配后封装 | P3 | JS/Three.js渲染和客户端输入可适配现Web宿主；固定数字按键可做传统转向式FPS，并非鼠标永久排除。 需修改pointer lock依赖、增加辅助瞄准/视角重置和菜单导航；Quake游戏数据不因代码GPL自动获授权。 |
| 16 | 61 | [GalaxyQuest](#item-16) | 需另宿主或运行路线 | P5 | C++ Android NDK/OpenXR面向Meta Quest的原生移植，不是浏览器HTML游戏。 当前APK仅能用于Quest路线，现WebView/WKWebView宿主不能装入其渲染器/VR追踪/手柄；需独立原生平台工程。 |
| 17 | 33 | [长风 · Long Wind](#item-17) | 交互或性能适配后封装 | P3 | 已有锁定、统一动作与标准Gamepad映射，可通过自动锁定和动作组合实现九键；输入时序需保留150ms弹反窗口。 图形/动画/草地开销较高，需低档与稳定帧时；原角色/动作不是MIT，适配代码可先用程序化或可授权替代素材。 |
| 18 | 46 | [Tidewright](#item-18) | 交互或性能适配后封装 | P4 | WebGL2有现宿主技术路径，但强制EXT_color_buffer_float；缺该扩展GPU需降低模拟格式或另做替代，不能只靠系统版本号。 鼠标造型可转虚拟光标+工具/镜头模式，需实作九键UX，不永久排除。 |
| 19 | 18 | [毛线星球 · Yarn Planet](#item-19) | 交互或性能适配后封装 | P1 | 首章主要是移动/跳跃/互动/收线，数字九键可覆盖；物理为固定步、球面重力与BVH，现Web宿主可适配。 需要自动跟随镜头与电视菜单；共享线程/多人依赖Cloudflare，离线体验应明确禁用联网层。 |
| 20 | 62 | [Fable Theft Auto 5.1](#item-20) | 许可或素材条件待解决 | P5 | 步行/驾驶/自由瞄准可用模式切换与辅助瞄准，但复杂城市需性能降档；无代码许可，待授权后可适配。 |
| 21 | 19 | [Nova Lancer](#item-21) | 交互或性能适配后封装 | P1 | 轨道自动前进，方向四键可控制屏幕内飞行；fire/bomb/boost/brake映射ABXY，rollL/rollR另设计明确组合键，适合九键适配。 已有Gamepad不足以直接接TCP；需接入动作层、菜单焦点与低画质/音频初始化。 |
| 22 | 34 | [Crystal Rooms](#item-22) | 交互或性能适配后封装 | P3 | MIT儿童拼字玩法可开展；Next组件提取/静态输出、Three渲染和TTS回退是实际工作，不能要求TV运行Next服务端。 |
| 23 | 63 | [Mortal Clash](#item-23) | 许可或素材条件待解决 | P5 | 四攻击键与方向自然落到九键；代码未授权且GLB来自three.js examples各有许可，两个条件均要解决。 |
| 24 | 64 | [Rooftop Sniper: Last Light](#item-24) | 许可或素材条件待解决 | P5 | 已有离线HTML降低依赖工作，九键精细瞄准需灵敏度/倍率模式；代码许可未明确。 |
| 25 | 54 | [Fishslop](#item-25) | 许可或素材条件待解决 | P3 | SimInput已抽象moveX/moveY/rise/boost/feed/sonar，可直接做数字九键；不是因缺Gamepad而排除。 当前固定源码树未找到许可；未经授权不进行修改后再分发打包。 |
| 26 | 47 | [HEXAPOD RISING](#item-26) | 交互或性能适配后封装 | P4 | MIT机甲核心可适配；双摇杆映射不能直接冒充九键，须做锁定/镜头模式与完整菜单。 |
| 27 | 55 | [AMAR.IO](#item-27) | 许可或素材条件待解决 | P3 | 主HTML可做数字方向飞行与分裂/喷射/刹车，源码没标准Gamepad不是永久技术障碍。 当前无明确LICENSE；主版多人依赖Trystero/WebRTC；ga2是不同WebGPU实验，不能替换后声称保留同样多人。 |
| 28 | 65 | [Quasar Saz](#item-28) | 需另宿主或运行路线 | P5 | Godot 4.6 Mono/C#不在当前WebView宿主内，不能假设C# Web导出可用；采用Godot原生Android/Mac出口可继续，需独立TCP/NSD插件。 |
| 29 | 66 | [Pocket Bomber](#item-29) | 需另宿主或运行路线 | P5 | LÖVE 11.5/Lua非现Web宿主；可用love-android与Mac引擎导出或另评Web移植；同时README称MIT但未核完整许可文本。 |
| 30 | 67 | [Crossy Farm](#item-30) | 许可或素材条件待解决 | P5 | 离散网格过路十分适合四方向；当前无许可，待授权后只需通用菜单/离线适配。 |
| 31 | 68 | [Hollowmere](#item-31) | 许可或素材条件待解决 | P5 | 挖放、热栏和拖拽可由虚拟指针和焦点背包承接，需要较大交互改造；当前无许可。 |
| 32 | 69 | [Rail Rush](#item-32) | 许可或素材条件待解决 | P5 | 四方向跑酷与独立悬浮板键适合九键，当前无许可。 |
| 33 | 70 | [World 1-1](#item-33) | 许可或素材条件待解决 | P5 | Canvas平台跳跃技术门槛低；无代码许可，且马里奥名称、形象和关卡须独立授权或整体替换受保护表达。 |
| 34 | 71 | [Jazz Jackrabbit · Opus Edition](#item-34) | 许可或素材条件待解决 | P5 | 原生Gamepad及纯Canvas可封装；未明确代码许可，Jazz Jackrabbit角色/名称/素材归属也不能由粉丝重制推定许可。 |
| 35 | 72 | [Neon Siege](#item-35) | 许可或素材条件待解决 | P5 | 已有Gamepad减少桥接工作，但竞技场瞄准与盾/冲刺需核九键并降bloom；当前无许可。 |
| 36 | 73 | [Sprout Quest](#item-36) | 许可或素材条件待解决 | P5 | Canvas主循环可包，横屏/背包/3D预览改造量较大；缺少许可。 |
| 37 | 35 | [Wiggle Snakes](#item-37) | 交互或性能适配后封装 | P3 | MIT蛇玩法可开展，需把keydown单次角变化改为每帧连续转向并提取Next客户端组件。 |
| 38 | 23 | [BUBBLE NEBULA](#item-38) | 可封装候选 | P2 | 已有Gamepad和菜单，动作数少；24区/Boss是原有内容，接入不会据此宣称关卡已验。 |
| 39 | 24 | [PHOSPHOR PATROL](#item-39) | 可封装候选 | P2 | 已有Gamepad及完整移动/射击/炸弹/跃迁动作，九键可覆盖；Three后处理需低档性能验证。 |
| 40 | 12 | [Popgun Pip](#item-40) | 可封装候选 | P1 | 纯Canvas和原生Gamepad，没有3D或联网门槛；核心跳跃/射击/换武器可直接映射。 |
| 41 | 36 | [Quiverspire](#item-41) | 交互或性能适配后封装 | P3 | 停下自动射击降低瞄准负担；实际改造重点为升级与永久天赋多层焦点，不能只接移动。 |
| 42 | 13 | [STARBLAZER '86](#item-42) | 可封装候选 | P1 | Canvas竖向射击已有手柄，少量动作适合首批低GPU路线；保留禁射奖励关规则与画面比例。 |
| 43 | 48 | [WYRMZONE](#item-43) | 交互或性能适配后封装 | P4 | 地面/飞行两阶段可用数字方向与辅助镜头；现Gamepad/Pointer Lock不能自动证明九键全覆盖，须专项交互适配。 |
| 44 | 14 | [GLUP — Nila y el pez gato](#item-44) | 可封装候选 | P1 | MIT纯Canvas像素横屏及Gamepad，低复杂度封装候选；回访地图/能力菜单仍需验证。 |
| 45 | 74 | [Mystic Onslaught](#item-45) | 许可或素材条件待解决 | P5 | raylib已有Emscripten路线，WASM可以作为Web宿主适配而非永久排除；硬编码路径、资源尺寸与Web能力需检查，当前无许可。 |
| 46 | 37 | [Novaki: Strike Twice](#item-46) | 交互或性能适配后封装 | P3 | MIT代码+CC BY 4.0美术音频明确，PixiJS已有Gamepad；敌群性能、电视字号和升级焦点需适配。 |
| 47 | 75 | [Overclocked](#item-47) | 许可或素材条件待解决 | P5 | 移动/自动开火可行，程序链重排需专用焦点工作流；当前无许可。 |
| 48 | 76 | [SHOVE](#item-48) | 需另宿主或运行路线 | P5 | 只有Python CLI规则与JSON存档，当前Web宿主不能运行CLI；须新建图形前端并移植/嵌入规则，且未明确许可。 |
| 49 | 38 | [Emberbrood](#item-49) | 交互或性能适配后封装 | P3 | MIT回合驯龙不依赖精准鼠标；多层繁殖、列表、战斗菜单是完整手柄UI改造任务。 |
| 50 | 77 | [OSRS Tower Defense](#item-50) | 许可或素材条件待解决 | P5 | 棋盘塔防技术上可改网格游标，但未明确代码许可，README又明确精灵/音效来自OSRS缓存；需权利授权或完整素材替换。 |
| 51 | 78 | [Ascmearc（原Warlock）](#item-51) | 需另宿主或运行路线 | P5 | Rust/Bevy桌面与WASM WebGPU路线不符合现Android8/mac11 WebView能力基线；可做原生Bevy插件或验证WebGL2后端移植，需完整GPL对应源码。 |
| 52 | 79 | [CARD GAME（LÖVE2D）](#item-52) | 需另宿主或运行路线 | P5 | LÖVE桌面Lua无法直接塞入WebView；原生LÖVE路线和焦点选牌可行，但当前许可未明确。 |
| 53 | 39 | [Dungeon of Opus](#item-53) | 交互或性能适配后封装 | P3 | MIT React/Vite回合地牢可开展，核心方向简单；背包、装备、食物和文本需焦点化和回合防连发。 |
| 54 | 80 | [MAINSPRING](#item-54) | 许可或素材条件待解决 | P5 | 纯Canvas六角游标技术可行；PolyForm Noncommercial只许可符合条款的非商用用途，现双平台发布用途未确定，先审条件或另获授权，不把它写作MIT。 |
| 55 | 81 | [Plants vs. Zombies（fan remake）](#item-55) | 许可或素材条件待解决 | P5 | 网格种植适合方向焦点；无代码许可且使用植物大战僵尸品牌/IP，须授权或重新设计受保护表达和素材。 |
| 56 | 82 | [Rogue Dawn（原Emblem Rogue）](#item-56) | 许可或素材条件待解决 | P5 | Phaser网格战术可用焦点导航，云存档可选不必变成离线阻塞；当前无许可。 |
| 57 | 83 | [The Nine Lives of Ash](#item-57) | 需另宿主或运行路线 | P5 | Godot GDScript有原生/特定Web导出可能，但目录目前只证明编辑器运行；需要独立导出、桥接与竖屏重排，且无许可。 |
| 58 | 84 | [Toy Box Siege](#item-58) | 许可或素材条件待解决 | P5 | Phaser塔防可通过网格游标适配；缺根许可是当前阻塞。 |
| 59 | 25 | [Munch Maze](#item-59) | 可封装候选 | P2 | MIT Canvas掷骰走格已有箭头/Space/Enter，九键方案简单；Next需静态客户端提取。 |
| 60 | 40 | [CUE VICE](#item-60) | 交互或性能适配后封装 | P3 | MIT游戏已有Gamepad但主要拖拽；采用瞄角/力度和队员焦点保留物理规则，需证明可精确操作。 |
| 61 | 15 | [Sugarplum Drop](#item-61) | 可封装候选 | P1 | 已有Gamepad菜单/投放，左右+A与少量焦点即可覆盖，Canvas适合首批低GPU路线。 |
| 62 | 41 | [Brothers](#item-62) | 交互或性能适配后封装 | P3 | MIT Phaser/Matter弹射规则可保留；拖拽转为瞄角蓄力、镜头模式是适配而非排除理由。 |
| 63 | 85 | [Chain of Command](#item-63) | 许可或素材条件待解决 | P5 | 静态JS可运行；拖放编排与长文本必须重做焦点和电视布局，当前无许可。 |
| 64 | 86 | [Moe, Joe & Mr Mews](#item-64) | 许可或素材条件待解决 | P5 | Canvas单HTML可包；等距方向、切猫和拖箱可映射，缺代码许可，且需移除统计外链。 |
| 65 | 87 | [protocol play: puzzle](#item-65) | 需另宿主或运行路线 | P5 | 原生Rust/Bevy 0.18并非现成Web产物；可新建Android/Mac原生桥或评估WASM WebGL2构建，GPL要求对应源码/修改/构建说明。 |
| 66 | 88 | [Pharaoh](#item-66) | 需另宿主或运行路线 | P5 | Clojure+Quil/Processing依赖Java桌面，不是当前Android WebView/WKWebView项目；须移植规则/重做图形UI或新运行层，当前重写代码无许可。 |
| 67 | 49 | [CELADON — The Long Ash／陶艺订单工坊](#item-67) | 交互或性能适配后封装 | P4 | MIT/CC0/OFL范围明确，WebGL2可在能力达标设备尝试；拉坯手势、镜头与烧窑六参数要完整虚拟手/焦点设计，不能把高难交互永久排除。 |
| 68 | 42 | [Doom & Doilies](#item-68) | 交互或性能适配后封装 | P3 | MIT经营玩法可保留；庞大DOM列表、点击事件和焦点滚动需系统适配，同时核已提交PNG的出处。 |
| 69 | 89 | [Terrabrowser](#item-69) | 许可或素材条件待解决 | P5 | 纯JS/Canvas无第三方运行依赖，技术可移植；1600×600世界内存/照明和全套光标背包工作较大，当前无许可。 |
| 70 | 90 | [Clawd Collection／放置调试收集](#item-70) | 许可或素材条件待解决 | P5 | MIT代码可复用，但README排除Clawd角色/名称，直接连原外观发布的权利条件未解决；替换全部相关形象/文案或取得授权后可适配。 |
| 71 | 91 | [Coin Lagoon／海滩推币](#item-71) | 许可或素材条件待解决 | P5 | 方向+A推币技术适合九键；Rapier需设备验证，Clawd奖品/名称不在MIT范围，先授权或替换后再包。 |
| 72 | 43 | [Dystopia Meshi／反乌托邦食堂](#item-72) | 交互或性能适配后封装 | P3 | MIT静态配方/对白可离线运行，无AI API；六步菜单和长对白需要完整焦点/分页，不应因点击UI排除。 |
| 73 | 26 | [Fossil Hori-Hori／化石挖掘](#item-73) | 可封装候选 | P2 | MIT已有方向/蓄力/提取/扫描映射；工具/缩放可用动作页补齐，不需改挖掘规则。 |
| 74 | 50 | [HAKOBI Algorithm／物流工厂](#item-74) | 交互或性能适配后封装 | P4 | MIT已有grid游标/手柄；多肩键工具、镜头、缩放压入九键需模式设计，但不是硬件不可行。 |
| 75 | 27 | [Ice Mori-Mori／冰淇淋堆叠](#item-75) | 可封装候选 | P2 | MIT现有ABXY与方向覆盖主要经营动作，补菜单和按住取消即可进入封装路线。 |
| 76 | 44 | [Signal Dilemma／交通信号两难](#item-76) | 交互或性能适配后封装 | P3 | MIT路口焦点已有；九键外镜头/速度需焦点模式，五日/九路口可读性及模拟负载需验证。 |
| 77 | 45 | [Water Game／水中套圈](#item-77) | 交互或性能适配后封装 | P3 | MIT双泵/倾斜/摇晃均可用数字键替代传感器；需本地化Three/Rapier与保证流体/刚体性能。 |
| 78 | 51 | [Ink Arcade（Ink Rail + Ink Dash）](#item-78) | 交互或性能适配后封装 | P4 | MIT两套HTML都可改方向准星/辅助瞄准；Ink Dash有移动+瞄准冲突，需单独模式验收，不能只测Rail就称整项通过。 |
| 79 | 92 | [Clawd 7/8](#item-79) | 许可或素材条件待解决 | P5 | 四轨ABXY很适合九键；Clawd角色/名称例外阻塞原样分发，解决后还需端到端音频校准。 |
| 80 | 28 | [Bunbetsu Beat／节奏垃圾分类](#item-80) | 可封装候选 | P2 | MIT四方向分类天然匹配，WebGL2与Web Audio运行要求明确；音游必须验证真实TCP输入和音频延迟。 |
| 81 | 29 | [Mehter／奥斯曼军乐节奏](#item-81) | 可封装候选 | P2 | MIT四轨ABXY匹配，已含校准UI；必须保留同按/长音与暂停恢复并本地化素材/字体。 |
| 82 | 1 | [Blaze Thrust](#item-82) | 可封装候选 | P1 | MIT单键crisp-game-lib作品，保留上游独立规则“按住火焰上升，借横向气流收集氧气，避免火焰耗尽。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 |
| 83 | 2 | [Echo Bridge](#item-83) | 可封装候选 | P1 | MIT单键crisp-game-lib作品，保留上游独立规则“抓准旋转方向搭桥跳岛，平衡建桥材料与回收收益。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 |
| 84 | 3 | [Jet Stream](#item-84) | 可封装候选 | P1 | MIT单键crisp-game-lib作品，保留上游独立规则“切换三条方向相反的气流航道，穿过风障并保持位置。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 |
| 85 | 4 | [Kite Master](#item-85) | 可封装候选 | P1 | MIT单键crisp-game-lib作品，保留上游独立规则“收放风筝线应对风向与重力，捕捉云朵并防止触地。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 |
| 86 | 5 | [Marble Bounce](#item-86) | 可封装候选 | P1 | MIT单键crisp-game-lib作品，保留上游独立规则“点击给弹珠向上冲量，在目标爆炸前撞中目标销。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 |
| 87 | 6 | [Microbial Focus](#item-87) | 可封装候选 | P1 | MIT单键crisp-game-lib作品，保留上游独立规则“调整显微镜焦深，让不同深度的微生物离场，控制危险增长。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 原theme=shape通过Pixi 5.3.0使用WebGL，须保持原渲染并验证GPU能力。 |
| 88 | 7 | [Pod Migration](#item-88) | 可封装候选 | P1 | MIT单键crisp-game-lib作品，保留上游独立规则“控制领头鲸转向，带领鲸群穿过浮冰，维持队伍与连击。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 原theme=shape通过Pixi 5.3.0使用WebGL，须保持原渲染并验证GPU能力。 |
| 89 | 8 | [Pulse Stream](#item-89) | 可封装候选 | P1 | MIT单键crisp-game-lib作品，保留上游独立规则“抓准脉冲时机推回漂流物，防止五条航道中失守三条。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 |
| 90 | 9 | [Rocket Trail](#item-90) | 可封装候选 | P1 | MIT单键crisp-game-lib作品，保留上游独立规则“推进火箭并用尾焰摧毁陨石，追求连续击破倍率。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 |
| 91 | 10 | [Switchboard](#item-91) | 可封装候选 | P1 | MIT单键crisp-game-lib作品，保留上游独立规则“在旋转光标经过插口时按住接线，按请求正确连接电话。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 |
| 92 | 11 | [Tectonic Tether](#item-92) | 可封装候选 | P1 | MIT单键crisp-game-lib作品，保留上游独立规则“收放绳索蓄力摆荡，撞碎陨石并收集晶石补充能量。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 原theme=shape通过Pixi 5.3.0使用WebGL，须保持原渲染并验证GPU能力。 |
| 93 | 93 | [Flappy Skies](#item-93) | 许可或素材条件待解决 | P5 | 单键Canvas最易技术封装，但完整树无许可，不能因为代码短或公开就当MIT。 |

## 逐项门槛、输入、离线与许可

所有条目均须再完成文末公共验收；“可开始”不免除逐项权利或能力条件。

<a id="item-1"></a>

### 1. 鹈鹕骑自行车

**许可或素材条件待解决 · P5 · 建议顺序56**。来源：[固定源码](https://github.com/riba2534/claude-opus-5-5-demo/tree/54adc1fb64155f9dd7c1c90ecae7b8185ac540b8/pelican-bike)；ID：`riba2534/claude-opus-5-5-demo#ed4d6376`。

同仓已有骑行状态与抓鱼逻辑；技术上可复用Web宿主，但本项无根许可，不能因同仓CF/QQ已适配推定授权。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向控制骑行/变道；A跳跃，B展翅，X追鱼辅助，Y视角/设置焦点，START暂停。修复自动追鱼与显式输入优先级；lil-gui须替换为焦点菜单。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 固定commit完整源码树没有根LICENSE/COPYING；不能把依赖的MIT或package默认license当作整仓授权。 未明确
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-2"></a>

### 2. Kart Royale

**交互或性能适配后封装 · P1 · 建议顺序16**。来源：[固定源码](https://github.com/ryancampbell/kart-royale/tree/036c0efb025f5ecf8fc31c405e9d818c61e03e21)；ID：`ryancampbell/kart-royale#815b67bb`。

已读Input.ts有数字转向平滑、Gamepad及热插拔；Race.ts有检查点、倒计时、重生，可直接复用规则。 现成模拟Gamepad不能直接解决九键输入；需要直接注入动作状态并降低后处理开销。

- Android：打包目标Android 8+；运行最低版本未实测。需可用的较新Android System WebView、硬件加速与WebGL2/GLES3 GPU，发布前做能力探测和低画质实机验证；仅Android版本号不能保证运行。
- macOS：打包目标macOS 11+ universal；运行最低版本未实测。需实际支持WebGL2的系统WKWebView/WebKit，初始macOS 11系统WebKit不保证；Intel与Apple Silicon均须验证GPU、音频解锁与帧时。
- 九键方案与难点：UP: 油门；DOWN: 刹车/倒车；LEFT: 左转；RIGHT: 右转；A: 小跳/按住漂移；B: 使用道具；X: 向后看；Y: 切换视角或打开控制说明；START: 开始/暂停；菜单方向导航、A确认、B返回；camera: 比赛用原有追尾镜头，无需模拟右摇杆；数字转向做可调渐进。
- 离线条件：用npm锁文件构建静态包，将Three.js、postprocessing、n8ao与运行时资源打入本地。 程序化美术/音效可本地生成；清点字体与其他外链并本地化，使用稳定本地源保存设置。 低档关闭AO/高开销后处理，建立最大渲染分辨率。
- 许可/素材条件：保留根MIT版权/许可及所有打包依赖许可；无需把作者演示域名作为运行依赖。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/ryancampbell/kart-royale/blob/036c0efb025f5ecf8fc31c405e9d818c61e03e21/LICENSE)

<a id="item-3"></a>

### 3. Turbo Kart Rally

**交互或性能适配后封装 · P1 · 建议顺序17**。来源：[固定源码](https://github.com/bridge-mind/turbo-kart-rally/tree/c52aca3f10c7995884c316810cac6514daa40e9c)；ID：`bridge-mind/turbo-kart-rally#5dfcb7ed`。

已读输入和kart模块，漂移/道具动作可直接映射数字键，既有追尾镜头适合电视。 现import map从jsDelivr取Three.js，离线宿主必须改成本地bundle，菜单需要九键焦点。

- Android：打包目标Android 8+；运行最低版本未实测。需可用的较新Android System WebView、硬件加速与WebGL2/GLES3 GPU，发布前做能力探测和低画质实机验证；仅Android版本号不能保证运行。
- macOS：打包目标macOS 11+ universal；运行最低版本未实测。需实际支持WebGL2的系统WKWebView/WebKit，初始macOS 11系统WebKit不保证；Intel与Apple Silicon均须验证GPU、音频解锁与帧时。
- 九键方案与难点：UP: 油门；DOWN: 刹车/倒车；LEFT: 左转；RIGHT: 右转；A: 小跳/漂移；B: 道具；X: 后视；Y: 静音/辅助菜单；START: 开始/暂停，菜单A确认B返回；camera: 复用追尾；不要求模拟双摇杆。
- 离线条件：固定并本地打包Three.js r170及addons，移除CDN import map依赖。 模型、纹理、声音由代码生成，静态资源可随APK/APP分发；首个确认键触发音频。
- 许可/素材条件：MIT源码及Three.js等依赖许可随包保留；避免把品牌类比文案当授权。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/bridge-mind/turbo-kart-rally/blob/c52aca3f10c7995884c316810cac6514daa40e9c/LICENSE)

<a id="item-4"></a>

### 4. Frostline Kart

**许可或素材条件待解决 · P5 · 建议顺序57**。来源：[固定源码](https://github.com/sorrycc/fable-arcade/tree/6ab9de3122600e9c9dbe5daf3e77f7fe9361e335/games/mario-kart-snow)；ID：`sorrycc/fable-arcade#38a9ad78`。

单HTML程序化竞速可以封装；需数字转向、菜单和低GPU档，当前仓库没有再分发许可。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：上下油门/刹车、左右转向；A道具，B菜单返回，X重生，Y视角/设置，START暂停；数字转向需平滑。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 固定commit完整源码树没有根LICENSE/COPYING；不能把依赖的MIT或package默认license当作整仓授权。 未明确
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-5"></a>

### 5. Robo Tennis

**许可或素材条件待解决 · P5 · 建议顺序58**。来源：[固定源码](https://github.com/sorrycc/fable-arcade/tree/6ab9de3122600e9c9dbe5daf3e77f7fe9361e335/games/robot-tennis)；ID：`sorrycc/fable-arcade#5d0d70de`。

移动与挥拍只需方向加动作键，不存在硬件输入障碍；阻塞为代码许可未明确。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动并决定击球落点；A挥拍/发球，B冲刺，X球路说明，Y比赛菜单，START暂停。移动与挥拍同按不能吞键。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 固定commit完整源码树没有根LICENSE/COPYING；不能把依赖的MIT或package默认license当作整仓授权。 未明确
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-6"></a>

### 6. Dirt Crown

**可封装候选 · P2 · 建议顺序20**。来源：[固定源码](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-069)；ID：`triptych/web-games-andrew#dfb2f811`。

已有Gamepad竞速、升级和杯赛，核心九键能覆盖；需离线化和取消漂移语义。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：左右转向、上下油门/刹车；A漂移、B氮气，X重置/确认、Y升级菜单，START暂停。断线释放漂移不得发放氮气收益。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/triptych/web-games-andrew/blob/a7051c34fe2e7550fd206e6272f758df171855b0/LICENSE)

<a id="item-7"></a>

### 7. backroad rally

**交互或性能适配后封装 · P2 · 建议顺序30**。来源：[固定源码](https://github.com/jason-c-dev/backroad-rally/tree/e5542f96b9a9a2912fdaa160396054e81f022f23)；ID：`jason-c-dev/backroad-rally#085bb617`。

controls.ts支持数字键；Rapier单线程compat物理可运行于WebView/WKWebView，追尾镜头不需要双摇杆。 须强制可用WebGL2路径、清点WASM/GLB/音频加载，赛段和天气负载要做实机分档。

- Android：打包目标Android 8+；运行最低版本未实测。需可用的较新Android System WebView、硬件加速与WebGL2/GLES3 GPU，发布前做能力探测和低画质实机验证；仅Android版本号不能保证运行。
- macOS：打包目标macOS 11+ universal；运行最低版本未实测。需实际支持WebGL2的系统WKWebView/WebKit，初始macOS 11系统WebKit不保证；Intel与Apple Silicon均须验证GPU、音频解锁与帧时。
- 九键方案与难点：UP: 加速；DOWN: 刹车/倒车；LEFT: 左转；RIGHT: 右转；A: 手刹；B: 复位（确认后执行）；X: 镜头切换；Y: 赛段/生涯状态页；START: 开始/暂停；方向+A/B操作生涯菜单；camera: 固定追尾/俯视镜头，数字转向平滑复用现实现。
- 离线条件：静态bundle包含Three.js与Rapier兼容WASM，使用正确MIME/本地URL加载。 随包归档全部合法GLB、纹理、字体与音频；不运行Node/Unreal。 禁用在线无关功能并确认ghost/生涯存档本地可用。
- 许可/素材条件：代码MIT；字体保留OFL等许可。 README称模型由Blender脚本生成、音效/音乐用ElevenLabs；发布前清点资产授权/生成服务条款，未确认的音频可替换，不能仅凭代码MIT称全部资产MIT。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 条件分支：仅MIT代码及已确认权利素材先行；生成音频等未确认素材必须核权利或替换后才能发布。
- 权利证据：[文件1](https://github.com/jason-c-dev/backroad-rally/blob/e5542f96b9a9a2912fdaa160396054e81f022f23/LICENSE)

<a id="item-8"></a>

### 8. Slide Rush

**许可或素材条件待解决 · P2 · 建议顺序52**。来源：[固定源码](https://github.com/KJLKurt/waterslide-game-opus-5.5/tree/03bc5993750ba870f12de3c6086e15877b62de09)；ID：`kjlkurt/waterslide-game-opus-5.5#d2cc205e`。

转向+跳跃是九键非常合适的技术候选，已读Input.js/Racer.js有边沿跳跃与固定子步。 当前固定源码树未发现明确根许可证；公开源码和模型制作声明不足以授权修改后打包再分发。

- Android：打包目标Android 8+；运行最低版本未实测。需可用的较新Android System WebView、硬件加速与WebGL2/GLES3 GPU，发布前做能力探测和低画质实机验证；仅Android版本号不能保证运行。
- macOS：打包目标macOS 11+ universal；运行最低版本未实测。需实际支持WebGL2的系统WKWebView/WebKit，初始macOS 11系统WebKit不保证；Intel与Apple Silicon均须验证GPU、音频解锁与帧时。
- 九键方案与难点：UP: 菜单上移/可选前压；DOWN: 菜单下移/可选减速辅助；LEFT: 向左转向；RIGHT: 向右转向；A: 跳跃；B: 返回/取消；X: 视角/重赛入口；Y: 显示操作说明；START: 开始/暂停；camera: 自动追尾；无需右摇杆。
- 离线条件：取得授权后用Vite生成静态包，本地打包Three.js。 用宿主资产代替依赖首次网络下载的PWA缓存，确认localStorage外观/成绩持久。
- 许可/素材条件：需作者提供适用于修改及APK/macOS分发的许可证或明确授权；不能擅自标MIT。 第三方Three.js等许可需独立保留。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-9"></a>

### 9. FORE LIGHT-YEARS

**许可或素材条件待解决 · P5 · 建议顺序59**。来源：[固定源码](https://github.com/tdeeh8/fore/blob/0e34ee8e4bcf378d96a22a3809f4e5548193a098/index.html)；ID：`tdeeh8/fore#ffbcc691`。

射程、升级和最终结算完整，键鼠可改为瞄角/蓄力/焦点商店；代码没有许可，不能直接分发。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL 1/2（保留上游兼容路径）、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL 1/2（保留上游兼容路径）、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：左右调挥杆方向，上下调空中轨迹；A按住/释放击球，B推进，X升级，Y镜头模式，START暂停。商店焦点独立；取消长按不应发球。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 未明确：仓库仅README、index.html及preview.png，未发现LICENSE/COPYING；不能当MIT分发。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-10"></a>

### 10. Kart Rush

**许可或素材条件待解决 · P3 · 建议顺序53**。来源：[固定源码](https://github.com/stevkazt/kart-rush/tree/4b0cf276d84e76171feb765d87b5e8a6159cc421)；ID：`stevkazt/kart-rush#22bea9bc`。

main.js已有数字转向速率限制，Cannon固定物理步与完整比赛循环；无需永久排除手机项目。 未发现明确根许可证；另有强制手机横屏/触屏菜单，需要转换为电视布局与九键动作。

- Android：Android 8+宿主、可更新System WebView；Three.js 0.160与cannon-es所用WebGL路径、ES modules、硬件加速和Web Audio；r160保留WebGL1能力，不武断要求WebGL2，但实际着色器/驱动必须验证。
- macOS：macOS 11+ Universal宿主；WKWebView支持Three r160实际WebGL路径、ES modules和Web Audio，分别核Intel/Apple Silicon；不将r160与r170+的WebGL2门槛混同。
- 九键方案与难点：UP: 油门；DOWN: 刹车/倒车；LEFT: 左转；RIGHT: 右转；A: 使用道具；B: 备用道具动作；X: 复位（需确认）；Y: 视角/控制说明；START: 开始/暂停；camera: 复用追尾；原自动漂移随转向/速度触发，不虚构独立跳跃键；移除portrait旋转和触屏必选流程。
- 离线条件：授权后将Three.js 0.160、cannon-es 0.20和相关导入本地化，不能靠jsDelivr首次联网。 用本地资产入口替换PWA service worker路径，保留全部音效生成脚本与必要图标。
- 许可/素材条件：需要修改和再分发授权；当前未明确，不按MIT处理。 Cannon/Three.js依赖许可另附；项目CLAUDE.md仅开发说明，不是许可文件。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-11"></a>

### 11. Kırkpınar／土耳其摔跤

**可封装候选 · P2 · 建议顺序21**。来源：[固定源码](https://github.com/Furkiozknn/kirkpinar/blob/b655e93c5d04b199638bc3a9bf5228f1de0dcc8c/index.html)；ID：`furkiozknn/kirkpinar#a335c6f3`。

现有D-pad/ABXY/Start覆盖单人核心玩法；双人功能需独立席位扩展，先实现单人不等于双人已支持。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向与ABXY沿原生D-pad/ABXY动作表，START暂停；先保留完整单人职业/AI模式，菜单焦点化。双人需双客户端真实ID独立席位输入，不能把一个九键状态复制给双方。
- 离线条件：离线打包Three r170；移除Goatcounter；Google Fonts本地附许可或换系统字体；单人AI不依赖第二设备。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 MIT；Three.js MIT，Google Fonts另有字体许可。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/Furkiozknn/kirkpinar/blob/b655e93c5d04b199638bc3a9bf5228f1de0dcc8c/LICENSE)

<a id="item-12"></a>

### 12. Peri Golf

**可封装候选 · P2 · 建议顺序22**。来源：[固定源码](https://github.com/Furkiozknn/peri-golf/blob/875de69749f3b74a9b0d928fe88b98392c2c055e/index.html)；ID：`furkiozknn/peri-golf#2aa0558c`。

左右瞄准和蓄力释放已是数字键方案，核心交互无需重写；补全焦点与取消击球。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：左右瞄准，上下镜头距离；A蓄力/松开击球，B取消，X球场鸟瞰，Y挑战/设置，START暂停。切菜单和断线取消蓄力不得击球。
- 离线条件：Three r170本地化；随包核对CREDITS中的纹理/GLB/HDRI/音效，缺可选素材应保留程序化回退；去统计外链。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 MIT；CREDITS明确部分第三方纹理/音效CC0、Fredoka字体OFL 1.1（不能笼统全CC0）。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/Furkiozknn/peri-golf/blob/875de69749f3b74a9b0d928fe88b98392c2c055e/LICENSE)、[文件2](https://github.com/Furkiozknn/peri-golf/blob/875de69749f3b74a9b0d928fe88b98392c2c055e/CREDITS.md)

<a id="item-13"></a>

### 13. Tidewater

**需另宿主或运行路线 · P5 · 建议顺序60**。来源：[固定源码](https://github.com/dgreenheck/tidewater/tree/4811ba48d795197de5621985f404e765c0b7c0ef)；ID：`dgreenheck/tidewater#048014d7`。

当前是自写WebGPU/WGSL渲染器，没有WebGL回退，现Android8 WebView/mac11 WKWebView基线不具备可保证的WebGPU。 即使完成九键，当前宿主也不能承诺加载；需独立WebGL2渲染移植或升级宿主/系统/GPU路线。

- Android：当前Android8 WebView宿主无合格最低版本承诺；需WebGPU支持的独立宿主/较新系统与受支持GPU，或先移植WebGL2。具体最低版本须按新路线实测。
- macOS：当前macOS11 WKWebView不满足本项目WebGPU要求；须另定支持WebGPU的较新系统/宿主并测Intel兼容性，或移植WebGL2。
- 九键方案与难点：UP: 步行/船只前进；DOWN: 后退/减速；LEFT: 转向；RIGHT: 转向；A: 抛竿/按住收线；B: 互动/上船/下船；X: 镜头模式切换后方向调视角；Y: 商店/装备菜单；START: 暂停/确认菜单；camera: 可做数字转向+镜头模式与自动水平；需先解决渲染架构。
- 离线条件：现宿主不可直接离线打包运行；先提供WebGL2后端或独立支持WebGPU的新宿主。 后续可把音频、GLB、纹理和字体随包；Google Fonts需本地化，Node仅构建用。
- 许可/素材条件：源码MIT；CREDITS已读：Freesound/Poly Haven为CC0，Rocketbox角色MIT，字体OFL/Apache2，分别保留要求。 渲染架构限制与许可证是不同问题。
- 后续路线：移植WebGPU/WGSL渲染为WebGL2，或另建明确支持WebGPU的新系统/宿主路线；重新定义最低系统，不冒称现Android8/mac11基线支持。
- 权利证据：[文件1](https://github.com/dgreenheck/tidewater/blob/4811ba48d795197de5621985f404e765c0b7c0ef/LICENSE)

<a id="item-14"></a>

### 14. The Long Silence

**交互或性能适配后封装 · P3 · 建议顺序31**。来源：[固定源码](https://github.com/achimala/TheLongSilence/tree/69b3296b4b6ecb3ca75ed6193e4b785c4c791c0f)；ID：`achimala/thelongsilence#f747a96e`。

WebGL2源码可进入现Web宿主适配；Input.js已统一键鼠/手柄，但六自由度飞行、星图、扫描和步行交互超过简单一一键位。 需模式菜单、稳定相机、场景/地表资源与渲染档位，不能因现有Gamepad而当可直接打包。

- Android：打包目标Android 8+；运行最低版本未实测。需可用的较新Android System WebView、硬件加速与WebGL2/GLES3 GPU，发布前做能力探测和低画质实机验证；仅Android版本号不能保证运行。
- macOS：打包目标macOS 11+ universal；运行最低版本未实测。需实际支持WebGL2的系统WKWebView/WebKit，初始macOS 11系统WebKit不保证；Intel与Apple Silicon均须验证GPU、音频解锁与帧时。
- 九键方案与难点：UP: 抬头/上移，星图模式上移；DOWN: 低头/下移；LEFT: 向左偏航；RIGHT: 向右偏航；A: 加速，步行模式互动；B: 减速/刹停；X: 按住扫描；Y: 模式/动作轮盘（星图、着陆、离地、步行、滚转、升级）；START: 暂停/导航菜单；camera: 飞行采用数字偏航/俯仰+自动回正；滚转放动作轮盘或Y模式。步行用向前/后与转向，观察模式暂改方向控制视角。
- 离线条件：Vite构建并本地打包Three.js；归档所有生成的地表纹理、GLB、舱内资源及其相对路径。 禁用外部演示/调试依赖；星图、剧情、存档应可本地运行，采用低分辨率行星烘焙。
- 许可/素材条件：根MIT与Three.js许可证随包；仓库声明素材由自身工具生成，仍逐文件保留来源声明，勿加入外部素材。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/achimala/TheLongSilence/blob/69b3296b4b6ecb3ca75ed6193e4b785c4c791c0f/LICENSE)

<a id="item-15"></a>

### 15. Three.js Quake

**交互或性能适配后封装 · P3 · 建议顺序32**。来源：[固定源码](https://github.com/mrdoob/three-quake/tree/6d6177b11f81f390d8e527dd5dd738d981eb13fa)；ID：`mrdoob/three-quake#15a8cb58`。

JS/Three.js渲染和客户端输入可适配现Web宿主；固定数字按键可做传统转向式FPS，并非鼠标永久排除。 需修改pointer lock依赖、增加辅助瞄准/视角重置和菜单导航；Quake游戏数据不因代码GPL自动获授权。

- Android：打包目标Android 8+；运行最低版本未实测。需可用的较新Android System WebView、硬件加速与WebGL2/GLES3 GPU，发布前做能力探测和低画质实机验证；仅Android版本号不能保证运行。
- macOS：打包目标macOS 11+ universal；运行最低版本未实测。需实际支持WebGL2的系统WKWebView/WebKit，初始macOS 11系统WebKit不保证；Intel与Apple Silicon均须验证GPU、音频解锁与帧时。
- 九键方案与难点：UP: 前进；DOWN: 后退；LEFT: 左转；RIGHT: 右转；A: 开火；B: 跳跃；X: 按住进入瞄准/横移模式：上下俯仰、左右平移；Y: 切换武器；长按动作菜单；START: 开始/暂停；camera: 数字角速度/加速度、视角自动回中与可关闭辅助瞄准；不模拟连续双摇杆。
- 离线条件：把Three.js 0.183及addons改本地bundle；确认单机服务器逻辑无网络必需。 首版采用用户导入合法PAK或确认shareware分发条款后再打包数据；完整PAK不随包擅自分发。 联网WebTransport另行支持，不作为离线版必需。
- 许可/素材条件：GPLv2代码再分发需提供对应源码、改动和许可证；需评估与宿主整合方式的GPL义务。 原版/分享版PAK属于独立资产许可；代码GPL不能替代PAK分发授权，适配可用合法用户自备数据进行。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 条件分支：不捆绑任何未授权PAK，先实现用户导入合法自备数据的流程；安装引擎包本身不含可直接游玩的原作关卡。
- 权利证据：[文件1](https://github.com/mrdoob/three-quake/blob/6d6177b11f81f390d8e527dd5dd738d981eb13fa/LICENSE)

<a id="item-16"></a>

### 16. GalaxyQuest

**需另宿主或运行路线 · P5 · 建议顺序61**。来源：[固定源码](https://github.com/bigmak94/GalaxyQuest/tree/86a31eed9545795cfd561db52ddfb2ad3ad1325e)；ID：`bigmak94/galaxyquest#a384514c`。

C++ Android NDK/OpenXR面向Meta Quest的原生移植，不是浏览器HTML游戏。 当前APK仅能用于Quest路线，现WebView/WKWebView宿主不能装入其渲染器/VR追踪/手柄；需独立原生平台工程。

- Android：不适用当前Android8 WebView宿主。原项目仅声明Meta Quest 2/3/3S目标；Android TV原生最低版本须独立移植后确定。
- macOS：不适用macOS11 universal WKWebView。需重新开发macOS原生图形/输入后端并建立双架构构建，原项目未提供此保证。
- 九键方案与难点：UP: 拟定原生平面移植后的前移；DOWN: 后移；LEFT: 左移；RIGHT: 右移；A: 跳跃/确认；B: 旋转/返回；X: 星屑指针模式；Y: 相机/动作切换；START: 暂停；camera: 指针、体感倾斜、重力相机必须重做为数字模式；此方案仅独立原生移植设计，不适用于现Web宿主。
- 离线条件：另建原生Android TV与macOS渲染/输入层，替换OpenXR与Quest扩展；不能靠WebView包装解决。 用户自行提供/转换原版Super Mario Galaxy数据，仓库不含游戏素材；不下载或捆绑原版数据。
- 许可/素材条件：移植层Unlicense，Petari及第三方代码按各自许可保留；原版游戏资产独立受保护。
- 后续路线：独立开发Android TV/macOS原生图形与平面输入后端，替换Quest/OpenXR；原作数据仍由用户合法提供并转换。
- 权利证据：[文件1](https://github.com/bigmak94/GalaxyQuest/blob/86a31eed9545795cfd561db52ddfb2ad3ad1325e/LICENSE)

<a id="item-17"></a>

### 17. 长风 · Long Wind

**交互或性能适配后封装 · P3 · 建议顺序33**。来源：[固定源码](https://github.com/jbang2004/long-wind/tree/ac2e7e38e15b7f17bd7920eed82638c64bbe4713)；ID：`jbang2004/long-wind#5f52a12a`。

已有锁定、统一动作与标准Gamepad映射，可通过自动锁定和动作组合实现九键；输入时序需保留150ms弹反窗口。 图形/动画/草地开销较高，需低档与稳定帧时；原角色/动作不是MIT，适配代码可先用程序化或可授权替代素材。

- Android：打包目标Android 8+；运行最低版本未实测。需可用的较新Android System WebView、硬件加速与WebGL2/GLES3 GPU，发布前做能力探测和低画质实机验证；仅Android版本号不能保证运行。
- macOS：打包目标macOS 11+ universal；运行最低版本未实测。需实际支持WebGL2的系统WKWebView/WebKit，初始macOS 11系统WebKit不保证；Intel与Apple Silicon均须验证GPU、音频解锁与帧时。
- 九键方案与难点：UP: 角色向前；DOWN: 后退；LEFT: 左移；RIGHT: 右移；A: 轻击；长按蓄力重击；B: 格挡/时机弹反；X: 闪避；Y: 锁定/切换目标；Y+A剑气，Y+B拔/收剑；START: 暂停/菜单；camera: 默认锁定或自动追尾，空闲按住Y+方向旋转镜头；冲刺可做连续方向长按。组合键须可重映射且不延迟格挡。
- 离线条件：本地打包Three.js、模型、纹理与字体；动态加载路径统一为宿主可访问静态源。 提供低草地密度/阴影/后处理档，必要时用低模和程序动画替换原素材。
- 许可/素材条件：代码MIT；Poly Haven CC0；字体OFL。 已读CREDITS：Tripo角色与Mixamo动作明确不在MIT范围，受各自服务条款约束，禁止独立抽取/再分发。打包游戏前核实组合使用授权，无法确认则替换为有明确分发许可的素材。 eligibleNow仅表示可立即开展代码适配/替代资产开发，不表示原素材可直接随包发布。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 条件分支：先用MIT代码及程序化/许可明确的替代模型动作适配，原Tripo/Mixamo内容不得未经核实随包。
- 权利证据：[文件1](https://github.com/jbang2004/long-wind/blob/ac2e7e38e15b7f17bd7920eed82638c64bbe4713/LICENSE)、[文件2](https://github.com/jbang2004/long-wind/blob/ac2e7e38e15b7f17bd7920eed82638c64bbe4713/CREDITS.md)

<a id="item-18"></a>

### 18. Tidewright

**交互或性能适配后封装 · P4 · 建议顺序46**。来源：[固定源码](https://github.com/winchxyz/tidewright/tree/ebf06be3303c2ee9588c394230971e5e475b3f1c)；ID：`winchxyz/tidewright#16d757ca`。

WebGL2有现宿主技术路径，但强制EXT_color_buffer_float；缺该扩展GPU需降低模拟格式或另做替代，不能只靠系统版本号。 鼠标造型可转虚拟光标+工具/镜头模式，需实作九键UX，不永久排除。

- Android：打包目标Android 8+；运行最低版本未实测。需可用的较新Android System WebView、硬件加速与WebGL2/GLES3 GPU，发布前做能力探测和低画质实机验证；仅Android版本号不能保证运行。 本项目额外硬要求EXT_color_buffer_float与浮点渲染目标，GPU能力不满足就不能用当前实现。
- macOS：打包目标macOS 11+ universal；运行最低版本未实测。需实际支持WebGL2的系统WKWebView/WebKit，初始macOS 11系统WebKit不保证；Intel与Apple Silicon均须验证GPU、音频解锁与帧时。 另须EXT_color_buffer_float；Intel集显浮点目标和模拟负荷必须单独验证。
- 九键方案与难点：UP: 虚拟光标上移；DOWN: 虚拟光标下移；LEFT: 虚拟光标左移；RIGHT: 虚拟光标右移；A: 按住使用当前工具/放置；B: 取消或替代铲除工具；X: 上一工具/工具轮盘；Y: 镜头模式：方向旋转/平移，A/B缩放；START: 暂停/阶段菜单；camera: 默认固定斜俯视，Y切换镜头与雕刻模式；光标边缘自动平移，可调速度和网格吸附。
- 离线条件：全部JS/GLSL与UI本地化，无引擎CDN；保留程序合成音频。 启动探测WebGL2+EXT_color_buffer_float，不满足则说明不支持或采用经实现验证的低配模拟路径；不假装成功。
- 许可/素材条件：MIT源码，依赖/字体等按实际打包清单保留声明。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/winchxyz/tidewright/blob/ebf06be3303c2ee9588c394230971e5e475b3f1c/LICENSE)

<a id="item-19"></a>

### 19. 毛线星球 · Yarn Planet

**交互或性能适配后封装 · P1 · 建议顺序18**。来源：[固定源码](https://github.com/makerjackie/yarn-planet/tree/5c8acce8df04fc7788d48a98343e38c05a458a16)；ID：`makerjackie/yarn-planet#977060cc`。

首章主要是移动/跳跃/互动/收线，数字九键可覆盖；物理为固定步、球面重力与BVH，现Web宿主可适配。 需要自动跟随镜头与电视菜单；共享线程/多人依赖Cloudflare，离线体验应明确禁用联网层。

- Android：打包目标Android 8+；运行最低版本未实测。需可用的较新Android System WebView、硬件加速与WebGL2/GLES3 GPU，发布前做能力探测和低画质实机验证；仅Android版本号不能保证运行。
- macOS：打包目标macOS 11+ universal；运行最低版本未实测。需实际支持WebGL2的系统WKWebView/WebKit，初始macOS 11系统WebKit不保证；Intel与Apple Silicon均须验证GPU、音频解锁与帧时。
- 九键方案与难点：UP: 前进；DOWN: 后退；LEFT: 左移；RIGHT: 右移；A: 互动/接线/确认；B: 跳跃/取消；X: 收线；Y: 按住镜头模式，方向调视角；短按连接手册；START: 暂停/设置；camera: 自动追尾与地平稳定；镜头模式在安全停步时使用，不要求模拟右摇杆。
- 离线条件：Vite bundle包含Three.js和BVH依赖，所有程序化资源本地生成。 保留本地首章存档；无网时禁用Cloudflare Durable Objects偶遇/公共线条，保证不会等待网络才能进入。 如果保留多人则明确在线并自托管Worker，不能称离线多人。
- 许可/素材条件：代码MIT，第三方库许可按THIRD_PARTY声明保留。 README明确代码许可不授予Yarn Planet/毛线星球品牌；衍生发行应按要求更名，不冒充官方。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/makerjackie/yarn-planet/blob/5c8acce8df04fc7788d48a98343e38c05a458a16/LICENSE)

<a id="item-20"></a>

### 20. Fable Theft Auto 5.1

**许可或素材条件待解决 · P5 · 建议顺序62**。来源：[固定源码](https://github.com/sorrycc/fable-arcade/tree/6ab9de3122600e9c9dbe5daf3e77f7fe9361e335/games/voxel-gta-city)；ID：`sorrycc/fable-arcade#8d64c685`。

步行/驾驶/自由瞄准可用模式切换与辅助瞄准，但复杂城市需性能降档；无代码许可，待授权后可适配。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向默认移动，X切瞄准模式后方向转镜头；A射击/确认，B跳跃/取消，Y交互/上下车，START暂停；换弹/武器从暂停动作页选。车辆模式重新分配油门/转向；需辅助瞄准和免Pointer Lock入口。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 固定commit完整源码树没有根LICENSE/COPYING；不能把依赖的MIT或package默认license当作整仓授权。 未明确
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-21"></a>

### 21. Nova Lancer

**交互或性能适配后封装 · P1 · 建议顺序19**。来源：[固定源码](https://github.com/tanuu5/nova-lancer/tree/63b63953299994baa05ac27c15c6b836fff0179b)；ID：`tanuu5/nova-lancer#5a0d0ea5`。

轨道自动前进，方向四键可控制屏幕内飞行；fire/bomb/boost/brake映射ABXY，rollL/rollR另设计明确组合键，适合九键适配。 已有Gamepad不足以直接接TCP；需接入动作层、菜单焦点与低画质/音频初始化。

- Android：打包目标Android 8+；运行最低版本未实测。需可用的较新Android System WebView、硬件加速与WebGL2/GLES3 GPU，发布前做能力探测和低画质实机验证；仅Android版本号不能保证运行。
- macOS：打包目标macOS 11+ universal；运行最低版本未实测。需实际支持WebGL2的系统WKWebView/WebKit，初始macOS 11系统WebKit不保证；Intel与Apple Silicon均须验证GPU、音频解锁与帧时。
- 九键方案与难点：UP: 上移；DOWN: 下移；LEFT: 左移；RIGHT: 右移；A: 射击，按住锁定蓄力；B: 炸弹（单次按下）；X: 加速；Y: 减速；START: 开始/暂停；菜单A确认B返回；camera: 沿轨道自动追尾，无独立镜头轴。；combos: 可配置快速双按LEFT/RIGHT触发rollL/rollR，或Y+LEFT/RIGHT触发侧滚并抑制该次刹车；实现后须验证不误触。
- 离线条件：用已有esbuild流程生成内嵌Three.js单HTML，本地保留全部模块生成产物。 将Google Fonts/OFL字体本地化或使用许可明确系统回退；WebAudio经A/START手势解锁。
- 许可/素材条件：代码MIT、Three.js MIT，随包保留声明；字体保留OFL。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/tanuu5/nova-lancer/blob/63b63953299994baa05ac27c15c6b836fff0179b/LICENSE)

<a id="item-22"></a>

### 22. Crystal Rooms

**交互或性能适配后封装 · P3 · 建议顺序34**。来源：[固定源码](https://github.com/vreshch/kids-games/tree/ca0c247fbd3308550529239d66740d67ad6519ca/src/components/crystal-rooms)；ID：`vreshch/kids-games#28082ade`。

MIT儿童拼字玩法可开展；Next组件提取/静态输出、Three渲染和TTS回退是实际工作，不能要求TV运行Next服务端。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向WASD移动，A进入/交互，B返回，X读字/重播，Y关卡说明，START暂停；Web Speech缺失时显示字幕并以本地提示音替代，不能让无TTS阻断过关。
- 离线条件：提取客户端React/Three组件，不把Next dev server带入包；所有路由/字词/音效本地；TTS不是离线必备能力。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/vreshch/kids-games/blob/ca0c247fbd3308550529239d66740d67ad6519ca/LICENSE)

<a id="item-23"></a>

### 23. Mortal Clash

**许可或素材条件待解决 · P5 · 建议顺序63**。来源：[固定源码](https://github.com/PromptEngineer48/claude-opus-5.5-games/tree/07b8b5e0d54a0938b03db5d855577acf8e3bcad9/mortal-clash)；ID：`promptengineer48/claude-opus-5.5-games#4f23cf70`。

四攻击键与方向自然落到九键；代码未授权且GLB来自three.js examples各有许可，两个条件均要解决。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动/蹲跳；ABXY分别接J/K/L/I攻击，START暂停/菜单；菜单确认按上下文接A，保证多键连招与取消状态独立。
- 离线条件：除Three/字体外，下载并按版本冻结examples r170引用的每个GLB与逐文件许可；无模型授权则自制替换。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 固定commit完整源码树没有根LICENSE/COPYING；不能把依赖的MIT或package默认license当作整仓授权。 未明确 逐一核对three.js examples r170人物GLB作者与再分发许可；Three引擎MIT不覆盖所有示例模型。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-24"></a>

### 24. Rooftop Sniper: Last Light

**许可或素材条件待解决 · P5 · 建议顺序64**。来源：[固定源码](https://github.com/PromptEngineer48/claude-opus-5.5-games/tree/07b8b5e0d54a0938b03db5d855577acf8e3bcad9/rooftop-sniper)；ID：`promptengineer48/claude-opus-5.5-games#45e778b8`。

已有离线HTML降低依赖工作，九键精细瞄准需灵敏度/倍率模式；代码许可未明确。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向调准星；A射击，B开镜/取消，X屏息，Y切换倍率/换弹动作页，START暂停。需加粗调/细调灵敏度和免Pointer Lock菜单；瞄准精度是验收门槛。
- 离线条件：先对offline/index.html与构建源码来源做对应检查，Vite8使用其支持的构建Node版本，最终包不运行Node。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 固定commit完整源码树没有根LICENSE/COPYING；不能把依赖的MIT或package默认license当作整仓授权。 未明确
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-25"></a>

### 25. Fishslop

**许可或素材条件待解决 · P3 · 建议顺序54**。来源：[固定源码](https://github.com/vasu-devs/FishSlop_Opus5.5/tree/55de15091c789585a5d4ece952f841e6006af138)；ID：`vasu-devs/fishslop_opus5.5#3d1af856`。

SimInput已抽象moveX/moveY/rise/boost/feed/sonar，可直接做数字九键；不是因缺Gamepad而排除。 当前固定源码树未找到许可；未经授权不进行修改后再分发打包。

- Android：打包目标Android 8+；运行最低版本未实测。需可用的较新Android System WebView、硬件加速与WebGL2/GLES3 GPU，发布前做能力探测和低画质实机验证；仅Android版本号不能保证运行。
- macOS：打包目标macOS 11+ universal；运行最低版本未实测。需实际支持WebGL2的系统WKWebView/WebKit，初始macOS 11系统WebKit不保证；Intel与Apple Silicon均须验证GPU、音频解锁与帧时。
- 九键方案与难点：UP: 前进；DOWN: 后退；LEFT: 转向/横移；RIGHT: 转向/横移；A: 喂食；B: 声呐；X: 上浮；Y: 下潜；长按模式菜单选商店/镜头/加速；START: 暂停/菜单；camera: 自动跟随潜艇，按住Y进入镜头模式；商店方向键选物品、A购买、B返回。
- 离线条件：授权后本地Vite bundle；Three.js代码及程序化几何/音频无需服务器。 localStorage映射稳定本地origin，保留定时/暂停/购买存档；不依赖Node运行时。
- 许可/素材条件：需要明确修改/再分发授权或许可证；当前未明确，不能借用Three.js的MIT授权游戏本体。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-26"></a>

### 26. HEXAPOD RISING

**交互或性能适配后封装 · P4 · 建议顺序47**。来源：[固定源码](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-120)；ID：`triptych/web-games-andrew#da778254`。

MIT机甲核心可适配；双摇杆映射不能直接冒充九键，须做锁定/镜头模式与完整菜单。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动；A射击、B导弹、X助推/跳喷模式，Y切瞄准模式让方向转镜头，START暂停。九键不具独立右摇杆，必须锁定/自动回中并实测同时走射；动作页保留救援/升级。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/triptych/web-games-andrew/blob/a7051c34fe2e7550fd206e6272f758df171855b0/LICENSE)

<a id="item-27"></a>

### 27. AMAR.IO

**许可或素材条件待解决 · P3 · 建议顺序55**。来源：[固定源码](https://github.com/onehundredapps/amar.io/tree/a074716cc36f395a2aec1955a9c84784b6d621eb)；ID：`onehundredapps/amar.io#77e4b393`。

主HTML可做数字方向飞行与分裂/喷射/刹车，源码没标准Gamepad不是永久技术障碍。 当前无明确LICENSE；主版多人依赖Trystero/WebRTC；ga2是不同WebGPU实验，不能替换后声称保留同样多人。

- Android：打包目标Android 8+；运行最低版本未实测。需可用的较新Android System WebView、硬件加速与WebGL2/GLES3 GPU，发布前做能力探测和低画质实机验证；仅Android版本号不能保证运行。
- macOS：打包目标macOS 11+ universal；运行最低版本未实测。需实际支持WebGL2的系统WKWebView/WebKit，初始macOS 11系统WebKit不保证；Intel与Apple Silicon均须验证GPU、音频解锁与帧时。
- 九键方案与难点：UP: 俯仰向上；DOWN: 俯仰向下；LEFT: 偏航左转；RIGHT: 偏航右转；A: 分裂；B: 喷射质量；X: 刹车；Y: 后视/重置视角或动作菜单；START: 开始/暂停菜单；camera: 保持自动前进的数字偏航/俯仰；加大自动回中和瞄准提示，名字默认本地生成免键盘。
- 离线条件：获得授权后将主index.html Three.js/CDN依赖本地化。 离线版明确切断Trystero信令路径并保留本地机器人循环；在线版需要信令/STUN等网络条件。 不混用ga2 WebGPU目录，主版采用WebGL渲染路径。
- 许可/素材条件：当前源码未明确授权，需取得修改/再分发许可；Trystero/Three.js许可独立保留。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-28"></a>

### 28. Quasar Saz

**需另宿主或运行路线 · P5 · 建议顺序65**。来源：[固定源码](https://github.com/cleak/quasar-saz/blob/e56e93ea8c72cbe2ff9f1e754eb68f6829e6ae43/game/GameManager.cs#L145)；ID：`cleak/quasar-saz#9cb6ed83`。

Godot 4.6 Mono/C#不在当前WebView宿主内，不能假设C# Web导出可用；采用Godot原生Android/Mac出口可继续，需独立TCP/NSD插件。

- Android：新Godot 4.6 Mono Android出口，匹配Godot官方模板和.NET 9 Android构建条件、ABI及图形后端；不能从现minSdk26推导成功。
- macOS：Godot 4.6 Mono原生Mac导出，C#/.NET依赖随包；确认arm64与x86_64导出/合并、Big Sur兼容部署目标及图形后端，需独立宿主桥。
- 九键方案与难点：方向移动、A射击、B冲刺、X超级攻击，Y升级/武器页，START暂停；Godot Input Map接桥；升级与标题必须全焦点。
- 离线条件：打包Godot导出模板、C#程序集/.NET运行组件和所有.pck内容；不能依赖开发机Godot/系统dotnet。
- 许可/素材条件：运行路线改变也不改变上游许可；先满足以下权利条件再分发任何新平台包。 保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取许可原文件
- 后续路线：新建引擎原生Android/Mac出口和TCP/NSD九键桥，或证明可行的Web导出；保留原规则。此分类不要求一律重写游戏，也不表示永久不能适配。
- 权利证据：[文件1](https://github.com/cleak/quasar-saz/blob/e56e93ea8c72cbe2ff9f1e754eb68f6829e6ae43/LICENSE)

<a id="item-29"></a>

### 29. Pocket Bomber

**需另宿主或运行路线 · P5 · 建议顺序66**。来源：[固定源码](https://github.com/chongdashu/love2d-pocket-bomber-game/blob/1cf66e2fdbbb7f5e81d51703b2155c834ca77b8b/src/explosion.lua#L11)；ID：`chongdashu/love2d-pocket-bomber-game#8c7b09ae`。

LÖVE 11.5/Lua非现Web宿主；可用love-android与Mac引擎导出或另评Web移植；同时README称MIT但未核完整许可文本。

- Android：另建love-android/LÖVE 11.5兼容运行层并接TCP/NSD；或验证Lua→Web构建。实际minSdk/ABI由引擎输出核定。
- macOS：LÖVE 11.5 Mac原生运行层，核arm64/x86_64和mac11部署目标；当前WKWebView不能直接执行Lua。
- 九键方案与难点：方向移动、A炸弹、B返回、X道具/说明、Y关卡页，START暂停；Lua层接原生按键桥及joystick回调，清键不得额外放炸弹。
- 离线条件：原生路线带齐LÖVE/Lua runtime、五关与音效，并审全部第三方库许可。
- 许可/素材条件：运行路线改变也不改变上游许可；先满足以下权利条件再分发任何新平台包。 尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 README写MIT，但根目录与递归树未发现许可原文件，因此保守标未明确。
- 后续路线：新建引擎原生Android/Mac出口和TCP/NSD九键桥，或证明可行的Web导出；保留原规则。此分类不要求一律重写游戏，也不表示永久不能适配。

<a id="item-30"></a>

### 30. Crossy Farm

**许可或素材条件待解决 · P5 · 建议顺序67**。来源：[固定源码](https://github.com/sorrycc/fable-arcade/tree/6ab9de3122600e9c9dbe5daf3e77f7fe9361e335/games/crossy-farm-car)；ID：`sorrycc/fable-arcade#8347516f`。

离散网格过路十分适合四方向；当前无许可，待授权后只需通用菜单/离线适配。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向单步移动；A确认、B返回，X车库、Y设置，START暂停；按下与长按重复节奏分开，避免按一次跨两格。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 固定commit完整源码树没有根LICENSE/COPYING；不能把依赖的MIT或package默认license当作整仓授权。 未明确
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-31"></a>

### 31. Hollowmere

**许可或素材条件待解决 · P5 · 建议顺序68**。来源：[固定源码](https://github.com/sorrycc/fable-arcade/tree/6ab9de3122600e9c9dbe5daf3e77f7fe9361e335/games/terraria-sandbox)；ID：`sorrycc/fable-arcade#7a1d26ba`。

挖放、热栏和拖拽可由虚拟指针和焦点背包承接，需要较大交互改造；当前无许可。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动；A主工具/挖掘，B跳跃，X切工具模式，Y切虚拟指针，START暂停；指针模式方向定位、A放置/拾取、B取消，背包/治疗/抓钩用焦点动作页。需实现完整状态提示及无鼠标拖放。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 固定commit完整源码树没有根LICENSE/COPYING；不能把依赖的MIT或package默认license当作整仓授权。 未明确
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-32"></a>

### 32. Rail Rush

**许可或素材条件待解决 · P5 · 建议顺序69**。来源：[固定源码](https://github.com/sorrycc/fable-arcade/tree/6ab9de3122600e9c9dbe5daf3e77f7fe9361e335/games/subway-runner)；ID：`sorrycc/fable-arcade#25d6f318`。

四方向跑酷与独立悬浮板键适合九键，当前无许可。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：左右换道，上跳下滑；A跳跃，B滑铲，X悬浮板（替代双击），Y商店/说明，START暂停；菜单输入隔离于局内动作。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 固定commit完整源码树没有根LICENSE/COPYING；不能把依赖的MIT或package默认license当作整仓授权。 未明确
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-33"></a>

### 33. World 1-1

**许可或素材条件待解决 · P5 · 建议顺序70**。来源：[固定源码](https://github.com/sorrycc/fable-arcade/tree/6ab9de3122600e9c9dbe5daf3e77f7fe9361e335/games/mario-1-1)；ID：`sorrycc/fable-arcade#39a4a7dd`。

Canvas平台跳跃技术门槛低；无代码许可，且马里奥名称、形象和关卡须独立授权或整体替换受保护表达。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：左右移动、上下场景交互；A跳跃，B跑动/火球，X道具说明，Y重开页，START暂停；按住跳跃高度必须保留。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 固定commit完整源码树没有根LICENSE/COPYING；不能把依赖的MIT或package默认license当作整仓授权。 未明确 Canvas平台跳跃技术门槛低；无代码许可，且马里奥名称、形象和关卡须独立授权或整体替换受保护表达。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-34"></a>

### 34. Jazz Jackrabbit · Opus Edition

**许可或素材条件待解决 · P5 · 建议顺序71**。来源：[固定源码](https://github.com/JuliusBrussee/jazz-jackrabbit-remastered/blob/65fcc519980b3b3bd2f30e312e7336f0f50d5238/index.html#L329)；ID：`juliusbrussee/jazz-jackrabbit-remastered#57c4fbb3`。

原生Gamepad及纯Canvas可封装；未明确代码许可，Jazz Jackrabbit角色/名称/素材归属也不能由粉丝重制推定许可。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动，A跳/悬浮，B射击，X切武器，Y动作/俯冲页，START暂停；保留原Gamepad功能并补所有菜单。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可 原生Gamepad及纯Canvas可封装；未明确代码许可，Jazz Jackrabbit角色/名称/素材归属也不能由粉丝重制推定许可。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-35"></a>

### 35. Neon Siege

**许可或素材条件待解决 · P5 · 建议顺序72**。来源：[固定源码](https://github.com/PromptEngineer48/claude-opus-5.5-games/tree/07b8b5e0d54a0938b03db5d855577acf8e3bcad9/neon-siege)；ID：`promptengineer48/claude-opus-5.5-games#1195f794`。

已有Gamepad减少桥接工作，但竞技场瞄准与盾/冲刺需核九键并降bloom；当前无许可。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动；A射击、B冲刺、X盾、Y切瞄准模式，START暂停；自动瞄准或瞄准模式解决双摇杆需求，武器选择在焦点动作页。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 固定commit完整源码树没有根LICENSE/COPYING；不能把依赖的MIT或package默认license当作整仓授权。 未明确
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-36"></a>

### 36. Sprout Quest

**许可或素材条件待解决 · P5 · 建议顺序73**。来源：[固定源码](https://github.com/aibengineering/sprout-quest/blob/fc5ab9bf0a770fbffc7619932253fb85c30f7270/src/battle/battle.ts#L27)；ID：`aibengineering/sprout-quest#9044a287`。

Canvas主循环可包，横屏/背包/3D预览改造量较大；缺少许可。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动；A攻击/确认、B闪避/返回、X互动、Y背包，START暂停；背包网格/装备/制作需单独焦点状态，竖屏重排到横屏，3D预览提供低档。
- 离线条件：Bun只用于离线构建；精灵、3D预览及字体全打包，不在运行时调用Blender。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-37"></a>

### 37. Wiggle Snakes

**交互或性能适配后封装 · P3 · 建议顺序35**。来源：[固定源码](https://github.com/vreshch/kids-games/tree/ca0c247fbd3308550529239d66740d67ad6519ca/src/components/wiggle-snakes)；ID：`vreshch/kids-games#5e026e94`。

MIT蛇玩法可开展，需把keydown单次角变化改为每帧连续转向并提取Next客户端组件。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：左右持续调蛇头角度、上下辅助方向选择；A加速、B超能力、X说明、Y设置，START暂停；每帧角速度映射，不能仅发送一次keydown造成不连续转向。
- 离线条件：提取Next客户端Canvas组件和规则；不部署服务器，保留原localStorage存档。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/vreshch/kids-games/blob/ca0c247fbd3308550529239d66740d67ad6519ca/LICENSE)

<a id="item-38"></a>

### 38. BUBBLE NEBULA

**可封装候选 · P2 · 建议顺序23**。来源：[固定源码](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-082)；ID：`triptych/web-games-andrew#98e5fbec`。

已有Gamepad和菜单，动作数少；24区/Boss是原有内容，接入不会据此宣称关卡已验。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：左右移动、上下菜单/场景；A跳跃、B吹泡、X说明、Y设置，START暂停；保证泡泡/跳跃连按和跨屏后状态正确。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/triptych/web-games-andrew/blob/a7051c34fe2e7550fd206e6272f758df171855b0/LICENSE)

<a id="item-39"></a>

### 39. PHOSPHOR PATROL

**可封装候选 · P2 · 建议顺序24**。来源：[固定源码](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-070)；ID：`triptych/web-games-andrew#125f127e`。

已有Gamepad及完整移动/射击/炸弹/跃迁动作，九键可覆盖；Three后处理需低档性能验证。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向飞行；A射击、B炸弹、X跃迁、Y说明/设置，START暂停；接送殖民者保留自动碰撞逻辑，电视上区分地面与敌人。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/triptych/web-games-andrew/blob/a7051c34fe2e7550fd206e6272f758df171855b0/LICENSE)

<a id="item-40"></a>

### 40. Popgun Pip

**可封装候选 · P1 · 建议顺序12**。来源：[固定源码](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-042)；ID：`triptych/web-games-andrew#692f0252`。

纯Canvas和原生Gamepad，没有3D或联网门槛；核心跳跃/射击/换武器可直接映射。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动；A跳跃、B射击、X切武器、Y背包/能力页，START暂停；壁跳、跑跳射同按及能力解锁提示须验证。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/triptych/web-games-andrew/blob/a7051c34fe2e7550fd206e6272f758df171855b0/LICENSE)

<a id="item-41"></a>

### 41. Quiverspire

**交互或性能适配后封装 · P3 · 建议顺序36**。来源：[固定源码](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-046)；ID：`triptych/web-games-andrew#bb00f775`。

停下自动射击降低瞄准负担；实际改造重点为升级与永久天赋多层焦点，不能只接移动。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动/停下自动射击；A确认升级、B返回、X天赋、Y说明，START暂停；升级卡焦点、滚动和恢复时清空方向。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/triptych/web-games-andrew/blob/a7051c34fe2e7550fd206e6272f758df171855b0/LICENSE)

<a id="item-42"></a>

### 42. STARBLAZER '86

**可封装候选 · P1 · 建议顺序13**。来源：[固定源码](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-109)；ID：`triptych/web-games-andrew#a5e02554`。

Canvas竖向射击已有手柄，少量动作适合首批低GPU路线；保留禁射奖励关规则与画面比例。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向飞行；A射击、B炸弹、X说明、Y难度/设置，START暂停；禁射奖励关不得由重连残留按键开火，竖向场景保留比例。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/triptych/web-games-andrew/blob/a7051c34fe2e7550fd206e6272f758df171855b0/LICENSE)

<a id="item-43"></a>

### 43. WYRMZONE

**交互或性能适配后封装 · P4 · 建议顺序48**。来源：[固定源码](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-083)；ID：`triptych/web-games-andrew#b509dca0`。

地面/飞行两阶段可用数字方向与辅助镜头；现Gamepad/Pointer Lock不能自动证明九键全覆盖，须专项交互适配。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向地面移动/空中转向；A攻击、B跳跃、X次动作，Y切镜头/瞄准模式，START暂停。地面到飞行切换要可见提示，不强制Pointer Lock；是否需要辅助瞄准须试玩决定。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/triptych/web-games-andrew/blob/a7051c34fe2e7550fd206e6272f758df171855b0/LICENSE)

<a id="item-44"></a>

### 44. GLUP — Nila y el pez gato

**可封装候选 · P1 · 建议顺序14**。来源：[固定源码](https://github.com/gavilanbe/glup/blob/db4bc2cf502b9b53bd06fe65491215ea2324ef82/game.js#L1)；ID：`gavilanbe/glup#d9e925df`。

MIT纯Canvas像素横屏及Gamepad，低复杂度封装候选；回访地图/能力菜单仍需验证。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动；A跳跃、B吸入/吐出、X能力、Y地图/说明，START暂停；菜单/回访地图全焦点，320×180画布整数缩放。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取许可原文件
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/gavilanbe/glup/blob/db4bc2cf502b9b53bd06fe65491215ea2324ef82/LICENSE)

<a id="item-45"></a>

### 45. Mystic Onslaught

**许可或素材条件待解决 · P5 · 建议顺序74**。来源：[固定源码](https://github.com/KAOSN00B/MysticOnslaught/blob/bf63659da929f07ec28e920f14097031726ae512/Mystic%20Onslaught/MysticOnslaughtBeta/TestGame/CombatDirector.cpp#L43)；ID：`kaosn00b/mysticonslaught#7de3d050`。

raylib已有Emscripten路线，WASM可以作为Web宿主适配而非永久排除；硬编码路径、资源尺寸与Web能力需检查，当前无许可。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebAssembly、Emscripten WebGL后端、音频与本地.data载入；线程能力另核；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebAssembly、Emscripten WebGL后端、音频与本地.data载入；线程能力另核；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动；A攻击、B闪避、X技能、Y遗物/升级，START暂停；确认原gamepad各状态覆盖；WASM资源载入与按键取消需桥接。
- 离线条件：冻结Emscripten工具链并重建.js/.wasm/.data，删除开发机绝对路径；若启用线程必须另核跨源隔离/宿主限制。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-46"></a>

### 46. Novaki: Strike Twice

**交互或性能适配后封装 · P3 · 建议顺序37**。来源：[固定源码](https://github.com/novaki-ai/strike-twice/blob/fc97c4d5de409eebf0c36e2417fcf8eb2b04248f/src/game/game.ts#L51)；ID：`novaki-ai/strike-twice#a22c1d67`。

MIT代码+CC BY 4.0美术音频明确，PixiJS已有Gamepad；敌群性能、电视字号和升级焦点需适配。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持PixiJS 8的WebGL渲染后端（不得默认仅选WebGPU）、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持PixiJS 8的WebGL渲染后端（不得默认仅选WebGPU）、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动；ABXY按原动作/升级上下文，START暂停；升级、遗物和职业选择加可见焦点，敌群下保持键边沿不丢失。
- 离线条件：图像/音频/字体全部本地；单列MIT代码与CC BY 4.0资产的作者、链接、修改说明。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取许可原文件
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/novaki-ai/strike-twice/blob/fc97c4d5de409eebf0c36e2417fcf8eb2b04248f/LICENSE)

<a id="item-47"></a>

### 47. Overclocked

**许可或素材条件待解决 · P5 · 建议顺序75**。来源：[固定源码](https://github.com/danjaekim/overclocked/blob/93d47ea512c278d64d117f9d4a150b54563c6ef0/src/game/run.js#L30)；ID：`danjaekim/overclocked#4d3e5b43`。

移动/自动开火可行，程序链重排需专用焦点工作流；当前无许可。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动；A选链条槽/确认，B取消，X拾起/放下卡，Y切构筑模式，START暂停；构筑模式方向在卡与槽之间导航、显式提交重排，保留自动射击。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-48"></a>

### 48. SHOVE

**需另宿主或运行路线 · P5 · 建议顺序76**。来源：[固定源码](https://github.com/robss2020/claude-fable-5-having-fun/blob/00511f846dd57b4c224728c85eace8e377e5b5ec/shove.py#L109)；ID：`robss2020/claude-fable-5-having-fun#821cc616`。

只有Python CLI规则与JSON存档，当前Web宿主不能运行CLI；须新建图形前端并移植/嵌入规则，且未明确许可。

- Android：先实现Android可运行的规则层和Canvas/原生棋盘UI；当前Python CLI无直接Android WebView入口。
- macOS：可另捆Python3和新图形UI，或移植JS统一双平台；当前CLI不是现WKWebView图形游戏。
- 九键方案与难点：方向棋盘游标；A选单位/推，B取消/拉，X查看预告，Y结束回合确认，START暂停。须新建图形棋盘和信息UI；CLI规则不能直接显示为可玩TV网页。
- 离线条件：不能用安装Python来假装Web封装；若移植规则，应将关卡/JSON格式/规则测试一同归档并验证一致性。
- 许可/素材条件：运行路线改变也不改变上游许可；先满足以下权利条件再分发任何新平台包。 尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可
- 后续路线：取得规则代码授权后移植Python规则或构建受支持的规则运行层，并新建图形棋盘与完整焦点UI；不能把CLI当网页打包。

<a id="item-49"></a>

### 49. Emberbrood

**交互或性能适配后封装 · P3 · 建议顺序38**。来源：[固定源码](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-038)；ID：`triptych/web-games-andrew#cf8b626b`。

MIT回合驯龙不依赖精准鼠标；多层繁殖、列表、战斗菜单是完整手柄UI改造任务。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向切焦点；A选择/战斗确认，B返回，X队伍/龙栏，Y排序/信息，START暂停；训练、繁殖、背包、五幕剧情逐层焦点管理并分页。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/triptych/web-games-andrew/blob/a7051c34fe2e7550fd206e6272f758df171855b0/LICENSE)

<a id="item-50"></a>

### 50. OSRS Tower Defense

**许可或素材条件待解决 · P5 · 建议顺序77**。来源：[固定源码](https://github.com/hamilton-junior/osrs-tower-defense/blob/aae04a74b14df039087195dfb906bdfb4f3d7297/lib/game/core/sim/combat.ts#L374)；ID：`hamilton-junior/osrs-tower-defense#a434ec0d`。

棋盘塔防技术上可改网格游标，但未明确代码许可，README又明确精灵/音效来自OSRS缓存；需权利授权或完整素材替换。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向网格游标；A放塔/确认，B取消/卖出页，X塔牌切换，Y祈祷/卡牌页，START暂停；45×20棋盘需缩放/概览模式与可读浮层。
- 离线条件：缓存中提取的OSRS图集/音效不能随MIT依赖一并视作许可；替换为自有/授权资源后才离线打包。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可 棋盘塔防技术上可改网格游标，但未明确代码许可，README又明确精灵/音效来自OSRS缓存；需权利授权或完整素材替换。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-51"></a>

### 51. Ascmearc（原Warlock）

**需另宿主或运行路线 · P5 · 建议顺序78**。来源：[固定源码](https://github.com/jannef/ascmearc/blob/f0a99ccdaf61adf914b030d85bff59ea1baeac1b/crates/ascmearc-core/src/combat.rs#L542)；ID：`jannef/ascmearc#3db49089`。

Rust/Bevy桌面与WASM WebGPU路线不符合现Android8/mac11 WebView能力基线；可做原生Bevy插件或验证WebGL2后端移植，需完整GPL对应源码。

- Android：当前WASM WebGPU不能覆盖Android8 WebView；另建Bevy Android原生出口/网络桥或实证WebGL2后端，最低OS/图形驱动按导出结果确定。
- macOS：当前原生Bevy需核最低Metal/系统要求并构建arm64+x86_64；WebGPU不能保证mac11 WKWebView，须另路线。
- 九键方案与难点：方向移动/菜单；A交互、B取消、X动作轮、Y背包/法术，START暂停；角色命名用焦点键盘，瞄准/方向命令切模式，完整键盘命令不可简单删去。
- 离线条件：原生路线需Rust/Bevy可交叉编译工具链、资产和字形；WASM路线要实际证明WebGL2回退及宿主API。
- 许可/素材条件：运行路线改变也不改变上游许可；先满足以下权利条件再分发任何新平台包。 按GPL-3.0-only提供对应源码、修改说明、构建/安装材料与许可；新桥接/链接组件亦须核兼容性。 已读取许可原文件
- 后续路线：新建引擎原生Android/Mac出口和TCP/NSD九键桥，或证明可行的Web导出；保留原规则。此分类不要求一律重写游戏，也不表示永久不能适配。
- 权利证据：[文件1](https://github.com/jannef/ascmearc/blob/f0a99ccdaf61adf914b030d85bff59ea1baeac1b/LICENSE)

<a id="item-52"></a>

### 52. CARD GAME（LÖVE2D）

**需另宿主或运行路线 · P5 · 建议顺序79**。来源：[固定源码](https://github.com/Corttezz/card-game-love2d/blob/998dbffef8dc3fdd19fb41f21344b2999f7a37d1/src/core/Game.lua#L167)；ID：`corttezz/card-game-love2d#2e759371`。

LÖVE桌面Lua无法直接塞入WebView；原生LÖVE路线和焦点选牌可行，但当前许可未明确。

- Android：另建LÖVE Android运行层/网络桥，或先验证love.js完整兼容；当前不是静态网页。
- macOS：捆绑兼容mac11的LÖVE引擎及Lua代码，核Universal两架构；不能直接复用现WKWebView入口。
- 九键方案与难点：方向选卡；A加入/移出组合、B返回、X查看牌、Y提交/结束回合确认，START暂停；出牌与多选建立明确焦点状态；Lua需原生或经验证的Web运行层。
- 离线条件：原生路线带LÖVE/Lua和全部卡牌/音效；如love.js试验需冻结转换工具并验证完整Lua功能。
- 许可/素材条件：运行路线改变也不改变上游许可；先满足以下权利条件再分发任何新平台包。 尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可
- 后续路线：新建引擎原生Android/Mac出口和TCP/NSD九键桥，或证明可行的Web导出；保留原规则。此分类不要求一律重写游戏，也不表示永久不能适配。

<a id="item-53"></a>

### 53. Dungeon of Opus

**交互或性能适配后封装 · P3 · 建议顺序39**。来源：[固定源码](https://github.com/joozio/dungeon-of-opus/blob/4db3bb30059489c82a2d454c3c4120a7ceb66616/src/App.tsx#L258)；ID：`joozio/dungeon-of-opus#c28203c3`。

MIT React/Vite回合地牢可开展，核心方向简单；背包、装备、食物和文本需焦点化和回合防连发。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动/焦点；A交互，B返回，X背包/装备，Y食物/动作页，START暂停；背包焦点和回合输入边沿防重复，文本重排。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取许可原文件
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/joozio/dungeon-of-opus/blob/4db3bb30059489c82a2d454c3c4120a7ceb66616/LICENSE)

<a id="item-54"></a>

### 54. MAINSPRING

**许可或素材条件待解决 · P5 · 建议顺序80**。来源：[固定源码](https://github.com/Kelevera/mainspring/blob/ec1a45254fc8b892ac151135c01ca932105fe249/src/engine.js#L97)；ID：`kelevera/mainspring#ebe3be6e`。

纯Canvas六角游标技术可行；PolyForm Noncommercial只许可符合条款的非商用用途，现双平台发布用途未确定，先审条件或另获授权，不把它写作MIT。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向六角游标；A选齿轮/安装，B取消/拆卸，X旋转/采购，Y合同/护符页，START暂停；六邻方向使用行列导航加可见目标，不假设四键等于六键。
- 离线条件：源码零运行依赖，明确选择三合同demo或已获许可的完整八合同版本；不把演示限制绕过当移植。
- 许可/素材条件：保留PolyForm Noncommercial完整条款并明确本次使用/分发属于其允许的非商用范围；若不满足则取得另行授权。不是OSI开源许可。 已读取许可原文件
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。
- 条件分支：仅在明确符合PolyForm Noncommercial条款的非商用范围内开展；否则先取得另行授权。
- 权利证据：[文件1](https://github.com/Kelevera/mainspring/blob/ec1a45254fc8b892ac151135c01ca932105fe249/LICENSE.md)

<a id="item-55"></a>

### 55. Plants vs. Zombies（fan remake）

**许可或素材条件待解决 · P5 · 建议顺序81**。来源：[固定源码](https://github.com/dannishen60/plants-vs-zombies/blob/386be0c054e394206237445b0f0e69f4381e6fc6/index.html#L562)；ID：`dannishen60/plants-vs-zombies#1894d30c`。

网格种植适合方向焦点；无代码许可且使用植物大战僵尸品牌/IP，须授权或重新设计受保护表达和素材。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向棋盘/种子焦点；A种植/收阳光，B取消，X切种子栏，Y铲子/商店，START暂停；泳池/屋顶坐标按格选，不能依靠精确鼠标。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可 网格种植适合方向焦点；无代码许可且使用植物大战僵尸品牌/IP，须授权或重新设计受保护表达和素材。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-56"></a>

### 56. Rogue Dawn（原Emblem Rogue）

**许可或素材条件待解决 · P5 · 建议顺序82**。来源：[固定源码](https://github.com/virtu333/rogue-emblem/blob/89d0324697f53bfe85456618de87bfc448d25035/src/engine/Combat.js#L194)；ID：`virtu333/rogue-emblem#64c26b81`。

Phaser网格战术可用焦点导航，云存档可选不必变成离线阻塞；当前无许可。

- Android：Android 8+宿主及可更新System WebView；Phaser 3实际选用的WebGL后端、Canvas/ES modules、Web Audio；若要求低GPU Canvas回退，须先确认本游戏所有效果支持，不能仅凭Phaser支持就保证。
- macOS：macOS 11+ Universal宿主；系统WKWebView须支持Phaser实际WebGL后端与Web Audio，arm64/x86_64分别验证；Matter物理纯JS不需要原生物理插件。
- 九键方案与难点：方向网格；A确认行动、B返回，X单位/装备，Y预测/招募详情，START暂停；战斗预测与分支路线独立焦点和大字分页。
- 离线条件：关闭可选Supabase云同步并保留本地档，或让用户显式配置自有服务；不嵌入共享凭据。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-57"></a>

### 57. The Nine Lives of Ash

**需另宿主或运行路线 · P5 · 建议顺序83**。来源：[固定源码](https://github.com/phirogue/SparkyGames/blob/3b370c0e21522c2fc496295e25e650443a070aac/game/core/combat_state.gd#L372)；ID：`phirogue/sparkygames#de691b38`。

Godot GDScript有原生/特定Web导出可能，但目录目前只证明编辑器运行；需要独立导出、桥接与竖屏重排，且无许可。

- Android：Godot 4 GDScript先完成Android导出模板与渲染兼容档、九键TCP/NSD桥；也可评估兼容渲染器的Web导出，尚无可用构建证据。
- macOS：Godot原生Mac导出或实际验证Web导出，确认mac11、arm64+x86_64、WebGL2/线程限制；编辑器能跑不等于Mac包通过。
- 九键方案与难点：方向选牌/技能；A使用，B取消，X防守，Y撤退确认/信息，START暂停；竖屏卡面横排，Godot规则/UI导出后接原生桥。
- 离线条件：Godot导出资产和字体全部本地；Web导出需单独验证SharedArrayBuffer/跨源隔离及当前项目实际依赖。
- 许可/素材条件：运行路线改变也不改变上游许可；先满足以下权利条件再分发任何新平台包。 尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可
- 后续路线：新建引擎原生Android/Mac出口和TCP/NSD九键桥，或证明可行的Web导出；保留原规则。此分类不要求一律重写游戏，也不表示永久不能适配。

<a id="item-58"></a>

### 58. Toy Box Siege

**许可或素材条件待解决 · P5 · 建议顺序84**。来源：[固定源码](https://github.com/Jaxsbr/toy-box-siege/blob/d47f24190e01d461879b1a1a0c9e1a03fbfe24b9/src/systems/Combat.ts#L39)；ID：`jaxsbr/toy-box-siege#160c1ebf`。

Phaser塔防可通过网格游标适配；缺根许可是当前阻塞。

- Android：Android 8+宿主及可更新System WebView；Phaser 3实际选用的WebGL后端、Canvas/ES modules、Web Audio；若要求低GPU Canvas回退，须先确认本游戏所有效果支持，不能仅凭Phaser支持就保证。
- macOS：macOS 11+ Universal宿主；系统WKWebView须支持Phaser实际WebGL后端与Web Audio，arm64/x86_64分别验证；Matter物理纯JS不需要原生物理插件。
- 九键方案与难点：方向网格；A买/放置，B取消，X切玩具，Y升级/信息，START暂停；放置预览与资金失败反馈必须不依赖鼠标悬停。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-59"></a>

### 59. Munch Maze

**可封装候选 · P2 · 建议顺序25**。来源：[固定源码](https://github.com/vreshch/kids-games/tree/ca0c247fbd3308550529239d66740d67ad6519ca/src/components/munch-maze)；ID：`vreshch/kids-games#0ff26943`。

MIT Canvas掷骰走格已有箭头/Space/Enter，九键方案简单；Next需静态客户端提取。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向走格；A掷骰/确认，B返回，X步数说明，Y关卡页，START暂停；回合结束锁输入，按住方向不能吃掉下一回合。
- 离线条件：提取Next客户端Canvas/规则；保留棋盘/字形/进度，WebAudio只在用户开始后启动。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/vreshch/kids-games/blob/ca0c247fbd3308550529239d66740d67ad6519ca/LICENSE)

<a id="item-60"></a>

### 60. CUE VICE

**交互或性能适配后封装 · P3 · 建议顺序40**。来源：[固定源码](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-077)；ID：`triptych/web-games-andrew#3b7ee714`。

MIT游戏已有Gamepad但主要拖拽；采用瞄角/力度和队员焦点保留物理规则，需证明可精确操作。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向瞄角/调整力度；A蓄力释放，B取消，X切队员，Y能力/镜头模式，START暂停；改拖拽为可见力度条，静止回合与滚动实时阶段输入隔离。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/triptych/web-games-andrew/blob/a7051c34fe2e7550fd206e6272f758df171855b0/LICENSE)

<a id="item-61"></a>

### 61. Sugarplum Drop

**可封装候选 · P1 · 建议顺序15**。来源：[固定源码](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-078)；ID：`triptych/web-games-andrew#02ed201c`。

已有Gamepad菜单/投放，左右+A与少量焦点即可覆盖，Canvas适合首批低GPU路线。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：左右移动投放点；A投放、B返回，X图鉴/说明、Y设置，START暂停；长按不连投、碰撞合成仍由原物理推进。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/triptych/web-games-andrew/blob/a7051c34fe2e7550fd206e6272f758df171855b0/LICENSE)

<a id="item-62"></a>

### 62. Brothers

**交互或性能适配后封装 · P3 · 建议顺序41**。来源：[固定源码](https://github.com/david-a-wheeler/brothers/blob/168296a0b0b829a8f7defef7d4f5f2d590026dac/src/Brothers.js#L415)；ID：`david-a-wheeler/brothers#037b00a0`。

MIT Phaser/Matter弹射规则可保留；拖拽转为瞄角蓄力、镜头模式是适配而非排除理由。

- Android：Android 8+宿主及可更新System WebView；Phaser 3实际选用的WebGL后端、Canvas/ES modules、Web Audio；若要求低GPU Canvas回退，须先确认本游戏所有效果支持，不能仅凭Phaser支持就保证。
- macOS：macOS 11+ Universal宿主；系统WKWebView须支持Phaser实际WebGL后端与Web Audio，arm64/x86_64分别验证；Matter物理纯JS不需要原生物理插件。
- 九键方案与难点：左右瞄角、上下力度；A按住蓄力/释放，B取消，X切兄弟，Y镜头模式，START暂停；镜头模式方向平移、A/B缩放；拖拽用离散选择+力度替代。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取许可原文件
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/david-a-wheeler/brothers/blob/168296a0b0b829a8f7defef7d4f5f2d590026dac/LICENSE.md)

<a id="item-63"></a>

### 63. Chain of Command

**许可或素材条件待解决 · P5 · 建议顺序85**。来源：[固定源码](https://github.com/shainyoreng/chain-of-command/blob/7d4439b6886b33dce7e08c10df5d7b5aec04a5d2/web/js/engine.js#L21)；ID：`shainyoreng/chain-of-command#2c6d9b37`。

静态JS可运行；拖放编排与长文本必须重做焦点和电视布局，当前无许可。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向选协议/路由槽；A放置、B取消，X拾起/移动条目，Y运行/结果页，START暂停；拖放编排改为两步选槽，长文本分页及回看。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-64"></a>

### 64. Moe, Joe & Mr Mews

**许可或素材条件待解决 · P5 · 建议顺序86**。来源：[固定源码](https://github.com/lambsubstitute/three-cats/blob/a94e5cfcb1f4d6b741e2ac15e68d494445902e1e/index.html#L497)；ID：`lambsubstitute/three-cats#ed3be9fb`。

Canvas单HTML可包；等距方向、切猫和拖箱可映射，缺代码许可，且需移除统计外链。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向等距移动；A跳跃、B交互/拖箱，X切猫，Y提示/侧栏，START暂停；图示世界方向，拖拉按住状态可取消，三猫状态可读。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-65"></a>

### 65. protocol play: puzzle

**需另宿主或运行路线 · P5 · 建议顺序87**。来源：[固定源码](https://github.com/jjgarcianorway/protocol-play/blob/784c7091886241ff10c69af2ded5c5576ccc3564/src/simulation.rs#L308)；ID：`jjgarcianorway/protocol-play#1ae7f134`。

原生Rust/Bevy 0.18并非现成Web产物；可新建Android/Mac原生桥或评估WASM WebGL2构建，GPL要求对应源码/修改/构建说明。

- Android：Rust/Bevy 0.18需Android原生导出与输入桥；WASM WebGL2可作新研究路线，当前没有现成Web静态包。
- macOS：Bevy原生Mac出口，核Metal后端及mac11部署目标、arm64+x86_64；若改WASM须重新验证后端能力。
- 九键方案与难点：方向网格；A放砖、B取消/擦除，X旋转、Y背包/模拟切换，START暂停；移动和模拟分模式，颜色之外加图形区分。
- 离线条件：打包Bevy资产/字体和关卡，先完成Android原生或WASM导出PoC；现v0.57二进制不能当0.58源码构建证据。
- 许可/素材条件：运行路线改变也不改变上游许可；先满足以下权利条件再分发任何新平台包。 按GPL-3.0-or-later提供对应源码、修改说明、构建/安装材料与许可；新桥接/链接组件亦须核兼容性。 已读取许可原文件
- 后续路线：新建引擎原生Android/Mac出口和TCP/NSD九键桥，或证明可行的Web导出；保留原规则。此分类不要求一律重写游戏，也不表示永久不能适配。
- 权利证据：[文件1](https://github.com/jjgarcianorway/protocol-play/blob/784c7091886241ff10c69af2ded5c5576ccc3564/LICENSE)

<a id="item-66"></a>

### 66. Pharaoh

**需另宿主或运行路线 · P5 · 建议顺序88**。来源：[固定源码](https://github.com/unclebob/Pharaoh/blob/ecd04272e4a70c19cf600091bdf73a71acd6baa5/src/pharaoh/simulation.clj#L170)；ID：`unclebob/pharaoh#6ec0d058`。

Clojure+Quil/Processing依赖Java桌面，不是当前Android WebView/WKWebView项目；须移植规则/重做图形UI或新运行层，当前重写代码无许可。

- Android：Java11+Clojure/Quil桌面依赖不等于Android Java可运行；需移植图形层/规则到支持的运行环境。
- macOS：可捆Java11+和Clojure/Quil原生桌面应用，核JRE两架构及mac11；如用现宿主需改写为Web。
- 九键方案与难点：方向表格焦点；A进入数值编辑、B取消，X小步增减模式、Y月结确认，START暂停；数字编辑方向改变数位/数值，处理全部鼠标对话框。
- 离线条件：桌面Mac路线可捆绑合适JRE；Android并无相同Java桌面/AWT环境，需重做Quil显示层而非带一个JAR。
- 许可/素材条件：运行路线改变也不改变上游许可；先满足以下权利条件再分发任何新平台包。 尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 递归文件树未找到覆盖该游戏的根LICENSE/COPYING原文件；不因GitHub公开而推定开源许可
- 后续路线：取得当前重写代码许可；Mac可评估捆JRE桌面路线，Android需移植Quil/Processing显示层或改为Web，并验证规则一致。

<a id="item-67"></a>

### 67. CELADON — The Long Ash／陶艺订单工坊

**交互或性能适配后封装 · P4 · 建议顺序49**。来源：[固定源码](https://github.com/winchxyz/celadon/blob/be0342639a28dd92a3ac3169206bede2e18a5116/src/game/game.js)；ID：`winchxyz/celadon#e3e78b55`。

MIT/CC0/OFL范围明确，WebGL2可在能力达标设备尝试；拉坯手势、镜头与烧窑六参数要完整虚拟手/焦点设计，不能把高难交互永久排除。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向选择泥层/笔划；A按住工具，B取消，X循环工具，Y在拉坯/镜头/参数焦点间切换，START暂停；参数页方向选六个烧窑值并调节，手势位移需连续虚拟手。默认辅助拉坯/公会代烧可作选项，不能删去核心工艺。
- 离线条件：three@0.185.1打包；九份CC0录音与Baloo2/Nunito字体/OFL文件一起离线；录音缺失保留合成音回退。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 LICENSE自身明确代码MIT；九份录音CC0 1.0；Baloo2/Nunito字体SIL OFL 1.1，原OFL文件随仓库保存。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/winchxyz/celadon/blob/be0342639a28dd92a3ac3169206bede2e18a5116/LICENSE)、[文件2](https://github.com/winchxyz/celadon/blob/be0342639a28dd92a3ac3169206bede2e18a5116/public/sfx/CREDITS.md)、[文件3](https://github.com/winchxyz/celadon/blob/be0342639a28dd92a3ac3169206bede2e18a5116/public/fonts/CREDITS.md)、[文件4](https://github.com/winchxyz/celadon/blob/be0342639a28dd92a3ac3169206bede2e18a5116/public/fonts/OFL-Baloo2.txt)、[文件5](https://github.com/winchxyz/celadon/blob/be0342639a28dd92a3ac3169206bede2e18a5116/public/fonts/OFL-Nunito.txt)

<a id="item-68"></a>

### 68. Doom & Doilies

**交互或性能适配后封装 · P3 · 建议顺序42**。来源：[固定源码](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-110)；ID：`triptych/web-games-andrew#b595fcd8`。

MIT经营玩法可保留；庞大DOM列表、点击事件和焦点滚动需系统适配，同时核已提交PNG的出处。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向DOM焦点，A操作，B返回，X切经营页，Y详情/排序，START暂停；升级、雇佣、访客与滚动列表均需焦点，不能仅给最上层菜单映射。
- 离线条件：本地化Three/字体并将PNG逐项列来源/哈希；仓库MIT与图片来源需交叉核，不能仅检查JS文件。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 已读取固定commit根LICENSE原文，包含MIT授权条款。 MIT
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/triptych/web-games-andrew/blob/a7051c34fe2e7550fd206e6272f758df171855b0/LICENSE)

<a id="item-69"></a>

### 69. Terrabrowser

**许可或素材条件待解决 · P5 · 建议顺序89**。来源：[固定源码](https://github.com/Wimmboo2/Terrabrowser/blob/471220ee4e09495235ab038243296cd8f79da6bb/src/main.js)；ID：`wimmboo2/terrabrowser#e755899c`。

纯JS/Canvas无第三方运行依赖，技术可移植；1600×600世界内存/照明和全套光标背包工作较大，当前无许可。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向移动；A工具、B跳跃、X工具栏，Y虚拟指针模式，START暂停；指针方向定位挖/放、A确认/B取消，背包拾取/拆堆/地图分别焦点化。热栏十格用循环或页，不把十格塞成十个物理键。
- 离线条件：不依赖CDN；采用稳定本地HTTP origin保存IndexedDB/RLE世界，升级迁移/配额不足提供可见失败反馈。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 当前树未见LICENSE/COPYING；仅源码公开不能视为开源授权。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

<a id="item-70"></a>

### 70. Clawd Collection／放置调试收集

**许可或素材条件待解决 · P5 · 建议顺序90**。来源：[固定源码](https://github.com/tanuu5/clawd-collection/blob/32cf7ef7d75c3a66355cd56d9c3a809187028a48/src/game/gacha.js)；ID：`tanuu5/clawd-collection#7e42ca6d`。

MIT代码可复用，但README排除Clawd角色/名称，直接连原外观发布的权利条件未解决；替换全部相关形象/文案或取得授权后可适配。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向菜单/BUG光标；A点击BUG/确认、B返回，X队伍、Y抽取/图鉴，START暂停；清楚区分模拟代币与外部服务，离线收益沿原规则计算但后台暂停不偷跑实时动作。
- 离线条件：本地字体附OFL，保留原8小时/60%离线收益规则；Clawd例外资源必须替换或获授权。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 README明确Clawd角色/名称属于Anthropic，不在MIT授权范围；非官方粉丝作品。 Clawd名称/角色明确不在MIT内；采用独立原创替代形象并移除全部相关命名/素材，或取得权利人授权，再复评为可适配。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。
- 条件分支：MIT规则代码可先用于替代角色/名称方案；原样带Clawd品牌和角色的发布仍受阻。全部替代资产完成并核验后可升为交互适配候选；不属于永久排除。
- 权利证据：[文件1](https://github.com/tanuu5/clawd-collection/blob/32cf7ef7d75c3a66355cd56d9c3a809187028a48/LICENSE)

<a id="item-71"></a>

### 71. Coin Lagoon／海滩推币

**许可或素材条件待解决 · P5 · 建议顺序91**。来源：[固定源码](https://github.com/tanuu5/coin-lagoon/blob/d01855fcbac44369bfc8e55f4f5f70e8b7c19a09/src/game/machine/Physics.js)；ID：`tanuu5/coin-lagoon#005d90fa`。

方向+A推币技术适合九键；Rapier需设备验证，Clawd奖品/名称不在MIT范围，先授权或替换后再包。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：左右投币位置，上下菜单；A投币、B返回，X图鉴、Y设置，START暂停；按下边沿只落一币，断线取消不产生额外投币；奖品替换后也验证识别。
- 离线条件：本地化Rapier WASM及Mochiy Pop One OFL字体；奖品造型/贴图/名字/说明中的Clawd全部处理。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 README明确Clawd角色/名称属于Anthropic，不在MIT授权范围；非官方粉丝作品。 Rapier Apache-2.0；Google Fonts Mochiy Pop One OFL。 Clawd名称/角色明确不在MIT内；采用独立原创替代形象并移除全部相关命名/素材，或取得权利人授权，再复评为可适配。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。
- 条件分支：MIT规则代码可先用于替代角色/名称方案；原样带Clawd品牌和角色的发布仍受阻。全部替代资产完成并核验后可升为交互适配候选；不属于永久排除。
- 权利证据：[文件1](https://github.com/tanuu5/coin-lagoon/blob/d01855fcbac44369bfc8e55f4f5f70e8b7c19a09/LICENSE)

<a id="item-72"></a>

### 72. Dystopia Meshi／反乌托邦食堂

**交互或性能适配后封装 · P3 · 建议顺序43**。来源：[固定源码](https://github.com/tanuu5/dystopia-meshi/blob/d0e1f5136a80ee8d731ffe82734e0cfc92b519d2/src/Game.ts)；ID：`tanuu5/dystopia-meshi#d1008aca`。

MIT静态配方/对白可离线运行，无AI API；六步菜单和长对白需要完整焦点/分页，不应因点击UI排除。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向在食材/形状/温度/配料/器皿等焦点中移动；A确认、B退一步，X配方库，Y订单/筛选，START暂停；六步向导分页面，长对白和过敏提示保持可读。
- 离线条件：全部recipes/对白/字形离线，Google Fonts下载附OFL或改系统字体；无运行时LLM服务。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/tanuu5/dystopia-meshi/blob/d0e1f5136a80ee8d731ffe82734e0cfc92b519d2/LICENSE)

<a id="item-73"></a>

### 73. Fossil Hori-Hori／化石挖掘

**可封装候选 · P2 · 建议顺序26**。来源：[固定源码](https://github.com/tanuu5/fossil-horihori/blob/337120a4d683a8ce7de080167a78c60797744c54/src/game/Slab.js)；ID：`tanuu5/fossil-horihori#0857f4a6`。

MIT已有方向/蓄力/提取/扫描映射；工具/缩放可用动作页补齐，不需改挖掘规则。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向瞄准；A蓄力挖掘、B取消，X提取、Y扫描，START暂停；工具/缩放用暂停动作页或X修饰+方向（可见模式），不能与提取边沿冲突；取消蓄力不砸下。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/tanuu5/fossil-horihori/blob/337120a4d683a8ce7de080167a78c60797744c54/LICENSE)

<a id="item-74"></a>

### 74. HAKOBI Algorithm／物流工厂

**交互或性能适配后封装 · P4 · 建议顺序50**。来源：[固定源码](https://github.com/tanuu5/hakobi-algorithm/blob/ed6bafcac040db582f188245d92c63a18c7d5fb0/src/game/sim/World.js)；ID：`tanuu5/hakobi-algorithm#80dbc3c9`。

MIT已有grid游标/手柄；多肩键工具、镜头、缩放压入九键需模式设计，但不是硬件不可行。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向网格游标；A放置、B删除/取消，X循环工具、Y旋转，START规划/暂停；镜头/缩放/分析从焦点工具页进入，保留全部肩键功能，错投/配额说明放大。
- 离线条件：Three打包、系统字体无需CDN；生产/机器人/日程数据和localStorage存档一并保留。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/tanuu5/hakobi-algorithm/blob/ed6bafcac040db582f188245d92c63a18c7d5fb0/LICENSE)

<a id="item-75"></a>

### 75. Ice Mori-Mori／冰淇淋堆叠

**可封装候选 · P2 · 建议顺序27**。来源：[固定源码](https://github.com/tanuu5/ice-morimori/blob/075a8ff2fa08bd4019489ef92081ec633d0d2fe5/src/game/Counter.js)；ID：`tanuu5/ice-morimori#ff19ebb0`。

MIT现有ABXY与方向覆盖主要经营动作，补菜单和按住取消即可进入封装路线。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向选择口味/落点；A挖/落、B丢弃、X浇头、Y交付，START暂停；原动作覆盖九键，补笔记/存档菜单；断线按住释放不落球不交付。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；Three/CDN/Google Fonts改同源本地并附各自许可，或使用系统字体。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/tanuu5/ice-morimori/blob/075a8ff2fa08bd4019489ef92081ec633d0d2fe5/LICENSE)

<a id="item-76"></a>

### 76. Signal Dilemma／交通信号两难

**交互或性能适配后封装 · P3 · 建议顺序44**。来源：[固定源码](https://github.com/tanuu5/signal-dilemma/blob/eb26f229e760804980bf93119c3022b5dff46a8c/src/game/Game.js)；ID：`tanuu5/signal-dilemma#0a2046b8`。

MIT路口焦点已有；九键外镜头/速度需焦点模式，五日/九路口可读性及模拟负载需验证。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向选路口；ABXY接原信号/行人选择，START暂停；镜头、减速/快进从暂停页进入可见模式后方向调节，伦理选择与日报焦点化。
- 离线条件：Three打包及系统字体；本地日程/道德选择/存档，不需要外部交通服务。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/tanuu5/signal-dilemma/blob/eb26f229e760804980bf93119c3022b5dff46a8c/LICENSE)

<a id="item-77"></a>

### 77. Water Game／水中套圈

**交互或性能适配后封装 · P3 · 建议顺序45**。来源：[固定源码](https://github.com/tanuu5/water-game/blob/f65f77c5fde76dd2571ed44236d9876f33a46d80/js/main.js)；ID：`tanuu5/water-game#c3328f05`。

MIT双泵/倾斜/摇晃均可用数字键替代传感器；需本地化Three/Rapier与保证流体/刚体性能。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：方向模拟倾斜；A/B左右泵，X摇晃，Y模式/配置，START暂停；替代设备姿态传感器，保留泵按下强脉冲与长按衰减，松开/断线无额外脉冲。
- 离线条件：Three与Rapier JS/WASM从CDN改本地同源；M PLUS Rounded 1c附OFL或系统替代；去除必须传感器授权的路径。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 Rapier Apache-2.0；Google Fonts M PLUS Rounded 1c OFL。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/tanuu5/water-game/blob/f65f77c5fde76dd2571ed44236d9876f33a46d80/LICENSE)

<a id="item-78"></a>

### 78. Ink Arcade（Ink Rail + Ink Dash）

**交互或性能适配后封装 · P4 · 建议顺序51**。来源：[固定源码](https://github.com/tanuu5/ink-arcade/blob/184e8979745582dad2ffb0c0f2199eba8237d876/ink-rail.html)；ID：`tanuu5/ink-arcade#438bed9c`。

MIT两套HTML都可改方向准星/辅助瞄准；Ink Dash有移动+瞄准冲突，需单独模式验收，不能只测Rail就称整项通过。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：Ink Rail方向移动准星，A手动射击/B取消，X自动射击切换，Y难度，START暂停；Ink Dash默认方向移动，Y切瞄准模式并自动射击/辅助瞄准。两个入口都要验证，清单仍按一项记录。
- 离线条件：ink-rail.html与ink-dash.html两个入口以及Three r170模块均本地；共同菜单能切换并独立存档。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/tanuu5/ink-arcade/blob/184e8979745582dad2ffb0c0f2199eba8237d876/LICENSE)

<a id="item-79"></a>

### 79. Clawd 7/8

**许可或素材条件待解决 · P5 · 建议顺序92**。来源：[固定源码](https://github.com/tanuu5/clawd-7-8/blob/f709831538152e5405a8a1fe06ce4c7b97a95402/index.html)；ID：`tanuu5/clawd-7-8#82ae9a54`。

四轨ABXY很适合九键；Clawd角色/名称例外阻塞原样分发，解决后还需端到端音频校准。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL 1/2（保留上游兼容路径）、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL 1/2（保留上游兼容路径）、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：ABXY四轨；方向标题/难度/校准，START暂停；多键同按、长按、Web Audio时钟与TCP输入延迟要校准，品牌角色先授权或替换。
- 离线条件：Three r128本地化；原合成曲不需外部音乐服务，品牌例外资源先替换/授权。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 README明确Clawd角色/名称属于Anthropic，不在MIT授权范围；非官方粉丝作品。 Clawd名称/角色明确不在MIT内；采用独立原创替代形象并移除全部相关命名/素材，或取得权利人授权，再复评为可适配。
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。
- 条件分支：MIT规则代码可先用于替代角色/名称方案；原样带Clawd品牌和角色的发布仍受阻。全部替代资产完成并核验后可升为交互适配候选；不属于永久排除。
- 权利证据：[文件1](https://github.com/tanuu5/clawd-7-8/blob/f709831538152e5405a8a1fe06ce4c7b97a95402/LICENSE)

<a id="item-80"></a>

### 80. Bunbetsu Beat／节奏垃圾分类

**可封装候选 · P2 · 建议顺序28**。来源：[固定源码](https://github.com/tanuu5/bunbetsu-beat/blob/34b714f4fa57d30f649782e51a5515ae5b789d19/js/core/judge.js)；ID：`tanuu5/bunbetsu-beat#7d944ec6`。

MIT四方向分类天然匹配，WebGL2与Web Audio运行要求明确；音游必须验证真实TCP输入和音频延迟。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：四方向直接分类；A确认、B返回、X校准、Y难度/帮助，START暂停；活体需放行，避免菜单方向传播成误判。±60/130ms窗口必须测TCP到音频延迟，不能用浏览器平均帧率代替。
- 离线条件：Three r180及ES modules离线；谱面/合成音按原Web Audio时钟，保存用户延迟设置。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/tanuu5/bunbetsu-beat/blob/34b714f4fa57d30f649782e51a5515ae5b789d19/LICENSE)

<a id="item-81"></a>

### 81. Mehter／奥斯曼军乐节奏

**可封装候选 · P2 · 建议顺序29**。来源：[固定源码](https://github.com/Furkiozknn/mehter/blob/511431e7c8114956c10e4ab7c70ae31073c0fa0f/index.html)；ID：`furkiozknn/mehter#9fe2b636`。

MIT四轨ABXY匹配，已含校准UI；必须保留同按/长音与暂停恢复并本地化素材/字体。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持WebGL2、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持WebGL2、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：ABXY四轨，方向曲目/难度/校准，START暂停；同时按下和持续长音独立保留；±45/110ms窗口需端到端输入/音频偏移设置和暂停音轨恢复。
- 离线条件：Three r170本地；CREDITS区分CC0音效与作者MIT模型，Google Fonts逐文件留许可；不得从演示站临时拉资源。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。 MIT；CREDITS区分CC0第三方资产与作者Blender模型MIT，字体另按Google Fonts许可。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/Furkiozknn/mehter/blob/511431e7c8114956c10e4ab7c70ae31073c0fa0f/LICENSE)、[文件2](https://github.com/Furkiozknn/mehter/blob/511431e7c8114956c10e4ab7c70ae31073c0fa0f/CREDITS.md)

<a id="item-82"></a>

### 82. Blaze Thrust

**可封装候选 · P1 · 建议顺序1**。来源：[固定源码](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/docs/blaze-thrust/main.js)；ID：`abagames/claude-one-button-game-creation#82e48f78`。

MIT单键crisp-game-lib作品，保留上游独立规则“按住火焰上升，借横向气流收集氧气，避免火焰耗尽。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：A接原单键isPressed/isJustPressed/isJustReleased；方向导航帮助/设置，B返回，X重开确认，Y说明，START暂停。连续按住推进、松开恢复；断线必须暂停火焰/氧气耗时。
- 离线条件：固定页面与crisp-game-lib CDN版本，下载完整库/依赖许可证并留哈希；保留本游戏main.js规则/独立入口/声音和像素资源，禁止运行时访问CDN。 本次源码补查依赖版本为crisp-game-lib 1.4.0、sounds-some-sounds 3.1.1及需要时Pixi 5.3.0；BGM/音效还须离线资源清点，不能只打包JS后宣称完全离线。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/LICENSE.txt)

<a id="item-83"></a>

### 83. Echo Bridge

**可封装候选 · P1 · 建议顺序2**。来源：[固定源码](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/docs/echo-bridge/main.js)；ID：`abagames/claude-one-button-game-creation#738207e6`。

MIT单键crisp-game-lib作品，保留上游独立规则“抓准旋转方向搭桥跳岛，平衡建桥材料与回收收益。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：A接原单键isPressed/isJustPressed/isJustReleased；方向导航帮助/设置，B返回，X重开确认，Y说明，START暂停。按下搭桥的方向取同一仿真帧；重开和返回不得额外消耗材料。
- 离线条件：固定页面与crisp-game-lib CDN版本，下载完整库/依赖许可证并留哈希；保留本游戏main.js规则/独立入口/声音和像素资源，禁止运行时访问CDN。 本次源码补查依赖版本为crisp-game-lib 1.4.0、sounds-some-sounds 3.1.1及需要时Pixi 5.3.0；BGM/音效还须离线资源清点，不能只打包JS后宣称完全离线。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/LICENSE.txt)

<a id="item-84"></a>

### 84. Jet Stream

**可封装候选 · P1 · 建议顺序3**。来源：[固定源码](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/docs/jet-stream/main.js)；ID：`abagames/claude-one-button-game-creation#f269db8f`。

MIT单键crisp-game-lib作品，保留上游独立规则“切换三条方向相反的气流航道，穿过风障并保持位置。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：A接原单键isPressed/isJustPressed/isJustReleased；方向导航帮助/设置，B返回，X重开确认，Y说明，START暂停。换航道使用原边沿，不能因重复TCP帧连续切三道。
- 离线条件：固定页面与crisp-game-lib CDN版本，下载完整库/依赖许可证并留哈希；保留本游戏main.js规则/独立入口/声音和像素资源，禁止运行时访问CDN。 本次源码补查依赖版本为crisp-game-lib 1.4.0、sounds-some-sounds 3.1.1及需要时Pixi 5.3.0；BGM/音效还须离线资源清点，不能只打包JS后宣称完全离线。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/LICENSE.txt)

<a id="item-85"></a>

### 85. Kite Master

**可封装候选 · P1 · 建议顺序4**。来源：[固定源码](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/docs/kite-master/main.js)；ID：`abagames/claude-one-button-game-creation#c0fa6422`。

MIT单键crisp-game-lib作品，保留上游独立规则“收放风筝线应对风向与重力，捕捉云朵并防止触地。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：A接原单键isPressed/isJustPressed/isJustReleased；方向导航帮助/设置，B返回，X重开确认，Y说明，START暂停。保留收放绳时长，失焦取消不产生一次人为放线。
- 离线条件：固定页面与crisp-game-lib CDN版本，下载完整库/依赖许可证并留哈希；保留本游戏main.js规则/独立入口/声音和像素资源，禁止运行时访问CDN。 本次源码补查依赖版本为crisp-game-lib 1.4.0、sounds-some-sounds 3.1.1及需要时Pixi 5.3.0；BGM/音效还须离线资源清点，不能只打包JS后宣称完全离线。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/LICENSE.txt)

<a id="item-86"></a>

### 86. Marble Bounce

**可封装候选 · P1 · 建议顺序5**。来源：[固定源码](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/docs/marble-bounce/main.js)；ID：`abagames/claude-one-button-game-creation#d270d3be`。

MIT单键crisp-game-lib作品，保留上游独立规则“点击给弹珠向上冲量，在目标爆炸前撞中目标销。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：A接原单键isPressed/isJustPressed/isJustReleased；方向导航帮助/设置，B返回，X重开确认，Y说明，START暂停。按下产生单次冲量，按住不得每帧弹跳。
- 离线条件：固定页面与crisp-game-lib CDN版本，下载完整库/依赖许可证并留哈希；保留本游戏main.js规则/独立入口/声音和像素资源，禁止运行时访问CDN。 本次源码补查依赖版本为crisp-game-lib 1.4.0、sounds-some-sounds 3.1.1及需要时Pixi 5.3.0；BGM/音效还须离线资源清点，不能只打包JS后宣称完全离线。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/LICENSE.txt)

<a id="item-87"></a>

### 87. Microbial Focus

**可封装候选 · P1 · 建议顺序6**。来源：[固定源码](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/docs/microbial-focus/main.js)；ID：`abagames/claude-one-button-game-creation#2354f7eb`。

MIT单键crisp-game-lib作品，保留上游独立规则“调整显微镜焦深，让不同深度的微生物离场，控制危险增长。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 原theme=shape通过Pixi 5.3.0使用WebGL，须保持原渲染并验证GPU能力。

- Android：Android 8+宿主、可更新System WebView；原theme=shape使用Pixi 5.3.0强制WebGL，须有可用硬件WebGL上下文、Canvas及Web Audio。具体WebGL1/2能力按原库路径实测，不能假定Canvas2D回退。
- macOS：macOS 11+ Universal宿主；WKWebView需支持Pixi 5.3.0所选WebGL上下文和Web Audio，Intel/Apple Silicon分别验证；保留原shape渲染，不宣称纯Canvas2D。
- 九键方案与难点：A接原单键isPressed/isJustPressed/isJustReleased；方向导航帮助/设置，B返回，X重开确认，Y说明，START暂停。焦深变化保留原按住/松开语义，暂停冻结微生物危险计时。
- 离线条件：固定页面与crisp-game-lib CDN版本，下载完整库/依赖许可证并留哈希；保留本游戏main.js规则/独立入口/声音和像素资源，禁止运行时访问CDN。 本项还须完整打包Pixi 5.3.0；保留shape主题，不能以删除原渲染来宣称兼容。 本次源码补查依赖版本为crisp-game-lib 1.4.0、sounds-some-sounds 3.1.1及需要时Pixi 5.3.0；BGM/音效还须离线资源清点，不能只打包JS后宣称完全离线。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/LICENSE.txt)

<a id="item-88"></a>

### 88. Pod Migration

**可封装候选 · P1 · 建议顺序7**。来源：[固定源码](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/docs/pod-migration/main.js)；ID：`abagames/claude-one-button-game-creation#850f94f6`。

MIT单键crisp-game-lib作品，保留上游独立规则“控制领头鲸转向，带领鲸群穿过浮冰，维持队伍与连击。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 原theme=shape通过Pixi 5.3.0使用WebGL，须保持原渲染并验证GPU能力。

- Android：Android 8+宿主、可更新System WebView；原theme=shape使用Pixi 5.3.0强制WebGL，须有可用硬件WebGL上下文、Canvas及Web Audio。具体WebGL1/2能力按原库路径实测，不能假定Canvas2D回退。
- macOS：macOS 11+ Universal宿主；WKWebView需支持Pixi 5.3.0所选WebGL上下文和Web Audio，Intel/Apple Silicon分别验证；保留原shape渲染，不宣称纯Canvas2D。
- 九键方案与难点：A接原单键isPressed/isJustPressed/isJustReleased；方向导航帮助/设置，B返回，X重开确认，Y说明，START暂停。领头鲸转向按原动作时序推进，重连不能自动开局。
- 离线条件：固定页面与crisp-game-lib CDN版本，下载完整库/依赖许可证并留哈希；保留本游戏main.js规则/独立入口/声音和像素资源，禁止运行时访问CDN。 本项还须完整打包Pixi 5.3.0；保留shape主题，不能以删除原渲染来宣称兼容。 本次源码补查依赖版本为crisp-game-lib 1.4.0、sounds-some-sounds 3.1.1及需要时Pixi 5.3.0；BGM/音效还须离线资源清点，不能只打包JS后宣称完全离线。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/LICENSE.txt)

<a id="item-89"></a>

### 89. Pulse Stream

**可封装候选 · P1 · 建议顺序8**。来源：[固定源码](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/docs/pulse-stream/main.js)；ID：`abagames/claude-one-button-game-creation#ab7bc8f4`。

MIT单键crisp-game-lib作品，保留上游独立规则“抓准脉冲时机推回漂流物，防止五条航道中失守三条。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：A接原单键isPressed/isJustPressed/isJustReleased；方向导航帮助/设置，B返回，X重开确认，Y说明，START暂停。脉冲与航道失败倒计时暂停一致；以输入边沿结算。
- 离线条件：固定页面与crisp-game-lib CDN版本，下载完整库/依赖许可证并留哈希；保留本游戏main.js规则/独立入口/声音和像素资源，禁止运行时访问CDN。 本次源码补查依赖版本为crisp-game-lib 1.4.0、sounds-some-sounds 3.1.1及需要时Pixi 5.3.0；BGM/音效还须离线资源清点，不能只打包JS后宣称完全离线。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/LICENSE.txt)

<a id="item-90"></a>

### 90. Rocket Trail

**可封装候选 · P1 · 建议顺序9**。来源：[固定源码](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/docs/rocket-trail/main.js)；ID：`abagames/claude-one-button-game-creation#fd7d7ba3`。

MIT单键crisp-game-lib作品，保留上游独立规则“推进火箭并用尾焰摧毁陨石，追求连续击破倍率。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：A接原单键isPressed/isJustPressed/isJustReleased；方向导航帮助/设置，B返回，X重开确认，Y说明，START暂停。持续推进/尾焰与松开语义保留，暂停冻结倍率计时。
- 离线条件：固定页面与crisp-game-lib CDN版本，下载完整库/依赖许可证并留哈希；保留本游戏main.js规则/独立入口/声音和像素资源，禁止运行时访问CDN。 本次源码补查依赖版本为crisp-game-lib 1.4.0、sounds-some-sounds 3.1.1及需要时Pixi 5.3.0；BGM/音效还须离线资源清点，不能只打包JS后宣称完全离线。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/LICENSE.txt)

<a id="item-91"></a>

### 91. Switchboard

**可封装候选 · P1 · 建议顺序10**。来源：[固定源码](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/docs/switchboard/main.js)；ID：`abagames/claude-one-button-game-creation#0eb861e0`。

MIT单键crisp-game-lib作品，保留上游独立规则“在旋转光标经过插口时按住接线，按请求正确连接电话。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：A接原单键isPressed/isJustPressed/isJustReleased；方向导航帮助/设置，B返回，X重开确认，Y说明，START暂停。按住接线、松开断开沿原规则，断线的取消不当成一次成功接线。
- 离线条件：固定页面与crisp-game-lib CDN版本，下载完整库/依赖许可证并留哈希；保留本游戏main.js规则/独立入口/声音和像素资源，禁止运行时访问CDN。 本次源码补查依赖版本为crisp-game-lib 1.4.0、sounds-some-sounds 3.1.1及需要时Pixi 5.3.0；BGM/音效还须离线资源清点，不能只打包JS后宣称完全离线。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/LICENSE.txt)

<a id="item-92"></a>

### 92. Tectonic Tether

**可封装候选 · P1 · 建议顺序11**。来源：[固定源码](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/docs/tectonic-tether/main.js)；ID：`abagames/claude-one-button-game-creation#6feb7b58`。

MIT单键crisp-game-lib作品，保留上游独立规则“收放绳索蓄力摆荡，撞碎陨石并收集晶石补充能量。”；只需单键桥、电视缩放、暂停/重开与离线依赖，不是把11款合并换皮。 原theme=shape通过Pixi 5.3.0使用WebGL，须保持原渲染并验证GPU能力。

- Android：Android 8+宿主、可更新System WebView；原theme=shape使用Pixi 5.3.0强制WebGL，须有可用硬件WebGL上下文、Canvas及Web Audio。具体WebGL1/2能力按原库路径实测，不能假定Canvas2D回退。
- macOS：macOS 11+ Universal宿主；WKWebView需支持Pixi 5.3.0所选WebGL上下文和Web Audio，Intel/Apple Silicon分别验证；保留原shape渲染，不宣称纯Canvas2D。
- 九键方案与难点：A接原单键isPressed/isJustPressed/isJustReleased；方向导航帮助/设置，B返回，X重开确认，Y说明，START暂停。绳索蓄力/释放严格区分有效松开与取消，断线不得额外发射。
- 离线条件：固定页面与crisp-game-lib CDN版本，下载完整库/依赖许可证并留哈希；保留本游戏main.js规则/独立入口/声音和像素资源，禁止运行时访问CDN。 本项还须完整打包Pixi 5.3.0；保留shape主题，不能以删除原渲染来宣称兼容。 本次源码补查依赖版本为crisp-game-lib 1.4.0、sounds-some-sounds 3.1.1及需要时Pixi 5.3.0；BGM/音效还须离线资源清点，不能只打包JS后宣称完全离线。
- 许可/素材条件：保留上游MIT版权与许可全文，独立保留构建依赖许可；署名Claude参与来源，不宣称pureTV原创游戏。
- 后续路线：完成本项交互/性能方案及公共验收，随后分别构建签名Android与Universal Mac包。
- 权利证据：[文件1](https://github.com/abagames/claude-one-button-game-creation/blob/d81f02a0928b35d9c979e9918aa9dc3c2770821b/LICENSE.txt)

<a id="item-93"></a>

### 93. Flappy Skies

**许可或素材条件待解决 · P5 · 建议顺序93**。来源：[固定源码](https://github.com/sorrycc/fable-arcade/tree/6ab9de3122600e9c9dbe5daf3e77f7fe9361e335/games/flappy-bird)；ID：`sorrycc/fable-arcade#7aaaa736`。

单键Canvas最易技术封装，但完整树无许可，不能因为代码短或公开就当MIT。

- Android：Android 8+（宿主minSdk26）；可更新的System WebView和硬件加速，实际支持Canvas/DOM、ES modules、Web Audio；系统版本本身不保证GPU/驱动或浏览器能力。
- macOS：macOS 11+宿主，arm64/x86_64均要验证；系统WKWebView须实际支持Canvas/DOM、ES modules、Web Audio；早期Big Sur不保证WebGL2，需兼容WebKit更新及GPU，不能把Universal编译当图形兼容。
- 九键方案与难点：A振翅，方向菜单，B返回，X重开确认，Y设置，START暂停；离散按下而非每帧重复，竖屏画布等比例居中。
- 离线条件：按固定提交将入口、模块、关卡、素材及运行库全部打入静态产物；构建工具仅构建时使用，包内不依赖Node/Bun开发服务器。
- 许可/素材条件：尚未核到覆盖此固定源码的明确许可；需取得作者明确的修改/双平台再分发授权或完整许可依据。公开仓库、依赖MIT、README一句MIT都不能自动补齐全部权利。 固定commit完整源码树没有根LICENSE/COPYING；不能把依赖的MIT或package默认license当作整仓授权。 未明确
- 后续路线：取得明确代码/素材许可，或在已获许可代码范围内完成替代资产，再按本项九键与离线方案继续。

## 两平台发布前公共验收

1. 从固定上游commit与锁文件构建并保留全部原许可/素材归属；src/dist哈希冻结，双平台使用相同已验dist。
2. 手机/遥控/原SDK TCP都能操作开始、暂停、帮助、选关、设置、结果、重开与返回；所有九键独立，组合键不能吞键；无鼠标/Pointer Lock必需入口。
3. native输入每动画帧只消费一次；诊断与身份卡读取缓存；63485端口、NSD、真实客户端ID、唯一连接与断线清键符合现协议。
4. 暂停必须冻结实际规则/物理/计时/音频，而非仅盖遮罩；重连需用户显式恢复；取消不是普通松开动作。
5. 断网首次启动、所有关卡/模型/WASM/字体本地载入、稳定本地origin和存档/升级迁移；在线功能明确标示，不能把在线多人称离线可用。
6. 960×540与1280×720实玩及截图目视；检查安全区、文字/控件边界、焦点、滚动、比例，不能用截图存在代替可读性。
7. WebGL/WebGPU/浮点扩展/WASM能力实际探测；低档分辨率、阴影/后处理和实体电视帧时验证，不拿演示作者FPS或视频帧率当设备结果。
8. Android安装后原SDK九键/服务发现/端口占用回退独立验收；Mac arm64/x86_64原生、窗口/背景/音频/输入独立验收；Rosetta或浏览器结果不是Intel实体GPU测试。
9. 音游与时机动作测TCP到游戏判定/音频端到端延迟；提供必要校准；同按、长按和暂停恢复均应实测。
10. 正式固定证书APK、Universal Mac包、哈希/来源/许可/验证记录分别归档；是否签名、公证、公开发布按真实证据记，不从评估状态推导。

本评估不修改catalog、README、商城、发布状态或百款完成计数；实际移植、签名和下载证据由各游戏任务另行记录。

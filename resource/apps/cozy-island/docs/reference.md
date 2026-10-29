# 悠岛生活 TV · Cozy Island TV — 玩法与范围

这是参考《集合啦！动物森友会》的轻松岛屿生活、收集、邻里交往与家园布置，以及圆润卡通 3D 美术方向，独立创作的有限内容小游戏。地图、米拉和皮普两位居民、人物造型、家具、程序生成的三维模型与材质、WebAudio 音乐均为原创。没有使用商业原作代码、ROM、提取模型、图像、音频或角色，也不宣称商业原作内容或体验的完整移植。

This is a small original game inspired by the relaxing collection, neighbor interactions, home decoration and rounded cartoon 3D art direction of Animal Crossing: New Horizons. The island, Mira and Pip, avatars, furniture, procedural three-dimensional models/materials and synthesized soundtrack are original. It does not include the commercial game's code, ROMs, extracted models/artwork/audio or characters, and is not a complete port of that game.

## 首次游玩 / First visit

1. 标题按 SELECT 选单人或双人，START / A 开始。按摇杆屏幕方向行走；靠近蜜桃树、木桩、石头、贝壳按 A 采集。每人背包容量为 24 件。
2. 找广场的米拉交 3 个蜜桃，找海边的皮普交 4 份木材。领取金币与家具后，可以继续下一项任务。
3. SELECT 依次切换空手／钓竿／捕虫网。在东侧木码头附近持钓竿按 A 抛线；等待「咬钩！」再按 A。鱼会先轻轻试探零至两次；提前收线或超过鱼种对应的 0.8–1.2 秒反应窗口会失败，B 可以取消。成功获得一条海鱼，并记录到共享鱼类图鉴。
4. 到商店门前按 A 出售一整种背包物品、购买家具或升级小屋。制作台与 B 背包菜单都可制作家具，缺材料时会提示配方。
5. B → 装饰，选择家具，摇杆移动摆放预览；SELECT 每次旋转 90°，A 放置，B 返回。避开人物、已有物品、建筑入口与海岸。靠近已摆家具，通过「收起附近的装饰」收回背包。地毯可以走过，其他家具会阻挡行走。
6. 小屋门前 A 进入，屋内门垫处 A 出门。完成米拉与皮普的五个心愿、升级小屋并摆好长椅与星光灯后，会获得友谊纪念像；之后仍可继续采集和布置。
7. 寻找花地的粉蝶、北侧林地的甲虫及夜晚南侧的萤火虫。切换捕虫网，按住 A 举网慢走，面向昆虫并靠近后松开 A 挥网。跑近和挥空会惊飞昆虫；追上已惊飞的昆虫也无法捕获。捕获的昆虫按物种进入背包，可到商店出售，B → 昆虫图鉴查看共享记录。

Choose 1P/2P with SELECT on the title screen, then START or A to begin. Use the stick to walk in screen directions and A near resources, neighbors and entrances. B opens your own bag and guide; stick up/down and A navigate every menu. Gather peaches and wood for Mira and Pip, then use the east pier for timed fishing. SELECT cycles hands, rod and bug net. With the rod, A casts, and another A during the species-specific 0.8–1.2-second BITE window catches a fish. Gentle nibbles before that signal do not count as bites. With the net, hold A to walk quietly; face a nearby insect and release A to swing. Running or missing scares wildlife away. Sell stacks at the market, craft or buy furniture, upgrade the shared home, and complete all five requests to earn a friendship keepsake. Furniture placement uses the stick for its preview, SELECT to rotate, A to place and B to return; picking up nearby furniture requires bag space.

START 暂停／继续；手动暂停时 SELECT 切换音乐。B 背包中的音乐项与电视侧栏按钮也可开关。清空小岛需进入 B → 重置小岛，再明确选择「确认清空所有玩家的存档」；默认选择保留。

START pauses/resumes. SELECT toggles music while manually paused; the bag and sidebar also have music controls. Reset requires opening the reset menu and explicitly choosing to erase the island; its default choice keeps the save.

## 内容与经济 / Content and economy

- 一座固定小岛、一个共享房屋内部、商店、制作台、两位原创居民。支持 WebGL 1 时使用真实三维近景；旧电视可回退到原有整岛 Canvas 兼容画面。
- 五种可记录的鱼：银沙丁鱼、海鲈鱼全天；珊瑚蝶鱼 06:00–18:00；星点鳐 18:00–06:00；月光鱼 21:00–04:00。B → 鱼类图鉴可查看捕获次数、最大尺寸及出没时间，首次发现每种奖励 10 金币。两人共享图鉴，同一种首次奖励只发放一次；背包满时不能捕获或登记。背包、出售和居民交付仍统一按海鱼计数。
- 三种真实场景昆虫：西侧花地粉蝶 06:00–18:00、北侧林地翠叶甲虫全天、南侧晚星萤火虫 18:00–06:00。昆虫会在各自栖息地缓慢移动；快步靠近 1.65 格内会惊飞，举网后以正常 32% 速度移动可安全接近。松 A 挥网捕获面前约 99° 扇形、0.15–1.45 格范围内最近的一只，挥空会惊动 2 格内的昆虫。惊飞后 30 秒、捕获后 45 秒重新出现；出没时间仍须符合昼夜窗口。背包满时不捕获、不登记也不消耗昆虫。
- 昆虫共享实体和图鉴，两人同一帧争捕只会成功一次。每种首次发现奖励共享 10 金币，重复捕获只增加图鉴计数；粉蝶／甲虫／萤火虫每只可分别出售 14／18／22 金币。举网、挥网、惊飞和夜间发光都有画面反馈。打开背包、切换工具或进入断线／手动暂停会取消举网，恢复时不会自动挥网。
- 蜜桃、木材、石材、贝壳和海鱼五种物资；长椅、星光灯、花草盆、地毯四种可购买／制作的家具，以及最终任务的纪念像。岛屿与屋内合计最多摆放 60 件。
- 三棵蜜桃树、三个木桩、三块石头、三个贝壳点。采集后 90 秒恢复；两人同时采集同一点只会成功一次。
- 五个有限任务：3 蜜桃；4 木材；2 海鱼；3 贝壳加 4 石材；完成前置任务、一级房屋升级并放好长椅和灯。奖励依次为 30、35、60、80、120 金币，部分任务另送家具。任务只能交付一次。
- 两次房屋升级：100 金币 + 8 木材 + 6 石材；220 金币 + 12 木材 + 10 石材。升级改变屋顶／旗帜和最终屋内地板，并满足庆典目标；首版房屋内部面积固定。
- 日夜由模拟时钟变化，24 分钟为一个昼夜，不与当地真实日期绑定。再次打开时最多补算 8 小时离线时间用于时钟与资源恢复；没有离线惩罚或债务。

The finite release contains one island, a shared home interior, market, workbench, two residents, five gathering resources, three sellable insect species, four craftable/buyable furniture types and one reward keepsake. Resource nodes regrow after 90 seconds. Five one-time requests and two home upgrades give a complete progression, with continued decorating afterward. Home upgrades change visual details and satisfy the celebration goal; the interior footprint stays fixed. A simulated day lasts 24 minutes. Offline clock/resource recovery is capped at eight hours, without penalties. Five fish species have day/night availability, distinct reaction windows and recorded sizes. Three visible wildlife habitats host a daytime butterfly, an all-day beetle and a nighttime firefly. Fast approaches within 1.65 tiles startle insects; holding the net slows walking to 32%. Releasing A catches the nearest calm insect 0.15–1.45 tiles ahead within a roughly 99-degree cone. Misses startle wildlife within two tiles. Fled insects return after 30 seconds, catches after 45 seconds, subject to their active hours. The shared journals persist discoveries and catch counts, with a one-time 10-coin reward for each species; fish additionally record largest size. Wildlife positions and respawn timers reset on a fresh visit, while inventories, journals and island time persist. There are no seasons, museum building/donations, hundreds of villagers/items, terrain editing, online travel, real-calendar festivals or commercial-game story/content parity.

## 双人、保存和显示 / Cooperation, saving and display

两人可以同时移动、采集、钓鱼和操作各自菜单。背包、工具、消息和菜单分别归属玩家；金币、鱼类图鉴、已交任务、家具摆设和房屋升级共享。所有经济操作按同一模拟步骤顺序检查并立即保存，不能通过同时购买超支或重复领取奖励。共享摆设可以由任一玩家收起到自己的背包。物品菜单不会取消另一人的菜单。

三维画面采用人物附近的生活视角，人物明显大于原先整岛总览中的图标。镜头跟随人物平滑移动；方位保持固定，摇杆的屏幕方向含义不变。两人在同一地点且相近时共享近景，距离拉开或分别在屋内、屋外时自动左右分屏，镜头不会限制另一人的移动；重新靠近后恢复共享视角。分屏切换有距离缓冲，避免在边界反复跳动。屋内使用有厚度木地板、可见背墙和窗帘的开放前墙视图，房间人物与家具仍共享。建筑和树冠挡住近处人物时减淡遮挡，屋后合法位置仍可辨认人物。这里没有远程联网或分岛模式。

The 3D camera follows residents at a nearby life-simulation scale, with a fixed azimuth that preserves screen-relative stick directions. Nearby residents share a view; distance or different indoor/outdoor locations switches to independent left/right views, with hysteresis when rejoining. Neither camera restricts movement. The shared interior has a cutaway front, solid floorboards, walls and curtains. Nearby obstructing tree crowns/buildings fade so residents remain readable behind them. The legacy compatible renderer retains its whole-island view and room insets.

正常显示由本地 Three.js r124 在明确创建的 WebGL 1 上渲染：圆润的人物头部与躯干、摆动四肢、实体树冠／树干／果实、带厚度屋顶与窗框的建筑、海岸／码头、家具、鱼竿浮标和捕虫网均为三维场景对象，环境光、方向光与阴影作用于其表面。材质区分草地、沙滩、木材、衣服和海水；昼夜改变光照、海色及窗灯。离屏 WebGL 画布在同帧合成到现有高分辨率电视画布，菜单和提示继续使用清晰的二维字体。不是将一张概念图、截图或平面插画当作场景背景。

无 WebGL 或图形上下文丢失时，保留可玩的 Canvas 回退，并明确显示「兼容画面 / Compatibility display」；上下文成功恢复后返回三维画面。离开页面释放几何体、贴图、材质与上下文。小花瓣用较低细分，近处人物头和树冠保留圆润轮廓；静态家具模板和所有已摆家具按材质合并，不为每一片花瓣单独提交绘制。更换摆放预览复用几何体，替换场景批次释放旧批次。

The local Three.js r124 renderer explicitly requests WebGL 1. Rounded residents, articulated limbs, trees and fruit, roof/window volumes, coast/pier, furniture, bobbers and nets are actual lit 3D objects. A same-frame offscreen WebGL composite keeps the existing readable Canvas menus and HUD at the display resolution. Unavailable/lost graphics contexts show a labeled playable Canvas fallback; successful context restoration returns to 3D. Geometry, materials, textures and the context are released on exit. Small petals use fewer segments, and furniture is batched by material without requiring instancing extensions. This is a compact original scene, not the commercial game's model/animation library, terrain editor, rolling-world projection, full lighting system or content catalog.

Native `CozyIslandHost` supplies the language, room information, controller snapshots and state publication. `CozyIslandTV` exposes `key`, `updateRoom`, `suspend`, `game` and `renderer`. Published state stays below 4,096 bytes, with both joined participants marked active. Each player has separate inventory, tool, messages and menus; coins, the fish journal, resident progress, placed furniture and home upgrades are shared. A participant disconnect pauses simulation, reconnecting resumes automatic pause, and manual pause persists. Each player's controls remain independent, including when one is indoors and the other is outside.

存档位于固定应用来源 `https://cozy-island.invalid` 的本地 DOM 存储，包含版本化数据、个人背包、位置、共享经济、鱼类／昆虫图鉴和装饰。旧存档缺少昆虫图鉴字段时，仅补空图鉴，已有鱼类图鉴、金币、昼夜时钟和背包照常保留；损坏的图鉴记录按存档损坏处理。交易立即写入，位置每秒保存；暂停、隐藏和页面退出时补存。数据结构损坏时恢复新岛并显示提示；存储写入失败会在电视显示提示。更换设备、卸载应用或确认重置会失去本机存档，没有云同步。

Saves use versioned localStorage on the stable native origin. Economic transactions save immediately; positions save every second and on suspension/hide/exit. Corrupt schema restores a fresh island with a notice. Storage errors are shown onscreen. There is no cloud save or cross-device migration. Audio requires an interaction, can be disabled, and releases its context on exit. The game uses ES2017-compatible JavaScript and local assets without external network dependencies.

## 验证与边界 / Validation and limitations

`tests/game-model.test.cjs` covers transaction rollback, simultaneous resource and wallet contention, five requests and two upgrades, fishing timing, placement/rotation/pickup/collision, full bags, save corruption/reload, reset confirmation, independent menus, real joystick movement and pause semantics. Economy and doorway tests explicitly seed only the state needed for an isolated rule; they do not prove full acquisition or traversal.

捕虫回归另外覆盖真实摇杆快走惊飞和举网潜行、松键捕获、朝向与距离判定、背包容量、昼夜窗口、两人争捕、重复奖励防护、暂停取消、图鉴与物种背包保存和旧档兼容。`tests/runtime-input.mjs` 通过实际页面验证原生退出确认暂停、隐藏和失焦入口取消举网，恢复时即使收到旧手势的松键也不会挥网或增加存档奖励；始终按住的旧手势也必须先释放后重新按下。该回归已接入兼容测试入口。测试中的定位与时间夹具仅用于隔离规则，不代表整段人类游玩路线。

独立审查另完成了从新档出发、仅以 `step()` 摇杆与按键输入的完整路径：真实行走和采集、两次钓鱼、五项任务、屋内摆放纪念像、两次房屋升级和保存重载。该审查没有直接设置背包、金币或人物位置，使用几何寻路规划输入，完成用了约 447 秒模拟时间；它证明模型路径可达与规则可完成，不代表人类游玩时长或电视实机体验。

Browser tests exercise the actual packaged page with a simulated native room bridge, two separate phone pages, responsive TV layouts, menus, movement, fishing/crafting/placement fixtures, real page reload persistence, independent player status during renderer failure, suspension and cleanup. Chromium screenshots are actual Canvas rendering; they are not photographs of a TV. Browser fixture tests seed selected economic states to reach rare conditions and do not claim a full browser playthrough. Physical Android TV, hardware remote, and real-phone/LAN gameplay remain separate device checks.

`tests/rendering.mjs` 另外验证真实 WebGL 1 绘制调用、近景人物比例、实际按键行走和镜头跟随、同屏／分屏及室内切换、家具摆放预览、屋后遮挡、昼夜画面、上下文丢失／恢复、无 WebGL 启动及页面退出清理；还以 60 个花盆及反复切换预览检查绘制量与几何／贴图复用。测试截图来自实际浏览器三维渲染，家具和位置夹具仅用于隔离视觉状态，不代表完整采集路线。CI 使用 SwiftShader 软件 WebGL，能验证渲染与生命周期，不代表低端 Android TV 的 GPU 帧率；真实电视性能和不同机型驱动仍需实机验证。

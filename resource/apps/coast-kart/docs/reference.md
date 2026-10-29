# 海岸卡丁车 TV：实现范围 / Coast Kart TV scope

## 原创项目 / An original game

本项目依据用户选择，独立实现现代卡丁车游戏的核心玩法。Mario Kart 8 Deluxe 是类型与体验的参考，不是本项目名称、源码、画面、地图或音乐的来源。本项目不加载 ROM、不模拟 Switch，不包含商业游戏的角色、赛道、模型、纹理、音频或提取数据，也不声称完整移植、准确复刻其画面或全部规则。

Coast Kart TV is an independent implementation of modern kart-racing mechanics. Mario Kart 8 Deluxe informed the requested genre, not the game's source code or assets. This game does not emulate Switch, load ROMs, or reproduce the commercial game's characters, courses, models, textures, audio, full rules or visual fidelity. All four courses, vector karts, scenery, interface and synthesized score were created for this project.

## 当前源码内容 / Current source features

- **四条原创赛道 / Four original circuits:** 晴海环线 Sunshore Circuit、松林远征 Pinewood Run、赤岩峡谷 Redrock Rally、星港夜航 Neon Harbor。每条赛道拥有不同长度、宽度、弯道顺序、坡度与环境配色及景物，模型为确定性数据。
- **快速比赛 / Quick race:** 三圈。单人加六位 AI，或双人同时分屏加六位 AI。两位人类车手均冲线后显示赛果；其余尚未冲线的 AI 按前进距离排名。
- **四站锦标赛 / Grand Tour:** 按海岸、森林、峡谷、夜港顺序进行四场比赛。名次积分为 15、12、10、8、6、4、2、1；每站累计，四站后显示总榜。最终积分相同的车手保持车手列表顺序。保存人类车手最高锦标赛积分。
- **计时挑战 / Time trial:** 明确限制一人，无 AI、道具与分屏；三圈完成后保存该赛道最佳总时间与最佳单圈。
- **竞速 / Racing:** 自动加速、左右转向、刹车与倒车、路外减速、车辆轻碰撞、越界返回赛道、三圈计时与名次。弯道产生外甩力，需要主动转向。
- **漂移 / Drift:** 有速度且转向时按住 B 积蓄漂移。达到 0.65／1.6／2.4 秒后松开，分别获得 0.85／1.65／2.35 秒冲刺，火花由蓝转金再转紫。最高蓄力 3 秒。刹车、离开路面或撞击会中断蓄力。Three charge tiers at 0.65, 1.6 and 2.4 seconds award progressively longer boosts; braking, leaving the road or getting hit cancels charge, including on the release frame.
- **尾流 / Slipstream:** 在路面以足够速度，保持在行驶前车后方 45–220 距离单位、同车道范围内 1.2 秒，获得 1.15 秒冲刺，冷却 2.4 秒。偏离车道会失去蓄力；倒车、静止或已冲线车辆不会产生有效尾流。Both human and AI racers can charge a slipstream boost, including across the start/finish line. A visible gauge shows charge and activation.
- **四种道具 / Four items:** 冲刺 Boost 提升速度；护盾 Shield 持续五秒并抵挡一次命中；路障 Trap 默认留在身后，也可向前抛出后落地；脉冲 Pulse 可沿当前车道向前或向后发射。加速和护盾按下 A 立即生效；路障与脉冲按住 A 拖在车后，松开 A 投掷，持有时摇杆向上选前、向下选后，回中保留所选方向。向下仍会刹车，需要权衡瞄准与速度。道具箱位于四组固定补给点，拾取后短暂冷却；计时挑战没有道具。
- **持物攻防 / Held-item combat:** 拖在车后的路障或脉冲可以抵消一次从后方追上的脉冲，两件道具同时消耗。它不能挡正面攻击或地面路障；车辆实际被击中会丢掉拖曳道具，护盾仍可优先抵挡车身命中。松手只投掷一次，持物可以与 B 漂移同时使用。暂停、手机掉线会收回拖曳道具但保留背包，恢复后必须重新按住 A 才能再投掷，避免暂停期间松手造成恢复后误发射。
- **竞速策略 / Race strategy:** 道具抽取按名次偏向：前排更多路障与护盾，后排更多加速与脉冲，中段四种均匀。所有抽取使用可重复的比赛随机序列；不是按圈数固定轮换，也不会直接修改排名或传送落后车手。AI 观察同车道前后对手，使用相同持物、瞄准、投掷和拦截规则。
- **攻击反馈 / Combat feedback:** 电视显示车后拖曳道具、投掷方向、后方脉冲预警、拦截闪光和音效；手机显示防御/来袭状态，并在支持震动的浏览器提供短震动提示。碰撞按一帧内双方相对轨迹的首次接触计算，覆盖高速对向投射物及跨越起终点线；先接触的车辆或拖曳物先处理。
- **本地记录 / Local records:** 按赛道保存普通赛最佳三圈时间、计时挑战最佳三圈时间、跨模式最佳单圈，及最高锦标赛积分、音乐开关。当前比赛、位置、锦标赛进度不跨退出保存。

Boost and shield activate immediately on A. Holding A with a trap or pulse trails it behind the kart; releasing throws once. Stick up/down selects forward/backward, and neutral retains that choice. A forward trap lands after a short flight, while a pulse travels in the chosen direction. Down still applies braking. A trailing item absorbs one pursuing pulse and is consumed with it; it does not block frontal attacks or road traps. Holding A works alongside B drifting. Pause/disconnect retracts the held item into inventory and cancels the armed throw, so releasing while suspended cannot fire on resume.

Item draws favor defense for leaders and speed/attacks for chasers, without changing positions or bypassing checkpoints. AI use the same guard/aim/release rules and react to nearby rivals and incoming attacks. The TV supplies projected held items, directional instructions, rear-attack warnings and interception feedback; compatible phones also vibrate on a new rear threat. Relative swept collision tests select the earliest impact and handle the finish-line seam. Time trials remain free of combat.

## 操作 / Controls

| 输入 / Input                   | 行为 / Action                                                                                                                |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 摇杆左右 / Stick left-right    | 标题选赛道；比赛转向 / Choose circuit at title; steer while racing                                                           |
| 摇杆上下 / Stick up-down       | 标题选模式；比赛向下刹车至倒车 / Choose mode at title; down brakes and then reverses                                         |
| A                              | 加速/护盾按下生效；路障/脉冲按住防御、松开投掷，↑↓选前后 / Press for boost/shield; hold trap/pulse to guard, release to throw, stick ↑↓ aims                                                                                                          |
| B                              | 按住漂移，松开冲刺 / Hold to drift, release to boost                                                                         |
| START                          | 开始、暂停、继续、重赛、下一站或查看总成绩 / Start, pause, resume, replay, next circuit or final standings                   |
| SELECT                         | 标题切换单人双人；暂停切换音乐；赛果返回标题 / Toggle 1P/2P at title; toggle music when paused; return to title from results |
| 电视音乐按钮 / TV music button | 随时切换音乐 / Toggle music                                                                                                  |

标题选择双人后需要两部手柄均已连接才能开始。计时模式只允许 1P；在此模式选择双人会切回快速比赛。两人比赛使用左右分屏，两位车手从同一时间轴同时驾驶。已加入车手断线会自动暂停；全部重新连接后自动恢复。手动暂停不会因重连而解除。

Two connected controllers are required to start 2P. Time trial is solo; selecting 2P changes it to quick race. Both players race concurrently on a shared simulation, in side-by-side views. A joined controller disconnect pauses the race automatically; reconnecting all participants resumes that automatic pause. Manual pause survives disconnect/reconnect.

键盘调试 / Keyboard: arrows steer/menu; Z or space uses item; X holds drift; P is START; Shift is SELECT. Enter starts from title/results and uses an item while racing. Keyboard operates 1P. The Android shell maps remote Start/Select buttons through the same API.

## 渲染与兼容 / Rendering and compatibility

Canvas 2D 使用 960×540 逻辑画布，透视投影绘制道路、坡度、景物及矢量车辆；双人各使用半屏。画面为平滑风格的 2.5D 透视公路，不是像素画，也不是完整 3D 赛道网格。无需 WebGL、GPU 扩展、外部字体、CDN、网络素材或动态资源下载。自行绘制圆角路径，避免依赖较新 Canvas API。

The 960×540 Canvas 2D renderer projects road segments, hills, scenery and original vector karts. Each player receives half of the view in 2P. This is smooth perspective 2.5D road rendering, not a full 3D course mesh. It requires no WebGL, external font, CDN or downloaded assets. Rounded paths are drawn without newer Canvas methods. Room state updates and startup failure diagnostics run independently of rendering. Page exit cancels RAF, room polling and audio; visibility/native suspension pauses gameplay.

音乐与音效使用 Web Audio 本地合成，浏览器可能要求首次按键后才能播放。Chrome 61 级别的语法与 API 用于旧电视 WebView。二维码房间、手机控制器、Android 生命周期由本应用原生外壳提供。

Original music and effects are synthesized with Web Audio after an input gesture permits playback. The implementation targets Chrome 61-era syntax and APIs. Native Android code owns the QR room, controller network and lifecycle.

## 与商业参考作的差异 / Deliberate differences

本作没有商业参考作的反重力、滑翔、水下路段、复杂车辆改装、大量角色、授权赛道、线上联机、完整物理碰撞网格、战斗模式与赛事内容。AI 使用相同加速、转向、路外与道具规则，以确定性赛道观察来控制方向。道路模型限制前后行驶加横向移动；无法离开赛道自由探索或做真实三维跳跃。脉冲是可前后发射的直线车道投射物，不自动追踪目标或碰墙反弹。只有一个道具栏，拖曳防御只挡后方脉冲；没有双道具栏、硬币养成、空中/水下道具行为或商业参考作的全部道具库。当前版本重点是四条可完成赛道、双人同时竞速、漂移与道具、计时与积分。

This version omits antigravity, gliding, underwater sections, extensive customization, licensed characters/courses, online play, full mesh collision physics and battle modes. AI drive using the same acceleration, steering, off-road and item rules. The road model combines signed distance with lateral movement; it is not free-roaming three-dimensional vehicle simulation. Pulse items move forward or backward in their launch lane and neither home nor bounce off walls. There is one item slot, and held-item defense only intercepts rear pulses. Dual item slots, coin progression, airborne/underwater interactions and the commercial reference’s full item roster remain outside this implementation. The intended scope is four completable original circuits, simultaneous local racing, drift boosts, items, timing and championship points.

## 验证 / Verification

运行 `node --test resource/apps/coast-kart/tests/*.test.cjs`。新增 `tests/combat.test.cjs` 覆盖持物与前后投掷、跨线拦截、正面命中、高速先后顺序、双人同时漂移防御、暂停/断线取消、名次抽取分布、AI 和计时模式隔离；`tests/combat.mjs` 通过两张真实手机页面验证 A/B 与摇杆输入贯通模型，未写入截图。原有测试包含：四赛道正常方向输入跑完三圈、全部 AI 前进、双人并行、断线与手动暂停、倒车无效计圈、检查点顺序、漂移冲刺、道具箱冷却、四种道具效果、路外减速与返回、冲线顺序、四站积分、计时记录和模型状态大小。

Full-course tests observe bend/position and send steering inputs through `step`; they do not set distance, gates or lap counts to finish a race. Targeted tests explicitly use controlled fixtures for a skipped/reverse checkpoint, drift on a straight, off-road position, item-box crossing, held-button item activation, projectile impact and two racers approaching the final gate. Such fixtures validate individual rules, not an assertion that an entire race was played naturally. The complete championship and all four circuit-completion tests use actual physics and normal inputs.

浏览器与真实旧 Chromium 兼容验证另见项目测试脚本。浏览器截图使用模拟原生房间桥接，不代表 Android 电视或手机实机验证。

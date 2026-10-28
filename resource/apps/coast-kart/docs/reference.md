# 海岸卡丁车 TV：实现范围 / Coast Kart TV scope

## 原创项目 / An original game

本项目依据用户选择，独立实现现代卡丁车游戏的核心玩法。Mario Kart 8 Deluxe 是类型与体验的参考，不是本项目名称、源码、画面、地图或音乐的来源。本项目不加载 ROM、不模拟 Switch，不包含商业游戏的角色、赛道、模型、纹理、音频或提取数据，也不声称完整移植、准确复刻其画面或全部规则。

Coast Kart TV is an independent implementation of modern kart-racing mechanics. Mario Kart 8 Deluxe informed the requested genre, not the game's source code or assets. This game does not emulate Switch, load ROMs, or reproduce the commercial game's characters, courses, models, textures, audio, full rules or visual fidelity. All four courses, vector karts, scenery, interface and synthesized score were created for this project.

## 首版内容 / Version 0.1.0

- **四条原创赛道 / Four original circuits:** 晴海环线 Sunshore Circuit、松林远征 Pinewood Run、赤岩峡谷 Redrock Rally、星港夜航 Neon Harbor。每条赛道拥有不同长度、宽度、弯道顺序、坡度与环境配色及景物，模型为确定性数据。
- **快速比赛 / Quick race:** 三圈。单人加六位 AI，或双人同时分屏加六位 AI。两位人类车手均冲线后显示赛果；其余尚未冲线的 AI 按前进距离排名。
- **四站锦标赛 / Grand Tour:** 按海岸、森林、峡谷、夜港顺序进行四场比赛。名次积分为 15、12、10、8、6、4、2、1；每站累计，四站后显示总榜。最终积分相同的车手保持车手列表顺序。保存人类车手最高锦标赛积分。
- **计时挑战 / Time trial:** 明确限制一人，无 AI、道具与分屏；三圈完成后保存该赛道最佳总时间与最佳单圈。
- **竞速 / Racing:** 自动加速、左右转向、刹车与倒车、路外减速、车辆轻碰撞、越界返回赛道、三圈计时与名次。弯道产生外甩力，需要主动转向。
- **漂移 / Drift:** 有速度且转向时按住 B 积蓄漂移。超过 0.65 秒松开，获得短冲刺；超过 1.6 秒获得更强冲刺。最高蓄力 2.5 秒。刹车、离开路面或撞击会中断蓄力。
- **四种道具 / Four items:** 冲刺 Boost 提升速度；护盾 Shield 持续五秒并抵挡一次命中；路障 Trap 留在身后；脉冲 Pulse 沿当前横向车道向前飞行。道具碰撞造成短暂减速与打滑。道具箱位于四组固定补给点，拾取后短暂冷却；计时挑战没有道具。
- **本地记录 / Local records:** 按赛道保存普通赛最佳三圈时间、计时挑战最佳三圈时间、跨模式最佳单圈，及最高锦标赛积分、音乐开关。当前比赛、位置、锦标赛进度不跨退出保存。

## 操作 / Controls

| 输入 / Input                   | 行为 / Action                                                                                                                |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 摇杆左右 / Stick left-right    | 标题选赛道；比赛转向 / Choose circuit at title; steer while racing                                                           |
| 摇杆上下 / Stick up-down       | 标题选模式；比赛向下刹车至倒车 / Choose mode at title; down brakes and then reverses                                         |
| A                              | 使用道具 / Use item                                                                                                          |
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

本作没有商业参考作的反重力、滑翔、水下路段、复杂车辆改装、大量角色、授权赛道、线上联机、完整物理碰撞网格、战斗模式与赛事内容。AI 使用相同加速、转向、路外与道具规则，以确定性赛道观察来控制方向。道路模型限制前后行驶加横向移动；无法离开赛道自由探索或做真实三维跳跃。脉冲是直线车道投射物，不自动追踪目标。当前版本重点是四条可完成赛道、双人同时竞速、漂移与道具、计时与积分。

This version omits antigravity, gliding, underwater sections, extensive customization, licensed characters/courses, online play, full mesh collision physics and battle modes. AI drive using the same acceleration, steering, off-road and item rules. The road model combines signed distance with lateral movement; it is not free-roaming three-dimensional vehicle simulation. Pulse items move forward in their launch lane and do not home. The intended scope is four completable original circuits, simultaneous local racing, drift boosts, items, timing and championship points.

## 验证 / Verification

运行 `node --test resource/apps/coast-kart/tests/*.test.cjs`。测试包含：四赛道正常方向输入跑完三圈、全部 AI 前进、双人并行、断线与手动暂停、倒车无效计圈、检查点顺序、漂移冲刺、道具箱冷却、四种道具效果、路外减速与返回、冲线顺序、四站积分、计时记录和模型状态大小。

Full-course tests observe bend/position and send steering inputs through `step`; they do not set distance, gates or lap counts to finish a race. Targeted tests explicitly use controlled fixtures for a skipped/reverse checkpoint, drift on a straight, off-road position, item-box crossing, held-button item activation, projectile impact and two racers approaching the final gate. Such fixtures validate individual rules, not an assertion that an entire race was played naturally. The complete championship and all four circuit-completion tests use actual physics and normal inputs.

浏览器与真实旧 Chromium 兼容验证另见项目测试脚本。浏览器截图使用模拟原生房间桥接，不代表 Android 电视或手机实机验证。

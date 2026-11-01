# 制作说明 / Production notes

## 参考范围

本作参考经典《孤胆枪手》所代表的斜俯视异形射击玩法：工业设施中的密集敌群、持续射击、掉落补给、武器升级、破坏性爆炸与任务推进。它是 pureTV 的独立实现，使用新地图、角色、材质与音效；不是商业原作的移植，也不包含原作关卡、贴图、音乐、录音、ROM 或可执行程序。

首版提供三段有独立布局的战役，每关有三个顺序控制台目标与可开启的通道，完成战斗后前往出口。两次关间补给、最终首领与失败重开构成完整循环。与原作相比，本版内容规模、物理和敌人行为更简化；采用单人行动，提供手机盲操作区域和辅助瞄准。

## 角色与移动动作参考

0.1.2 的角色研究使用 [Steam 上的原版 Alien Shooter 商品页](https://store.steampowered.com/app/33100/Alien_Shooter/)（App 33100，Sigma Team 开发/发行）的官方截图和“Gameplay video”宣传实机视频。观察了商店中的人物全身像、普通战斗跑姿，以及视频约 8–10、22、98、115 秒附近的连续动作帧。Sigma 旧链接目前会导向较新的 Alien Shooter World，因此没有把该新作的形象混作原版依据。

原版画面可见人物的深色上衣、露出的手臂、蓝灰长裤、短发裸头和较修长的比例；持枪移动时，上躯相对稳定，双腿交替屈伸。绿色基础异形较低伏，头背细长、四肢呈爪状；较大的黄橙色异形抬高前躯，以后腿承重，前爪和长尾构成明显轮廓。这些观察用于改进本作的原创低模和关节动作，替换之前相近的圆壳六足造型。

本作五类怪物仍对应自己的战斗规则，并不宣称与原版敌种一一对应。公开的小尺寸精灵和压缩视频不足以确定原版完整骨架、所有敌种的腿数或精确步频。研究资料仅用于观察，未把官方截图、视频帧或提取的商业素材打入 APK；项目内的模型、关节参数和材质仍为独立制作。

## 本地素材与依赖

| 内容 | 来源 |
| --- | --- |
| 地图与任务 | `world.js` 中为本项目编写的关卡布局 |
| 规则、寻路与战斗 | `game-model.js` 中独立实现的确定性模拟 |
| 三维角色、环境与纹理 | `renderer.js` 中构造的几何、关节动画和本地烘焙材质，制作脚本见 `tools/bake-materials.mjs`，无在线素材请求 |
| 音效与工业环境声 | `audio.js` 中合成的振荡器、滤波噪声与包络，无采样录音 |
| 图标与 Android 横幅 | 本项目绘制的矢量图形 |
| 三维库 | 仓库已有 Three.js 的本地副本，许可证见 `src/main/assets/THREE-LICENSE.txt` |
| 局域网房间 | 沿用并适配 pureTV 游戏的原生 HTTP/WebSocket 房间协议 |

游戏只需要电视与手机之间的局域网通信，不使用公网游戏服务器或 CDN。扫码手柄不使用陀螺仪，无需安装局域网 HTTPS 证书。

## 操作与暂停

移动采用屏幕相对坐标，左右不会随镜头旋转颠倒。右侧三分之一按上下分为两个大动作区：上半区持续射击和拖动瞄准，下半区单次手雷。没有拖动瞄准输入时，游戏辅助选择视线内目标；墙体会阻挡射线与弹丸。

进入后台、手柄断线、图形上下文丢失会暂停战斗。重新连接或恢复图形后必须明确按 START 继续。取消手势和连接恢复携带的旧按键会被释放或抑制，避免误投手雷。系统退出确认与游戏内暂停、补给、结算界面均使用虚化背景。原生应用在按 Home 切出或确认退出时结束当前战役并关闭房间，不保留后台游戏进程。

## 性能与验证边界

静态环境合批，重复角色部位实例化，动态实体与效果限制数量；绘制分辨率受上限约束。`renderer.stats` 提供当前 draw calls、三角形数与帧数用于自动检查。浏览器软件渲染测得的调用量不能代表电视真实帧率。

浏览器集成检查使用真实打包页面与 WebGL，但使用模拟的原生房间桥接；场景展示截图可以设置明确的测试状态。模型单元测试覆盖游戏规则，原生测试覆盖房间/生命周期。未经电视与手机实机测量，不声称已验证设备帧率、操作时延或所有 Android WebView 兼容性。

## English

This is an independent pureTV implementation inspired by classic industrial-base alien shooters. It uses original maps, geometry, procedural textures and synthesized sound, with no extracted commercial game assets. It provides three mission sectors, sequential objectives, two supply stops, a final guardian, failure/restart and a single-player campaign controlled by one phone.

Version 0.1.2 studies the original game's [official Steam screenshots and gameplay trailer](https://store.steampowered.com/app/33100/Alien_Shooter/) for the lightly dressed human silhouette, stable two-handed aiming, alternating steps, low crouched creatures, and taller hind-leg-supported aliens with claw arms and tails. Relevant trailer observations are around 8–10, 22, 98 and 115 seconds. Our five gameplay classes are original adaptations, not claims of a one-to-one match to the original enemy catalog. No reference images, video frames or extracted rigs are bundled.

Rendering and audio are fully bundled and do not request external assets. The phone controller uses local HTTP/WebSocket communication and does not require gyroscope access or installation of an HTTPS certificate. Movement stays aligned with screen directions; firing supports drag aiming and line-of-sight assistance.

Browser captures use the actual game page and a simulated Android room. Showcase scenes may use explicit test state. Unit tests and software-rendered browser checks do not establish physical-TV performance or real-phone latency.

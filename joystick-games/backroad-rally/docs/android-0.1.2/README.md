# Backroad Rally 0.1.2 Android TV 画面验证

使用公开的 0.1.2 签名 APK，SHA-256 为 `67f61471e0e23e9ea963475425d5c43fa9d3265167f9028bd55dc319494fbe3c`。在 API 36 的 1080p Android TV 模拟器中，通过原 pureTV TCP SDK 操作十个菜单步骤进入芬兰快速赛段。原始记录包含 116 条已接收并确认的 SDK 消息，赛段进入 running，赛车位于 x=54 米。[签名包](https://github.com/ecojust/pureTV/releases/download/joystick-racing-nine-test-20261120/backroad-rally-0.1.2.apk) · [输入和状态记录](https://github.com/ecojust/pureTV/blob/8c7377e6737fe9ce62d5707e324ef2508f6d7851/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/report.json)

## swiftshader_indirect 后端

WebGL2 报告设备为 Android Emulator OpenGL ES Translator (Google SwiftShader)。原游戏 HUD 报告 post off、low 55%，绘制缓冲区降为 528 × 297。默认 framebuffer 状态完整，上下文仍在运行，抗锯齿已开启。[原设备与实际画质记录](https://github.com/ecojust/pureTV/blob/8c7377e6737fe9ce62d5707e324ef2508f6d7851/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/original-stage-running-capabilities.json)

在渲染帧从 326 前进到 327 时，独立测试程序将游戏 canvas 缩采样至 160 × 90。14,400 个样本的 alpha 全为零。在 1920 × 1080 的 Android 系统截图中，中央 960 × 540 的 518,400 个像素全部是画布 CSS 底色 RGB(27,25,22)，屏幕边缘可见计时、速度和手柄连接界面。此次未通过赛道与车辆的画面检查。[系统截图](https://github.com/ecojust/pureTV/blob/8c7377e6737fe9ce62d5707e324ef2508f6d7851/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/original-stage-running.png) · [画布日志](https://github.com/ecojust/pureTV/blob/8c7377e6737fe9ce62d5707e324ef2508f6d7851/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/final-console.json) · [采样脚本](https://github.com/ecojust/pureTV/blob/81d5fddba2c69744847e9cf72be5a4bf501786a8/joystick-games/qa/android/graphics-observer/graphics.js)

另一次双端口完整复验在模拟器启动后首次 ADB 解锁按键时退出，未进入游戏安装步骤。[运行记录](https://github.com/ecojust/pureTV/actions/runs/44687697371/job/136128292001) · [该次留存的原始工件](https://github.com/ecojust/pureTV/tree/222326071f9563a5674423be20db73a5760efd6a/artifact/backroad-rally)

## lavapipe 启动配置与 ANGLE/Vulkan

安装相同 0.1.2 APK，将同一版 Android TV 模拟器的启动参数改为 `-gpu lavapipe`。游戏的 WebGL2 设备名实际报告为 Android Emulator OpenGL ES Translator / ANGLE / Vulkan 1.2.0 / SwiftShader Device (Subzero)。通过十个原 SDK 菜单步骤启动芬兰赛段。系统原图中，白色赛车位于起跑门前，土路、护栏、观众和房车可见。[系统截图](https://github.com/ecojust/pureTV/blob/18600af5d01945f397666e720421469b23567c03/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/original-stage-running.png) · [设备信息](https://github.com/ecojust/pureTV/blob/18600af5d01945f397666e720421469b23567c03/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/original-stage-running-capabilities.json)

第 267 至 268 帧之间，共享原游戏画布的 160 × 90 缩采样得到 14,400 个不透明像素和 4,931 种颜色。直接读取 WebGL 默认帧缓冲的中央 96 × 54 区域，5,184 个像素均不透明，包含 935 种颜色。截图时速度为 0 km/h，软件模拟器的原 HUD 当时报告约 1 fps、967 ms 帧时。本次诊断覆盖到发车，后续的加速、转向和端口占用场景由完整手柄验收记录。[画布和帧缓冲记录](https://github.com/ecojust/pureTV/blob/18600af5d01945f397666e720421469b23567c03/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/report.json) · [测试脚本](https://github.com/ecojust/pureTV/blob/57e5c9c/joystick-games/qa/android/graphics-observer/graphics.js)

## 原生手柄加速

另一次独立模拟器启动使用相同签名包、ANGLE/Vulkan 后端和原 SDK。按住上方向键后，游戏状态记录车速从接近零升到 7.38 km/h，x 从 54.00 移至 54.45 米。后续 Android 系统截图显示 9 km/h、计时 2.733 秒，白色赛车、土路、起跑门、观众和房车均可见。368 条 SDK 消息全部获得确认。此次默认帧缓冲采得 919 种颜色，整画布采样为 4,957 种颜色。[驾驶截图](https://github.com/ecojust/pureTV/blob/2bd09dd52f3f5346d7c4d8ce155c7a6c8a6f10fb/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/original-stage-accelerated.png) · [SDK 指令、速度、位置与颜色记录](https://github.com/ecojust/pureTV/blob/2bd09dd52f3f5346d7c4d8ce155c7a6c8a6f10fb/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/report.json)

## 扩展手柄流程与菜单响应

完整流程还经过设置、生涯、车库和涂装。720p ANGLE/Vulkan 模拟器中，按原菜单选择 Low 后保留默认渲染分辨率。正常端口完成 28 项、486 条输入均获确认。打开车库后，8.48 秒时已观察到涂装焦点与松键，10.59 秒获得下一帧，同一观察服务随后连续三次 GET 超时。端口占用回退完成 19 项、312 条输入均获确认，画质菜单在 4.1 秒已响应方向键，等待松键观察时超时。两次都停留在菜单，未完成完整驾驶验收。同期系统日志记录游戏主线程分别跳过 1,345 和 1,012 帧。[默认端口原报告](https://github.com/ecojust/pureTV/blob/2e58f27be6eea5b6ed8cdfd229115ee384d91793/evidence/joystick-android-runtime-backroad-rally/backroad-rally-normal/report.json) · [端口回退原报告](https://github.com/ecojust/pureTV/blob/2e58f27be6eea5b6ed8cdfd229115ee384d91793/evidence/joystick-android-runtime-backroad-rally/backroad-rally-occupied/report.json) · [系统日志、录屏及原始指令](https://github.com/ecojust/pureTV/tree/2e58f27be6eea5b6ed8cdfd229115ee384d91793/evidence/joystick-android-runtime-backroad-rally)

1080p、同一签名包和设置的正常端口完成 22 项、383 个 ACK。返回设置成功后，发下一键前等待独立观察超时。端口占用回退完成 35 项、953 个 ACK，已实际按 A 启动芬兰赛段。菜单页面的最后一个已知输入轮询计数为 579，新文档的轮询重新从 17 增加至 245。此步骤在原 240 秒内读了 183 次快照，所存样本未出现所需的 running/ready 组合。独立的同包驾驶实测采用 720 秒上限进入赛段并实际加速。跨页面比较须以新赛段 URL、同一手柄会话和新文档内后续轮询确认。[默认端口原报告](https://github.com/ecojust/pureTV/blob/7a34dd76f47364fde5c38524f4ba6a0bee4589d3/evidence/joystick-android-runtime-backroad-rally/backroad-rally-normal/report.json) · [端口回退原报告](https://github.com/ecojust/pureTV/blob/7a34dd76f47364fde5c38524f4ba6a0bee4589d3/evidence/joystick-android-runtime-backroad-rally/backroad-rally-occupied/report.json) · [独立加速记录](https://github.com/ecojust/pureTV/blob/2bd09dd52f3f5346d7c4d8ce155c7a6c8a6f10fb/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/report.json)

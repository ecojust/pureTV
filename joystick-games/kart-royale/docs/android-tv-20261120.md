# Kart Royale 的 Android TV 运行记录（2026-11-20）

这些检查针对 Android TV 模拟器，使用实际签名 APK、配套只读 Observer 和 pureTV TCP SDK。每个运行的普通模式使用 63485 端口，占用模式验证端口回退。

| 版本与运行 | 普通模式 | 默认端口已占用 |
| --- | --- | --- |
| [0.1.0 原包 / 44679330171](https://github.com/ecojust/pureTV/actions/runs/44679330171) | WebGL2 已启动。在 “drawing the hud” 阶段保留的最后快照为 0 帧，随后观察连接中断，初始菜单超时。 | 等待 ADB 设备 45 秒后超时。 |
| [0.1.1 原构建 / 44680268953](https://github.com/ecojust/pureTV/actions/runs/44680268953) | 构建、签名和输入验证通过。在 “tuning the engines” 阶段保留的最后快照为 0 帧，随后观察连接中断，初始菜单超时。 | 等待 ADB 设备 45 秒后超时。 |
| [0.1.1 原包，guest lavapipe / 44681943317](https://github.com/ecojust/pureTV/actions/runs/44681943317) | 端口 63485。150 秒时最后快照为 “tuning the engines”，0 帧。 | 端口回退至 33457。150 秒时最后快照为 “balancing the frame”，0 帧。 |

0.1.0 使用已审阅的三个菜单 QA 文件以及首次签名的 APK。61 次宿主采样记录到模拟器进程消失，未取得退出状态；前后内核记录都未报告 OOM 或模拟器故障，无法据此判定退出原因。[原包和签名记录](https://github.com/ecojust/pureTV/tree/5fe9ceda41c134619c613ac352ac8f22ed5d96bb/packages/kart-royale) · [两个模式的原始报告与采样](https://github.com/ecojust/pureTV/tree/b40f9e7009fdba9531ef80a1f9b297e7640cf70d/evidence/joystick-android-runtime-kart-royale)

0.1.1（versionCode 2）在明确识别出软件渲染器时默认使用原有 Low 画质。包名为 `com.ecojust.joystick.kartroyale`，大小 1,221,895 字节，SHA256 为 `ad971bba4d30383dfca7c5ea7c50e4b5b9e3d176a0b80af7d6855b1f15fdd117`。完整下载后复核了固定证书、包内十项资源哈希以及五项游戏 dist 文件的原始字节。正常端口及占用端口的报告均绑定同一 APK。[冻结源码](https://github.com/ecojust/pureTV/commit/9dff011992528e61506607b918776a1c99de49d6) · [签名收据](https://github.com/ecojust/pureTV/blob/b97e3c3dd6dbd8a679f29bbf71836749aa45a001/packages/kart-royale/signing-receipt.json) · [原始运行报告](https://github.com/ecojust/pureTV/tree/b97e3c3dd6dbd8a679f29bbf71836749aa45a001/reports/joystick-android-report-runtime-kart-royale)

首次 Mesa 对照通过原产物来源验证，随后在模拟器参数回归检查失败，未启动 AVD。第二次对照分别断言 Pon 的原参数和 Kart Royale 的 Mesa 参数，使用同一份签名 APK。电视镜像为 API 36、x86_64，模拟器为 37.3.10（16970787），内存 3072 MiB。[首次对照](https://github.com/ecojust/pureTV/actions/runs/44681216593) · [第二次对照](https://github.com/ecojust/pureTV/actions/runs/44681943317)

0.1.1 的 guest lavapipe 对照在两个模式都保留了 ADB、真实目标进程和 Android 日志，GLES 后端实际为 SwANGLE / SwiftShader 5。两份日志均记录了 Chromium 的瓦片内存限额告警。另一次 Xvfb / host 对照让模拟器选择了 Mesa llvmpipe，但独立 WebView 探针在启动游戏前退出，包含 ColorBuffer 绑定失败日志。这次没有取得游戏画面或控制器结果。[guest 原始证据](https://github.com/ecojust/pureTV/tree/1babbdb955046dc6f9c4cf4f8fc1539137901431/evidence/joystick-android-runtime-kart-royale) · [host 对照](https://github.com/ecojust/pureTV/actions/runs/44682838889)

## 0.1.2 的软件渲染启动与驾驶

0.1.2（versionCode 3）在确认为软件 GPU 且画质为 Low 时，直接把原场景渲染到画布，按镜头实际需要编译材质。其余设备沿用先前的画质选择。真实 WebGL2 上下文现在直接报告驱动名称。冻结包构建与签名均通过。[源码](https://github.com/ecojust/pureTV/commit/620fa8829d0b273ebcb6ec1539b97461c283c45c) · [签名和原生检查](https://github.com/ecojust/pureTV/actions/runs/44684303462)

该 APK 大小 1,221,895 字节，SHA256 为 `5bf29aa9b13c66f2520e1ac9cdfbaf5d6f371582bec34d18df6db67b295ec294`。完整下载后复核了签名收据、十项资源及五项 dist 的冻结字节。默认模拟器的普通模式在端口 63485 报告驱动为 Android Emulator OpenGL ES Translator (Google SwiftShader)，Low、WebGL2、“balancing the frame”与 0 帧，随后初始菜单超时。占用模式等待 ADB 设备 45 秒超时。[原始 APK](https://raw.githubusercontent.com/ecojust/pureTV/89b8e5d9c97cc123009b1642674d55751946701c/packages/kart-royale/kart-royale-0.1.2.apk) · [签名收据](https://github.com/ecojust/pureTV/blob/89b8e5d9c97cc123009b1642674d55751946701c/packages/kart-royale/signing-receipt.json) · [双模式原始报告](https://github.com/ecojust/pureTV/tree/89b8e5d9c97cc123009b1642674d55751946701c/reports/joystick-android-report-runtime-kart-royale)

在共享双核配额的 Linux x86_64 环境，用 Chromium 156、ANGLE / Mesa llvmpipe（LLVM 19.1.7、OpenGL ES 3.2）、960 × 540 视口检查了该渲染改动。此轮网页构建的渲染逻辑与冻结包相同，当时尚未加入最终的只读驱动名字段。首次观察到原游戏帧需 191 秒，第 2 帧在 199 秒显示 Start，第 8 帧在 213 秒报告就绪。在该环境中启动需要三分钟以上。用原游戏输入打开角色选择并开始比赛，第 18 帧进入倒计时，第 106 帧进入 racing，按住加速键后第 109 帧速度达到 1.49，坐标改变。标题和比赛截图均可辨认赛道和车辆。这些时间包含同机其他任务负载。该轮为桌面浏览器测量，Android TV 的原生结果使用下方独立任务。[实测标题和加速画面](software-renderer-20261120.jpg)

另用相同浏览器和视口对冻结的 0.1.2 bundle 做了冷启动 CPU 采样，10 毫秒采样一次，同时记录原页面的启动文字。该轮采样窗口为 315.46 秒。文字切换之间包含浏览器调度和系统初始化，CPU 栈时长还包含同步等待图形驱动的时间。

| 冻结版本的阶段 | 本次观察 |
| --- | --- |
| 天空与环境光 | “raising the sun” 到 “mixing materials” 用时 3.21 秒。天空环境生成时首次使用 WebGL 程序的栈约 1.97 秒。 |
| 赛道与场景装饰 | “laying the circuit” 到 “dressing the bay” 用时 11.85 秒；后者到 “rolling out the grid” 用时 35.81 秒。装饰阶段包含建筑、看台、植被与程序化纹理。 |
| 原场景首批画面 | 95.94 秒时启动文字已显示 “ready”。在实际绘制的调用链中，three.js 的 WebGLProgram.onFirstUse 约占 190.38 秒，包含查询程序状态、Uniforms 和 Attributes。窗口结束前已观察到第 3 帧、标题页与 Start 焦点。 |

解压后可在 Chrome DevTools 的 Performance 面板载入原始 CPU 采样。环境含两核 CPU 配额及并发任务，采样本身也产生开销。[CPU 采样文件](software-startup-0.1.2.cpuprofile.gz)

在 0.1.2 的两次原生对照中，观察器只在游戏标识、软件驱动、WebGL2 和控制器端口均可核实时续等，且必须看到原启动步骤或原倒计时帧增加。每一段总上限为 300 秒，验收仍需真实渲染和相同的 SDK 操作。两次均输入原签名产物 14606610194。[host Mesa](https://github.com/ecojust/pureTV/actions/runs/44685089257) · [guest lavapipe](https://github.com/ecojust/pureTV/actions/runs/44685153445)

首次 host 对照在启动 AVD 前停于监督器的测试项，测试 ELF 在采样前退出。重试让同一真实测试进程等到监督器写出其 exec 身份才退出，保留原身份和退出码断言。测试项已本地通过 22/22。[首次运行的原始记录](https://github.com/ecojust/pureTV/tree/4254b8bba985beaa6acfb6cdad4c3d68396f3ef9/evidence/joystick-android-runtime-kart-royale) · [host 游戏运行重试](https://github.com/ecojust/pureTV/actions/runs/44685883221)

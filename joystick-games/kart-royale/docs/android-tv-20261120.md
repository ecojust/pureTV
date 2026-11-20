# Kart Royale 的 Android TV 运行记录（2026-11-20）

这些检查针对 Android TV 模拟器，使用实际签名 APK、配套只读 Observer 和 pureTV TCP SDK。每个运行的普通模式使用 63485 端口，占用模式验证端口回退。

| 版本与运行 | 普通模式 | 默认端口已占用 |
| --- | --- | --- |
| [0.1.0 原包 / 44679330171](https://github.com/ecojust/pureTV/actions/runs/44679330171) | WebGL2 已启动。在 “drawing the hud” 阶段保留的最后快照为 0 帧，随后观察连接中断，初始菜单超时。 | 等待 ADB 设备 45 秒后超时。 |
| [0.1.1 原构建 / 44680268953](https://github.com/ecojust/pureTV/actions/runs/44680268953) | 构建、签名和输入验证通过。在 “tuning the engines” 阶段保留的最后快照为 0 帧，随后观察连接中断，初始菜单超时。 | 等待 ADB 设备 45 秒后超时。 |

0.1.0 使用已审阅的三个菜单 QA 文件以及首次签名的 APK。61 次宿主采样记录到模拟器进程消失，未取得退出状态；前后内核记录都未报告 OOM 或模拟器故障，无法据此判定退出原因。[原包和签名记录](https://github.com/ecojust/pureTV/tree/5fe9ceda41c134619c613ac352ac8f22ed5d96bb/packages/kart-royale) · [两个模式的原始报告与采样](https://github.com/ecojust/pureTV/tree/b40f9e7009fdba9531ef80a1f9b297e7640cf70d/evidence/joystick-android-runtime-kart-royale)

0.1.1（versionCode 2）在明确识别出软件渲染器时默认使用原有 Low 画质。包名为 `com.ecojust.joystick.kartroyale`，大小 1,221,895 字节，SHA256 为 `ad971bba4d30383dfca7c5ea7c50e4b5b9e3d176a0b80af7d6855b1f15fdd117`。完整下载后复核了固定证书、包内十项资源哈希以及五项游戏 dist 文件的原始字节。正常端口及占用端口的报告均绑定同一 APK。[冻结源码](https://github.com/ecojust/pureTV/commit/9dff011992528e61506607b918776a1c99de49d6) · [签名收据](https://github.com/ecojust/pureTV/blob/b97e3c3dd6dbd8a679f29bbf71836749aa45a001/packages/kart-royale/signing-receipt.json) · [原始运行报告](https://github.com/ecojust/pureTV/tree/b97e3c3dd6dbd8a679f29bbf71836749aa45a001/reports/joystick-android-report-runtime-kart-royale)

首次 Mesa 对照通过原产物来源验证，随后在模拟器参数回归检查失败，未启动 AVD。第二次对照分别断言 Pon 的原参数和 Kart Royale 的 Mesa 参数，使用同一份签名 APK。电视镜像为 API 36、x86_64，模拟器为 37.3.10（16970787），内存 3072 MiB。[首次对照](https://github.com/ecojust/pureTV/actions/runs/44681216593) · [第二次对照](https://github.com/ecojust/pureTV/actions/runs/44681943317)

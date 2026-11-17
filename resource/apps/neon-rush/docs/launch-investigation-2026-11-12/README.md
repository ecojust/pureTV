# APK Checker 启动故障调查

用户反馈霓虹飞车 0.1.1 在 APK Checker 中打不开，而 HiFiNi 可以打开。以下比较使用仓库实际正式签名 APK；不能从打包方式不同直接认定故障原因。

| 项目 | 霓虹飞车 0.1.1 | HiFiNi 0.5.0 |
| --- | --- | --- |
| 大小 | 443,884 字节 | 205,924 字节 |
| 最低 / 目标 SDK | 26 / 29 | 26 / 29 |
| 原生 ABI 库 | 无 `.so` | 无 `.so` |
| 签名 | 同一固定证书，v2/v3 | 同一固定证书，v2/v3 |
| 入口 | 普通及电视入口，类存在 | 普通及电视入口，类存在 |
| DEX | 单 DEX 038 | 单 DEX 038 |
| 构建方式 | aapt2 + javac + d8 | Gradle Android 插件 + R8/资源压缩 |
| 主界面 | WebView + 本地 JavaScript/Three.js/WebGL | 原生 Android View；登录页另外使用 WebView |

[实际 APK 对照](packaging/comparison.json)验证了 ZIP、签名、对齐、入口、飞车全部 13 个 R 常量和资源表对应关系、资产索引，无确定的基础打包缺陷。[API 检查](native-static/report.json)确认正式 DEX 的 288 个平台方法引用都不高于 API26，lambda 已转换。

[APK Checker 对照](checker/summary.json)记录 Apple Silicon TV 配置为 API36 r4 arm64-v8a、GPU auto、1920×1080、3GB RAM。实际调用 Checker 解析器读取这两份 APK，均返回正确入口组件。没有改动 APK Checker 仓库。

[禁用 WebGL 检查](webgl-disabled/report.json)使用正式资源和真实 Chromium `--disable-webgl`，未注入替换图形 API。页面显示明确的 3D 不支持提示并禁用开始按钮；该结果不证明用户模拟器的图形状态。

真实 Android TV 原包对照由 [CI 43268397554](https://github.com/ecojust/pureTV/actions/runs/43268397554) 执行。环境为 Android TV 16 / API36、Linux x86_64、SwiftShader、1920×1080、3GB RAM；系统 WebView 为 `com.google.android.webview 143.0.7499.24`。

| 正式包 | 实际结果 | 验证边界 |
| --- | --- | --- |
| 飞车 0.1.1 | 8.868 秒安装成功，入口启动成功，观察期间进程存活且前台正确，无 Java fatal exception | 首张截图仍显示准备页面；普通确认键后，第二张截图显示实际 3D 赛道、车辆及倒计时 1。未验证完整比赛或帧率 |
| HiFiNi 0.5.0 | 后续安装命令 120.102 秒超时 | 未执行启动；不是已证明的 APK 安装拒绝或应用崩溃 |
| 飞车 0.1.0 | 后续安装命令 120.082 秒超时 | 未执行启动；该基线对照未完成 |

[首张实际截图](android-tv-probe/after-ten-seconds-screen.png)中的“正在准备游戏 / Creating your game room...”说明首次加载有延迟，不能描述为十秒内已进入飞车菜单。[确认键后实际截图](android-tv-probe/after-confirm-screen.png)显示完整 3D 倒计时画面，但不能代替完整游玩验证。日志中的 Chromium tile-memory 警告与成功显示画面同时存在，尚不能将其归因为用户故障。UIAutomator 没读到可访问性文字，也不代表屏幕空白。

两个未完成的安装对照还有环境干扰：原始 `hifini-0.5.0/logcat.stdout.txt` 第 256–266 行记录 Play Protect 判定和保护对话框，第 498–513 行记录 Play 商店更新时进程被停止、对话框退出；`neon-rush-0.1.0/logcat.stdout.txt` 第 66–75、128 行也记录保护对话框。探针没有操作这些对话框。不能把这两个超时等同应用启动失败，也没有用户原机日志证明其遇到了相同情况。

本环境无法直接下载 Actions 的 Azure artifact，使用 [导出 CI 43270206877](https://github.com/ecojust/pureTV/actions/runs/43270206877) 从原运行导出，**没有重跑模拟器**。导出提交为 [`347b39b0`](https://github.com/ecojust/pureTV/commit/347b39b0564b5e7fe5183f353fcabc9f1dda64c4)，绑定原源码 `b101eaa6`，已逐一验证 102 份原始文件的大小及 SHA256。ZIP 容器重新封装，文件内容保持不变。

- [全部原始 artifact](android-tv-probe/probe-artifact.zip)、[原始报告](android-tv-probe/summary.json)、[WebView provider](android-tv-probe/webview-provider.stdout.txt)。
- [导出来源与 102 份哈希](android-tv-probe/export.json)、[取回验证](android-tv-probe/fetch-verification.json)、[归档校验](android-tv-probe/archive-manifest.json)。
- [单独保存的目视检查与限制](android-tv-probe/review.json)，没有改写原始报告。

两份包的基础检查未发现确定缺陷，构建器不同本身不是故障证据。已证明 0.1.1 在上述 Android TV 环境可以启动并显示 3D 画面；Linux x86_64/SwiftShader 与用户 Mac ARM64/GPU auto 不同，不能冒充原机复现。HiFiNi 能打开目前是用户的原机观察，本次 CI 没有完成其安装对照。

此前发布的 66 项 Robolectric 回归和浏览器比赛，不等于已经验证 APK 在用户模拟器上的实际启动。当前尚未改变生产源码或发布新的修复 APK；用户故障的根因仍未确定，下一步需要 APK Checker 的完整错误，或明确是闪退、黑白屏还是停留加载页面。

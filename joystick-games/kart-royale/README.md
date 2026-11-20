# Kart Royale · 海湾卡丁车

[下载当前 Android TV 手柄版 0.1.5](https://github.com/ecojust/pureTV/releases/download/catalog-tv-controls-v1.0.1/kart-royale-0.1.5.apk) · [用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

基于 [ryancampbell/kart-royale](https://github.com/ryancampbell/kart-royale/tree/036c0efb025f5ecf8fc31c405e9d818c61e03e21) 的 pureTV 手柄版。固定原源为 `036c0efb025f5ecf8fc31c405e9d818c61e03e21`，保留 Sunset Bay Circuit、八辆卡丁车、AI 对手、道具、原轮胎/悬架物理和漂移奖励规则。网上后来替换的 homie 多人版本不属于本次移植。

## Android TV

[下载 Kart Royale 0.1.4 签名 APK](kart-royale-0.1.4.apk)。最低系统为 Android 8（API 26），游戏需要 WebGL 2。已安装 0.1.3 的玩家可使用相同包名与签名的 0.1.4 覆盖升级。安装后启动游戏，在同一局域网连接 pureTV 手柄，用十字键和 A 选择车手并开始比赛。

Android TV 14 软件渲染模拟器在首次启动游戏前完成 Google 系统服务更新，随后默认端口 63485 完成 58 项检查。端口占用时回退到 35045，也完成 58 项。两次都在首圈实际驾驶，随后暂停、断线并恢复。两次从建立观察端口到出现可操作菜单分别为 24.1 秒与 19.5 秒。[0.1.4 原生验收与驾驶原图](docs/android-0.1.4/README.md) · [各版本实测与首次开机记录](docs/android-tv-20261120.md)

上一正式版本 [0.1.3 签名 APK](kart-royale-0.1.3.apk) 仍可下载，该版本在默认及回退端口也各通过 58 项。[0.1.3 原生验收与驾驶原图](docs/android-delivery/README.md)

## Windows 下载

Windows 0.1.0、0.1.1 与 0.1.2 均在默认端口和占用回退模式通过原生手柄实测。下方提供正式发布的 0.1.1。[三个版本的原始运行记录](docs/windows-delivery/version-runs.md)

Windows x64 0.1.1 支持 Windows 10 1903 或更新版本，需要 Microsoft Edge WebView2 Runtime 和 WebGL 2。可运行安装程序，也可将便携版完整解压后运行 `PureTVGame.exe`。该版本未做 Authenticode 签名。

[下载 EXE 安装程序](windows/KartRoyale-0.1.1-windows-x64-setup.exe) · [下载 ZIP 便携版](windows/KartRoyale-0.1.1-windows-x64.zip) · [SHA-256 校验](SHA256SUMS.txt)

默认 TCP 63485 和端口占用回退两种模式各通过 10 项原生检查，覆盖手柄连接、选车、驾驶、暂停、断线重连和控制设置保存。安装与卸载已在 Windows x64 验证。显示比例覆盖 96 DPI，实体手柄与完整比赛未实测。[原生运行核验](docs/windows-delivery/verification.json) · [实机截图](docs/windows-delivery/visual-review.md) · [Windows 构建记录](https://github.com/ecojust/pureTV/actions/runs/44680258590)

## 源码版 0.1.5 的连接与操作

标题页按 Enter 选车，确认开赛后用方向键驾驶。 电脑也可以连接同一局域网的 pureTV 无线手柄，按手柄搜索键（GPIO 23）配对。Android TV 可用同一 Wi-Fi 下的手机扫描菜单连接卡中的二维码，打开虚拟手柄。比赛时连接卡缩小，断线后重新连接，再手动继续。

## macOS 下载

0.1.0 Universal：[DMG](macos/KartRoyale-0.1.0-macos-universal.dmg)（2,046,696 字节）· [ZIP](macos/KartRoyale-0.1.0-macos-universal.zip)（1,540,639 字节）· [SHA256 校验](SHA256SUMS.txt)。DMG 内应用可拖入 Applications；ZIP 解压后提供相同应用。需要 **macOS 11 或更新版本及 WebGL 2**，包包含 arm64 / x86_64，采用 ad-hoc 签名，未经过 Apple 公证。

Apple Silicon 原生、默认端口占用回退及 Rosetta 三种模式各通过 9 项原 SDK 和实际游戏检查。**Intel Mac 图形运行仍未验证**；Intel 原失败和初始化分类结果保留，独立探针的 context-loss 不能证明游戏失败原因。原控制设置 `kr.controls.v1` 已完成真实保存、退出和换本地地址重启恢复验证。 未做实体手柄或完整通关测试。

原三种模式的菜单、手柄 ID、比赛 HUD 和四个暂停按钮清楚可见；Rosetta 的赛中原图有近处赛道墙遮挡部分车身，属于原镜头中的场景遮挡。 本次 Mac 原截图为 1024×642／1024×645，浏览器的 960×540／1280×720 布局检查是另一组证据。详情见 [Mac 交付核验](docs/macos-delivery/) 与 [逐张目视记录](docs/macos-ci-44615880581-visual-review.json)。安装文件沿用源码 `6c7cb4fdb99dce236b634c842326bae6aed5f232`、原流程 [44615880581](https://github.com/ecojust/pureTV/actions/runs/44615880581) 的原始字节。

| 按键 | 比赛 | 菜单 |
| --- | --- | --- |
| ↑ / A | 油门 | 方向选择，A 确认 |
| ↓ | 制动 | 下一个控件 |
| ← / → | 转向 | 上一个 / 下一个控件 |
| B | 漂移 | 返回 |
| X | 使用道具 | 上一个控件 |
| Y | 向后看 | 下一个控件 |
| START | 暂停 / 明确恢复 | 开始或返回 |

原键盘、标准手柄、触控仍保留。九个 pureTV 键独立输入，可同时转向、油门和漂移。连接卡展示实际客户端 ID，未提供信号数据时不编造 RSSI。默认 TCP 63485，服务发现和端口冲突由共享宿主处理。

断线、失焦与后台清空输入，暂停比赛，并走原 `forfeitDrift` 路径放弃未兑现的漂移蓄能，不触发释放加速或道具。重连不自动继续，需要释放旧按键，再按 START 或选择 Resume。原版“松开再踩油门自动恢复”不适用于此手柄版。

原作者在固定 README 中披露多数漂移尝试没有获得加速、收益集中一个弯；这些旧版规则没有被替换或调整成新线上版本。这里只有一条主要赛道，未宣传新增杯赛或联机模式。

```bash
npm ci --ignore-scripts
npm test
npm run build
npm run build:check
python3 -m http.server 8080 --directory dist
# http://127.0.0.1:8080/tv.html
```

`src/` 保留完整 103 个原源文件及其原 package-lock；新增桥接也在该目录维护。根适配包固定原四个运行依赖的精确版本，额外使用 esbuild 0.28.2 生成离线 IIFE/CSS。构建明确从根依赖锁解析，忽略原源目录里可能存在的旧 node_modules；干净 npm ci 与本地缓存安装的资产一致性见 docs/build-reproducibility/。所有网格、纹理、声音由原代码生成，没有运行时 CDN。根 LICENSE 是 MIT（Ryan Campbell），原 package.json 标记 ISC，两者事实均保留；依赖许可随 dist/THIRD-PARTY-NOTICES.txt 打包。

需要 WebGL2 和现代 WebView。手柄版 0.1.1 在识别到 SwiftShader、llvmpipe 或 Microsoft Basic Render Driver 等软件渲染器时默认使用游戏自带的低画质。硬件 GPU 继续按设备选档，显式 `?quality=` 设置优先。0.1.2 的软件低画质直接绘制当前镜头内的原场景，按需编译着色器与上传几何数据，启动与图形上下文恢复均使用此路径。上方 0.1.0 Mac 下载沿用原默认设置。

上方提供 Android TV、Windows 和 macOS 安装包。实体电视尚未测试。原 SDK TCP、各平台原生与浏览器模拟桥接结果分别保存。

# macOS 0.1.1 构建与验证

最终构建源码为 `00d712cf1ab3624b7f05af0ec45774156bb11249`，[工作流 43709816079](https://github.com/ecojust/pureTV/actions/runs/43709816079) 的构建、两平台验证和导出均成功。安装包由 `build-assets/neon-rush-macos-43709816079-attempt-1` 取回；最终 README、证据及二进制入库不改变已测试的源码。

## 安装包来源

| 文件 | 字节数 | SHA256 |
| --- | ---: | --- |
| NeonRush-0.1.1-macos-universal.dmg | 881311 | `453816ed24497263b68fb9a5b2278d32abb621191ce2a1dc121a8a307d03b160` |
| NeonRush-0.1.1-macos-universal.zip | 551335 | `270c681d0e4473060946307a06cb946f21952deac03fe4518cd2ec7076281c85` |

两种包内为同一个 `Neon Rush.app`，包名 `com.ecojust.neonrush.macos`，版本 0.1.1/build 1，Mach-O 包含 arm64 与 x86_64。CI 挂载 DMG、复制安装、逐文件对照 ZIP／构建清单，并执行 `codesign --verify --deep --strict`。这是 ad-hoc 签名，**未做 Apple 公证，未验证 Gatekeeper 首次批准流程**。最低部署版本为 macOS 11；实际较新系统的验证不能代表所有 macOS 11 机器。

[构建输入与完整 app 清单](build-manifest.json)记录源码、资源、测试脚本、SDK 和编译器；[导出清单](export-manifest.json)记录每份原始证据和包的字节数及哈希。导出清单中的 `masterUpdated:false` 指 CI 导出阶段，最终入库由后续交付提交完成。

## 实际运行结果

| 运行方式 | 结果 | 原版虚拟手柄 | 真实驾驶 |
| --- | --- | --- | --- |
| Apple 芯片原生 arm64，中文 | 9 组通过 | 原页面鼠标操作，经原 SDK／bridge.py，3 项通过 | 28 秒；5 次漂移、3 次小喷、2 次氮气、0 碰撞 |
| Apple 芯片上 Rosetta 执行 x86_64，英文 | 9 组通过 | 同上，3 项通过 | 28 秒；5 次漂移、4 次小喷、2 次氮气、0 碰撞 |
| 原生 Intel 云端运行机 | `limited_graphics`，6 组非图形检查通过 | 未运行游戏网页联调 | 未运行；宿主 WebGL 不可用 |

原生 Intel 环境报告 Apple Paravirtualized Graphics Device、64 MB；保留实际限制，不将 Rosetta 结果描述为实体 Intel 显卡测试。两平台各有 20 项 Swift 协议测试，JS 桥接 13 项通过。原生完整验收覆盖本地 HTTP 资源和错误请求、Bonjour 实际端口及 TXT version=1、原 SDK 九键、A/X 与 B/Y、长按、同步抑制、驾驶与暂停、断线清键与重连、原版虚拟页面、同序号 ACK、正常退出撤销 TCP／Bonjour。观察到的消息和 ACK 分别为 ARM 290/290、Rosetta 285/285、Intel 34/34。

驾驶由正常 TCP 按钮推进，只读诊断用于观察，没有写入游戏状态或修改游戏时钟。虚拟页通过真实鼠标输入操作未修改的 `virtual.html`，使用未修改的 `joystick_sdk.py` 和 `bridge.py`；源码哈希保留在各报告。测试仅在临时 GitHub Mac 运行机中点击已核实的 Neon Rush／Python 本地网络授权提示，客户端不代替用户授权。

已目视检查最终中文暂停／驾驶画面和英文菜单：主按钮、说明及手柄面板可读，没有可见遮挡。此前 960×540／1280×720 中英文布局证据使用模拟原生桥；与此处实际 WKWebView 截图分别保留。游戏模型、赛道、Three.js bundle 及共享运行时未修改，Android 0.1.1 APK 与商城目录未变化。

**未实测实体 ESP32、电视、手机、实体 Intel 显卡或 macOS 11。** Bonjour 通过 Mac 的 `dns-sd` 实际浏览和解析，不等于实体 ESP32 搜索验收。安装包未上传应用服务器，未创建独立 GitHub Release。

## 公开下载

产物随 `ea787d1de2235fa56b8ba98bc8818c4c4977fade` 推送 master。对不可变提交和 master 的 DMG、ZIP、SHA256SUMS 分别完整匿名下载，共 6 份均 HTTP 200，字节数、SHA256 和完整内容与入库文件一致；见[公开下载记录](public-download-verification.json)。

## 证据入口

- [结构化验证摘要](verification.json)、[CI 状态](ci-run.json)、[CI 原始日志](ci-workflow.log)
- [Apple 芯片报告](evidence/neon-rush-macos-qa-macos-arm64/native/report.json)、[Rosetta 报告](evidence/neon-rush-macos-qa-macos-arm64/rosetta/report.json)、[原生 Intel 报告](evidence/neon-rush-macos-qa-macos-x64/native/report.json)
- [中文实际暂停画面](evidence/neon-rush-macos-qa-macos-arm64/native/diagnostics/driving-paused.png)、[英文实际菜单](evidence/neon-rush-macos-qa-macos-arm64/rosetta/diagnostics/menu.png)
- [此前尝试与失败原始记录](../attempts/)，对应原因和修正见[任务日志](../../../../../../history/2026-11-15-002.md)

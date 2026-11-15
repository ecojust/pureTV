# macOS 0.1.2 · 固定手柄连接端口

源码冻结于 `13748656d0b4122cbf263eecb0aeae74af036422`。[工作流 43714427066](https://github.com/ecojust/pureTV/actions/runs/43714427066) 的构建、两平台验收和导出全部成功，Mac 应用版本为 0.1.2/build 2；游戏规则和 Android 0.1.1 包不变。

## 修复内容

0.1.1 在窗口失焦时关闭整个手柄服务，恢复焦点后重新绑定默认端口；端口仍被占用时可能换成随机端口。系统本地网络授权弹窗也会触发该路径。本次将输入暂停与网络生命周期分开：后台不接受游戏操作，但保留监听、Bonjour、TCP 会话和 ACK；回到窗口后必须松开按键，再按 START 继续。隐藏、最小化、睡眠、其他应用或本应用其他窗口取得焦点也会隔离输入。

按照本次用户要求，默认 TCP 端口改为 **63485**。只有首次绑定时被占用才选备用端口；绑定成功后保存所选端口，显式重启也不静默换端口。处理 Network.framework 将端口占用报告为 waiting、failed 或初始化异常的情况。退出或不可恢复的网页错误才关闭网络服务。

根 README 记录所有游戏新开发／更新时使用63485的统一约定；文档更新不会改变已发布的旧安装包。原 pureTV Python SDK、桥接程序和虚拟手柄网页未修改。

## 验收结果

| 模式 | 实际端口 | 通过检查 | 同连接切换窗口 |
| --- | ---: | --- | --- |
| Apple 芯片原生 | 63485 | 10组，含实际驾驶、断线重连、原版虚拟页 | 3轮端口/session/TCP连接不变 |
| Apple 芯片，启动前占用63485 | 63713 | 10组，含实际驾驶和原版虚拟页 | 3轮端口/session/TCP连接不变 |
| Rosetta执行x86_64，英文 | 63485 | 10组，含实际驾驶和原版虚拟页 | 3轮端口/session/TCP连接不变 |
| 原生Intel云端运行机 | 63485 | 7组非图形检查，`limited_graphics` | 3轮端口/session/TCP连接不变 |

每轮以 AppleScript 真实激活 Finder／游戏窗口，观察实际应用输入、游戏模型和 TCP 流量，不伪造生命周期，不写模型。后台九键无轴输入／新脉冲，模型冻结；ping 持续得到 ACK；回到前台长按仍被隔离，释放后新操作正常。原生 Intel 无 WebGL，因此其“新操作正常”只验证输入层，不冒称恢复3D驾驶。

三个具备图形环境的运行都完成28秒正常TCP驾驶、漂移/小喷/氮气以及原虚拟页面的3项检查。原始ACK计数：ARM标准360/360、ARM占用354/354、Rosetta341/341、Intel108/108。两平台分别通过27项Swift协议回归，JS桥接14项通过。虚拟页验收直接断言端口不变，不再在测试中自动重定向新端口。

已核验108份导出文件、32份构建输入、ZIP内25份应用文件；CI挂载DMG并比较其安装副本与ZIP，执行严格签名验证，测试的是同一通用包。中英文最终原生截图完成目视检查。另有[前置布局证据](preflight-ui/report.json)，该部分使用模拟宿主，其8765示例地址不是实际默认端口。

## 安装包

| 文件 | 字节数 | SHA256 |
| --- | ---: | --- |
| NeonRush-0.1.2-macos-universal.dmg | 887972 | `765026ccc0e026a2e2cd1674d47001ab3125c6215fe3ff8215ed5b8b4dfab0ec` |
| NeonRush-0.1.2-macos-universal.zip | 555104 | `50bf196900311c14c879762415eea0b1f5c9e2d4e1764acf7ca816be2969f9ba` |

[下载及安装说明](../../README.md) · [构建清单](build-manifest.json) · [原始包校验清单](package-SHA256SUMS.txt)。顶层SHA256SUMS同时包含保留的0.1.1和本次0.1.2包。

应用使用ad-hoc签名，未做Apple公证或Gatekeeper首次批准测试。最低部署版本macOS11；实际CI为较新macOS。未实测实体ESP32、电视、手机、实体Intel显卡、macOS11或真实系统睡眠/唤醒。保留的连接在实际睡眠期间仍可能受系统和网络中断影响，恢复后重连所选端口。未创建GitHub Release或上传应用服务器。

## 公开交付

产物与README规范随 `9368d34078f3d6d28a920054cfa3e625cb868394` 推送 master。不可变提交及 master 的 DMG、ZIP、校验清单、根README共8份匿名完整下载均HTTP200且逐字节一致；见[公开下载记录](public-download-verification.json)。

## 原始记录

- [结构化摘要](verification.json)、[CI状态](ci-run.json)、[原始CI日志](ci-workflow.log)
- [构建输入](build-manifest.json)、[导出哈希](export-manifest.json)、[独立复核](export-audit.json)及[脚本](export-audit.py)
- [ARM标准](evidence/neon-rush-macos-qa-macos-arm64/native/report.json)、[ARM占用端口](evidence/neon-rush-macos-qa-macos-arm64/native-occupied-port/report.json)、[Rosetta](evidence/neon-rush-macos-qa-macos-arm64/rosetta/report.json)、[Intel](evidence/neon-rush-macos-qa-macos-x64/native/report.json)
- [0.1.1历史记录](../verification-0.1.1/README.md)、[任务日志](../../../../../../history/2026-11-15-002.md)

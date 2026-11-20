# Kart Royale 的三次 Windows x64 原生复验

当前正式交付为 0.1.1。三次运行分别对各自构建的安装程序和便携 ZIP 进行原生检查，在默认端口和默认端口已占用两种模式下使用原 TCP SDK 实际游玩。表内每组数字按默认、占用两种模式排列。[0.1.1 正式下载](../../README.md#windows-下载)

| 版本 | 构建与复验 | 各模式通过项 | 各模式运行分钟 | 前十个菜单步骤的耗时中位数（秒） | 原包绑定 |
| --- | --- | --- | --- | --- | --- |
| 0.1.0 | [44679383741](https://github.com/ecojust/pureTV/actions/runs/44679383741) | 10/10、10/10 | 35.9、36.5 | 34.77、38.38 | [原导出](https://github.com/ecojust/pureTV/blob/d4c31546fa48cbb906d944de877f81a1b8c3a068/export-manifest.json) |
| 0.1.1 | [44680258590](https://github.com/ecojust/pureTV/actions/runs/44680258590) | 10/10、10/10 | 22.1、22.4 | 21.54、21.55 | [原导出](https://github.com/ecojust/pureTV/blob/f79477446e71b0c1691674ab1a500875cdc84ced/export-manifest.json) |
| 0.1.2 | [44684412852](https://github.com/ecojust/pureTV/actions/runs/44684412852) | 10/10、10/10 | 15.1、15.1 | 16.4、16.01 | [原导出](https://github.com/ecojust/pureTV/blob/cb1a3c65598dae61b4f030273023f142c2d42928/export-manifest.json) |

- 0.1.0 的本次原包来自 `cb09c82`，继续验证了之前超时的选车步骤。与早先同版本的 v8 预发布是不同构建，两份旧报告各自保留。
- 0.1.1 的原包来自 `9dff011`，对识别出的软件渲染器采用原游戏低画质。两模式均通过独立手柄连接、驾驶、暂停、断线重连和存档恢复检查。[原始截图与目视核验](visual-review.md)
- 0.1.2 的原包来自 `620fa88`，改变低画质软件 GPU 的渲染与着色器准备路径，两模式均通过。不同运行有不同的托管 Windows 机器，耗时包含 SDK 操作、等待判据和新游戏帧；这些数值不代表帧率或按键响应延迟。此处不涉及实体手柄与完整通关。

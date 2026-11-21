# QQ 飞车 macOS

[下载macOS 安装包（DMG）](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/qq-speed-macos.dmg)

## 0.1.0 版安装包与验证记录

- [下载 DMG](QQSpeed-0.1.0-macos-universal.dmg)：打开后把应用拖入 Applications。
- [下载 ZIP](QQSpeed-0.1.0-macos-universal.zip)：解压后打开 `.app`。
- [SHA256 校验和](SHA256SUMS.txt)、[原始构建清单](build-manifest.json)、[交付与验收来源](delivery-manifest.json)。

通用安装包含 Apple Silicon ARM64 与 Intel x86_64。构建最低目标 macOS 11，游戏还需要可用的 WebGL2；未声称所有 macOS 11 设备均可运行。包采用 ad-hoc 签名，未 Apple 公证；首次打开如被系统拦截，可在系统“隐私与安全性”中允许打开。

首次运行请允许本地网络访问，手柄与 Mac 连接同一网络。默认 TCP `63485`，Bonjour `_puretv._tcp`、TXT `version=1`；仅启动时端口被占用才选择备用端口，连接和失焦期间保持稳定。游戏为单人操作，侧边显示真实手柄 ID。

本版原生验收通过 ARM 正常端口、ARM 端口占用和 Rosetta 的实际游戏操作、完整连接卡、START 暂停/继续、三轮焦点切换、断线重连、逐条 ACK 与正常退出。Intel CI 运行器实际出现 WebGL context loss，独立探针与应用错误相符；仅其原生连接/生命周期通过，不计为 Intel 图形玩法通过。没有实体 ESP32 手柄验收，也没有声称原生流程完成整场比赛；更广的玩法覆盖见游戏浏览器 QA。

安装包来自提交 `8d6475980ce2312df8839a38dd724794eb59b83b` 的[原始构建任务](https://github.com/ecojust/pureTV/actions/runs/44115155028)，保持原 ZIP/DMG 字节。该游戏的验收脚本来自 `6da4d967d41fb0b365b563777d6ada9e8c079fe2`，实际记录见[工作流 44120745068](https://github.com/ecojust/pureTV/actions/runs/44120745068)及 [docs/verification](docs/verification/)。最终聚合只复制原包与各自证据，没有重新打包。

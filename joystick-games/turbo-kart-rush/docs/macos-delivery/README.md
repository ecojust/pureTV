# macOS 0.1.0 原包交付

本目录提供 [交付核验](verification.json) 和逐字节保留的 [原构建清单](original-build-manifest.json)。下载、系统要求与已知界面限制见 [游戏说明](../../README.md)；[包清单](../../packages.json) 和 [校验值](../../SHA256SUMS.txt) 给出相同原件。

原构建及实际游戏流程为 `44615880581` attempt 1，源码与 QA 源均为 `6c7cb4fdb99dce236b634c842326bae6aed5f232`；Apple Silicon 原生、端口占用回退及 Rosetta 各 9 项原检查通过。原包完整闭包审核覆盖本款 1365 个输入、ZIP 内 14 个应用文件和实际 arm64/x86_64 两个 Mach-O slice。当前 4 个 dist 文件逐字节对应原包资源。没有为本次交付重新编译或运行游戏。

ARM 原证据完整导出为 `9789c5a17e338df15728b3aec502bfbb42dce6a6`（同批 516 文件），Intel 原证据为 `5779100b7c50df0a666c4fe5433f890f6a013bfe`（同批 309 文件），原流程整体和 Intel 游戏报告仍是 failure。Intel 前后独立探针实际记录 context-loss，但不证明本游戏失败原因；原初始化分类仍 blocked。本次只按三个 Apple Silicon 模式通过且明确 Intel 未验证的范围分发 Universal 原件，不把原分类器判定改为通过。

本游戏没有声明持久存档字段；原测试只验证无存档状态下重启与换本地地址后的恢复一致，没有宣称实际存档保存已验。

原图已由 native-readiness 逐张查看，详见 [九张原图记录](../macos-ci-44615880581-visual-review.json)。已知界面限制：原三种模式的赛中帮助卡遮住右下小地图上部，暂停展开卡也会盖住背景地图；圈数、计时、完整手柄 ID 和三个暂停按钮仍可见。三张赛中截图均显示 0 km/h，实际驾驶依据原运行记录，不能由静态图推断。 图像尺寸是 1024×642／1024×645，不能把旧浏览器分辨率检查当成本次 Mac 截图或把 FPS 标签当作设备性能实测。

原包从既有 Actions artifact `14575925502` 转存到未发布草稿附件后完整 GET，wrapper 和各包 SHA 保持相同；[原回执](../../../../docs/racing-nine/native-readiness/ci-44615880581-attempt-1/original-package-transfer/original-transfer-receipt.json) 保留完整传递关系。草稿没有发布，游戏根下载采用这里列明的原包；这不是新的 GitHub Release。原始包与完整源码审计见 [审核记录](../../../../docs/racing-nine/native-readiness/ci-44615880581-attempt-1/package-source-audit/audit.json)，原运行摘要见 [ARM 记录](../../../../docs/racing-nine/native-readiness/ci-44615880581-attempt-1/arm-findings.json) 与 [Intel 记录](../../../../docs/racing-nine/native-readiness/ci-44615880581-attempt-1/intel-findings.json)。

未经过 Apple 公证；未做实体手柄或完整通关验证。Android、Windows 的状态单独记录。本次仅建立原包硬链接和交付元数据，没有修改游戏、原报告、截图或分类器。

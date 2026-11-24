# 0.1.1 Web 验证证据

本目录保留已执行验证的原始报告、日志、准确脚本版本和四张实际 3D 界面截图。归档时未重跑测试，也未改写原始报告。

| 验证 | 结果 | 证据 |
| --- | --- | --- |
| Wi-Fi 输入、断线、重连、手机切换、取消 | 4 个行为子测试通过，Node 共计 5 项（含父测试） | [原始报告](runtime/report.json)、[日志](runtime/run.log) |
| 共享输入生命周期兼容 | 15 项通过 | [原始报告](shared-input/report.json)、[日志](shared-input/run.log) |
| 中英文 960×540、1280×720 实际界面 | 4 组布局、广播状态、连接文案、开始与暂停通过 | [原始报告](ui-v2/report.json)、[日志](ui-v2/run.log)、[独立目视记录](ui-v2/visual-review.json) |

runtime 与 shared-input 使用合成原生桥和手动推进 RAF；前者运行实际赛车模型，后者运行探针模型。这些证据不是实际游玩、性能或真机结果。UI 使用最终 3D 包和普通键盘操作，但桥接连接与广播状态、二维码为夹具，不证明 TCP、DNS-SD、Wi-Fi 无线发现或扫码成功。实体电视、手机、ESP32 均未参与本目录测试。

[manifest.json](manifest.json) 列出实际命令、退出码、执行脚本 SHA256 和 14 份来源资产哈希；[SHA256SUMS.txt](SHA256SUMS.txt) 校验本目录存档文件。脚本按原路径运行依赖；归档副本保留原文，不直接改变导入路径。

UI 原始报告中的 visualReviewCompleted=false 保持不变，后续四张截图目视结论另存 visual-review.json。签名 APK 与资产一致性由发布汇总另行核验，不能从本目录推断已签名或已进行设备测试。

后续目视发现仅连接 Wi-Fi 时，扫码区域徽章误显示 CONNECTED。已修复为仅 phone 连接显示 CONNECTED，并在中英文夹具中断言 Wi-Fi → phone → Wi-Fi 时 LOCAL → CONNECTED → LOCAL。最终界面证据为 `ui-v2/`；旧 `ui/` 原报告、脚本、`manifest-v1.json` 与 `ui-v1-production/` 保留供核对，不作为最终 UI 验收。运行时和模型未变，复用输入测试结果。

# 九款赛车 macOS 覆盖汇总：本地验证 revision 3

最终 9 个源文件及 SHA-256 见 [source-inventory.json](source-inventory.json)，对应原字节保存在 `executed-source/`。本次没有运行新的 Mac capability 探针或赛车玩法，没有改任何原报告；真实 Mac 新流程仍待冻结后 CI。

`full-v1` 默认仍要求 ARM 原生、ARM 占用端口、Rosetta x86_64、Intel 原生完整通过。只有代码中固定的 9 款赛车、注册表明确声明 `arm-rosetta-with-intel-observation-v1`、精确 WebGL2 渲染计划才可选择新汇总。此策略要求前三种实际玩法全部通过；Intel 若未通过，则只接受有界初始化异常与同一真实 Intel job 前后完整独立探针证据，记录 `intelNative.status: unverified` / `originalGameQaStatus: failed` / `gameFailureCauseProven: false`。原 Intel job 和总流程失败状态不改变。

`ready` 代表原宿主/页面握手，可能来自 DOMContentLoaded 或导航完成消息；它不证明所有游戏 module 均成功初始化。`game: null` 加独立 context-lost 观察不能推出唯一故障原因。初始化之后的失败、已 ready 的游戏 renderer、任何明确非图形故障、缺少完整证据、身份或时间范围不符都会阻止导出。原 CF / QQ 图形豁免没有扩展。

汇总器核对原包 binary / appFiles、原 build/install 报告、run / attempt / source / runner job、原执行脚本与来源清单、ARM 实际菜单/玩法截图，以及 Intel 原 probe JSON / 三个样本 / 四项 sysctl / 原 GitHub jobs 返回 / 系统与编译器和 WebKit 信息 / 编译→签名→执行命令链。probe binary 是临时文件，明确不随证据导出，保留其原 SHA 和完整源码。GitHub ImageOS / ImageVersion 不存在时保留 null 与确切 unavailableFields，不填造系统信息。

既有 export job 内独立保存 coverage-report，未通过时也保存具体 blocked 原因；合格汇总与原证据一同导出。大包公开下载仍由主任务另行处理，这组修改没有扩大 Git 单文件导出限额。

本次最后修订关闭两处边界：

- 初始化 phase 内，若游戏 renderer 已 ready、后续存档断言或其他异常失败，不能作为 Intel 未验证情形。只接受原 verifier 的两种初始化失败异常，并继续检查原状态。
- runtime 重用包流程的 HTTP 检查必须单独 passed / returncode 0。核对原命令、成功日志、QA 版 HTTP Swift / 测试 / 音频输入、实际编译 harness 和 case 原资料；同时在 runtime plan 中显式归档这些输入。原 workflow 早已把 HTTP 纳入 batch 失败状态，本次修复的是 Intel 游戏和 HTTP 同时失败时，独立汇总仍可能误接受的边界。

本轮 4 项 capability 和 30 项 coverage 单元测试通过；3 份 workflow 用 actionlint 1.7.12 默认参数通过。所有 12 个嵌入 Python 片段（包括 `PYFINAL`）语法通过，详见 [all-embedded-python-syntax.json](all-embedded-python-syntax.json)。`result.json` 原执行脚本仅统计 `PY` 的 10 段，补充文件明确补齐另外两段，未覆盖原记录。未改变的 observation / reuse / catalog 工具测试沿用 [revision 2](../coverage-validation-attempt-2/result.json) 已通过结果，不重复运行。

当前 classifier 另以只读方式重新读取真实旧样本 44584471562（120 原文件）与新共享样本 44593224015（363 原文件）的原不可变导出，两款各 4 模式全部保持 `full-v1: complete`；483 个原文件的前后哈希完全相同。两个样本均为 Canvas 2D / DOM，不是九款 WebGL2 赛车验证。分类器正向单元样例为明确标注的模拟资料；其中旧 Intel 原探针只用于边界测试，不能成为新 run 的能力证据。

独立静态复核由另一 agent 完成，最终未发现剩余阻断；结论限于代码与证据结构审查。原生新版 helper / GitHub 当前 job API 身份匹配与九款实际游戏仍须真实 CI 执行。

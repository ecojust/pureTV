# 九款 WebGL2 赛车的 macOS 验证范围与导出方案（已实现，待首次赛车原生 CI）

本方案已实现独立 capability 观察、覆盖范围汇总和两份 catalog 流程接入，完成本地边界测试与独立源码复核，等待冻结后首次赛车原生 CI。最初审阅基线为 `216416833235d22a4f45e4c336fe8830eb57dc6a`；最终 9 个源文件与 SHA 见 [revision 3 清单](coverage-validation-attempt-3/source-inventory.json)。没有修改生产宿主、游戏或原玩法通过标准；原 Intel 失败保持失败。九款尚未完成本流程的原生验证，不存在可据此宣布通过的赛车 Mac 包。

实施验证见 [revision 3](coverage-validation-attempt-3/README.md)：本轮 34 项目标测试、三份 workflow actionlint 和全部 12 个嵌入 Python 片段语法检查通过，先前 revision 1/2 原记录保留。真实共享宿主样本 [44593224015](ci-44593224015-attempt-1/README.md) 的 363 个原文件已恢复并校验；HTTP 12 项通过、1 项因卷能力跳过，367 键存档及 8 份原玩法报告通过。该样本运行于新 coverage 源冻结之前，只证明共享宿主回归，不能证明新观察编排或九款 WebGL2 赛车通过。

独立汇总放在既有 export job 内，不另建重复下载大包的 job。汇总缺证据时阻断并保留具体原因；没有更改审批范围、原失败状态、固定包身份或大包公开交付规则。ARM 前后探针是附加环境观察，原结果完整保留，但不作为有限覆盖判据，也不能声称所有探针均通过；ARM 的三种实际玩法及 Intel 的同机前后探针仍分别受下文严格门槛约束。

建议交付 Universal `arm64 + x86_64` 包时，分别披露三种执行环境：Apple Silicon 原生、Apple Silicon 上的 Rosetta x86_64、Intel Mac 原生。Rosetta 的实际 x86_64 进程使用 Apple GPU，不能代替 Intel 硬件的 WebGL 实测。

## 已确认的事实和现有阻断点

- 原独立能力 run `44159596612 / attempt 1` 的 Intel 默认 WKWebView 在 WebGL1/2 各三帧观测中均 `contextLost:true`，首个错误为 `37442`，shader precision / renderer 为 null；ARM 原生和 Rosetta 对照有正常上下文。原样本与 SHA 见 [capability-provenance.json](capability-provenance.json)，原导出 `d26c8eabe88dea372fc342e38c3f48361bf72cd3`，先前 Intel 单独导出 `c4114b6fcf0c91264ae8373b8f680860334f67f9`。这些是特定 runner 的观察，不能直接作为新 run 的限制证明。
- 原四款诊断宿主的 `game:null` 与精度访问异常有原证据，但它们是另外重建的诊断宿主，没有证明新九款原安装包的 Intel 图形通过。
- `tools/macos-verify.py::initialization(renderer=...)` 对 catalog 游戏只接受真实 renderer / frames / menu / controller 状态。CF/QQ 的 `limited_graphics` 分支不适用于 catalog，应保持这一点。
- 两份 catalog workflow 的 verify matrix 在 ARM 上执行 native、occupied-port、Rosetta，在 Intel 上执行 native。最初审阅时 export 要求全部 batch/report/check `passed`，并写出 `nativeGameplayVerified:['arm64','x86_64','rosetta-x86_64']`。新实现以严格语义验证后的 `verificationCoverage` 替换该含混声明，原 QA 判定不变。
- 当前 `shared/macos/tools/webgl-probe.swift` 是独立 WebGL2 探针。旧 capability workflow 还对固定四款重建诊断宿主，不能把整份旧流程直接拿来作为新赛车验收。
- 当前正式宿主的诊断包括 `game`、原生进程架构、导航/诊断错误，却不保证完整捕获页面加载早期的全部 JS 异常。因此 `game:null` 只能表示启动未完成，不能仅凭此断言失败全部由 GPU 环境造成。

## 严格验收与有限覆盖分开记录

保持每次实际游戏 QA 的原判定、退出码和原始文件不变。Intel 初始化失败仍为 `failed`；不改成 `passed`、`limited_graphics` 或只运行协议后通过。新增独立的覆盖范围汇总，不回写原 report。

| 条件 | 原游戏报告 | 覆盖范围汇总 / 交付资格 |
| --- | --- | --- |
| ARM native、occupied-port、Rosetta、Intel native 全部严格通过 | 全部 `passed` | `complete` / 可以按全部已验范围交付 |
| ARM 三模式严格通过；Intel 原包校验通过；同机同次独立探针确实持续 context lost；Intel 仅在图形启动阶段未验完 | Intel 原始 `failed` 保留 | `partial`；Intel `unverified`，仅允许明确披露 Intel 未验的包交付 |
| Intel 探针正常，但游戏失败；或有明确的非图形初始化故障、玩法/输入/存档故障 | `failed` | `blocked`，不能用环境限制解释 |
| ARM 或 Rosetta 未实际通过；来源/签名/安装完整性不符；探针超时/缺失/异常；Intel job 被取消或资料缺失 | 原状态保留 | `blocked`，不能推测未执行的结果 |

有限覆盖的第二行不是根因判定。特别是 `game:null` 时，报告应写“同机 WebGL2 能力观测异常，原包 Intel 启动未完成，是否还存在游戏特有问题未确定”。不得写“已证实只有 runner 问题”，也不得声称 Intel 兼容通过。若错误明确属于脚本语法、资源读取、权限、原生退出等其他问题，必须阻断并处理。

有限覆盖政策已采用注册表显式字段 `macosCoveragePolicy: arm-rosetta-with-intel-observation-v1`，默认仍为 `full-v1`。只允许本次代码内固定九款且注册表明确登记的 WebGL2 游戏使用，计划中同时绑定具体游戏列表、所需 renderer 和源码 SHA；缺少有限覆盖声明时继续严格默认，未知值或混入旧游戏都拒绝。此政策决定允许披露什么验证范围，不改变 QA 成败，不自动扩展旧 CF/QQ 特例。注册字段由 root 统一登记，不能从任意日志文案推断政策。

## 同一包、同一次执行的证据要求

1. Universal 包只构建一次。两个 runner 下载同一 artifact，核验 ZIP/DMG/安装复制的完整文件集合、二进制 SHA、架构切片、源清单和 ad-hoc 签名。ARM 三种运行模式均使用这些原安装字节；Rosetta 用 `arch -x86_64`，同时要求应用自身报告实际 `x86_64`。
2. ARM native、occupied-port 与 Rosetta 保留现有全部实际游戏/菜单/原 SDK/身份卡/取消输入/重连/存档重启验证。只要任一模式失败，交付资格阻断。协议通过、编译通过或独立 probe 通过均不能替代实际游戏画面和状态变化。
3. 在 Intel 的同一个 verify job 中，对每款原包测试前后分别运行独立默认 WKWebView WebGL2 探针；不加载游戏、不改变游戏资产、不伪造 shader precision、不切到 Canvas。WebGL1 可作为附加对照，不替代所需 WebGL2。
4. 能力异常的自动识别限于确凿样本：进程为 x86_64、探针正常结束、真实创建 WebGL2 context、完整三帧均 context lost，原 GL error / precision / renderer 原样保存。探针自己崩溃、输出缺字段、超时、仅创建失败或时好时坏不自动套用既有 context-lost 结论。
5. 原生进程未退出、应用实际架构、导航/资源/诊断状态及原游戏初始化失败必须保留。`game:null` 不冒充已运行游戏；可标 Intel 游戏启动未验，但要显式保留原因尚不完全确定的限制。已观察到非图形故障时不能归入有限覆盖。
6. 保存 OS / runner image / Xcode / SDK / WebKit 版本、起止时间、命令、退出码、stdout/stderr、探针原源码、编译后二进制 SHA、原始 JSON；汇总引用它们的路径/字节数/SHA。本实现直接使用原 WebGL2 探针，没有生成 WebGL1 patch；以后若增加变体须另存确切差异。GitHub ImageOS / ImageVersion 不存在时明确记录 null 与 unavailableFields。临时二进制明确 `binaryIncluded:false`，不能默认为已归档。
7. 独立探针作为 verify 内的附加观察；游戏测试进程失败仍采集后置 probe 并上传原文件。若提前异常或取消造成前后证据缺失，有限覆盖必须阻断。新能力证据绑定 run / attempt / job / runner / qaSourceCommit 与包的 sourceCommit、artifact id/digest。旧 run 的 probe 不能填补新 run 缺失。

## 已实现路径和职责

| 路径 | 实现内容；原生流程仍待首次赛车 CI |
| --- | --- |
| `joystick-games/tools/macos-capability.py`（新增） | 编译确切原 WebGL2 探针、读取真实 job / 环境、执行当前 runner 原生探针、保留原输出。不重建或打开诊断游戏副本。Rosetta 仍由原游戏 QA 实际验证。 |
| `joystick-games/tools/macos-verify.py` | 只增加可审计的阶段和失败时架构记录，例如 `failurePhase`、来自原始 state 的实际架构；保持 catalog `initialization`、所有图形/玩法断言和失败退出码。不能添加 catalog 的 allow-unavailable 路径。 |
| `joystick-games/tools/macos-coverage.py`（新增） | 唯一汇总/导出资格验证器。读取不可变原 report、包 manifest、计划和 capability，进行上述严格映射；输出独立 `coverage-report.json`，不编辑输入文件。两份 workflow 共用，避免各自隐含放宽。 |
| `joystick-games/shared/macos/tests/coverage.test.py`（新增） | 使用真实原失败的最小 fixture 加变异用例，验证来源不符/漏文件/未知字段、不同 runner、健康 probe + 游戏失败、坏探针、只协议通过、ARM/Rosetta 失败等都拒绝；确认输入字节不变和旧 full-v1 默认不放宽。 |
| `joystick-games/shared/macos/tests/capability.test.py`（新增） | 真实 Intel 身份、当前 job 选择、命令失败与超时的原输出保留边界测试。 |
| `joystick-games/tools/macos-catalog-reuse.py` | 新 helper 进入明确 QA 源清单；未放宽原生产包来源等同检查。 |
| `.github/workflows/joystick-catalog-macos.yml` | 新计划字段与源码清单；verify 内运行能力观察；既有 export job 内独立汇总，可在 verify 失败后检查证据。export 仅据严格完整或明确有限覆盖资格运行，不只改 `if`。 |
| `.github/workflows/joystick-catalog-macos-runtime.yml` | 同一覆盖规则，并保留 artifact source / QA source / run / attempt 分离、原包全部字节复用检查。QA 变更不能被当成旧 QA 原证据。 |
| `.github/workflows/joystick-catalog-macos-evidence.yml` | 如需扩大 batch 选择，仅加 root 注册的确切新批次；原始 probe/log 的只读导出按来源和后缀验证，不能把 failed 证据当 validated package。 |
| 九款 README / 发布说明（后续交付时） | 按实际覆盖矩阵分别披露 ARM 原生、Rosetta x86_64 和 Intel 硬件。本轮未编写赛车已通过声明，不把 `x86_64` 架构存在直接写成 Intel 实测通过。 |

现有导出流程的文件完整性、包与源匹配、存档证据、固定 APK 证书等检查不减弱。新的 capability helper / coverage helper / tests / workflow 均进入执行源码清单；运行只取冻结源码，不从归档 docs 中找脚本。Mac 精确闭包治理另按 root 协调，不在本提案中顺带替换来源规则。

若 Intel verify 因真实失败返回非零，其 GitHub job 及总工作流可能仍为红色；保留该事实。后置 coverage/export job 可以明确成功导出“验证范围有限”的包，但不能通过 `continue-on-error`、修改报告或伪造全绿来掩盖原失败。现有 `preserve-failure` 继续独立保留失败。

## 清单格式与用户可见表述

建议新增版本化 `verificationCoverage`，替换会产生歧义的整串架构通过声明。有限覆盖示意（不是实际结果）：

```json
{
  "schemaVersion": 2,
  "installPackagesValidated": true,
  "packageArchitectures": ["arm64", "x86_64"],
  "verificationCoverage": {
    "appleSiliconNative": {"status": "passed", "processArchitecture": "arm64"},
    "appleSiliconRosetta": {"status": "passed", "processArchitecture": "x86_64"},
    "intelNative": {
      "status": "unverified",
      "originalGameQaStatus": "failed",
      "capabilityObservation": "webgl2_context_lost",
      "gameFailureCauseProven": false
    }
  },
  "overallGameplayVerification": "partial",
  "deliveryEligibility": "eligible_with_intel_unverified",
  "physicalControllerTested": false,
  "appleNotarized": false
}
```

实际每项还必须指向原始报告路径/SHA和同源安装包身份；不能只依赖手写的 `status`。版本 2 不继续输出含混的 `nativeGameplayVerified:['arm64','x86_64',...]`。若有兼容旧消费者的要求，也只能增加准确枚举的模式数组，并明确排除 Intel native。

可用文案：“提供 Apple Silicon 与 Intel 通用安装包。已在 Apple Silicon 原生及 Rosetta x86_64 下验证实际游戏和 pureTV 手柄。CI 的 Intel Mac WebGL2 能力观测出现上下文丢失，该环境的游戏启动未完成，Intel 硬件兼容性尚未验证。”

## 下一步原生验证

本地汇总器边界测试、actionlint、旧 full-v1 原报告只读回放与独立源码复核已完成。冻结全部 QA 源后，待 racing-01 游戏源稳定，由 root 启动首次三款赛车真实 Mac 包与验收；不能把已完成的宿主样本算作新 coverage 编排实测。最终必须对九款自身的冻结包分别完成实际 ARM/Rosetta 游戏验收与同次 Intel 原始观察；不能从 GLUP/Emberbrood 或旧四款推导九款通过。任何受测游戏资产/宿主变更都重新构建对应包，只有纯 QA 修正才可在现有 runtime 流程的严格源验证下复用原包。

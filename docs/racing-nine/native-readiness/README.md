# Android / macOS 赛车客户端准备情况

本记录包含源码审查、已有原始证据读取、资源预算与读取实现、局部测试，以及实际 Android 宿主的大资源打包验证。尚未构建九款赛车、启动新 CI 或完成新赛车原生玩法验证。候选名单仍在评审；资源预算须在确定每款游戏实际离线资源清单后冻结。

## 现有 Intel 图形故障的确凿原因

原始能力诊断运行：[44159596612，attempt 1](https://github.com/ecojust/pureTV/actions/runs/44159596612)。最终导出固定为 [`d26c8eabe88dea372fc342e38c3f48361bf72cd3`](https://github.com/ecojust/pureTV/tree/d26c8eabe88dea372fc342e38c3f48361bf72cd3)，早期 Intel 只读导出为 [`c4114b6fcf0c91264ae8373b8f680860334f67f9`](https://github.com/ecojust/pureTV/tree/c4114b6fcf0c91264ae8373b8f680860334f67f9)。所选 Intel 文件的 Git blob 身份在两次导出相同。

- Intel `macos-15-intel`、macOS 15.7.9、原生 x86_64：独立默认 WKWebView 的 WebGL 1 和 WebGL 2 都返回 context 对象，但三个连续 animation-frame 样本均 `contextLost: true`；第一个 `glError: 37442` 是 `CONTEXT_LOST_WEBGL`。shader precision、renderer、vendor、version 均为空。仅判断 `getContext()` 非空会误判图形能力。
- 同环境四款 Three 游戏 `bubble-nebula`、`phosphor-patrol`、`wyrmzone`、`quiverspire` 的原启动诊断均为 `game: null`。记录的异常是在 `getShaderPrecisionFormat(...).precision` 读取空值，随后是 `THREE.WebGLRenderer: Context Lost.`。页面、宿主、手柄服务已就绪，但游戏初始化中断。
- ARM `macos-latest`、macOS 26.7.2：原生 arm64 的独立 WebGL 1/2 探针三个样本都正常，renderer 为 Apple GPU；四款诊断的游戏对象、WebGL2 renderer、帧数都存在。这是能力与初始化对照，不是整局玩法验收。
- 原始 `startup-summary.json` 部分 `status: failed` 来自诊断脚本后续断言；不得改写原报告、借此声称整体通过，或把 `observed` 解释为玩法通过。原导出清楚声明 `nativeGameplayVerified: false`、`originalAppsOpened: false`，游戏启动记录来自另建诊断宿主。

这组证据可将旧 Intel runner 的 `game: null` 归因为真实 WebGL 上下文丢失，不能推广为所有 Intel Mac 都不兼容，也不能验证新赛车。不可伪造 shader precision、修改游戏模型或沿用 CF/QQ 的图形豁免。新赛车 macOS 主验必须分别记录 ARM 原生与 Rosetta 实际 x86_64 游戏运行；独立 Intel runner 若再次无可用图形，应保留原探针和环境限制，不能标记 Intel 游戏完整通过。

原始最小证据在 [original-capability](original-capability/)；逐文件 SHA-256、Git blob SHA、原始 URL、两次 Intel 导出相同性见 [capability-provenance.json](capability-provenance.json)。[capture-capability-evidence.py](capture-capability-evidence.py) 只读取固定提交，校验 Git blob 和原导出 manifest 后保存原字节，不执行游戏。

## 已找到的资源限制

下表为修改前源码的实际检查，并非对候选游戏文件体积的估测。后文记录已完成的针对性改动。

| 路径 | 当前限制 / 行为 | 对赛车的影响 |
| --- | --- | --- |
| `resource/game-kit/build.py` | APK `<10,000,000` 字节；每文件 `≤8,000,000`；总 payload `<32,000,000`；只允许 flat 文件和固定扩展名 | 改一个 APK 常量仍无法打包大型素材；旧 100 款规则必须保持 |
| `joystick-games/tools/android-build.py` | dist 必须为 flat 普通文件，无 symlink；同 GameKit 扩展名；禁止覆盖 phone / generated 配置 | 资源可按独立平铺文件构建，不必 base64；GLB 等目前被拒 |
| `joystick-games/tools/android-release.py` | 未签名 / 签名 identity 都要求 APK `<10,000,000` | 构建与签名必须采用同一显式政策 |
| `joystick-games/tools/android-runtime-inputs.py` | 复用包再次检查 APK `<10,000,000`；逐文件校验冻结源码、签名、payload | 后续 QA 也须读取原冻结政策，不能只改 build |
| `resource/game-kit/android/.../MainActivity.java` | index ≤65,536 字节、flat name；只允许列入 index 的资源；MIME 不含 GLB/GLTF/BIN/WASM；资源本身通过 InputStream 返回 | Android 资源传输已流式；需要隔离的新游戏 MIME 扩展，保留 origin / name / index 拒绝边界 |
| `resource/game-kit/android/.../LanGameServer.java` | phone 控制器固定文件读取 ≤512 KiB | 仅手机控制页服务，与电视游戏资源分离，不应为赛车扩大 |
| `joystick-games/tools/macos-build.py` | flat dist、普通文件、每文件 `<10 MiB`；.app 同时 arm64 + x86_64 | 单独 GLB 文件可能直接挡在打包前 |
| `joystick-games/shared/macos/Sources/LocalAssetServer.swift` | 单文件 `≤10 MiB`，总量 `≤32 MiB`；全部文件预读为 Data；每次响应再拼完整 Data；无 Range | 大型赛车被拒或会产生不必要内存峰值；音频需正确处理单 Range |
| 同上 | 未知 MIME 文件被忽略；GLB/GLTF/BIN/WASM 未列入 | 3D 模型即使被放进包也会 404 |
| macOS catalog build/runtime workflow | 每个 Git 导出文件 `<100,000,000` | 109.5 MB 原始资源若不能压缩到上限以内，需要独立大包交付方案，不能只扩大资源预算 |
| Android catalog export workflow | Git 导出没有相同显式体积预检查，但仍受 GitHub 单文件上限 | 大 APK 不能当普通 blob 推入导出分支；应在导出前决定可验证交付方式 |

所有大小限制必须按字节区分十进制 MB 和 MiB。保留旧 `resource/game-kit` 的默认规则，预算不得依靠全局环境变量放宽。

## 已实施的最小改动

1. 新增 joystick 专用资源 policy：只有新注册赛车且 `game.json` 明确声明才能选择扩展预算；校验每文件、总离线资源、APK 三项上限、文件数和扩展名。没有 policy 的旧游戏仍走原预算。政策进入 sourceInputs、包 manifest、签名重验与冻结复用检查。
2. 优先沿用 flat dist，将原离线依赖作为独立安全文件，构建阶段稳定映射路径并改写模型/音频引用；保持 SHA 资源清单。不要强制大型素材进单个 base64 HTML。若选中游戏必须保留目录，另行扩大成逐段严格校验的相对路径，不能直接接受任意 URL。
3. 经主任务协调后采用共享宿主小改，不复制 builder 或 MainActivity。GameKit 新增 `main(argv=None, *, limits=None)` 与 `payload(..., limits=None)` 调用接口，旧 CLI 没有放宽限额的开关；joystick 调用方先校验注册与双边政策再传入。MainActivity 仅扩展 3D/font MIME 与正确的二进制 encoding，保持 InputStream 传输、固定可信 origin、严格 index 和禁止外网回退。
4. Mac 将预算写入签名覆盖的 `PureTVAssetPolicy` Info.plist 字段。资源服务器启动只建立 URL/size 索引，请求以 64 KiB 块发送，支持 GET/HEAD 与单 Range，保持 loopback/Host/路径/连接/请求头限制，并拒绝索引后被替换成 symlink 或改变大小的文件。旧游戏 src/dist/APK 未变；共享工具和宿主的 input hash 变化是新的构建来源，旧 QA 必须继续使用原冻结 ref，不能放宽旧生产源等同检查。
5. Mac `inputs()` 当前将所有 `shared/` 下非 macos/web/android 目录都纳入，新增 Windows 代码也会改变 catalog Mac sourceInputs。九款冻结前应明确新平台依赖的归属与完整清单；不能删减原输入以强行通过旧包复用。
6. 所有资源政策及 HTTP 边界须有有意义的拒绝测试：默认 10 MB 保持、未注册/未声明拒绝、超量拒绝、path traversal / symlink / encoded path / duplicate / reserved 名拒绝、GLB 独立二进制内容一致、Range / HEAD 长度一致。独立宿主改动需要原平台编译与真实运行；Linux 静态检查不能代替。

修改范围：`joystick-games/tools/asset-policy.py`（新）、`android-build.py`、`android-release.py`、`android-runtime-inputs.py`、`macos-build.py`；`resource/game-kit/build.py` 和原 `MainActivity.java`；Mac 原 `LocalAssetServer.swift`；相应政策和宿主测试。没有新增 overlay、独立宿主、注册条目，也没有改旧游戏 src/dist/APK、全局 history 或 Windows 文件。

启用示例（须在游戏的 `game.json` 和对应 `catalog-registry.json` 条目中完全相同）：

```json
"assetPolicy": {
  "schemaVersion": 1,
  "maxAssetBytes": 32000000,
  "maxTotalBytes": 128000000,
  "maxApkBytes": 99000000
}
```

单资源硬上限 64 MiB，总资源硬上限 256 MiB，APK `<100,000,000` 字节；实际预算可以更小，不能用 null、布尔值、浮点数、未知字段或只改一边来启用。总资源预算覆盖生成配置；flat 文件上限 2048，Android asset index 保留 64 KiB 上限。新增允许的二进制格式包含 GLB、GLTF、BIN、WASM、HDR、KTX2，均保持独立文件和逐字节 payload 校验。Mac ZIP/DMG 生成后也在推送前检查实际单包 `<100,000,000`，超限保留失败输出而不默默丢资源。

## 已执行的验证与待执行项目

- [validation-attempt-1](validation-attempt-1/)：45 项 Python/Java 测试通过，覆盖原包来源清单、政策拒绝、独立 GLB 二进制、总量 / index、非法路径 / symlink / reserved 名、实际 Java MIME 方法；8 项 macOS HTTP 测试在 Linux 明确跳过，不计原生通过。
- [validation-attempt-2](validation-attempt-2/)：MIME 大小写补充后重新执行相关 10 项通过，Python 语法与 `git diff --check` 通过；保存了对应源文件哈希。
- [android-compile-attempt-1](android-compile-attempt-1/) 是保留的失败：最初 fixture 组合时与共享默认 `tv.html` 重复，未产生成功包。修正 fixture 为与 joystick 相同的原生源码 + 三份 phone asset 组合后，[attempt-2](android-compile-attempt-2/) 通过。
- 最终 [android-compile-attempt-3](android-compile-attempt-3/) 编译了实际原共享 Java 宿主，包含独立 8,000,001 字节 GLB 夹具和 4,000,003 字节音频夹具；生成 **12,264,734 字节**未签名 APK，SHA-256 `ff2ca43f0755736b77ed00ef09ea7213a10b0a774af5fb24ae865c7162d0fda6`，ZIP / payload 字节一致。另以两个分别小于 8 MB 的普通音频文件运行**原默认 CLI**，确实在 APK 超过 **10,000,000 字节**时拒绝，独立证明旧 APK 约束仍生效。
- 可复现编译脚本为 [build-android-asset-fixture.py](build-android-asset-fixture.py)。夹具刻意使用不可压缩字节，不能运行成游戏，也不是真实模型或声音；未签名、未安装、未读取密钥，没有任何玩法认证。
- `joystick-games/shared/macos/tests/local-assets.test.py` 会在真实 Mac 上编译实际 `LocalAssetServer.swift` 并发 HTTP 请求验证分块、二进制 MIME、Range / HEAD、Host / path / body 拒绝、后置 symlink、旧默认预算与新显式预算。**本机没有 Swift/macOS Network framework，须由 Mac CI 后续执行**；当前 Swift 改动仍待原平台编译与 HTTP 套件确认，之后还需 ARM / Rosetta 赛车玩法验收。
- 已接入 `joystick-catalog-macos.yml` 的原 `*.test.py` 自动发现列表，断言 HTTP 套件恰好出现一次，不重复构建阶段测试；保存实际 Swift/test/workflow 原字节到 `build-evidence/executed-source`，并记录原 commit 对比与 SHA。`joystick-catalog-macos-runtime.yml` 在每个实际 QA runner 单独运行 HTTP 套件，结果参与 batch 成败；失败时仍保存游戏各自检查，且没有新增任何 Intel 图形豁免。
- 两个流程都通过 `PURETV_ASSET_TEST_EVIDENCE` 保存真实编译命令、compiler version、生成的 `main.swift`、源 / 测试 / harness / binary 哈希和每个 fixture server 的原 stdout/stderr。现有 `if: always()` artifact 上传保留失败输出。读取源码在测试执行前完成，不能用后来的文件覆盖原执行依据。
- [workflow-validation-attempt-2](workflow-validation-attempt-2/) 使用经发布 SHA-256 校验的 actionlint **1.7.12**，两份 workflow 检查和 8 个内嵌 Python 片段的语法检查均通过。先前 [attempt-1](workflow-validation-attempt-1/) 的 actionlint 1.7.7 对已有 `download-artifact@v4` 的 `artifact-ids` 输入报旧 schema 错误，原结果保留；未通过修改已有 artifact 身份约束来消除警告，也未 dispatch CI。
- 最终 [workflow-validation-attempt-3](workflow-validation-attempt-3/) 以 actionlint 1.7.12 默认参数再次通过，两份 workflow 均没有配置忽略规则或禁用检查参数。

## 九款注册后可复用的 CI 与证书

| 用途 | 现有 workflow / 参数 | 验收和约束 |
| --- | --- | --- |
| Android 构建 + 固定证书签名 + runtime | `joystick-catalog-android.yml`：`source_sha`, `batch`, 可选 `games` | checkout SHA 必须等于 source_sha；先构建 observer，再签名；API 36 Android TV x86_64、3072 MB、SwiftShader；协议和原游戏 qa-plan 都需通过 |
| Android 仅重跑原包 QA | `joystick-catalog-android-runtime.yml`：`qa_source_sha`, `artifact_source`, `artifact_export`, `artifact_run`, `batch`, 可选 `games` | 验证原 immutable export、签名、完整源码清单和 production 字节未变；不重新签包 |
| Mac Universal .app / ZIP / DMG + 双 runner 验收 | `joystick-catalog-macos.yml`：`source_sha`, `batches` | ARM 构建 arm64+x86_64；ARM 原生 / occupied-port / Rosetta、Intel 原生各单独报告；当前每个 catalog 报告都要求 passed，不接受旧 limited_graphics |
| Mac 原包重新验证 | `joystick-catalog-macos-runtime.yml`：`source_run`, `source_sha`, `source_attempt`, `batches` | 允许原 run 后续取消/失败，但选中 build job 必须成功且 artifact 对应确切 attempt；原 manifest 输入清单和生产字节保持一致，QA allowlist 外改变必须重建 |

Android 固定证书 SHA-256 为 `eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23`。签名取已有 `PURETV_KEYSTORE_BASE64` / `PURETV_KEYSTORE_PASSWORD`，alias `puretv`；先校验 key 导出的证书，再签 v1/v2/v3（v4 关闭），再次核对证书、packageName、version、ZIP 内容和 payload。本次审查未读取任何 secret。

Android 当前最小 SDK 为 26，不是 Android 4.4/6 的可安装声明。WebGL2、内存和性能还取决于实际设备 WebView/GPU；API 36 模拟器通过不能证明旧电视通过。Mac 最低部署为 11.0，现有包为 ad-hoc 签名且未 Apple notarization；不能宣称 Developer ID 或公证完成。

九款需要在 registry 中各有唯一 packageName/appName/executable，并具有 game.json、lockfile、dist、原 LICENSE/NOTICE/upstream 来源、明确 storageKeys 和独立 qa-plan。新车型/赛道或菜单的可玩验证不能只复用手柄协议回包；必须观察真实游戏画面和输入后的正常状态变化。

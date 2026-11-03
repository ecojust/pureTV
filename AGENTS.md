# pureTV 协作规范

本文件适用于整个仓库。用户当前指令优先于这里的项目约定；在已授权范围内继续完成工作，不重复请求确认。本文不新增发布、提交或普通修改的审批步骤。

## 接手任务

1. 先读 `history/INDEX.md`，再读最新记录及与任务相关的未完成记录，确认用户原话、已完成事项、限制和下一步。
2. 执行 `git status --short`、`git branch --show-current`、`git log -5 --oneline`，核对实际分支和未提交改动。继续百款游戏时同时读 `resource/game-kit/progress.json`。
3. 日志是交接线索，当前代码、提交和可复查证据才是状态依据。路径不存在、历史结果过期或日志与代码冲突时，先核实并记录差异，不能把计划当成完成。
4. 保留用户及其他 agent 的修改，不擅自重置、覆盖、清理或强推。多人协作先划分文件范围，最终由主 agent 汇总验证和日志。
5. 按需阅读下面的文档，无须每次重读所有游戏的巨大验证报告。跨会话 scratch 缓存可能消失，应能从仓库说明重建。

## 项目结构与改动范围

- `desktop/`：电脑端 Android TV / Google TV 管理器；开发入口为 `desktop/README.md`。
- `resource/launcher/<id>/`：独立启动器；`resource/apps/<id>/`：独立电视应用或游戏。
- `resource/game-kit/`：小游戏原生宿主、局域网手机手柄、公共 Web 运行时、渲染器、构建和验证工具。
- `tools/`：资源目录、签名证书及索引维护；`docs/`：公共说明与预览；`history/`：用户请求和可复查的行动记录。
- 新游戏的规则、素材、测试和说明放在自己的目录。只有确有共性需求或缺陷时才改公共组件，修改后运行相关共享回归。
- 优先沿用仓库现有技术和接口，避免无关重构、依赖升级或全仓库格式调整。查找文件和文本优先使用 `rg`。

## 管理器与启动器

- 桌面端沿用 TypeScript／Vite 与 Tauri／Rust 结构。修改界面时维护既有中英文文案与焦点、滚动、等待和结果反馈；模拟设备界面不能描述为真实设备执行。
- 在 `desktop/` 中按改动选择 `npm run build`、`npm run test:ui`、`npm run test:svg`、`npm run test:network`；Rust 核心和宿主分别使用 `cargo test --locked --manifest-path core/Cargo.toml`、`cargo test --locked --manifest-path src-tauri/Cargo.toml`。依赖安装和浏览器要求见其 README，不因修改文档而重跑全部检查。
- ADB 操作保留既有核心组件与当前默认启动器保护，明确目标设备；不能把模拟成功、下载成功或命令发出当作设备上的操作成功。
- 启动器与管理器共享 `layout.json` v5 协议。修改协议时同时核对两端兼容性、默认布局、导入导出和实际渲染，遵循 `resource/README-development.md`；Android 构建／测试使用对应软件目录的说明。

## 百款游戏与验收

以 `resource/game-kit/progress.json` 的实际验证状态为准，不能从应用目录总数推算游戏数量。公共组件、草稿和未签名构建不计数。

每款游戏必须具备独立可玩的规则，完成规则回归、浏览器实际输入回归及画面检查，提供严格小于 **10,000,000 字节**的正式签名 APK、实际游玩录像，并完成该款的独立 GitHub 提交后，才能计入完成数。不得为了达到数量复制换皮、虚构结果或提前增加计数。

- 基础接口、取消输入和手机控制约定：`resource/game-kit/README.md`。
- 模型实现 `PureModel.create(seed, difficulty)` / `step(state, dt, input)`；终局冻结。界面通过 `GameDef` 和公共运行时接入。
- 每款目录维护 `game.json`、`src/main/assets/game-model.js`、`game.js`、说明、许可证、测试、`logo.svg`、实际画面 `thumb.png`、验证记录和发布资源。图标和资源约定见 `resource/README-development.md`、`docs/resource-maintenance.md`。
- 模型测试覆盖该款核心规则、资源边界、成功与失败、输入取消和终局。测试求解器不随游戏资产打包。
- 浏览器 QA 与录像使用正常输入推进，不写入模型或强制获胜。录像、性能观测和合成协议测试分别说明，具体要求见 `resource/game-kit/qa/README.md`。
- 有意义地检查 960×540、1280×720 的文字、控件、侧栏与实际游戏画面。自动截图通过不能代替目视检查。
- 未做实体电视／手机测试时明确记录 `physicalTvTested:false` / `physicalPhoneTested:false`。软件浏览器结果和视频导出帧率不能当作设备帧率。
- 运行与改动有关的检查；通过后除非有新修改、失败或未解决疑点，不反复运行相同测试。

## 构建、签名与资源同步

以 `resource/game-kit/BUILD.md` 为准。Game Kit 使用 JDK 17、Android Platform 35、Build Tools 34.0.0、固定哈希的 ZXing 3.5.3。工具链放仓库外，构建输出也不得写入游戏源码或公共组件目录。

```bash
python3 resource/game-kit/build.py \
  --game resource/apps/<id> --output /absolute/scratch/<id>/build \
  --sdk /absolute/android-sdk --jdk /absolute/jdk17 \
  --zxing /absolute/core-3.5.3.jar
```

本地 builder 只产生未签名 APK。冻结确切源码提交后，通过 `prepare-signing-request.py`、现有 `sign-game-kit.yml` 和 `fetch-signed.py` 使用仓库固定发布证书并核验来源、包名、版本、签名、资产和哈希。不得临时生成发布密钥、替换证书或把未签名 APK 冒充可安装正式包。

新增应用包名按现有规则登记到 `tools/resource_catalog.py` 的准确证书映射；完成实际资源后更新 `resource.json`、`SHA256SUMS.txt`、预览、验证记录和进度，运行资源校验与索引同步：

```bash
python3 tools/resource_catalog.py --build-tools /absolute/android-sdk/build-tools/34.0.0
python3 tools/update-resource-index.py
```

`tools/verify-game-publication.py` 仅支持其注册的旧游戏，不要直接套用于新 Game Kit 游戏。签名产物、GitHub 提交、GitHub Release 和 Gitee 市场发布是不同状态，分别如实记录。

## 持续记录与交接

每次收到用户 prompt，都在 `history/` 的当前任务记录中保留可见用户原话及顺序；新的独立任务创建 `YYYY-MM-DD-NNN.md`。同一任务中的补充要求继续追加，不覆盖前面的请求。先前会话原话不可得时明确注明，不能凭推测补写。

每个有意义的行动阶段后，以及暂停、阻塞、交接和最终回复前，更新当前记录与 `history/INDEX.md`。记录实际动作、涉及文件、必要命令或提交／工作流编号、决策依据摘要、结果和证据路径、限制、尚未完成事项、下一步。无需逐条转储所有工具输出。

不记录 token、密码、密钥、敏感环境变量、完整凭据输出或私有推理过程。用户 prompt 含秘密时，以 `[已脱敏：类型]` 替换秘密并说明脱敏。记录可复查结论和简短理由，不记录内部思维链。

模板及状态规则见 `history/README.md`。发布相关证据应留在对应应用的 `docs/`，history 只链接；scratch 路径应标为本次环境临时证据。最终回复准确区分已实现、已验证、已签名、已推送与仍待办，保留可继续执行的下一步。

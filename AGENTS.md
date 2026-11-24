# pureTV 协作规范

本文件适用于整个仓库。用户当前指令优先于这里的项目约定；在已授权范围内继续完成工作，不重复请求确认。本文不新增发布、提交或普通修改的审批步骤。

## 收到用户 prompt 时

每收到一条用户 prompt（包括工作中途的补充或更正），第一步就是把它提交到 `history/`。只做定位记录所需的检查，按以下顺序操作：

1. 独立任务按 UTC 日期新建 `history/YYYY-MM-DD-NNN.md`；同一任务在原记录的“用户 prompt”一节按顺序追加用户原话（`U1`、`U2`……），保留已有请求。按下文的脱敏约定处理秘密。先前会话原话不可得时注明“原文不可得”。
2. 在记录中写明当前状态和下一步，同步更新 `history/INDEX.md` 的对应条目，使接手者能从索引找到这条请求。
3. 仅将本次任务记录和对应索引变更单独做一次 Git 提交，推送到当前任务的远程分支。推送成功后再分析或执行该请求。推送失败时保留本地提交，恢复连接后先确认远程状态，按需补推。

## 改动完成后自动合并 PR

每次完成改动并通过相关验证后，提交并推送到当前任务分支，创建或更新该任务的 PR，然后自动合并到目标分支，无需用户另行确认。若仓库要求的检查仍在运行，等待其通过并完成合并。合并后核对目标分支已包含本次改动，再向用户报告结果并附上 PR 链接。

## 接手任务

1. 接手或断线恢复时，从 `history/INDEX.md` 找到最新记录及相关未完成记录，核对用户原话、已完成事项、限制和下一步。如有新 prompt，先按上节登记并推送。
2. 执行 `git status --short`、`git branch --show-current`、`git log -5 --oneline`，核对实际分支和未提交改动。继续百款游戏时同时读 `resource/game-kit/progress.json`。
3. 日志是交接线索，当前代码、提交和可复查证据才是状态依据。路径不存在、历史结果过期或日志与代码冲突时，先核实并记录差异，不能把计划当成完成。
4. 保留用户及其他 agent 的修改，不擅自重置、覆盖、清理或强推。多人协作先划分文件范围，最终由主 agent 汇总验证和日志。
5. 按需阅读下面的文档，无须每次重读所有游戏的巨大验证报告。跨会话 scratch 缓存可能消失，应能从仓库说明重建。

## 项目结构与改动范围

- `desktop/`：电脑端 Android TV / Google TV 管理器；开发入口为 `desktop/README.md`。
- `resource/launcher/<id>/`：独立启动器；`resource/apps/<id>/`：独立电视应用。游戏的源码、素材和 APK 统一放在 `joystick-games/<id>/`。
- `fork/<分类>/<id>/`：第三方小体积 APK 归档；保留上游原包和证书，按 `fork/MAINTENANCE.md` 生成来源、图标、封面与校验清单，不计入自研资源或自动上架商城。
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

当前上架游戏以首页清单为准。原百款计划已下架，历史计数可在[归档交付清单](https://github.com/ecojust/pureTV/blob/7cba602846e3efe6ddb499db2be258edc82ab5de/resource/game-kit/progress.json)复核。公共组件、草稿和未签名构建不计数。

每款游戏必须具备独立可玩的规则，完成规则回归、浏览器实际输入回归及画面检查，提供严格小于 **10,000,000 字节**的正式签名 APK、实际游玩录像，并完成该款的独立 GitHub 提交后，才能计入完成数。不得为了达到数量复制换皮、虚构结果或提前增加计数。

- 基础接口、取消输入和手机控制约定：`resource/game-kit/README.md`。
- 模型实现 `PureModel.create(seed, difficulty)` / `step(state, dt, input)`；终局冻结。界面通过 `GameDef` 和公共运行时接入。
- 每款目录维护 `game.json`、`src/main/assets/game-model.js`、`game.js`、说明、许可证、测试、`logo.svg`、实际画面 `thumb.png`、验证记录和发布资源。图标和资源约定见 `resource/README-development.md`、`docs/resource-maintenance.md`。
- 各平台的游戏客户端图标使用该游戏实际游玩时的画面。按[客户端游戏图标说明](docs/branding/game-icons.md)用 `tools/game_icons.py` 从同一帧输出方形图标、Windows ICO 和 Android TV 横幅。默认取游戏目录的 `thumb.png`，需要换帧或调整方形裁剪时分别登记在 `tools/game-icon-sources.json` 和 `tools/game-icon-crops.json`。首页收录从外部仓库封装的游戏时，在游戏清单提供上游仓库根地址，由中英文 README 生成器显示来源图标。
- 模型测试覆盖该款核心规则、资源边界、成功与失败、输入取消和终局。测试求解器不随游戏资产打包。
- 美术预览、源码冻结与最终 QA 前核对实际加载资产的 SHA256；最终测试资产必须与冻结源码及正式签名 APK 一致。渲染代码变更后旧录像不能冒充新版本证据。
- 浏览器 QA 与录像使用正常输入推进，不写入模型或强制获胜。录像、性能观测和合成协议测试分别说明，具体要求见 `resource/game-kit/qa/README.md`。
- 保留标准验证工具的原始报告；补充通关总结另存文件，不覆盖标准报告。失败后重试时保留失败记录，并明确哪些检查重跑、哪些证据复用及其来源哈希。
- 保留实际执行的测试／录制脚本版本及来源。冻结后修改测试前先确定归档方式；发布时不能把旧冻结tests误当作实际运行版本。只改测试不等于生产资产变化，但仍要保证证据可重现。
- 有意义地检查 960×540、1280×720 的文字、控件、侧栏与实际游戏画面。预览阶段同时测量侧栏滚动尺寸与文字边界，记录是否需要滚动或发生越界；自动截图通过不能代替目视检查。
- 未做实体电视／手机测试时明确记录 `physicalTvTested:false` / `physicalPhoneTested:false`。软件浏览器结果和视频导出帧率不能当作设备帧率。
- 运行与改动有关的检查；通过后除非有新修改、失败或未解决疑点，不反复运行相同测试。

<a id="游戏-app-接入-puretv-wi-fi-手柄"></a>

## 游戏输入与连接显示

新开发及移植的游戏必须按[游戏输入与连接显示规范](docs/guide/game-controls.md)设计。发布前按其清单分别验证电脑键盘、电脑无线手柄、电视扫码手机和电视无线手柄，并在逐款记录中核对玩家加入、断开前后的画布与连接提示。

开发或验收支持手柄的游戏时，参考 [puretv-joystick/README.md](puretv-joystick/README.md) 中的服务发现、TCP 协议和虚拟手柄测试说明。

## 构建、签名与资源同步

以 `resource/game-kit/BUILD.md` 为准。Game Kit 使用 JDK 17、Android Platform 35、Build Tools 34.0.0、固定哈希的 ZXing 3.5.3。工具链放仓库外，构建输出也不得写入游戏源码或公共组件目录。

```bash
python3 resource/game-kit/build.py \
  --game joystick-games/<id> --output /absolute/scratch/<id>/build \
  --sdk /absolute/android-sdk --jdk /absolute/jdk17 \
  --zxing /absolute/core-3.5.3.jar
```

本地 builder 只产生未签名 APK。冻结确切源码提交后，通过 `prepare-signing-request.py`、现有 `sign-game-kit.yml` 和 `fetch-signed.py` 使用仓库固定发布证书并核验来源、包名、版本、签名、资产和哈希。不得临时生成发布密钥、替换证书或把未签名 APK 冒充可安装正式包。

新增应用包名按现有规则登记到 `tools/resource_catalog.py` 的准确证书映射；完成实际资源后更新 `resource.json`、`SHA256SUMS.txt`、预览、验证记录和进度，运行资源校验与索引同步：

```bash
python3 tools/resource_catalog.py --build-tools /absolute/android-sdk/build-tools/34.0.0
python3 tools/update-resource-index.py
python3 tools/update-tv-store-catalog.py --build-tools /absolute/android-sdk/build-tools/34.0.0
```

电视商城 0.1.3 起和桌面 APK 市场共同读取 `apps.b14f.com` 的影音、游戏和启动器目录。冻结新商城版本时用 `tools/freeze-tv-market.py` 从服务器核验 APK 并生成内置快照。更新仓库资源时仍须运行 `tools/update-tv-store-catalog.py`，让旧版商城从 GitHub 兼容目录取得签名升级。

`tools/verify-game-publication.py` 仅支持其注册的旧游戏，不要直接套用于新 Game Kit 游戏。签名产物、GitHub 提交、GitHub Release 和 Gitee 市场发布是不同状态，分别如实记录。

## 持续记录与交接

每个有意义的行动阶段后，以及暂停、阻塞、交接和最终回复前，更新当前记录与 `history/INDEX.md`。记录实际动作、涉及文件、必要命令或提交／工作流编号、决策依据摘要、结果和证据路径、限制、尚未完成事项、下一步。无需逐条转储所有工具输出。

不记录 token、密码、密钥、敏感环境变量、完整凭据输出或私有推理过程。用户 prompt 含秘密时，以 `[已脱敏：类型]` 替换秘密并说明脱敏。记录可复查结论和简短理由，不记录内部思维链。

模板及状态规则见 `history/README.md`；百款游戏环境重建及单款交付入口见 `history/CONTINUE-GAMES.md`。发布相关证据应留在对应应用的 `docs/`，history 只链接；scratch 路径应标为本次环境临时证据。最终回复准确区分已实现、已验证、已签名、已推送与仍待办，保留可继续执行的下一步。

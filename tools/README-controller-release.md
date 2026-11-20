# README 游戏手柄更新构建与验收

默认流程保留原 README 精选的 20 款游戏。`controller-games.yml` 专门构建 11 款旧 Gradle 游戏，9 款 Game Kit 继续使用现有 `sign-game-kit.yml` 固定证书签名流程。

## 首页的 12 款 Android 游戏

对同时包含游戏输入改动和版本号的冻结源码分支运行下面的命令。把 `SOURCE_REF` 设为冻结分支名，将 `SOURCE_SHA` 设为该分支的完整 Git 提交号。

```sh
gh workflow run controller-games.yml --repo ecojust/pureTV \
  --ref "$SOURCE_REF" -f scope=home-12
```

该流程为十款旧宿主游戏构建、签名并核对原证书，同时生成十二份对应的测试观察器。无密钥的共享构建任务会为霓虹飞车和叠塔工匠生成未签名 APK 与请求。等待流程成功后，把 `LEGACY_RUN` 和 `ATTEMPT` 分别设为此次运行号和尝试号，将生成的请求交给原 Game Kit 签名工作流。它会独立重建候选游戏并校验请求，再使用原证书签名。

```sh
REQUEST_REF="build-assets/game-kit-requests-home12-${LEGACY_RUN}-${ATTEMPT}"
for slug in neon-rush tower-overlap; do
  gh workflow run sign-game-kit.yml --repo ecojust/pureTV --ref "$SOURCE_REF" \
    -f source_sha="$SOURCE_SHA" -f slug="$slug" -f request_branch="$REQUEST_REF"
done
```

两次签名成功后，把 `NEON_RUN` 和 `TOWER_RUN` 设为对应的 Game Kit 签名运行号。原生验证默认运行六批，使用真实 APK、原版 SDK 和 Android TV 模拟器检查安装升级、手柄输入、游戏画面以及端口占用。手机网页扫码连接须另作实测。

```sh
BUNDLE=$(jq -cn --arg sha "$SOURCE_SHA" --arg legacy "$LEGACY_RUN" \
  --argjson attempt "$ATTEMPT" --arg neon "$NEON_RUN" --arg tower "$TOWER_RUN" \
  '{scope:"home-12",sourceSha:$sha,legacyRunId:$legacy,legacyAttempt:$attempt,kitRuns:{"neon-rush":$neon,"tower-overlap":$tower}}')
gh workflow run controller-games-runtime.yml --repo ecojust/pureTV \
  --ref "$SOURCE_REF" -f acceptance_mode=complete -f bundle_manifest="$BUNDLE"
```

## 第一阶段：固定源码构建、签名及暂存

1. 冻结全部游戏、共享宿主、观察器和构建工具的准确源码提交。
2. 推送 `feat/readme-games-controller` 会运行旧游戏的两组编译、模型与原生回归、lint，以及独立 Game Kit 共享原生回归/lint。
3. 无密钥的构建步骤检查 APK 与源码资产逐字节一致，并校验旧已发布 APK 的包名、版本和真实证书；新包必须保持包名/证书并提高 versionCode。
4. 独立签名步骤只使用仓库现有 v2 证书。20 份只读 Instrumentation 观察器同时编译、签名，仅作为测试附件，不给用户安装。
5. 包、构建输入及原始报告导出至 `build-assets/controller-games-<run>-attempt-<attempt>`，只创建新分支，不更新 master 或 Release。此阶段 `runtimeResult=not_run`，不能据此宣称实际 Android 游戏验收通过。

旧游戏保留既有体积限制：Jackal 16 MiB、Alien Shooter 12 MiB、其他九款 5 MiB。Game Kit 游戏仍严格小于 10,000,000 字节，不为本次控制器更新改变旧素材或压缩玩法资源。

## 第二阶段：同一正式包的实际 Android TV 验收

当 11 旧游戏构建签名流程及 9 个 Game Kit 签名流程全部成功，调用 `controller-games-runtime.yml`，其 `bundle_manifest` 输入为以下 JSON。`sourceSha` 精确绑定9款Game Kit包，`legacySourceSha` 精确绑定11款旧游戏及20份测试观察器（省略时默认等于 `sourceSha`）。仅旧游戏后续改动时，可复用生产源码未变的9个Game Kit签名包；逐款仍比较实际资产及原生来源收据与所属提交，不能只忽略提交差异。QA 工具自身可由后续提交提供，报告单独保存 `qaSourceSha`。

```json
{
  "sourceSha": "准确40位源码提交",
  "legacySourceSha": "旧游戏与观察器准确40位源码提交",
  "legacyRunId": "旧游戏controller-games运行编号",
  "legacyAttempt": 1,
  "kitRuns": {
    "neon-rush": "签名运行编号",
    "twenty-four": "签名运行编号",
    "torch-bridge": "签名运行编号",
    "tower-overlap": "签名运行编号",
    "packing-sculptor": "签名运行编号",
    "conveyor-window": "签名运行编号",
    "glass-fold": "签名运行编号",
    "tension-span": "签名运行编号",
    "prism-relay": "签名运行编号"
  }
}
```

八个独立 Android TV API 36 模拟器批次并行运行，每批只验收2–3款；来源分组仍是 arcade/worlds/kit，正式包、观察器和严格验收内容不变。批次为 arcade-1/2/3、worlds-1/2、kit-1/2/3，各款只出现一次。只读观察 APK 声明为 testOnly，安装时单独使用 `adb install -r -t`。只有 `PURETV_DISPOSABLE_EMULATOR=1`、明确的 `emulator-*` 序列号和设备 `ro.kernel.qemu=1` 三项同时满足时，批处理才在该临时模拟器内关闭云端 ADB 安装验证，并保存平台指纹和设置前后值；这不会更改实体设备设置或免除正式 APK 的签名校验。每款通过 `git show` 从所属 APK 的源码提交读取旧 `resource.json`，校验保留的旧 APK 实际包名、版本、哈希及证书后安装，再 `adb install -r` 覆盖新正式 APK，并安装同证书只读观察器。观察器通过正常启动 Activity 找到真实 WebView，只提供读取快照的本机接口；普通输入由未修改的 pureTV SDK 和虚拟手柄发送到实际 Android TCP 服务。

可选 `batches` 输入留空时运行全部8批；例如 `["arcade-1","worlds-1","worlds-2","kit-3"]` 只运行这4批的9款。独立计划任务严格拒绝未知、重复或空数组；批内仍执行每款完整验收。每份证据和导出清单记录准确 QA 提交、所选批次及全部计划游戏；局部运行成功只表示所选批次成功，不能表述为20款全部通过。组合多次验收时必须逐款保存对应 run、QA 提交和正式包哈希，并保留失败原件。

另有3个明确的单款复验别名 `retry-used-car`、`retry-alien`、`retry-prism`，以及 Tank/Jackal 两款的 `retry-arcade-visual`，默认8批不会包含它们。每个别名使用独立 AVD，仍执行各款完整验收；选择父批与重复子游戏的组合会被计划任务拒绝。Used 和街机视觉复验使用官方 stable `system-images;android-29;android-tv;x86`（仓库列出的 revision 3），Alien 和 Prism 使用原 API36/x86_64；计划清单逐批记录 apiLevel、arch、renderer 和完整启动选项。街机对照最初由查看器显示疑问触发；随后对原 PNG 与录像的像素复核撤回了黑块结论，原视觉证据保持有效。已启动的 API29 任务作为额外环境对照完成，不表示修复了视觉缺陷。正式包和测试观察器均保持原签名/字节，最低 API26 不高于 API29，但旧镜像的实际 WebView/WebGL、安装与控制器操作仍必须通过实测。

worlds-2、独立 Used 及街机视觉复验使用 `-feature -Vulkan -verbose`，保留 SwiftShader 和所有正式包，验证替代 GL 渲染路径并记录详细模拟器输出。该开关由 [Android 官方排障文档](https://developer.android.com/studio/run/emulator-troubleshooting) 明确支持；此前整个 AVD 失响应的根因仍未确定，没有据此认定为游戏或 Vulkan 缺陷。其他批次参数保持一致。

Used 在 API29/x86 对照中仍出现整个 AVD 失响应后，仅 `retry-used-car` 将 GPU 模式改为 `swiftshader`，保留其 API29/x86、禁用 Vulkan 和 verbose 参数。先前原日志记录 emulator 37.2.13；[官方图形加速文档](https://developer.android.com/studio/run/emulator-acceleration) 明确 `swiftshader_indirect` 从36.4.9起废弃，并列出受支持的 `swiftshader` GLES/Vulkan 软件渲染模式。计划记录这次单因素变化及依据，原始运行日志保留每次实际 emulator 版本；这不表示已经确定或修复失响应的根因。其他批次的 GPU 模式不变。

随后该配置的宿主内核日志记录到 RenderThread 段错误；仅 Used 再固定为[官方归档](https://developer.android.com/studio/emulator_archive)的稳定 emulator **35.6.11 / build 13610412**，API29/x86、`swiftshader`、禁 Vulkan 和 verbose 均保持。使用 runner 官方 `emulator-build` 输入，计划记录下载 URL、公布的 SHA256 和大小。CI 对同一官方 URL 另作流式下载校验（不冒称拦截了 action 自行下载的文件），并在实际验收前记录和严格校验安装版本/build；原始失败仍保留。这是宿主版本的单因素对照，不表示已找到或修复游戏缺陷。其他批次不固定或改变 emulator build。

`controller-emulator-batch.py` 管理安装、观察器生命周期、ADB 端口转发及原始日志；`tools/readme-controller-qa/run.mjs` 判定各款实际操作与输入取消行为。每款以 Android screenrecord 保存普通输入阶段的新录像（最长120秒，960×540，600,000 bit/s；编码帧率不代表实体设备性能）。失败保留录像、截图、logcat、准确命令和原始报告，并继续其他款；只有全部通过，组任务才成功。证据导出至独立的 `build-assets/controller-runtime-<run>-attempt-<attempt>`。

`controller-runtime-diagnostics.py` 在模拟器启动前每5秒记录主机内存、压力指标、进程名/RSS（不收集进程参数和环境变量），并保留前后内核日志和模拟器崩溃文件；设备端持续 logcat 即使 AVD 随后离线也保留已读日志。诊断只读取状态，不重启设备、不重试或放宽验收。每个 `controller-runtime-<batch>` artifact 保存这些原始文件以及实际执行源码和哈希，包含证据目录内的隐藏工作流副本。上游 emulator-runner v2 无关闭 `keyevent 82` 的配置，启动失败仍真实报告失败。

这不是实体电视或 ESP32 测试。NSD 注册可由宿主状态观察，ESP32 搜索发现需单独实机验证。没有把 TCP ACK 或安装成功等同于玩法验收通过。

## 本地只读与边界验证

```sh
TMPDIR=/path/to/scratch python3 -m unittest discover -s tools/tests -p 'test_controller_*.py' -v
python3 tools/controller-release.py list --all
```

可用只读工具链为 `/workspace/scratch/game-polish-toolchain/` 下的 `android-sdk`、`jdk-17.0.21+9` 和 `core-3.5.3.jar`。该路径属于当前环境，迁移环境时须重新定位；根盘不足时所有输出、临时文件和缓存明确放在有空间的目录。

# README 游戏手柄更新构建与验收

当前范围为根 README 的 20 款游戏。`controller-games.yml` 专门构建 11 款旧 Gradle 游戏，9 款 Game Kit 继续使用现有 `sign-game-kit.yml` 固定证书签名流程。

## 第一阶段：固定源码构建、签名及暂存

1. 冻结全部游戏、共享宿主、观察器和构建工具的准确源码提交。
2. 推送 `feat/readme-games-controller` 会运行旧游戏的两组编译、模型与原生回归、lint，以及独立 Game Kit 共享原生回归/lint。
3. 无密钥的构建步骤检查 APK 与源码资产逐字节一致，并校验旧已发布 APK 的包名、版本和真实证书；新包必须保持包名/证书并提高 versionCode。
4. 独立签名步骤只使用仓库现有 v2 证书。20 份只读 Instrumentation 观察器同时编译、签名，仅作为测试附件，不给用户安装。
5. 包、构建输入及原始报告导出至 `build-assets/controller-games-<run>-attempt-<attempt>`，只创建新分支，不更新 master 或 Release。此阶段 `runtimeResult=not_run`，不能据此宣称实际 Android 游戏验收通过。

旧游戏保留既有体积限制：Jackal 16 MiB、Alien Shooter 12 MiB、其他九款 5 MiB。Game Kit 游戏仍严格小于 10,000,000 字节，不为本次控制器更新改变旧素材或压缩玩法资源。

## 第二阶段：同一正式包的实际 Android TV 验收

当 11 旧游戏构建签名流程及 9 个 Game Kit 签名流程全部成功，调用 `controller-games-runtime.yml`，其 `bundle_manifest` 输入为以下 JSON。所有签名包和观察器必须绑定同一个 `sourceSha`；QA 工具自身可由后续提交提供，报告单独保存 `qaSourceSha`。

```json
{
  "sourceSha": "准确40位源码提交",
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

三组 Android TV API 36 模拟器并行运行。每款先安装冻结源码中的旧正式 APK，再 `adb install -r` 覆盖新正式 APK，并安装同证书只读观察器。观察器通过正常启动 Activity 找到真实 WebView，只提供读取快照的本机接口；普通输入由未修改的 pureTV SDK 和虚拟手柄发送到实际 Android TCP 服务。

`controller-emulator-batch.py` 管理安装、观察器生命周期、ADB 端口转发及原始日志；`tools/readme-controller-qa/run.mjs` 判定各款实际操作与输入取消行为。每款以 Android screenrecord 保存普通输入阶段的新录像（最长120秒，960×540；编码帧率不代表实体设备性能）。失败保留录像、截图、logcat、准确命令和原始报告，并继续其他款；只有全部通过，组任务才成功。证据导出至独立的 `build-assets/controller-runtime-<run>-attempt-<attempt>`。

这不是实体电视或 ESP32 测试。NSD 注册可由宿主状态观察，ESP32 搜索发现需单独实机验证。没有把 TCP ACK 或安装成功等同于玩法验收通过。

## 本地只读与边界验证

```sh
TMPDIR=/path/to/scratch python3 -m unittest discover -s tools/tests -p test_controller_release.py -v
python3 tools/controller-release.py list --all
```

可用只读工具链为 `/workspace/scratch/game-polish-toolchain/` 下的 `android-sdk`、`jdk-17.0.21+9` 和 `core-3.5.3.jar`。该路径属于当前环境，迁移环境时须重新定位；根盘不足时所有输出、临时文件和缓存明确放在有空间的目录。

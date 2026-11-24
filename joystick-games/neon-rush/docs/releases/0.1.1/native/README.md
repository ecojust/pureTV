# Native regression evidence

最终快照运行 `testDebugUnitTest lintDebug`，**66 项测试全部通过**，lint 无错误。3 项 warning 与基线完全相同：AGP 版本提示、固定横屏、测试夹具中未使用的 license 资源。结构化结果及相对路径见 [summary.json](summary.json)。

| 原始运行 | 结果 | 日志与报告 | 确切输入 |
| --- | --- | --- | --- |
| baseline | 29 项通过，lint 通过 | [日志](baseline/build.log)、[测试报告](baseline/reports/tests/testDebugUnitTest/index.html)、[lint](baseline/reports/lint-results-debug.html) | [源码](baseline/source.tar.gz)、[逐文件 SHA256](baseline/source-inputs.json) |
| current-1 | Java 编译失败；未执行测试或 lint | [原始日志](attempt-1-compile-failure/build.log) | [失败源码](attempt-1-compile-failure/source.tar.gz)、[SHA256](attempt-1-compile-failure/source-inputs.json) |
| current-2 | 62 项执行，7 项失败；未执行 lint | [日志](attempt-2-fixture-failure/build.log)、[失败报告](attempt-2-fixture-failure/reports/tests/testDebugUnitTest/index.html) | [失败源码](attempt-2-fixture-failure/source.tar.gz)、[SHA256](attempt-2-fixture-failure/source-inputs.json) |
| current-3 / final | 66 项通过，lint 通过 | [日志](final/build.log)、[测试报告](final/reports/tests/testDebugUnitTest/index.html)、[lint](final/reports/lint-results-debug.html) | [测试源码](final/source.tar.gz)、[SHA256](final/source-inputs.json) |

各次运行的原始 JUnit XML 位于对应 `test-results/`；lint 的原始 XML、HTML、文本报告保存在 `reports/`。最终测试分布为 LanGameServer 18、MainActivity 19、WifiControllerDiscovery 7、WifiControllerServer 22。完整源码压缩包包含实际执行的测试版本及其资源，不包含工具链、构建产物或缓存。

current-1 的失败来自 `onCreate(Bundle state)` 与 lambda 参数同名。current-2 的失败来自自定义 NSD shadow 静态记录未在用例之间自动重置；两个测试类随后在 `@Before` 显式重置。最终完整运行同时包含这些修复和新增 SDK `hello` / `ping` 回归，未复用旧测试结果充当最终结果。

测试在 **Robolectric Android API 28** 中执行，TCP / WebSocket 使用真实 Java loopback socket。NSD 使用自定义 shadow 记录 `NsdManager` 注册及撤销调用、注入异步回调，**没有验证真实多播发现、实体 ESP32 或 Android TV 实机**。这份归档也不代表浏览器游戏验收或 APK 安装验证。

在此目录执行 `sha256sum --check SHA256SUMS` 可检查归档完整性。源码压缩包内路径统一从 `resource/game-kit/android/` 开始，`source-inputs.json` 的键相对于该目录。baseline 对应干净提交 `216edb1c587c43580e72cff8ff4e8f68d25f2ddd`；final 在父提交 `a5fd8b2adc7f2df2f319b495595d9a4f5a893e7e` 上包含工作区改动，以归档源码及其哈希为准。

复现需 JDK 17、Android SDK Platform 35 / Build Tools 34.0.0、Gradle 8.9，以及下载 Maven 依赖的网络。以下命令从本目录提取独立快照；将 JDK、SDK、Gradle 路径替换为本机安装路径：

```bash
native_repro_dir=$(mktemp -d)
tar -xzf final/source.tar.gz -C "$native_repro_dir"
export JAVA_HOME=/absolute/path/to/jdk17
export ANDROID_HOME=/absolute/path/to/android-sdk
GRADLE_USER_HOME="$native_repro_dir/gradle-cache" /absolute/path/to/gradle-8.9/bin/gradle \
  --no-daemon --max-workers=2 \
  -p "$native_repro_dir/resource/game-kit/android" testDebugUnitTest lintDebug
```

更换压缩包即可复现 baseline 或失败源码。历史环境的 Gradle 分发地址与校验值、依赖版本记录在 `summary.json`；实际执行的启动脚本和测试 JVM 网络配置分别保存在 [environment/run-gradle.executed.sh](environment/run-gradle.executed.sh) 与 [environment/test-network.executed.init.gradle](environment/test-network.executed.init.gradle)。它们是原始执行记录，包含当时的代理与路径，不能直接作为通用启动脚本使用。普通直连环境无需这些代理设置；受代理管理的环境应配置自己的代理和 CA 信任，保留 TLS 校验。

**所有 `/workspace/scratch/…` 引用均为本次环境的临时路径**，包括原始日志、HTML 源码链接、执行脚本和 `environment/*original*` 元数据。交接使用本目录的相对路径与源码归档，不依赖临时目录。未归档工具链、Gradle 缓存或本地信任库。baseline 前两次网络准备失败的原始日志另存于 `baseline/environment-attempts/`，它们记录环境修复过程，不代表业务测试失败。

# Tank TV 预览版构建

当前发布版本为 `0.2.0-preview.2`，Android `versionCode` 为 `4`。预览包含重新实现的规则、35 个关卡、原生比例画面与声音，尚有 [reference.md](reference.md) 所列的逐帧还原边界。

```sh
cd resource/launcher/puretv
./gradlew :tank:assembleRelease
```

输出在 `resource/apps/tank/build/outputs/apk/release/tank-release-unsigned.apk`。发行构建未配置签名，不会修改公开资源清单，也不会替换已发布 APK；安装本地测试包前需要另行使用本地测试密钥签名。

Tank 所需素材已在其源码资源目录中，无须 Jackal 的外部素材参数。素材与地图来源见 [reference-art-audio.md](reference-art-audio.md) 和 [reference.md](reference.md)。

如需同时构建 Jackal 预览，先按其构建文档从已发布 APK 恢复素材，再显式指定目录：

```sh
./gradlew :tank:assembleRelease :jackal:assembleRelease \
  -PjackalArtworkDir=/absolute/path/to/visual-data
```

Jackal 的素材提取、目录结构及打包校验见 [Jackal 预览版构建](../../jackal/docs/local-preview-build.md)。上述构建命令不会上传或发布两个预览包。

规则与 Android 宿主验证：

```sh
# 从仓库根目录运行
node --test resource/apps/tank/tests/game.test.cjs
# 从 resource/launcher/puretv 运行
./gradlew :tank:testDebugUnitTest :tank:lintDebug
```

兼容性回归（从仓库根目录，先安装 desktop 依赖及 Playwright 浏览器）：

```sh
node resource/apps/tank/tests/compatibility.mjs
```

检查目标为 Chrome 61 语法与 ES2017，并模拟旧引擎缺失的 API；可用 `TANK_TEST_ASSETS=/absolute/path/to/extracted/apk/assets` 校验 APK 内的实际网页资源。此测试不等同于电视实机验证。

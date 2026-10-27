# Tank TV 本地预览构建

当前源码构建版本为 `0.2.0-preview.1`，Android `versionCode` 为 `3`。预览包含重新实现的规则、35 个关卡、原生比例画面与声音，尚有 [reference.md](reference.md) 所列的逐帧还原边界。

```sh
cd resource/launcher/puretv
./gradlew :tank:assembleRelease
```

输出在 `resource/apps/tank/build/outputs/apk/release/tank-release-unsigned.apk`。发行构建未配置签名，不会修改公开资源清单，也不会替换已发布 APK；安装本地测试包前需要另行使用本地测试密钥签名。

Tank 所需素材已在其源码资源目录中，无须 Jackal 的外部素材参数。素材与地图来源见 [reference-art-audio.md](reference-art-audio.md) 和 [reference.md](reference.md)。

如需同时构建 Jackal 本地预览，显式指定它的本机参考目录：

```sh
./gradlew :tank:assembleRelease :jackal:assembleRelease \
  -PjackalArtworkDir=/absolute/path/to/visual-data
```

Jackal 的目录结构、打包校验及本地使用范围见 [Jackal 本地预览构建](../../jackal/docs/local-preview-build.md)。上述构建命令不会上传或发布两个预览包。

规则与 Android 宿主验证：

```sh
# 从仓库根目录运行
node --test resource/apps/tank/tests/game.test.cjs
# 从 resource/launcher/puretv 运行
./gradlew :tank:testDebugUnitTest :tank:lintDebug
```

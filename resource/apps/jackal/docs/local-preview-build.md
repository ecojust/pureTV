# Jackal TV 本地预览构建

当前源码构建版本为 `0.2.0-preview.1`，Android `versionCode` 为 `2`。本预览用于逐项对照原作玩法、关卡、画面与声音；它不是已经完成逐帧验证的公开发行版。

渲染器需要的图集、过场画面和音符参考数据不放在公共 `src/main/assets/art` 中。开发者必须用 `-PjackalArtworkDir` 显式提供本机素材目录。构建只将所需文件暂存到 Android Gradle Plugin 管理的 `resource/apps/jackal/build/generated/assets/prepareJackalPreviewAssets/art/`，再加入预览 APK；不会将其复制进源码目录，也不会修改 `resource.json` 或公开 APK。

## 构建命令

从仓库根目录进入 Android 工程，然后指定目录：

```sh
cd resource/launcher/puretv
./gradlew :jackal:assembleRelease \
  -PjackalArtworkDir=/absolute/path/to/visual-data
```

也可以同时生成 Tank 预览：

```sh
./gradlew :tank:assembleRelease :jackal:assembleRelease \
  -PjackalArtworkDir=/absolute/path/to/visual-data
```

输出在 `resource/apps/jackal/build/outputs/apk/release/jackal-release-unsigned.apk`。该命令不配置发行签名，产物未签名，不能直接安装；本地测试需要另行使用本地测试密钥签名。本流程不发布 Release、不推送应用市场，也不覆盖资源目录中已发布的 APK。

`jackalArtworkDir` 可使用绝对路径；相对路径以 `resource/apps/jackal` 工程目录为基准。未提供参数、目录不存在、必要文件缺失或为空、PNG 文件头错误、JSON 无法解析或缺少必要结构时，APK/AAB 打包明确失败。检查不会退回旧版本 APK 或替代图像。

普通测试不要求外部素材：

```sh
./gradlew :jackal:testDebugUnitTest :jackal:lintDebug
```

未传参数的资源合并会清除上次暂存的外部素材，避免构建偷偷复用本机旧文件。APK 打包检查仍会拒绝缺素材的产物。

## 外部目录

目录应保留参考素材的相对路径，至少包含：

```text
visual-data/
├── levels/sprites.json
├── fonts/hud.png
├── boss_patches.json
├── data/audio-score.json
├── textures/
│   ├── stage_01_tiles.png
│   ├── stage_01_sprites.png
│   └── … stage_06_tiles.png / stage_06_sprites.png
└── cinematics/
    └── <场景名>/timeline.json + tiles.png
```

场景包括 `title_1p`、`title_2p`、`intro_1p`、`intro_2p`、`attract`、`continue_yes`、`continue_no`、`game_over`、`ending`、`ending_restart`、`stage_clear_01`～`stage_clear_05`、`stage_load_01`～`stage_load_06`、`continue_load_01`～`continue_load_06`。实际清单以 [build.gradle](../build.gradle) 中的 `requiredArtwork` 为准，和原生资源白名单对应；不会把目录中的任意其他文件打进 APK。可选的 `provenance.json` 和 `scene-updates-provenance.json` 会随本地预览保留来源记录。

还需要六关阶段变化与最终基地动画所用的 297 张 PNG，完整相对路径保存在 [scene-update-paths.json](../src/main/assets/scene-update-paths.json)。这份固定清单同时供 Gradle 和 Android 白名单使用；它只包含文件名，不包含图像。图形阶段元数据已在 `scene-updates.js` 中，无须另外打包 `texture_phases.json` 或阶段 timeline JSON。

构建对暂存 PNG 进行无损 IDAT 重压缩：保留所有非 IDAT 块，只把 IDAT 的 zlib 压缩级别改为 9，并验证重压缩前后解压得到的图像字节完全相同。外部原始文件不改动。每个文件的来源 SHA-256、生成 SHA-256 和前后大小写入暂存目录的 `art/preview-asset-provenance.json`，避免把生成文件摘要误当成来源摘要。

完整六关的阶段图集明显多于旧版简化游戏，Jackal 预览 APK 的大小检查上限因此从 5 MiB 调整为 16 MiB；不会通过删除阶段或图形来满足旧上限。可运行 `:jackal:verifyReleaseSize` 检查构建产物，仍须传入素材参数。

`data/audio-score.json` 必须是 `puretv.jackal.audio-score.v1` 格式，包含 `scores` 和 `envelopes`。音符由 Web Audio 本地合成，不加载 ROM 或模拟器。

## 来源与使用范围

当前本机对照资料来自 [HungLo2020/Jackal 的固定提交](https://github.com/HungLo2020/Jackal/tree/b6d90a1c999dcb9d6f82cdc0e88ef876aac4ee77/assets)，每个参考文件的 URL 和摘要保存在素材目录的 `provenance.json`。音符转换方式见 [transcribe-audio.py](transcribe-audio.py) 及转换结果中的 `source`。

这些原作相关图像和音乐资料的权利属于 Konami，现有资料不构成再发行授权。本参数是明确的本地对照预览入口，不是公开分发素材的授权；素材没有加入公共源码，本次构建也不上传包含它们的 APK。独立规则实现及还原边界见 [reference.md](reference.md)。

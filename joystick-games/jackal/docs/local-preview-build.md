# Jackal TV 预览版构建

当前发布版本为 `0.3.0`，Android `versionCode` 为 `3`。此版本修复旧版电视 WebView 启动与玩家状态，并提供手机浮动摇杆。尚未完成电视实机逐帧对照；剩余差异见 [reference.md](reference.md)。

[已签名 APK](../jackal-0.3.0.apk?raw=1) 与源码版本、签名、大小和摘要记录在 [resource.json](../resource.json)。本次 APK 从对应源码重新构建，沿用 pureTV 发布证书，可覆盖此前版本。

## 恢复构建素材

完整图集、演出时间线和音符数据已包含在发布 APK 的 `assets/art/` 内，源码不另存一份相同的大型素材。先从资源目录中的 APK 恢复所需文件：

```sh
# 仓库根目录
python resource/apps/jackal/tools/extract-artwork.py --output /tmp/puretv-jackal-art
```

提取工具先核对整个 APK 与资源清单的 SHA-256、大小，再核对全部 367 项必需素材与 APK 内 `preview-asset-provenance.json` 的逐文件大小、摘要。它保留另三份来源清单，不联网下载，也不会覆盖未由此工具创建的目标目录。

也可以显式提供同结构的外部素材目录。目录至少包含 `levels/sprites.json`、`fonts/hud.png`、`boss_patches.json`、`data/audio-score.json`、六关基本图集，以及演出和阶段变化图集。阶段图集完整路径见 [scene-update-paths.json](../src/main/assets/scene-update-paths.json)，其他必需项由 [build.gradle](../build.gradle) 的 `requiredArtwork` 定义。

## 构建与验证

```sh
# 仓库根目录；浏览器测试使用已恢复的素材
JACKAL_ART_DIR=/tmp/puretv-jackal-art node resource/apps/jackal/tests/compatibility.mjs
node resource/apps/jackal/tests/controller.mjs
JACKAL_ART_DIR=/tmp/puretv-jackal-art node resource/apps/jackal/tests/capture.mjs
node resource/apps/jackal/tools/build-levels.cjs --check
node --test resource/apps/jackal/tests/game.test.cjs resource/apps/jackal/tests/enemies.test.cjs resource/apps/jackal/tests/scenes.test.cjs

cd resource/launcher/puretv
./gradlew :jackal:assembleRelease :jackal:verifyReleaseSize \
  :jackal:testDebugUnitTest :jackal:lintDebug \
  -PjackalArtworkDir=/tmp/puretv-jackal-art
```

也可添加 `:tank:assembleRelease` 一并构建坦克大战。浏览器测试需要 `desktop` 的 npm 依赖及 Chromium；可通过 `CHROMIUM_PATH` 指定浏览器。

Gradle 输出位于 `resource/apps/jackal/build/outputs/apk/release/`，默认未签名。目录内已发布 APK 使用 pureTV 发布证书签名。构建命令不会自行上传、改写资源表或替换公开 APK。

素材仅暂存到 Gradle 管理的生成目录，不写入 `src/main/assets/art/`。未传参数时会清理旧的暂存素材；文件缺失、格式或结构错误时，打包明确失败。单元测试与 lint 可以不传素材参数。

PNG 暂存过程只进行无损 IDAT 重压缩，保留其他块及全部解压图像字节。原始输入文件不修改，生成清单分别记录输入和输出摘要。完整六关预览 APK 的大小上限为 16 MiB。

## 来源说明

参考资料来自 [HungLo2020/Jackal 的固定提交](https://github.com/HungLo2020/Jackal/tree/b6d90a1c999dcb9d6f82cdc0e88ef876aac4ee77/assets)，每份资料的 URL 和摘要保留在 APK 内的来源清单。音符转换方式见 [transcribe-audio.py](transcribe-audio.py) 和 [reference-audio.md](reference-audio.md)。

独立编写的规则、渲染及合成器代码与原作图像、地图、演出和音乐是不同的版权来源。原作相关内容仍归 Konami，不能统称为项目 MIT 素材。APK 中的来源说明保留最初本地对照构建时的记录；恢复构建输入不会改变其版权、许可或来源声明。详见 [参考与权利边界](reference.md#sources-and-rights)。

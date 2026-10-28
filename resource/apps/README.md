# 电视应用

每个软件目录直接包含可安装 APK、对应源码、作者、许可证及校验值。完整应用列表、版本、作者及封面见 [资源总表](../README.md)。

后续新增应用必须与 APK 一起提供同目录的 `logo.svg`（64×64、UTF-8、不超过 8 KiB），用于管理器下载缓存及启动器布局图标；README 和校验清单应包含该文件。完整规范见 [应用资源与 logo.svg 约定](../README-development.md#应用资源与-logosvg-约定)。历史商店应用缺少图标时仍可下载安装。

自研应用源码在各自 src/ 中，第三方源码为 source.tar.gz。启动器位于 [../launcher/](../launcher/)。

从仓库根目录进入 `resource/launcher/puretv/`，运行对应应用模块的 Gradle 任务，例如 `./gradlew :music:assembleDebug`。各应用的具体构建命令见其 README；安装直接使用软件目录内的已签名 APK。

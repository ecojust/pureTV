# 电视应用

每个软件目录直接包含可安装 APK、对应源码、作者、许可证及校验值。完整版本、大小及封面见[资源总表](../README.md)。

Tank TV 与 Jackal TV 是独立重写的游戏。新增的 [Tank NES TV](tank-nes/) 与 [Jackal NES TV](jackal-nes/) 使用 NES 模拟核心，首次使用需从手机导入自己的 `.nes` 文件；两个应用分别保存 ROM，可与重写版同时安装。

自研应用源码通常在各自 `src/` 中。两个 NES 应用共用 [tank-nes/shared/](tank-nes/shared/) 的模拟器、局域网服务与手机手柄；各自目录保留独立包名、图标及构建配置。第三方源码为 `source.tar.gz`。启动器位于 [../launcher/](../launcher/)。

从仓库根目录进入 `resource/launcher/puretv`，运行 `./gradlew :tank-nes:assembleDebug :jackal-nes:assembleDebug` 构建两个 NES 应用。安装可直接使用各软件目录内的已签名 APK。

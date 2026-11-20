# 仓库维护工具

从仓库根目录运行下列工具。按维护对象选择入口。

| 维护对象 | 入口 |
| --- | --- |
| `resource/` 中的启动器和自研应用 | 校验 APK、签名和元数据用 [resource_catalog.py](resource_catalog.py)。更新双语首页的精选资源及完整目录用 [update-resource-index.py](update-resource-index.py)。[资源维护说明](../docs/resource-maintenance.md) |
| 电视商城 | [update-tv-store-catalog.py](update-tv-store-catalog.py) 生成商城读取的资源清单，`--check` 可只核对现有清单。[商城源码及说明](../resource/apps/putrtv-store/) |
| `fork/` 中的第三方 APK | 下载、导入、封面、校验与超限文件清单的工具集中在 [tvapp/](tvapp/)。输入文件、调用顺序与复核步骤见 [第三方 APK 维护说明](../fork/MAINTENANCE.md)。 |
| 游戏与手柄 | 原有 20 款电视游戏的 [手柄发布流程](README-controller-release.md) 与 [连接状态验收](README-controller-status-release.md) 在此维护。Game Kit 的构建入口在 [resource/game-kit/](../resource/game-kit/BUILD.md)，独立跨平台手柄游戏的打包工具在 [joystick-games/tools/](../joystick-games/tools/)。 |

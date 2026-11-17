# 管理器主题更新与兼容性方案

本次源码更新使用更明亮的默认配色，统一侧栏、卡片、按钮、表单、弹窗和键盘焦点。这些变化随 [0.5.4 安装包](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.5.4)发布；本页原始验证保留其执行日期，正式发布检查见 [0.5.4 验证记录](release-0.5.4-validation.md)。

| 主题 | 配色 | 预览 |
| --- | --- | --- |
| 晴空 / Sky | 蓝白色，默认主题 | [应用管理](theme-refresh-2026-11-06/apps-emerald.png) |
| 海盐 / Sea Salt | 浅青色 | [应用管理](theme-refresh-2026-11-06/apps-ocean.png) |
| 石墨 / Graphite | 中性灰蓝色 | [应用管理](theme-refresh-2026-11-06/apps-graphite.png) |

旧的主题 ID 与本地偏好继续有效。管理器配色不会修改电视桌面布局中的内容颜色。

原 Info 入口和页面标题改为「兼容性方案」（繁体：相容性方案；英文：Compatibility），保留 7 组、19 项 ADB 命令、用法与系统兼容性说明，移除设备兼容性名单。「无需电视 ADB 的操作」分组继续保持移除。

预览使用仓库的模拟设备数据，不能作为实体电视验证。验证结果：

- [生产构建](theme-refresh-2026-11-06/build-complete.txt)通过，包含 TypeScript 与 743 条界面文案校验。
- 主题整体调整后[完整 171 项 UI 回归](theme-refresh-2026-11-06/ui-full.txt)通过；最后加深复选框边框及改名后，[5 项相关回归](theme-refresh-2026-11-06/ui-final.txt)通过，覆盖主题切换、复选框、三语页面名称、紧凑窗口与离线阅读。
- 最终三主题共 21 组主要文字对比度均达到 4.5:1，3 组复选框边界和 3 组键盘焦点均达到 3:1。数据见 [review.json](theme-refresh-2026-11-06/review.json)。
- 目视检查覆盖连接、应用管理、紧凑兼容性方案、英文弹窗和编辑器；[960×640 页面预览](theme-refresh-2026-11-06/compatibility-compact.png)显示新名称与滚动区。

过程与源码交付见本任务[工作记录](../../history/2026-11-06-002.md)。

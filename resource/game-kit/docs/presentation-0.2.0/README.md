# 多关卡与独立界面回归

共享运行时新增动态 `levelNames` 菜单和可选本地 `GameDef.stylesheet`；没有选择主题的旧游戏沿用原界面。

- `presentation-report.json`：默认三关菜单兼容性与六关菜单／本地主题两项浏览器探针通过，测试入口为 `qa/presentation-test.mjs`。
- `input-lifecycle-report.json`：15 项既有输入生命周期探针通过，实际运行时哈希保存在原报告。
- `presentation-initial-failure.json`：首次探针立即读取下一帧状态造成的测试等待问题，原失败保留；等待可观察状态后通过，生产运行时没有因该失败改变。

这些是共享协议测试，不能代替每款游戏实际游玩、画面检查或正式 APK 验签。未进行实体电视／手机测试。各款 0.2.0 的真实输入回归和录像另存各游戏的版本证据目录。

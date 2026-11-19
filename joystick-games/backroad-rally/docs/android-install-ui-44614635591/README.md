# Backroad Android 安装现场 · 44614635591

原 run attempt 1 / QA 源 `cf26e19bf57524a9c4ce53ea77bd30824cbcd54d` 两模式均在原 APK 的 `adb install -r` 240 秒超时，游戏未启动，SDK/玩法检查为零。原失败没有改写。

两张 1920×1080 原图均已实际逐张目视：Google Play Protect 的 **Unsafe app blocked**，目标 **Backroad Rally**；理由为应用面向较旧 Android，缺最新隐私保护。可见 **More details**（折叠、已聚焦）和 **Got it**，当前没有 **Install anyway**。XML 的包为 `com.android.vending`，前台确为 `PlayProtectDialogsActivity`；105,020,455 字节原包会话已 committed、进度 0.9，但目标包不存在。第二模式仍带有第一模式未结束会话。

原 APK 的 minimum SDK 为 **26**，target SDK 为 **29**，compile SDK 为 **35**。日志保留单项 APK Analysis SAFE 与最终 POTENTIALLY_UNWANTED；本证据不能据此声明恶意或唯一永久原因。未点击任何控件、未修改系统验证设置、未重装或重签。

[findings.json](findings.json) 绑定截图、XML、前台、session 与原 CLI 日志。`original-export/` 保留不可变导出 `2e0db026e138bbc8b3c5fbbb4f06ef9d109449f0` 的 92 个运行/现场/来源文件，共 9,545,825 字节；全部通过 Git blob 与 export manifest 逐字节校验。重复 APK 与完整 artifact-source 未再次下载。

后续仅可用另行授权的受限助手重新验证这一个原 APK，正常展开真实 More details，立即取新 XML/PNG；只有实际出现本应用明确 Install anyway 才能执行该单应用安装选择。原报告始终保留，不能把展开计划当已安装。

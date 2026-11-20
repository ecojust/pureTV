# Backroad Android target35 / query 原运行 v6

固定生产源 `4b6cf0b8cba288eae66bcae2ef2784acc279a695`，run **44625676430 / attempt1**。build/sign成功，runtime失败；原61份运行文件共6,898,376字节从只读export `5f16d7a757f1c54a07b4cef521018b00b2c921d7`恢复，Gitblob与manifest逐项一致。

两模式新APK普通安装分别15.414秒和12.125秒成功。新失败是旧QA在renderer=loading、frames=0、poll=1时已接受stage=menu，立即严格校验而失败。Activity前台、原ADB后续仍可用；没有进入query导航/手柄/驾驶。新target35本次未再触发旧安装阻断，不因此宣称所有电视或PlayProtect行为均已解决。

20原Vitest suites/176tests、53共享QA tests与105实际Java URL策略检查通过。没有执行Robolectric/真实query导航或target35布局验证。原production大包export另因既有文件大小守卫失败；已由独立只读workflow恢复原报告。原签ZIP通过既有transfer保存到未发布draft452000118/asset769487716，不是游戏交付。首次本地内存ZIP解取遇磁盘满，未完成APK已记录哈希并删除，未假称本地包审通过。

`runtime-findings.json`保留逐模式失败、实际安装时间与限制；`../android-initial-menu-readiness-qa/`仅是单独的QA等待修正。未覆盖原失败、改游戏或重新生产派发。

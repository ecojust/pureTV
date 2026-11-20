# 修复旧游戏 Gradle 源码范围

原CI43728904722、源码a657ce24失败：Android插件实际编译了整个共享源码目录，AndroidSourceDirectorySet的include没有阻止Game Kit MainActivity进入旧游戏；其R所属包不同，导致编译错误。原CI日志由发布任务保留。

11个应用改为apply一个`integration.gradle`。其中Sync只复制明确的两份Wi-Fi类及Legacy适配器到各应用build/generated目录，不向AGP暴露原始Game Kit源码目录。显式JavaCompile、preBuild与lint依赖保证各入口先生成源码；preBuild通过configureEach名称匹配，不依赖任务何时注册。Sync也会清除生成目录里遗留的非目标文件。

本地wrapper因直连网络被拒，见run.log。经Python下载并验证仓库固定SHA的Gradle8.9后可启动，但AGP8.5.2依赖无法解析，见run-2.log；没有假称本地Android插件编译通过。

probe-init.gradle使用真实Gradle执行生产Sync脚本，仅以Java source-set提供Android扩展在该脚本中所需的接口。11款均生成且只生成3个目标文件，逐字节对原共享文件，Java编译源码集合中不含GameKit MainActivity或LanGameServer；22任务通过，见run-3.log和逐游戏sources.json。此项证明实际复制/依赖配置及源码集合，原报告保留当时“还需CI”的阶段含义；后续实际AGP构建已完成，结果如下。

11款另行执行真实aapt资源符号生成和javac编译，结果在aapt-javac/归档；这仍不是APK签名、Robolectric执行或设备测试。后续[CI43733343883](https://github.com/ecojust/pureTV/actions/runs/43733343883)以`ed925cc1`完成11款实际Android插件编译、签名、lint及共享/旧游戏[384项JUnit，0失败/0错误](../../readme-controller-support/builds/ed925cc1/runs/43733343883/junit-summary.json)，包括44项新增Activity测试。可复查[原始CI日志](../../readme-controller-support/builds/ed925cc1/runs/43733343883/workflow.log)。本次源码范围修复本身未修改共享Java生产实现；本地尝试记录及verification.json中的当时下一步保持原样。

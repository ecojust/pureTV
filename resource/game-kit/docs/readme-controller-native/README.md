# Legacy Android 原生接入验证

11款旧游戏共用Game Kit的TCP/NSD实现，通过`legacy-controller-native`适配器接入原宿主：双人游戏配置两个稳定席位，孤胆枪手单人；A/X动作A、B动作B、Y选择、START开始/暂停。短失焦和原生确认框只隔离输入，不关闭TCP，退出Activity则关闭监听与连接。

正式旧11款游戏与测试观察器来源为 `ed925cc1839da4629991ecf46fc2f625821322ce`。[CI43733343883](https://github.com/ecojust/pureTV/actions/runs/43733343883)已完成实际Android Gradle编译、Robolectric/JUnit、lint和签名；共享宿主与旧游戏合计[384项JUnit全部通过，0失败、0错误](../readme-controller-support/builds/ed925cc1/runs/43733343883/junit-summary.json)。原始28份测试报告含本次新增的44项旧宿主Activity集成用例。参见[原始CI日志](../readme-controller-support/builds/ed925cc1/runs/43733343883/workflow.log)及[独立产物核验](../readme-controller-support/builds/ed925cc1/runs/43733343883/independent-artifact-verification.json)。

这44项覆盖实际TCP到HostBridge映射、快速按键与sync抑制、焦点变化保持端口和会话、双人独立断线及原席位恢复（孤胆枪手则拒绝额外玩家），以及Activity退出关闭监听和连接。Robolectric与JVM网络验证不等同于实体电视或ESP32测试。

旧11款在此前`64f2c94e`构建中的APK与`ed925cc1`包的字节数及SHA256逐款相同；[旧签名清单](../readme-controller-support/builds/64f2c94e/runs/43730701526/export/packages/)和[当前签名清单](../readme-controller-support/builds/ed925cc1/runs/43733343883/export/packages/)保留各自来源。9款Game Kit APK仍绑定各自的`a657ce24`签名来源，没有将新的观察器源码冒充游戏包来源。

20个正式APK的Android运行验收由[独立运行记录](../readme-controller-support/android/)说明，构建/JUnit通过不能推断该项已全部通过；更新本说明时[43736021527](https://github.com/ecojust/pureTV/actions/runs/43736021527)仍在8批执行。没有实体电视或ESP32验收声明。

- `compile-attempt-1`：独立aapt缺少Gradle通常注入的namespace，11款均在生成R之前失败；不是生产Java错误。
- `compile-attempt-2`：工具从原build.gradle读取namespace写入临时Manifest，11款真实Android资源符号生成和生产Java编译通过。随后宿主补充房间重新创建时清除输入，以及在页面尚未就绪时继续隔离，故这轮不是最终源码证据。
- `compile-attempt-3`：该轮冻结的11款生产代码全部通过，开始/结束sourceHashes一致，归档时再次逐字节核对。这是Android API35/JDK17编译，不是Robolectric执行、APK签名或实体电视验收。

原执行脚本、命令、输出日志和临时Manifest保留；生成的class/R缓存不入库，可按报告命令重建。独立工具在`legacy-controller-native/tests/compile-hosts.py`，输出必须在仓库外。本地编译只提供该轮源码证据，后续实际Android Gradle/JUnit结果以上方`ed925cc1`归档为准。早期[源码范围修复](gradle-source-fix/README.md)及[资源名单测试修复](worlds-asset-fixture-fix/README.md)保留原失败、准确执行脚本和来源，不覆盖为成功记录。

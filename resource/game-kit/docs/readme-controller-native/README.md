# Legacy Android 原生接入编译证据

11款旧游戏共用Game Kit的TCP/NSD实现，通过`legacy-controller-native`适配器接入原宿主：双人游戏配置两个稳定席位，孤胆枪手单人；A/X动作A、B动作B、Y选择、START开始/暂停。短失焦和原生确认框只隔离输入，不关闭TCP，退出Activity则关闭监听与连接。

- `compile-attempt-1`：独立aapt缺少Gradle通常注入的namespace，11款均在生成R之前失败；不是生产Java错误。
- `compile-attempt-2`：工具从原build.gradle读取namespace写入临时Manifest，11款真实Android资源符号生成和生产Java编译通过。随后宿主补充房间重新创建时清除输入，以及在页面尚未就绪时继续隔离，故这轮不是最终源码证据。
- `compile-attempt-3`：最终生产代码11款全部通过，开始/结束sourceHashes一致，归档时再次逐字节核对。这是Android API35/JDK17编译，不是Robolectric执行、APK签名或实体电视验收。

原执行脚本、命令、输出日志和临时Manifest保留；生成的class/R缓存不入库，可按报告命令重建。独立工具在`legacy-controller-native/tests/compile-hosts.py`，输出必须在仓库外。最终33+11个新增Activity集成测试在发布CI执行：实际TCP到HostBridge映射/快速按键/同步抑制、焦点变化保持端口与会话、双人独立断线/席位或单人拒绝额外演员、退出关闭监听和连接；本地编译结果不能代替这些尚待CI的执行结果。

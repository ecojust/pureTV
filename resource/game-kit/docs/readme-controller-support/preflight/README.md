# Game Kit / 共享TCP前置验证

- 共享原生TCP：27项真实loopback TCP/JUnit测试全部通过，覆盖默认63485、九键、快速脉冲、别名聚合、同步、断线、后台输入隔离、Y=SELECT兼容模式、双手柄席位和原ID重连。原始Robolectric测试文件仅移除runner/Config注解和对应imports，使用JDK17 + JUnit4.13.2 + org.json20240303执行同一测试方法。准确原始／执行源码、服务器源码、依赖SHA及日志留存；**不冒充Android框架或NSD实测**。
- 公共runtime：第一次15项旧回归通过；第二次加入native焦点冻结／恢复仍需新START后，16项全部通过。两次准确runtime和执行脚本均保存。此处是手动RAF与探针模型的协议夹具，不是实际游戏录像或设备帧率。
- Android正式builder成功编译当前共享宿主和Neon0.1.2c3，未签名APK436637字节，receipt保存全部来源；此APK只作为编译验证，不交付安装。最终正式签名由主任务另行完成。
- Neon地址／端口文案更新后，npm build与build:check通过；game.js520792字节，model未改变。旧Mac0.1.3包与其证据不改。

[准确来源与范围](verification.json)。完整Robolectric Activity/NSD回归、20款实际普通输入/画面与正式APK由主任务CI及最终QA另行记录。新增Activity测试覆盖三轮临时失焦，以及备用端口下两代网络refresh排队而不关闭原TCP连接；本目录不提前声称这些未执行测试通过。

JVM执行命令：

```sh
javac -cp 'deps/*' -d classes tcp-jvm/WifiControllerServer.java tcp-jvm/WifiControllerServerTest.java
java -cp 'classes:deps/*' org.junit.runner.JUnitCore com.ecojust.gamekit.WifiControllerServerTest
```

依赖下载地址分别为Maven Central：org/json/json/20240303/json-20240303.jar、junit/junit/4.13.2/junit-4.13.2.jar、org/hamcrest/hamcrest-core/1.3/hamcrest-core-1.3.jar，哈希见verification.json。这里保存的MainActivity.java是首次TCP测试时源码快照（尚未加入后续网络refresh保持修改），并未在该JVM测试中执行；最终宿主源码哈希由verification.json和unsigned-build-receipt.json记录。

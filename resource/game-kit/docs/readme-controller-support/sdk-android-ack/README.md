# Android ADB 转发关闭时的 ACK 观察夹具修正

第二轮实际Android运行43734122992中，Coast和Cozy均通过前8组游戏、断线、双席操作，最后全消息ACK断言失败。GameKit的Neon、四则二十四、夜桥接力、异形装箱、窗口装配也仅在同一收尾断言失败；叠塔工匠完整通过。缺失全部集中在第一条连接点击原虚拟页断开时的最后一批按键，没有发生在正常连接或已等ACK的第二SDK操作中。

| 游戏 | 第一连接缺失的原消息 |
| --- | --- |
| Coast | seq36 A tap |
| Cozy | seq36 RIGHT down、37 A down、38 RIGHT tap、39 A tap |
| Neon | seq37 A tap |
| 四则二十四 | seq30 RIGHT tap、31 A tap |
| 夜桥接力 | seq31 A tap |
| 异形装箱 | seq30 RIGHT tap、31 A tap |
| 窗口装配 | seq29 A tap |

每条具体消息、时间戳及原报告哈希见missing-ack-analysis.json。original/保留9份实际APK原始report、精确执行脚本、已存在的driver/仪器输出和截图，未用修复后的成功覆盖。Used Car的emulator offline属于另一条基础环境故障，不归入ACK结论。

旧观察代理调用client.pipe(upstream)，默认在客户端EOF时立刻结束上游。原虚拟页releaseAll后调用原SDK.disconnect；ADB的转发流读到EOF会关闭整个通道，不能依赖普通TCP半关闭继续保留回程。此架构由AOSP sockets.cpp中的EOF→local_socket_close→remote_socket_shutdown/A_CLSE路径解释；原源码与URL/哈希附在本目录，明确不冒充CI adb二进制的精确源码版本。

只修改QA代理为pipe(end:false)，客户端结束后等待这条连接已发送消息的真实ACK，最多2秒，再送FIN。connectionEvents记录EOF时pending序号、FIN原因和实际等待时间。超过上限仍保留缺失，最终严格每消息ACK断言照常失败；没有伪造回执、修改原SDK或生产接收器。断线动作也先等真实游戏帧同时看见RIGHT+A，再点击原虚拟页按钮。

## 修正验证

proxy-close-test.mjs用真实TCP套接字、未修改SDK、受控延迟ACK接收器及EOF即关闭整个通道的中继做夹具边界测试。旧代理14条发出、0条ACK，稳定重现截断；新代理14/14；故意扣留最后一条时只有13/14，并记录seq14超时未确认。这只证明测试夹具行为，不冒称Android或游戏实测。

完整Tetris attempt-10通过9/9组，93条消息=93ACK，无传输/页面错误。三次关闭均all-acked后FIN、pending为空，最大等待2.233ms。保留4695版本执行脚本及独立截图审查。随后仅把heldFrame读取统一为已有的receiver.players || controllers入口，代理片段完全未变；最终c754版本完整四则二十四通过8/8组、64/64ACK，并保存了实际RIGHT+A held帧。GameKit没有双席项，所以完整范围为8组。

verification.json核验88个实际执行源哈希以及前后两版代理片段一致。最终run SHA为c754c4c79f888419051c05a728ec356d802016f38de0c3680a3aaaa8874740e2。后续实际20 APK重跑结果属于独立Android CI，这份前置记录不宣称它们已通过。

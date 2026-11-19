# Turbo Kart Rush Android 原生首轮运行证据

原 run [44600152694](https://github.com/ecojust/pureTV/actions/runs/44600152694)、attempt 1、源 `06f1ab2b77e45d5fabcbd7233f8d3e9279a9d5c7`，不可变导出 `e01ab3ba25008cbbcbfa718321afa49fe6eb2331`。三款批次 build / sign 成功，Turbo 两种运行模式失败；同批其他游戏结果不作为本款验收依据。

独立核验全部 **544 个原导出文件、本款 165 份冻结源码输入、9 份 APK 资源**通过，原 source selector 重算清单一致，`apksigner` / `aapt` 确认固定证书与身份。APK 为 **545,968 字节**，SHA-256 `f4663f43839f45a24a913a93067e77c07528439cdc6f234aba6df1e877d03e6c`，包名 `com.ecojust.joystick.turbokartrush`，版本 `0.1.0 / 1`。APK 保留在 scratch，未放入游戏发布目录。见 [实际核验脚本](verify-export.py) 与 [independent-verification.json](independent-verification.json)。

normal 和 occupied 均通过初始化菜单、原 SDK 连接及 ID、选角色和进入四赛道选择页。在第 4 个计划步骤开始比赛时，原 QA 的 `run.py:574` 单次直接快照读取抛出 `RemoteDisconnected`，尚未进入后面的 60 秒真实状态等待。两份原 logcat 同时记录 `Observer.java:102` 的 `WebView snapshot timed out`（10 秒回调门槛）。失败后 ADB 的 logcat、包诊断和清理命令仍正常返回。具体原行与来源哈希见 [runtime-analysis.json](runtime-analysis.json)。

`instrumentation.log` 的 `Process crashed` 没有时间戳，而原清理命令包含成功 `force-stop`；该短串不能单独证明自发游戏崩溃。现有证据也未证明具体的 WebView 延迟原因。原截图仅为连接后的菜单，录像保留到失败，不能据此声称已完成驾驶或取消输入验收。

通用 QA 修复 `c5ad63e8c6a0ccfada5f763d1d26afa27f45002e` 已由主任务保存，用有界的新鲜快照重试处理此类读取边界；本档案不冒称修复后的原生验证已经通过。9 个资产均为平铺文件，可沿用现有 runtime-only 工作流复验原签名包，无需重编译或重签。

原报告、执行源码、命令日志、菜单截图和录像均保留原字节。完整 job 日志为 [original-runtime-job.log](original-runtime-job.log)，435,596 字节、SHA-256 `f91a513407f1f8f2ecd2caf75488548231b68cf491795fde212d9bcb9232ed5d`；先前因 run 未结束和存储 403 未取得日志的尝试另存，未覆盖。未修改生产代码、未测试实体电视或 ESP32，当前不计正式交付。

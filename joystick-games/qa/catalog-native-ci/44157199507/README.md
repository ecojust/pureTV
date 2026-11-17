# Android adventure-01 原包与运行证据

源码 `dfae2fb0979314424ef3e4f2c7cb7cfcac91885d`，原 run [44157199507](https://github.com/ecojust/pureTV/actions/runs/44157199507)，不可变导出 [`d3d9238e2028e750dfbfa55bcb32685a0cb243c6`](https://github.com/ecojust/pureTV/tree/d3d9238e2028e750dfbfa55bcb32685a0cb243c6)。383 个文件、45,119,810 字节全部大小/SHA256 一致；296 份归档源码与冻结 Git 逐字节相同。

两款 APK 与 Observer 通过独立固定证书、包名/版本、ZIP 全内容、资产及完整源清单核对。`frozen-release-verifier.log` 是本地隔离冻结源码执行的 `android-release.py verify`；为了调用其合同函数设置原 source/run 标识，不是新 GitHub 运行或实际设备测试。确切源码物化脚本、补充独立核验脚本及其清单保留。

Emberbrood 的 normal/occupied 两模式各 53 项原 SDK 检查通过，14 张原图全部复核，未见触控层遮挡或主要操作裁切。GLUP 两模式都在第 8 项后失败：走到 NPC 自动触发对话，计划下一步直接验证跳跃，仍处于 talking 状态。完整原始报告、执行源、两张连接图及摘录诊断保留；尚未修订路线或重跑。此处不宣称 GLUP 运行通过，也不宣称双平台交付。

`original/` 保存原运行文件（视频除外）与签名收据；`archived-original-files.json` 精确对应不可变导出路径/大小/hash。四段原视频和 APK 全部留在导出分支，未生成或改写，当前也保留 scratch 副本。实体电视与 ESP32 未测。

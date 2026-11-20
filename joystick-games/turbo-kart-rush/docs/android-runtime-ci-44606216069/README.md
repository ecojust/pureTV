# Turbo Kart Rush Android 原包复验 44606216069

原运行 attempt 1 失败。QA 源为 `c5ad63e8c6a0ccfada5f763d1d26afa27f45002e`；复用原 `44600152694` / `06f1ab2b77e45d5fabcbd7233f8d3e9279a9d5c7` 已签 APK，未重新构建或签名。APK 仍为 545,968 字节、SHA-256 `f4663f43839f45a24a913a93067e77c07528439cdc6f234aba6df1e877d03e6c`。

正常端口模式通过前 5 项，随后在确认角色并打开赛道选择时读取 observer 失败。新的有界快照逻辑确实进行了三次新 GET，最终耗尽重试；此后 ADB 明确报告设备离线，录像拉取失败。占用端口模式尚未进入游戏，等待 ADB 设备 45 秒超时。现有原日志没有采集宿主内存、cgroup OOM 事件或模拟器退出码，不能据此断定 OOM 或归因于启动期 ColorBuffer 错误。唯一保留图片是菜单，不是驾驶画面。

`verify-export.py` 实际核验不可变导出 `dc8ec7aadcd7ea2357abf4c168a197a2c17b9371` 全部 237 文件、165 项原应用源输入，以及分别绑定原包源和 QA 源的共 188 项源版本。原签名校验复用上一轮独立审核，并先逐字节比较 APK 哈希一致。`original-evidence/` 保留 68 项原报告、实际执行脚本、菜单图和绑定材料；APK 二进制及重复原源副本未入文档，但已完整验证并保留在原导出中。

复查：

```sh
python3 -B verify-export.py --repo /path/to/pureTV --root /path/to/pureTV-dc8ec7aadcd7ea2357abf4c168a197a2c17b9371
```

该脚本禁止覆盖已存在的 `original-evidence/`；复查应在新的文档目录运行原脚本并保留相邻上一轮独立签名审核资料。`verification.json` 只表示证据完整性通过，`runtimeAccepted` 仍为 `false`。未执行实体电视或 ESP32 测试。

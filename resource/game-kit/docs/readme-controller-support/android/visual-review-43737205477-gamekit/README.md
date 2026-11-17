# 折光工坊、拉索桥梁实际 APK 审阅 · run 43737205477

两款候选签名 APK 在 Android TV API 36 模拟器中均通过全部 8 项手柄回归；本次逐张目视两款的菜单、游戏、暂停与重连截图，共 8 张原始 PNG。六关选择、开始/继续按钮、连接状态与地址、主要操作和游戏区域均可见，没有明显裁切。折光工坊菜单与暂停层限于游戏区域，底部手柄栏保持清晰。

| 游戏 | 候选版本 | 实际 APK 测试 | 逐消息 ACK | 视觉结论 |
| --- | --- | --- | --- | --- |
| 折光工坊 | 0.2.1 | PASS，8/8 | 79/79，2 个连接 | PASS，4 张 |
| 拉索桥梁 | 0.2.2 | PASS，8/8 | 63/63，2 个连接 | PASS，4 张 |

来源：[CI run](https://github.com/ecojust/pureTV/actions/runs/43737205477)、[原始批次报告](../43737205477/evidence/controller-runtime-kit-3/report.json)。APK 源码 `a657ce24fc4c0c5adb07a671adabb3ce604f68f8`，observer 源码 `ed925cc1839da4629991ecf46fc2f625821322ce`，执行 QA 源码 `beaffd54f7dd1620086a12518b0e8e414e452525`。

[review.json](review.json) 分开记录逐图 SHA-256、尺寸、视觉判断和实际 APK 功能结果，并校验本地签名包与受测包的 SHA 一致。[readme-asset-inputs.json](readme-asset-inputs.json) 列出新版菜单、录像及验证文档的聚合来源；仅核对录像哈希，没有逐帧审阅。README 保留“待发布”，新版本资源由 root 聚合。

镜光接力不在此次通过范围：其原始测试仍在 protocol test pause 失败，等待独立复测。因此本批次和工作流的整体失败状态均保留。没有改生产代码、原图或旧失败记录，没有进行实体电视、手机或 ESP32 测试。

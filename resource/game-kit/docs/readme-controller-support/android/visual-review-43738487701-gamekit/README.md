# 镜光接力实际 APK 最终补验审阅 · run 43738487701

候选 **0.2.2** 在独立 Android TV API 36 模拟器中通过全部 **8 项**实际手柄回归，包括九键长按与逐消息 ACK（81/81，2 个连接）。本次逐张目视原始菜单、游戏、暂停和重连截图共 4 张，并确认本地签名 APK 的 SHA 与本轮受测包一致。

六关菜单、开始/继续按钮、光路棋盘、器件说明和状态栏完整，QR、连接状态、`10.0.2.15:63485` 地址及主要操作均可见。侧栏“小提示”的末尾在视口下方；这属于保留的非主要操作区限制，本次静态截图没有证明 Android 上的实际滚动动作。

来源：[CI run](https://github.com/ecojust/pureTV/actions/runs/43738487701)、[原始批次报告](../43738487701/evidence/controller-runtime-retry-prism/report.json)。APK 源码 `a657ce24fc4c0c5adb07a671adabb3ce604f68f8`，observer 源码 `ed925cc1839da4629991ecf46fc2f625821322ce`，执行 QA 源码 `a381b69f2cad78d9466872af656b3cb28d153211`。

[review.json](review.json) 记录每图尺寸、SHA-256、视觉结论和实际功能结果；[readme-asset-inputs.json](readme-asset-inputs.json) 列出新版菜单、录像和验证文档的原始来源。录像只核对哈希，未逐帧审阅。README 仍标为“待发布”，资源由 root 聚合。

旧 run 43737205477 的 Prism 失败证据原样保留；本报告记录新的独立通过结果，不重写旧报告。本次工作流仍有其他游戏失败，不能据此称全 20 款已通过或已发布。没有改生产代码、原始图片或测试报告，未进行实体电视、手机或 ESP32 测试。

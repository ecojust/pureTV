# 图片目视结论更正

此前 [arcade-final-visual-review.json](../arcade-final-visual-review.json) 中关于 Tank 暂停、Jackal 重连及录像存在黑块的结论予以撤回。旧评审原文保留，实际截图、录像和行为报告均未修改。图片工具当时的显示不完整，被误当成了原图内容。

重新解码原始 PNG，逐像素比较整个侧栏矩形 `(1480,130)-(1880,910)`：Tank 的 gameplay / paused / reconnected 三图完全相同，Jackal 的三图也完全相同，两款的差异像素均为 **0**。原视频解码帧中的 QR 白色区和侧栏白框也实际存在；旧录像黑块判断一并撤回。原始脚本、真实 stdout/stderr 与像素哈希见 [pixel-check.stdout.json](pixel-check.stdout.json)、[correction.json](correction.json)。

两款实际 APK 完整 9/9 行为通过和原菜单预览来源保持不变。本次只读复核没有改生产代码，也没有新增运行验收；未测试实体电视、手机或 ESP32。已经启动的 API29 对照是独立证据。

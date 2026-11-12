# 0.1.1 实际游玩录像

最终 [gameplay.mp4](../gameplay.mp4) 为标准 `record.mjs` 使用最终 v2 的 14 份资产、既有键盘策略和 180 秒 recipe 捕获的实际浏览器游玩。原始 `recording.json` 已逐字节保存为 [gameplay.json](../gameplay.json)，未改写标准报告。

- 实际捕获 181.648 秒、997 帧；H.264/yuv420p 视频 6,585,443 字节，小于 10,000,000 字节。
- 普通方向键选择赤岩，Enter 开始；实际完成两圈、第 1 名，游戏用时 60.9167 秒。11 次漂移、12 次小喷、4 次氮气、2 次跳跃、7 次碰撞。
- [video-validation.json](video-validation.json) 保留大小、格式、全片解码通过的原始结果；未重复进行全片解码。
- [summary.json](summary.json) 汇总原始状态统计、来源资产、范围和命令；[script-provenance.json](script-provenance.json) 绑定实际执行的 recorder、helper、策略、recipe、postcheck 及只读策略依赖。`executed/` 为原文副本，运行时需保持原仓库导入路径。
- 双语菜单通过原 postcheck 在捕获完成后正常导航生成。18/72 秒 PNG 从已编码视频抽取，最终 JPG 来自标准录制器实际最终截图。[visual-review.json](visual-review.json) 单独记录五张图的目视结论；不宣称逐帧观看视频。

录像没有合成原生桥、虚拟时钟、模型写入或强制结果。它是自动操作普通键盘的 Chromium/SwiftShader 实玩，不是人工游玩或实体电视/手机/ESP32 拍摄；30fps 为导出参数，不是设备帧率。APK 与这 14 份资产的一致性由发布负责人另行校验。

`interrupted-attempt1/` 保留首次旧资源录制因扫码徽章修正而中止的原因、日志和 58 帧哈希。该次未完成、未生成视频，不作为验收证据；完整部分帧仍保留于本次环境 `/workspace/scratch/neon-rush-wifi-recording/`。最终成功录制路径为 `/workspace/scratch/neon-rush-wifi-recording-v2/`。

[SHA256SUMS.txt](SHA256SUMS.txt) 绑定本子目录全部归档文件；父目录正式视频与原始 metadata 的哈希见 summary 和发布清单。

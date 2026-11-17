# 交付一致性审计

百款任务已完成。当前完整范围报告为 [1–100最终报告](progress-audit-through-100.json)，原字节4280412，SHA256 `7548a0d38343ddb1c8caa1d3e8d38974a29bf7c73ab79154ecc210ecffcbb3d5`。读取起止HEAD均为 `47df656366d17c871d805dec096e30ecd30252a2`，progress保持不变；其后的收尾提交仅归档报告与更新项目规范、历史状态。

最终结果：100款、0项交付错误、621处主要发布报告引用齐全，未发现未知的缺失引用。APK最大304419字节，录像最大6170851字节，均严格小于10000000。100个模型哈希互异只说明字节不同，玩法独立性另见[规则比较](../../../../history/checks/gameplay-distinctness-review.md)。

审计重新计算实际APK／录像大小与SHA，读取ZIP和包名；所有实际APK资产与完整签名／验证／录像及存在的浏览器清单比对。**仅三个文件** game-model.js、game.js、共享renderer.js额外与发布文件及冻结Git提交逐字节比对。审计没有重新游玩、构建、密码学验签或解码视频；它将每款既有验证记录绑定到实际文件，不能替代正式验收。实体电视／手机测试仍均为false。

历史留存不完整：第17–47款155处原始来源引用涉及132个缺失路径；第1–47款另有1491项未找到匹配原件的hash-only声明。缺失原件不能从摘要重新核验。主要正式交付文件及报告引用齐全。录制中间JPEG与明确scratch引用不属于承诺打包文件；48–78中间帧清理见[48–68记录](../../../../history/published-frame-cleanup-2026-11-03.json)和[69–78记录](../../../../history/published-frame-cleanup-69-78-2026-11-03.json)，成片、manifest与抽样图保留。

补充[1–95清单报告](../../../../history/checks/sha256sums-audit-through-95.json)和[96–100清单及95／96测试双来源报告](../../../../history/checks/final-listed-checksums-and-test-sources.json)，合计100份清单3863个列出文件全部匹配。此项只核对列出文件，不声称清单覆盖未列出文件；95／96实际测试版本另与执行归档和测试提交比对，生产签名来源不混用。补充[实际脚本](../../../../history/checks/audit-final-listed-files.py)支持显式 `--root`，报告内保留确切命令及原执行位置。

[1–71 v2报告](progress-audit-through-71-v2.json)与[初版](progress-audit-through-71.json)均保留原字节供追溯；v2记录了替换原因及初版SHA，不覆盖或追溯重写原结果。报告内scratch路径是原执行位置，不保证跨环境仍存在。

主脚本[audit-game-deliveries.py](../../../../tools/audit-game-deliveries.py)含14个纯验证函数正／负例。输出必须位于被审仓库外；执行时保持HEAD与进度稳定，再原样归档报告。新环境显式指定实际路径：

```bash
python3 tools/audit-game-deliveries.py \
  --root /absolute/pureTV --through 100 \
  --aapt /absolute/android-sdk/build-tools/34.0.0/aapt \
  --output /absolute/scratch/progress-audit-through-100.json
```

范围是生成时的当前版本；previousReleases旧版不在主审计范围。签名产物、GitHub提交、GitHub Release和Gitee发布分别记录；本次完成的是正式签名产物与GitHub master提交，没有GitHub Release／Gitee发布。

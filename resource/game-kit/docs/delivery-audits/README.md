# 交付一致性审计

当前有效基线为 [1–71 v2报告](progress-audit-through-71-v2.json)。[初版](progress-audit-through-71.json)保留供追溯；v2记录替换原因与初版SHA256。报告为生成时原字节，内部scratch路径是原执行位置，不代表跨环境仍存在。

v2对当前1–71版本得到0项交付错误、360次正式报告引用完整、71个模型哈希互异。它重新计算APK／录像大小与SHA，检查ZIP和包名；所有APK资产与完整签名／验证／录像清单比对，**仅三个文件** game-model.js、game.js、共享renderer.js额外与发布文件及冻结Git提交逐字节比对。未重新游玩、验签、构建或解码视频，不能替代每款正式验收。

历史留存不完整：第17–47款有155处原始来源引用、涉及132个缺失路径；第1–47款另有1491项未找到匹配原件的hash-only声明。这些被明确保留为限制，不声称从摘要重新核验了原件。主要正式交付文件与报告引用齐全。录制中间JPEG与明确scratch引用不属于承诺打包文件；48–68中间帧清理清单见根history目录。

脚本 [audit-game-deliveries.py](../../../../tools/audit-game-deliveries.py)经独立只读复核，包含14个同一验证函数的正／负例。输出只允许写在被审仓库外，之后可把报告原字节归档。新环境须显式指定实际路径：

```bash
python3 tools/audit-game-deliveries.py \
  --root /absolute/pureTV --through 100 \
  --aapt /absolute/android-sdk/build-tools/34.0.0/aapt \
  --output /absolute/scratch/progress-audit-through-100.json
```

只有100款正式交付之后才运行through100；此前使用实际已交付上限。报告记录读取的HEAD、progress哈希和审计范围，忽略previousReleases旧版。所有实体电视／手机测试标记仍为false。

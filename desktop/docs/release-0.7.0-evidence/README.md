# Manager 0.7.0 游戏栏目验收

| 来源 | 验证内容 |
| --- | --- |
| 50 款已有电视版 | 按发布收据逐项核对 308,631,164 字节 APK 的 SHA-256、证书和包名。目录里的全部下载地址都返回 APK 文件头和预期长度。Backroad Rally 的 Git LFS 地址实际返回 105,176,121 字节游戏包。[逐包核对](published-game-apks.json) |
| 6 款作者在线游戏 | 在屏蔽网络的环境用客户端 Rust 代码执行准备与导出。六份结果共 4,298,386 字节，逐一与正式签名原件比对，并通过 Android SDK 验签、包名与中文名称检查。还验证了缓存被同长度错误内容替换后的修复，以及取消或失败时保留原目标文件。[逐款导出与签名记录](assembled-game-apks.json) · [正式签名原件](https://github.com/ecojust/pureTV/tree/ec8ae301945dd4eb3046d9b94f2a6671cac14571) |

在 Chromium 的 Manager 界面中验证了保存、取消、失败重试和未连接电视时加入待安装队列。「电视游戏市场」可搜索、选择历史版本、下载和查看同一待安装列表。浏览器测试通过夹具调用 Tauri 命令，APK 实际组装和导出另用上述 Rust 入口验证。[单款宿主和签发流程](https://github.com/ecojust/pureTV/pull/94)

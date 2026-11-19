# 嵌套资源 Mac 样本：原生回归的夹具失败

原 run **44591227288 / attempt 1**，源码 `490f84f9dbc07935b7f6c3797809fa5f82bdaa4f`，批次 `adventure-01`。root 触发一次生产样本；本 agent 没有重发生产构建。GLUP / Emberbrood 只是共享宿主样本，不属于九款赛车交付。

原 build job `135797680464` 失败，artifact `14563917544` 与原 job 日志直取都为 403。第一次只读 exporter 使用旧 `ded9973`，run **44591812627**：原身份选择与下载成功，证据校验步骤失败。已确认该旧脚本没有允许新 build 归档的 `.opus` / `.m4a`；首次 exporter 的具体 traceback 未能取回，保留其源版本、步骤结果和 annotations，不伪造未见的错误行。

root 随后授权改用已冻结 `490f84f` 的 exporter，同一原 run/source/attempt/batch，只读 dispatch 一次，run **44592417407** 成功。不可变导出 **`56700c7bb2f779c973f6fce98c49102475938759`** 的 [184 份原文件](original-export/) 共 **213,084 字节**，已按 Git blob 与原 manifest 的大小/SHA 双重核验，见 [export-verification.json](export-verification.json)。两次请求/响应、原失败、原输入和日志均分别保留。

确切原始结论：

- `LocalAssetServer.swift` 真实 **ARM Swift 编译成功**。13 项 HTTP 方法中 **11 通过、1 明确因大小写不敏感卷而跳过、1 夹具构造错误**；嵌套模块/模型/原始音频/通知资源、单 Range 与父目录换为 symlink 的拒绝均有实际通过记录。
- 唯一 HTTP 错误发生在最后创建超长磁盘路径的 Python `mkdir`：Darwin 返回 `OSError [Errno 63] File name too long`，当时尚未将这份夹具送入服务器。`catalog-tools` 的 16 项也只有同一种超长目录夹具错误。两处原始 traceback 见 [shared/03.log](original-export/artifact/shared/03.log)、[shared/04.log](original-export/artifact/shared/04.log)。
- `GameStorageTests.swift` 的 367 个精确 ghost 键/1 MiB/跨 bundle 隔离已在真实 Swift 编译后运行通过，见原 `shared/10.log` 与 `shared/11.log`；ControllerServer 与其余共享检查通过。
- 两款原测试与 frozen-dist 通过，但因共享测试失败，Universal App 构建被明确 `skipped`。本轮没有原生玩法或新通用包通过声明。

修正仅涉及两份测试文件，不改生产路径限制或 Swift 源。builder 测试通过受控目录枚举提供确切超长 `Path`，从而测试真实路径验证逻辑而不先触发操作系统限制；HTTP 测试发送真实超过 1024 字符的路径，验证服务器拒绝。修正后的源码 SHA、执行副本与本地结果见 [test-fixture-fix/result.json](test-fixture-fix/result.json)。本机 HTTP 测试仍明确跳过，后续真实 Mac 重验由 root 触发。

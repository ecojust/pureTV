# Mac 嵌套资源与存档回归样本：44593224015 / attempt 1

原流程 [44593224015](https://github.com/ecojust/pureTV/actions/runs/44593224015) 在冻结来源 `33e8183835f5eaf6c7361eaa41ff34c1462dfdee`、ref `build-source/racing-mac-nested-v2` 完整成功。此来源只修复上一轮两处过长路径测试夹具；保留上一轮 [44591227288](../ci-44591227288-attempt-1/) 的原失败报告。

从原不可变导出 [`b2cfc46f1a40edca7e8cf687304b70f7dcfb2a5c`](https://github.com/ecojust/pureTV/tree/b2cfc46f1a40edca7e8cf687304b70f7dcfb2a5c) 只读恢复 363 个原文件、20,558,483 字节。逐文件同时检查 Git blob SHA-1、原导出 manifest 的大小与 SHA-256，见 [export-verification.json](export-verification.json)。四个 ZIP / DMG 没有在本机再次下载，其完整验证依据为原生安装检查及原导出清单，不能把此取证描述成本机重新安装。

具体结果见 [verified-results.json](verified-results.json)：

- 原 12 个共享命令全部成功。实际 ARM Swift 编译了包含逐段 `openat` 的 `LocalAssetServer.swift`，HTTP 套件登记 13 项，12 项通过、1 项因原卷无法表示大小写冲突文件而明确跳过。对应 Python builder 大小写拒绝测试通过。原 HTTP 日志见 `original-export/build-evidence/joystick-catalog-macos-build-adventure-01/shared/04.log`。
- 原真实 HTTP 检查覆盖嵌套相对 module / GLB / OPUS / M4A / 通知文件、Range / HEAD、超长 URL、预算与索引边界、父目录 symlink 替换。测试代码、生产 Swift、harness 和编译 binary 哈希均保留；二进制按原套件设计临时删除，未冒称已归档。
- 原 GameStorage Swift 编译及执行通过，冻结测试源码包含 367 个显式键、未知键拒绝及跨 bundle 隔离。原构建 artifact 未保存该测试源码副本，因此另从确切来源提交读取到 `source-verification/`，不冒称它是原 artifact 文件。运行命令和原输出见 `shared/10.log`、`shared/11.log`。
- GLUP 与 Emberbrood 的独立 universal 包构建与 ZIP / DMG / 安装副本验证通过。两款各有 ARM 原生、ARM 占用端口、Rosetta x86_64、Intel 原生 4 份原报告；8 份报告均完成全部 9 项原玩法 / 原 SDK / 存档检查，并绑定原包 binary、来源与执行脚本哈希。

GLUP 使用 Canvas 2D，Emberbrood 使用 DOM。这是新共享资源与存档宿主的原平台回归，**不计为九款 WebGL2 赛车交付，也不验证尚未冻结的 coverage 新流程**。没有从本次结果推断 Intel WebGL2 已可用，没有覆盖或修改任何原报告。

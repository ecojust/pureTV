# 第二次 macOS 样本：构建与四种实际运行模式通过

原 run **44584471562 / attempt 1**，冻结来源 `eb450428a33ebcfa22462c6abbdc1aa2a8a8b28e`，批次 `adventure-01`。只 dispatch 一次；GLUP / Emberbrood 是共享宿主样本，不属于九款赛车交付。

直接原 build artifact `14561366662` 下载返回 403，因此只 dispatch 一次只读 build 证据导出：run **44585179567**，固定 export commit **`f40147cea0faade7163c8fde45e05d9ab50b7cfd`**。原 [完整 build 证据](original-build-export/) 共 **117 文件 / 167,483 字节**，全部按 Git blob 与原 export-manifest SHA-256 / bytes 双重校验，见 [build-export-verification.json](build-export-verification.json)。没有改写第一次失败档或本次原日志。

已核实原报告：

- 真实 Swift HTTP 8 项全部通过，耗时 16.423 秒，见 [原 HTTP 日志](original-build-export/artifact/shared/04.log)。顶层错误政策现在确实送入服务器拒绝；原始 bool / int / real 等 plist 夹具和各进程 stdout/stderr 均已保留。
- `native-observation` 与其余全部共享回归通过，ControllerServer 与 GameStorage 原 Swift 测试编译/执行也通过。
- GLUP / Emberbrood 各自原测试、frozen dist、Universal arm64+x86_64 构建通过。具体原包文件尺寸与 SHA 在各自 `native-build.log` 中；本目录为只读证据导出，不包含可安装包。
- 初次读取时 Intel 原生玩法验证执行中、ARM verify 排队；GitHub API 随后短时 503，原监控失败单独保留。恢复后已读取完整的成功导出，不把排队时的判断当最终结果。

最终 immutable export 为 **`937730de874d89ada809625fb4a167d33a9ca972`**，原 run 的 ARM job `135775747296`、Intel job `135775747077`、export job `135783181598` 均成功。只读取回 [120 份原始证据](original-final-export/) 共 **15,329,554 字节**，逐 Git blob 与原 manifest 大小/SHA 双重校验，见 [final-export-verification.json](final-export-verification.json)。本次没有再次 dispatch，也没有重跑游戏或下载安装包。

两款各有 ARM native、occupied-port、Rosetta x86_64、Intel native x86_64 四份原游戏报告，共 **8 份 / 每份 9 项检查全部 passed**，包括原 SDK、真实玩法、取消/重连、端口与实际存档重启；两个 runner 的 ZIP/DMG/安装完整文件验证均通过。Emberbrood 实际 renderer 为 `dom`，GLUP 为 `canvas2d`，因此这些结果不能作为九款 WebGL2 赛车或 Intel WebGL2 能力已通过的证据。

后续新增 `.opus` / `.m4a` 与 128 MB 显式政策属于另一份源码，当前 `eb45042` 运行没有包含这些改动。本次只证明此前的流式服务器和 8 项 HTTP 套件；不能将它当成新的 9 项音频套件或完整赛车验收。

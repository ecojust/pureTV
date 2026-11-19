# 第二次 macOS 样本：构建已通过，玩法验证进行中

原 run **44584471562 / attempt 1**，冻结来源 `eb450428a33ebcfa22462c6abbdc1aa2a8a8b28e`，批次 `adventure-01`。只 dispatch 一次；GLUP / Emberbrood 是共享宿主样本，不属于九款赛车交付。

直接原 build artifact `14561366662` 下载返回 403，因此只 dispatch 一次只读 build 证据导出：run **44585179567**，固定 export commit **`f40147cea0faade7163c8fde45e05d9ab50b7cfd`**。原 [完整 build 证据](original-build-export/) 共 **117 文件 / 167,483 字节**，全部按 Git blob 与原 export-manifest SHA-256 / bytes 双重校验，见 [build-export-verification.json](build-export-verification.json)。没有改写第一次失败档或本次原日志。

已核实原报告：

- 真实 Swift HTTP 8 项全部通过，耗时 16.423 秒，见 [原 HTTP 日志](original-build-export/artifact/shared/04.log)。顶层错误政策现在确实送入服务器拒绝；原始 bool / int / real 等 plist 夹具和各进程 stdout/stderr 均已保留。
- `native-observation` 与其余全部共享回归通过，ControllerServer 与 GameStorage 原 Swift 测试编译/执行也通过。
- GLUP / Emberbrood 各自原测试、frozen dist、Universal arm64+x86_64 构建通过。具体原包文件尺寸与 SHA 在各自 `native-build.log` 中；本目录为只读证据导出，不包含可安装包。
- 此记录时 Intel 原生玩法验证处于执行中，ARM 原生 / Rosetta verify 尚在排队。构建成功不等于玩法通过。

后续新增 `.opus` / `.m4a` 与 128 MB 显式政策属于另一份源码，当前 `eb45042` 运行没有包含这些改动。本次只证明此前的流式服务器和 8 项 HTTP 套件；不能将它当成新的 9 项音频套件或完整赛车验收。

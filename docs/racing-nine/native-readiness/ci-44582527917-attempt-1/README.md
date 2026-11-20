# 第一次真实 macOS 验证：原始失败与测试修复

原 run **44582527917 / attempt 1**，冻结来源 `716ae0fe1d1ad57ab0c6d86cb691b81da0bac7bd`，样本批次 `adventure-01`（GLUP / Emberbrood）。仅用于验证共享宿主，不算九款赛车交付。

直接 job log 与 artifact 下载均为 Azure 403，下载状态已记录，临时签名下载 URL 已脱敏。只 dispatch 了一次只读导出：run **44583544239**，exporter 来源 `ded997381be3b2cf480986cf22dc3249ea613a8e`。原始完整证据固定在 Git commit **`23d0ff6de79762d3998c13354e646b83aea749e4`**，下载到 [original-export](original-export/)，共 **75 文件 / 145,250 字节**，每文件经 Git blob 与原 export-manifest 的 SHA-256 / bytes 双重校验。详见 [export-download-verification.json](export-download-verification.json)。

`executed-source/.github/workflows/joystick-catalog-macos.yml` 实际存在；原 workflow 设置了 `include-hidden-files: true`。Swift、测试脚本、执行 workflow 原字节均再次与原冻结 commit 比较一致，见 [diagnosis.json](diagnosis.json)。没有补写或修改原 artifact。

确凿结果：

- `LocalAssetServer.swift` 在 Apple Silicon 上由 Swift 6.3.3 成功编译。原 binary SHA 为 `f45c6a0d027fa8e50e74e8392e1131c2f00d909e5fe89b378eb029b218ac12c0`。实际测试可执行文件位于临时目录，不在原 artifact 的上传目录；只有哈希与编译来源保留，不能声称归档了原 binary。
- 真实 HTTP **8 项中 7 项通过**：多块二进制 / 3D MIME、Range / HEAD、非法 Range、路径 / Host / body、symlink 与大小替换、旧默认预算与大资源、未声明格式等通过。
- 剩余一项在首个顶层 `true` 夹具解析时失败：原 [stderr](original-export/artifact/local-assets-compile/cases/test_malformed_or_unbounded_policy_fails_closed/0-stderr.log) 为 `JSON text did not start with array or object and option to allow fragments not set`，原进程 exit `-5`。尚未将此值传给服务器，所以不是服务器接受非法政策；后续政策变体也尚未执行。详见原 [HTTP 日志](original-export/artifact/shared/04.log)。
- 另一个原 [native-observation 日志](original-export/artifact/shared/06.log) 在实际关闭连接并成功重绑定之后，因 `SO_REUSEADDR` 在 Darwin 返回有效非零值 `4`、断言却要求 `1` 而失败。
- GLUP / Emberbrood 各自的原测试与 `build:check` 全部通过；由于共享测试失败，universal .app / ZIP / DMG 构建被明确跳过。没有原生游戏玩法通过声明。

修复仅限两个测试文件：

1. `local-assets.test.py` 用 Python `plistlib` 写夹具，由 Swift `PropertyListSerialization` 读取，与实际 `Bundle.main` 的 Info.plist 类型保持一致，顶层布尔值也会送到服务器拒绝；保留 `1` 与 `1.0` 的类型区别。每个政策夹具原字节也写入测试证据，并准确记录进程是否被测试主动终止。
2. `native-observation.test.py` 将布尔 socket option 判断改为非零，保留真实端口重用、禁用 SO_REUSEPORT 和拒绝活动 listener 并存的行为验证。

[qa-fix-validation/result.json](qa-fix-validation/result.json) 记录两文件 SHA、10 项本地 native-observation 回归通过、Python 语法与 plist 标量类型验证。新的 Swift 夹具仍须再次真实 Mac 验证。未修改生产服务器、资源预算、游戏、资产闭包或任何旧验收结果；没有重复 dispatch 原构建。

# 本轮交付工具与核验记录

这里保存本轮实际执行的资源准备、预览/校验表生成与公开下载核验脚本，精确字节见 `source-manifest.json`。它们使用本轮固定签名来源、工作流和旧版本基线，是一次性交付记录，不能直接在已更新目录上重复执行准备阶段。

`acceptance-selection.json` 明确选取19款完整Android验收，以及唯一Used Car Racing的浏览器完整验收/Android环境阻塞范围。准备阶段没有把原始Android失败改写为成功；截图和录像各自记录来源。

- `prepare-execution.json`：实际参数、时间和退出码；原始stdout/stderr保留。
- `catalog-execution.json` / `catalog-consistency.json`：129项严格资源校验、119项商城目录与20新版一致性。
- `readme-link-verification.json`：36份文档1149个引用；稀疏检出外的既有对象另行验证。
- `checksums.stdout.log`：20应用3113文件的SHA256校验；各应用保留旧清单基线。
- `video-timestamp-review.json`：20段视频全解码通过。原null输出DTS提示及对照保留；继承源时间基后无stderr，原视频未改变。

公开下载核验使用固定发布提交，完整下载APK、资源信息、录像、预览、校验表和目录，与该提交的本地文件逐字节核对。它不代表向apps.b14f.com上传，也不代表实体电视、手机或ESP32验收。

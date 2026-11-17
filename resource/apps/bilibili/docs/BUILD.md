# BiliTV 构建与签名

构建根目录为 `resource/launcher/puretv`，应用模块为 `:bilibili`。使用仓库 Gradle Wrapper、JDK 17、Android SDK 35 与 Build Tools 34.0.0：

```bash
cd resource/launcher/puretv
./gradlew --no-daemon :bilibili:assembleDebug :bilibili:verifyReleaseSize :bilibili:testDebugUnitTest :bilibili:lintDebug
```

调试包位于 `resource/apps/bilibili/build/outputs/apk/debug/`，未签名 release 位于同目录的 `release/`。Release 使用 R8 和资源压缩，构建检查要求小于 10,000,000 字节；本地 release 构建不读取发布密钥。

最低系统为 Android 4.4 / API 19。Java 使用 JDK 17 编译，D8 负责语言特性转换；生产代码仍需使用 API 19 可用的运行时方法或显式版本分支。测试独立使用 Robolectric 4.11.1，因为 4.14.1 已不提供 API 19。具体测试系统由各测试的 `@Config` 指定；原生截图使用 API 28。

设置 `BILIBILI_UI_CAPTURE_DIR` 可导出原生测试画面。CI 要求该目录至少包含 `bilibili-tv.png` 和 `bilibili-tv.en.png`；这些画面使用模拟数据，不代表实体电视播放结果。

## CI 与现有签名证书

[Bili TV build](../../../../.github/workflows/bilibili.yml) 在 `feat/bilibili-tv` 和 `master` 的相关 push、相关 PR 以及手动 dispatch 时运行。只构建此应用模块；不会触发发布、改写目录资源或上传 Gitee。

Build job 不接收发布密钥。所有构建、单元测试、lint 和预览检查成功后，独立的 sign job 才使用仓库已配置的 `PURETV_KEYSTORE_BASE64` 与 `PURETV_KEYSTORE_PASSWORD`，别名为 `puretv`。PR 不运行 sign job。签名启用 v1 / v2 / v3，并再次用 API 19 最低系统条件验证 APK；不生成或替换发布密钥。

预期证书 SHA256 读取 `tools/puretv-release-certificate-v2.sha256`，当前为：

```text
eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23
```

CI artifacts：

| Artifact | 内容 |
| --- | --- |
| `bilibili-release` | 正式签名的 `bilibili-版本.apk`、`metadata.json`、`SHA256SUMS.txt`、`previews/` |
| `bilibili-build` | `unsigned.apk`、`build-metadata.json`、`previews/`，供签名步骤核对输入 |
| `bilibili-test-reports` | JUnit、lint、构建日志、已有原生测试画面；失败时也尽量保留 |

下载时先核对工作流的实际结论及源码 SHA：

```bash
gh run list --repo ecojust/pureTV --workflow bilibili.yml --branch feat/bilibili-tv
gh run view RUN_ID --repo ecojust/pureTV --json conclusion,headSha,url
gh run download RUN_ID --repo ecojust/pureTV --name bilibili-release --dir /absolute/scratch/bilibili-release
```

将 `RUN_ID` 换为实际成功的工作流编号。`metadata.json` 保存源码 SHA、工作流链接、包名、版本、文件大小、SHA256 和签名指纹。对下载的 APK 再执行 `apksigner verify --min-sdk-version 19 --print-certs` 与 SHA256 核验，确认来源后再更新应用目录的 `resource.json`、APK、预览与索引。工作流 artifact 与仓库资源、GitHub Release 是不同交付状态。

## Artifact 下载不可用时

可信分支的 export job 会将有界的 XML／日志／PNG 诊断写入临时分支 `build-assets/bilibili-RUN_ID` 的 `release-staging/bilibili/reports/`；签名成功时同一目录的 `release/` 包含 APK、元数据、哈希和预览。只有该 job 有 `contents: write`，签名 job 保持只读；PR 不导出，既有导出分支不覆盖，master 不被改写。

```bash
git fetch origin refs/heads/build-assets/bilibili-RUN_ID:refs/remotes/origin/build-assets/bilibili-RUN_ID
git show origin/build-assets/bilibili-RUN_ID:release-staging/bilibili/export-metadata.json
git archive origin/build-assets/bilibili-RUN_ID release-staging/bilibili | tar -x -C /absolute/scratch/bilibili-export
```

先创建目标 scratch 目录。核对 `export-metadata.json` 中的 `sourceSha`、`runId`、build/sign 结论和各文件 SHA256；失败流程的诊断不代表发布成功。完成取回并归档之后可删除临时远程分支。导出不包含密钥、源码缓存或 HTML 报告，也不会创建 GitHub Release。

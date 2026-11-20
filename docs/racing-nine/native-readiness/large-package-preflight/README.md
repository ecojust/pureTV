# Backroad 完整资源的大包预检

本次仅对已有完整 `dist/` 做压缩计数、读取原 Night 签名 APK 的 ZIP 条目和检查导出源码。没有删除、转码或拆分资源，没有原生构建、浏览器、签名、安装或 CI 派发，也没有调整任何包体上限。

## 实际测量

完整 Backroad `dist/` 为 **333 个文件、115,296,845 字节**。原执行脚本是 [executed-measure.py](executed-measure.py)，原输出是 [backroad-dist-compression.json](backroad-dist-compression.json)。二者从 scratch 逐字复制；报告包含每项压缩尺寸，以及 level 9 输入文件的 SHA-256。执行使用 `nice 19`、zlib **1.3.2**，约 19.07 秒。支持 seek 的计数输出对象丢弃 ZIP 字节，没有在磁盘或内存中保存整个归档；原 scratch 脚本和报告共 139,653 字节。脚本保留当时绝对输入与输出路径，复现时应在新副本中明确指定对应冻结目录，不覆盖原报告。

| 测量方式 | ZIP 字节数 | MiB | 距 GitHub 100 MiB 的余量 |
| --- | ---: | ---: | ---: |
| DEFLATE 9，全部原文件 | 104,597,061 | 99.75153 | 260,539 字节 |
| DEFLATE 6，全部原文件 | 104,633,250 | 99.78604 | 224,350 字节 |

这里的 ZIP 只包含 Web 资源，未包含原生可执行文件、图标、额外宿主页面、安装器、签名或平台元数据。Windows 当前 ZIP builder 使用 `ZIP_DEFLATED, compresslevel=9`；macOS 使用原生 `ditto` ZIP 与 `hdiutil UDZO`，Android 资源由 `aapt2 link` 决定逐项压缩，再添加 dex、对齐、签名。因此上述测量不是正式 APK、DMG 或完整桌面 ZIP 的大小。

旧原版 scratch `upstream-dist.zip` 为 104,557,432 字节，包含 332 项及原 `.glb.gz`。它不是当前保留原始 GLB 字节的 333 项目录，不能代替当前测量。当前完整输入的身份以本报告逐文件哈希为准。

## APK 宿主参考与估计范围

[night-apk-entry-overhead.json](night-apk-entry-overhead.json) 记录原 Night Android run **44591488463 / attempt 1**、源 `032924026f00dba24133ae6cfbf1e99b704c1011`、导出 `23d9b4e11b8409cb3c63cf1dc051bac54ffb6de5` 的签名 APK：总大小 22,465,268 字节，9 个非 `assets/` 条目压缩后合计 **262,684 字节**，整个 APK 的 ZIP 头、对齐、签名块等余量为 **12,745 字节**。这里只读取已有包，未再次进行证书或原生验证；此前独立证书核验见 Night 对应 `docs/android-ci-44591488463/`。

把同量级宿主条目与 Backroad DEFLATE 9 Web ZIP 相加即为 **104,859,745 字节**，已比 100 MiB 多 2,145 字节；Android 为 333 项增加 `assets/` 前缀又增加约 4,662 字节的文件名开销，另有配置、手机控制页和更长的签名清单。AAPT 会对不同条目选择存储或压缩，宿主及签名也可能变化，不能把该算式称为真实 APK 的精确下界。可确认的是余量极小，APK 和完整桌面 ZIP 存在充分依据的跨 100 MiB 风险；正式大小仍必须读取原平台产物。

## 当前导出会阻断整个汇总

GitHub 常见 Git 单文件边界是 **100 MiB = 104,857,600 字节**；仓库当前 Git 导出检查更严格，是 **严格小于 100,000,000 字节**。两者不可混用。当前 Web ZIP 自身已经比仓库边界多 **4,597,061 字节**，无需等宿主大小便可确认现路径不能容纳它。

| 入口 | 具体边界 | 超限结果 |
| --- | --- | --- |
| `.github/workflows/joystick-catalog-android.yml`，`Export original reports and packages to an isolated branch` | 全 `out.rglob('*')` 的每文件 `<100_000_000`，审查时第 387 行 | 任一包超限使该次汇总步骤中止；后续整次 Git commit/push 不执行，不会只跳过大游戏 |
| `.github/workflows/joystick-catalog-macos.yml`，`Validate every package and original report, then export an immutable branch` | 全目录 `<100000000`，审查时第 378 行 | 已选所有 batch 的汇总导出中止；此前原构建和 QA artifact 独立存在 |
| `.github/workflows/joystick-catalog-macos-runtime.yml`，对应原包复测导出 | 全目录 `<100000000`，审查时第 323 行 | 同上，不会只跳过单包 |
| `joystick-games/tools/windows-export.py`，末尾全目录循环 | 每文件 `<100000000`，审查时第 31 行 | 本次请求所有游戏的汇总 commit/push 中止 |

Backroad 当前显式构建预算允许包小于 **128,000,000 字节**；`asset-policy.py:desktop_package_limit` 也返回该逐款声明。构建预算与 Git 运输限制不同。任何提升全局上限都不能解决 GitHub 本身的单文件边界，本次没有修改它们。所读源码身份见 [source-inventory.json](source-inventory.json)。

## 原产物恢复与后续运输入口

现有 `joystick-catalog-*-evidence.yml` 和 `windows-read-evidence.py` 仅提取原报告，其后缀白名单不接收 APK、DMG、ZIP 或 EXE，不能用它们取安装包。应认证读取原 run / attempt 的 jobs、artifacts，绑定源 SHA、原 job 时间窗口、artifact ID / digest，再 GET `repos/ecojust/pureTV/actions/artifacts/{id}/zip` 保存到 scratch。保留原下载归档与 SHA、安全提取后的 manifest、签名回执、源码清单以及原 QA，不需要重新构建或签名。

- **macOS**：原 `joystick-catalog-macos-packages-racing-01` 在构建后 `always()` 上传，保留 30 天；每款仅在其 native build 成功后复制到该 artifact。`macos-catalog-reuse.py:validate_run` 允许整体 run 后续失败，但要求被复用的原 build job 成功；`verify_source` 绑定完整原生产输入。`macos-packages.py:main/check` 的实际安装、签名和 DMG 验证须在 Mac 执行，Linux 上只能审查原哈希、ZIP 清单及既有原生证据。
- **Android**：`joystick-android-signed` 在原签名步骤成功后上传，独立于最终 Git export。`android-release.py:identity/content/check_payload` 可用于固定证书、包名版本、完整原 payload 和回执核对。现有 `android-runtime-inputs.py:verify` 强依赖成功 Git export 的 commit / manifest；大包导出失败时不能伪造该身份来套用它，需要明确的 artifact 来源读取层。
- **Windows**：`joystick-windows-packages-<game>` 当前仅在整款 job 成功时上传。如果 runtime 已失败而安装包未上传，不能从仅有的 evidence artifact 重建或声称取回那些原包。已有包可结合原 `build-manifest.json`、`windows-packages.py:verify` 记录和 runtime 原证据核验。

后续可由平台负责人分别恢复、核验原包，再由传输层将**原字节**作为 GitHub Release 资产上传。游戏目录只保存小型元数据和说明：精确下载 URL、asset ID / 文件名、字节数、SHA-256、源码提交、原 run / attempt / artifact ID、平台架构、签名与覆盖限制。不得拆包、重压或裁剪资源来迎合 Git 边界；原 runtime 失败不能因成功上传 Release 就改写成玩法验收成功。该运输方案尚未在本记录中实施。

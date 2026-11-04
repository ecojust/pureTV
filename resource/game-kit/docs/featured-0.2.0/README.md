# 8 款精选游戏 0.2.0 构建与签名证据

生产源码冻结于 [`40a9c83627463151ef4685a5286e20e9fadd145d`](https://github.com/ecojust/pureTV/commit/40a9c83627463151ef4685a5286e20e9fadd145d)。本目录归档冻结构建、签名和资产一致性核验的原始证据；归档时真实游戏 QA 仍在进行，不能据此认定全部验收完成。

包含折光工坊（glass-fold）、镜光接力（prism-relay）、拉索桥梁（tension-span）、窗口装配（conveyor-window）、异形装箱（packing-sculptor）、叠塔工匠（tower-overlap）、夜桥接力（torch-bridge）及四则二十四（twenty-four）。

- [冻结源码核验](frozen-verification.json)：56 个源码文件逐字节匹配冻结提交，8 款构建均来自该提交。
- [批量构建收据](batch-receipt.json)：记录 8 款未签名 APK 的构建、大小与资产哈希。
- [签名资产核验汇总](signed-assets-verification.json)：8 款均通过仓库固定证书、源码身份、CRC、zipalign 和签名收据核验；每款 12 个 APK 资产的 SHA-256 均与冻结构建资产一致。逐款原始收据保存在 `signed/<slug>/`。
- [最终运行记录](signing-runs.json)及[首轮记录](signing-runs-attempt1.json)：保留运行 ID、工作流提交、失败与重试信息。8 个运行最终均成功。
- [工具链收据](toolchain.json)：记录 JDK 17、Android API 35、Build Tools 34.0.0、ZXing 3.5.3 的下载校验。`qa-package*.json` 保留 QA 工具依赖版本，不代表游戏 QA 已完成。

拉索桥梁的签名和导出首轮成功。其余 7 款首轮导出在 GitHub jobs API 尚未显示签名成功时失败，原错误为 `ValueError: This run has no successful signing job`。确认同一运行中的签名 job 已显式显示 `completed/success` 后，仅重试失败的 export job，沿用原运行及原签名产物；没有重新 dispatch 或请求重新签名。原失败日志与重试请求日志均保存在 `logs/`。窗口装配另保留一次被 gh CLI 拒绝的参数组合及修正后的请求日志；空请求日志表示命令没有标准输出，接受状态见运行记录。

`physicalTvTested: false`，`physicalPhoneTested: false`。以上核验不包含电视或手机真机测试，最终游戏 QA 摘要由后续验收单独补充。

[归档清单](archive-manifest.json)列出 47 份未经修改的原件，共 147,179 字节，逐件记录来源路径、大小和 SHA-256。原报告中的 `/workspace/scratch/` 路径保留为历史来源；对应证据已复制到本目录。归档不包含 APK、临时画面帧或凭据；日志中的 `***` 为 GitHub 原始脱敏标记。

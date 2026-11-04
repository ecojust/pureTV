# 8 款精选游戏 0.2.0 发布与验证记录

生产源码冻结于 [`40a9c83627463151ef4685a5286e20e9fadd145d`](https://github.com/ecojust/pureTV/commit/40a9c83627463151ef4685a5286e20e9fadd145d)。本目录归档冻结构建、签名和资产一致性核验的原始证据。最初归档这些签名原件时真实游戏 QA 尚未完成；现在八款均已通过最终验收，新增记录见下方链接，原签名证据保持不变。

包含折光工坊（glass-fold）、镜光接力（prism-relay）、拉索桥梁（tension-span）、窗口装配（conveyor-window）、异形装箱（packing-sculptor）、叠塔工匠（tower-overlap）、夜桥接力（torch-bridge）及四则二十四（twenty-four）。

- [冻结源码核验](frozen-verification.json)：56 个源码文件逐字节匹配冻结提交，8 款构建均来自该提交。
- [批量构建收据](batch-receipt.json)：记录 8 款未签名 APK 的构建、大小与资产哈希。
- [签名资产核验汇总](signed-assets-verification.json)：8 款均通过仓库固定证书、源码身份、CRC、zipalign 和签名收据核验；每款 12 个 APK 资产的 SHA-256 均与冻结构建资产一致。逐款原始收据保存在 `signed/<slug>/`。
- [最终运行记录](signing-runs.json)及[首轮记录](signing-runs-attempt1.json)：保留运行 ID、工作流提交、失败与重试信息。8 个运行最终均成功。
- [工具链收据](toolchain.json)：记录 JDK 17、Android API 35、Build Tools 34.0.0、ZXing 3.5.3 的下载校验。`qa-package*.json` 保留 QA 工具依赖版本，不代表游戏 QA 已完成。

拉索桥梁的签名和导出首轮成功。其余 7 款首轮导出在 GitHub jobs API 尚未显示签名成功时失败，原错误为 `ValueError: This run has no successful signing job`。确认同一运行中的签名 job 已显式显示 `completed/success` 后，仅重试失败的 export job，沿用原运行及原签名产物；没有重新 dispatch 或请求重新签名。原失败日志与重试请求日志均保存在 `logs/`。窗口装配另保留一次被 gh CLI 拒绝的参数组合及修正后的请求日志；空请求日志表示命令没有标准输出，接受状态见运行记录。

八款均为 0.2.0，每款 6 关，共 48 关，其中新增 24 关；每款均有独立布局、正式签名 APK、更新后的真实封面和普通输入六关通关录像。

- [逐款发布摘要](integration/release-summary.json)：记录版本、关卡、文件大小、采用的录制尝试及实际测试源码。
- [最终整合审计](integration/final-integration-audit.json)：8 款资源、47 份公共原件与 README 索引共 10 组检查通过；资产、签名、视频、实际六关目标、旧版归档、截图和全部校验文件一致。
- [完整资源目录校验](integration/resource-catalog.json)：125 项现有资源的正式签名核验通过。
- [索引生成记录](integration/readme-index-check.json)：根中英文和完整资源目录连续生成两次无变化；根目录只展示所选 8 款新增游戏及原有 11 款，完整目录保留 111 款游戏，四列与分类统计保持正确。
- [最终核验归档清单](integration/archive-manifest.json)：对应报告和实际执行的审计脚本哈希；这是一份新增清单，不替换最初 47 份签名原件的清单。

折光工坊前两次录像分别因测试切关操作和捕获时长不足未通过；最终采用第三次 300 秒录制。原失败报告、代表帧和三次测试修订来源均保留在该应用的最终 QA 目录。后续测试提交没有改变冻结生产资产。

`physicalTvTested: false`，`physicalPhoneTested: false`。验收包含 960×540、1280×720 的真实浏览器画面和普通输入录制，不包含电视或手机真机测试；没有据此宣称 GitHub Release 或 Gitee 市场发布。

[归档清单](archive-manifest.json)列出 47 份未经修改的原件，共 147,179 字节，逐件记录来源路径、大小和 SHA-256。原报告中的 `/workspace/scratch/` 路径保留为历史来源；对应证据已复制到本目录。归档不包含 APK、临时画面帧或凭据；日志中的 `***` 为 GitHub 原始脱敏标记。

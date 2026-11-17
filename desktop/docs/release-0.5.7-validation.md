# pureTV Manager 0.5.7 发布验证

**已发布并设为最新稳定版。** [下载0.5.7](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.5.7)，发布时间 `2026-11-15T09:17:26Z`。五份安装包及 SHA256 清单已从公开 HTTPS 地址完整下载，大小和哈希同时匹配 Release API 与清单。发布正文与冻结源码一致，旧0.5.6标签未修改。

## 改动与复现

Gitee 市场当前的麦动KTV 2.1.10 为 53,570,243 字节，原始地址返回 HTTP 403，响应明确提示大文件需要登录。旧版管理器把公开 Git blob 备用下载限制在 32 MiB，因此拒绝回退。0.5.7 将该上限提高至 128 MiB，保留固定提交、Git blob、字节数、内容哈希、取消、超时和临时文件清理。

在当前 Gitee 提交 `3960f3b7d13415574b37cc08ebd82b2f0e4dd34c` 上，最小 APK 完整下载校验通过；麦动的公开 Git blob API 返回200，完整读取71,427,207字节JSON，解码后APK大小、Git blob和SHA256均匹配。该探测从本次执行环境通过独立Python脚本发起，不是用户网络或已安装管理器的测试。[小包与raw证据](release-0.5.7-evidence/live-probe.json) · [大包完整校验](release-0.5.7-evidence/large-blob-probe.json)。

用户尚未提供具体应用和错误，不能据此认定所有“下载按钮无法下载”反馈都由同一原因造成。客户端自身更新与APK市场是不同下载流程。

源码固定在 [`0f5c4ffa`](https://github.com/ecojust/pureTV/commit/0f5c4ffa535b6f5f6c49758ca5be80290bfec21e)，标签 `desktop-v0.5.7`。7份版本/锁文件同步，第三方依赖未变。

## 验证结果

[正式流程43696998459](https://github.com/ecojust/pureTV/actions/runs/43696998459) 四个平台及发布全部通过，首次运行完成，无失败重跑。

- 最终前端构建通过（TypeScript、744条文案、Vite）；本地11项下载UI回归通过，使用模拟IPC。Linux正式CI完整UI171项、SVG7项通过。
- 四平台核心测试各110通过；原生Windows105、Linux106、两Mac各107通过。新增33MiB传输回归四平台均通过，验证raw403后的备用下载及内容校验；该fixture不是可安装APK，也不是公网下载。
- core ignored为Windows2、其余1，native各8，未执行项未计入通过数。每个平台另外显式运行Google下载、腾讯镜像和安装包准备各1项。公网市场集成测试未在CI执行，真实网络证据来自上述独立探测。
- 各平台兼容性采集28项、子网3项通过。Linux运行中MCP有72条PASS日志，包含重复查询和12条预期拒绝，不代表72种独立功能。UI/SVG/MCP仅在Linux执行。
- Windows及两Mac实际0.4.10→0.5.7升级、正常退出、重新启动和测试数据保留通过；Linux验证DEB身份与更新准备，未执行系统安装。
- 两Mac的完整应用签名、目标架构、macOS11最低版本及DMG安装副本启动通过；使用ad-hoc签名，未做Apple公证或Gatekeeper验收。ADB使用模拟设备，没有新增实体电视验收。

实际步骤、ignored原因及完整日志索引见 [CI摘要](release-0.5.7-evidence/ci-summary.json)，公开下载结果见 [机器记录](release-0.5.7-validation.json)。四平台完整日志共1,465,095字节，另保留发布日志及提取脚本，均在 [证据目录](release-0.5.7-evidence/)。

## 公开安装包

| 文件 | 字节数 |
| --- | ---: |
| `pureTV-Manager-0.5.7-linux-x64.deb` | 4,188,938 |
| `pureTV-Manager-0.5.7-macos-arm64.dmg` | 9,839,548 |
| `pureTV-Manager-0.5.7-macos-x64.dmg` | 10,074,081 |
| `pureTV-Manager-0.5.7-windows-x64-portable.exe` | 5,556,736 |
| `pureTV-Manager-0.5.7-windows-x64-setup.exe` | 2,279,601 |

[SHA256SUMS.txt](release-0.5.7-evidence/SHA256SUMS.txt) · [完整下载核验脚本](release-0.5.7-evidence/verify-public.py)。安装包使用完整流式下载核验，没有以HEAD请求代替。

## 更新入口与限制

发布后只读检查确认 Gitee `client/` 仍提供0.5.6的Windows安装版及两份Mac安装包；本次未上传Gitee，应用内更新暂不能取得0.5.7，请从GitHub发布页下载。[Gitee核验](release-0.5.7-evidence/gitee-client-after.json)。

`physicalTvTested:false`，用户具体下载失败原因仍需其应用名称和报错。发布过程见 [任务记录](../../history/2026-11-08-004.md)。

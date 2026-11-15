# pureTV Manager 0.5.9 发布验证

**已发布并设为最新稳定版。** [下载0.5.9](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.5.9)，发布时间 `2026-11-15T10:29:29Z`。五份安装包及 SHA256 清单已从公开 HTTPS 地址完整下载，大小和哈希同时匹配 Release API 与清单；正文与冻结源码一致，旧0.5.7标签未修改。

## 下载来源迁移

APK市场改读 `https://apps.b14f.com/` 下的 `launcher/`、`media/`、`game/`，客户端更新改读 `client/`。支持实际 HTML 目录、中文文件名、精确字节数与条件下载；旧 Gitee 下载与目录缓存隔离，不再回退至 Gitee。论坛仍单独使用 Gitee Issues。

真实目录读取到36个APK（游戏20、启动器10、影音6）。生产 Rust 代码的两个公网测试及独立 Python 探测通过：83,318字节小APK、454,320字节启动器、53,570,243字节麦动KTV，以及2,273,072字节的0.5.6 Windows客户端完整下载，缓存复核通过。首次完整目录约39秒；测试来自本次执行环境，不是用户网络或实体电视测试。

下载绑定 HEAD 获取的 ETag／Last-Modified 与精确字节数，使用条件请求并核对响应。本地 SHA256 回执在缓存复用和客户端安装前重新校验；APK 的匹配清单提供 SHA256 时额外核对。服务器未提供统一内容哈希，HTTP元数据不等于内容哈希，也不能保证识别同大小、同修改时间的文件替换。

0.5.8在发布前发现来源按钮误开返回403的根网址，因此取消流程并保留原标签。0.5.9将按钮改为可访问的 `client/` 和 `launcher/`。三个下载模块与0.5.8冻结源码逐字节相同，复用上述网络证据；修改的1项来源按钮UI重跑通过，替代此前53项中的1项，未重复计数。[证据复用哈希](release-0.5.9-evidence/preflight.json) · [0.5.8未发布记录](release-0.5.8-validation.md)。

源码固定在 [`b2f8513c`](https://github.com/ecojust/pureTV/commit/b2f8513c952e058df1a134fb2b564316733ee65c)，标签 `desktop-v0.5.9`。7份版本／锁文件同步，第三方依赖未变。

## 正式验证

[流程43702600015](https://github.com/ecojust/pureTV/actions/runs/43702600015) 四个平台及发布全部通过，首次运行完成，无失败重跑。

- 前端构建通过（TypeScript、744条文案、Vite）；Linux完整UI **172项**、SVG **7项**通过，界面测试使用模拟IPC。
- 四平台核心各110项通过；原生Windows108、Linux109、两Mac各110项通过。直接HTTP下载33MiB的传输fixture四平台均通过；fixture不是可安装APK。
- core ignored为Windows2、其他平台1，native各8；未执行项不计入通过数。各平台另显式运行Google下载、腾讯镜像和安装准备各1项。市场与客户端公网测试在本地显式执行，未把CI中的ignored当作公网验证。
- 各平台兼容性采集28项、子网3项通过。Linux运行中MCP有72条PASS日志，含重复查询和12条预期拒绝，不代表72种独立功能；UI／SVG／MCP仅在Linux执行。
- Windows及两Mac实际0.4.10→0.5.9升级、退出、重新启动和测试数据保留通过；Linux验证DEB身份与更新准备，未执行系统安装。
- 两Mac完整应用签名、目标架构、macOS11最低版本及DMG安装副本启动通过；使用ad-hoc签名，未做Apple公证或Gatekeeper验收。设备操作使用模拟ADB，没有新增实体电视验收。

[CI摘要](release-0.5.9-evidence/ci-summary.json) 保留实际步骤、ignored原因、日志索引及提取脚本。四平台完整日志共1,467,412字节，另有发布日志。[机器记录](release-0.5.9-validation.json)。

## 公开安装包

| 文件 | 字节数 |
| --- | ---: |
| `pureTV-Manager-0.5.9-linux-x64.deb` | 4,188,994 |
| `pureTV-Manager-0.5.9-macos-arm64.dmg` | 9,840,213 |
| `pureTV-Manager-0.5.9-macos-x64.dmg` | 10,077,806 |
| `pureTV-Manager-0.5.9-windows-x64-portable.exe` | 5,570,048 |
| `pureTV-Manager-0.5.9-windows-x64-setup.exe` | 2,280,305 |

[SHA256清单](release-0.5.9-evidence/SHA256SUMS.txt) · [完整下载结果](release-0.5.9-evidence/verified-release.json) · [核验脚本](release-0.5.9-evidence/verify-public.py)。所有安装包均完整流式下载，未以HEAD代替下载验证。

## 首次升级与服务器同步

0.5.7及更早版本仍使用旧源，请先从本版GitHub发布页手动安装一次。发布后 `2026-11-15T10:29:52Z` 只读复查，新服务器 `client/` 仍只有0.5.6的Windows安装版及两份Mac包，没有Linux包。本轮未上传服务器；GitHub发布不会自动同步 `apps.b14f.com`，正式附件上传到 `client/` 后才会进入后续应用内更新目录。[服务器复查](release-0.5.9-evidence/client-directory-after.json)。

`physicalTvTested:false`、`physicalPhoneTested:false`。任务过程见[历史记录](../../history/2026-11-08-004.md)。

# pureTV Manager 0.5.4 发布验证

**已发布并设为最新稳定版。** [下载0.5.4](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.5.4)，发布时间 `2026-11-07T07:12:52Z`。五份安装包及SHA256清单均已实际完整下载，字节数和SHA256同时匹配发布API及清单；发行说明与冻结源码一致，旧0.5.3标签未修改。

## 来源与检查

- 源码：[`4dce70bde1b4eb281f036b58a90c50ca6f9f0e99`](https://github.com/ecojust/pureTV/commit/4dce70bde1b4eb281f036b58a90c50ca6f9f0e99)，注解标签 `desktop-v0.5.4`。
- 正式工作流：[42349769846](https://github.com/ecojust/pureTV/actions/runs/42349769846)，四个平台及发布任务全部success，没有失败或重跑。
- 7份项目版本及锁文件统一为0.5.4，第三方依赖没有变更；本次仅将已完成的新主题、兼容性方案页面调整和紧凑导航修复发布成新版安装包。
- 各平台核心测试110项通过；原生测试Windows99、Linux100、两Mac各101项通过。各平台只读采集28项、子网3项，以及Google／腾讯实际ADB下载检查通过。明确标记为ignored的测试仍保持该状态，详情在机器记录中，未宣称所有在线服务测试均执行。
- Linux完整171项UI、7项SVG及运行中桌面进程的MCP检查通过。MCP使用模拟ADB；71条PASS日志包括轮询等重复调用，不是71种独立场景。
- Windows与两Mac验证实际 `0.4.10 → 0.5.4` helper升级、正常退出、重新启动和测试数据保留；Linux验证真实DEB身份和原生更新准备，没有执行系统安装。
- 两Mac分别核对arm64／x86_64架构、macOS11最低版本、完整应用签名、DMG与安装副本运行5秒及正常退出；没有验证Apple公证或Gatekeeper认可。

## 公开安装包

| 文件 | 字节数 |
| --- | ---: |
| `pureTV-Manager-0.5.4-linux-x64.deb` | 4,177,392 |
| `pureTV-Manager-0.5.4-macos-arm64.dmg` | 9,804,727 |
| `pureTV-Manager-0.5.4-macos-x64.dmg` | 10,052,199 |
| `pureTV-Manager-0.5.4-windows-x64-portable.exe` | 5,536,256 |
| `pureTV-Manager-0.5.4-windows-x64-setup.exe` | 2,268,398 |

校验清单的永久副本见 [SHA256SUMS.txt](release-0.5.4-evidence/SHA256SUMS.txt)，具体API、完整下载哈希、步骤状态、测试统计和证据哈希见 [机器记录](release-0.5.4-validation.json)。原始日志摘录保存在 [证据目录](release-0.5.4-evidence/)。完整CI日志SHA256为 `26efdc7f116c362e7ea244f097bed539b5fadc25037bc78a6834e8ed0bd694ea`。

## 更新入口与验证边界

本次未同步Gitee。发布后再次实查商店client目录，仍为0.5.3的Windows安装版与两Mac DMG，因此应用内“检查更新”尚不能获取0.5.4，请从GitHub发布页下载。

本版保留0.5.3的旧Android读取与默认桌面保护行为，没有新增实体电视验收；不能将桌面构建、模拟ADB或既有Android系统镜像检查等同于小米电视2／4等具体电视实测。本次没有另发BiliTV版本。

发布过程见 [本次记录](../../history/2026-11-07-001.md)。

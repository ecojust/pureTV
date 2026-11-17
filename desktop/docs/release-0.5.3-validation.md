# Desktop 0.5.3 验证记录

[pureTV Manager 0.5.3](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.5.3) 已于 **2026-11-06T00:11:01Z** 公开并设为最新稳定版本。五份公开安装产物及校验清单已重新下载，文件集合、字节数和 SHA256 全部一致。

## 源码与本次改动

- 冻结源码：`4d74296a50bc864ec777f8632da47dba3322486d`，注解标签 `desktop-v0.5.3`。旧0.5.2标签对象及产物没有替换。
- 收录Android5／6当前用户识别回退、Android4.4精确非致命linker诊断处理、固定 `/data` 文件系统容量回退和歧义HOME保护；Info三语同步说明实际命令。
- 小米电视2加入P0待验清单，系统版本未知；小米4的Android6仍为用户报告。它们与此前Android4.4反馈的实机用例均保持NOT_RUN/E0，未按型号推定系统或合并设备。
- 相对已验证的 `ae60c0af`，生产实现、测试和工作流保持一致；本次仅提升项目版本并更新文档，依赖版本未变。此前实际Android镜像证据继续绑定其原始源码与流程 [42081526201](https://github.com/ecojust/pureTV/actions/runs/42081526201)，本次没有重跑模拟器或声称实机通过，详见[兼容性验证记录](tv-compatibility-validation-2026-11-05.md)。

## 正式四平台验证

[标签流程42133344048](https://github.com/ecojust/pureTV/actions/runs/42133344048) 的四个平台与发布任务均success，未发生失败或重跑；同SHA的master重复流程42133344051已取消。下表为本次正式日志的结果，不借用此前计数。

| 平台 | Core通过／忽略 | Native通过／忽略 | Collector通过 | 安装验证范围 |
| --- | --- | --- | --- | --- |
| Windows x64 | 110／2 | 99／8 | 28 | 实际0.4.10→0.5.3升级、正常退出、重启和数据保留 |
| macOS ARM64 | 110／1 | 101／8 | 28 | 实际升级、完整DMG／应用签名、架构、安装副本启动5秒及正常退出 |
| macOS Intel | 110／1 | 101／8 | 28 | 同上，验证对应Intel架构 |
| Linux x64 | 110／1 | 100／8 | 28 | DEB身份及原生更新元数据；未执行系统安装 |

各平台两路ADB实际下载验证通过。Linux完整UI **171**、SVG **7** 通过；实际桌面进程配合模拟ADB的MCP **71次调用检查**通过，其中12次为预期拒绝，覆盖28种工具。调用检查包含状态轮询，不表示71个独立场景，也不构成实体电视测试。

Windows/Linux日志各核实750条文案、3项网络测试通过。Linux系统依赖准备24秒、浏览器准备16秒，默认Azure源成功，没有实际执行APT回退。macOS使用ad-hoc签名，本次未验证Apple公证或Gatekeeper放行；Windows未使用商业代码签名。

## 公开产物复核

Release正文与冻结源码发行说明一致，latest和注解标签解析均已核验。以下五份文件重新下载后，字节数与Release API一致，SHA256同时匹配发布清单与API摘要；清单自身也与API摘要一致。

| 文件 | 字节数 |
| --- | ---: |
| `pureTV-Manager-0.5.3-windows-x64-setup.exe` | 2269397 |
| `pureTV-Manager-0.5.3-windows-x64-portable.exe` | 5537280 |
| `pureTV-Manager-0.5.3-macos-arm64.dmg` | 9805734 |
| `pureTV-Manager-0.5.3-macos-x64.dmg` | 10053434 |
| `pureTV-Manager-0.5.3-linux-x64.deb` | 4174696 |

准确SHA256、源码哈希、完整CI步骤结果、平台独立审计与精选原始日志摘录索引保存在[机器记录](release-0.5.3-validation.json)。摘录归档在[证据目录](release-0.5.3-evidence/)，完整Actions日志仅保留哈希且受GitHub保留期限制；临时下载位于本次环境 `/workspace/scratch/desktop-release-0.5.3/`，不是永久分发入口。

发布后再次读取Gitee公开 `client/`，仍为0.5.1的Windows安装版和两个Mac DMG。本次未上传Gitee，应用内更新暂不会提供0.5.3，请从GitHub发布页手动下载。

本次发布任务完成。小米电视2／4及其他品牌的实机兼容验证仍按[30项清单](tv-compatibility-checklist.md)继续；现有启动器最低Android8／API26，发布管理器补丁没有改变其最低系统要求。

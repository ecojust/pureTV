# Android 电视 ADB 命令兼容性依据

核查日期：2026-11-05。本文区分 **AOSP 源码提供命令**、**Manager 已实现相应处理**、**模拟回归通过**和**某台电视实际执行通过**。源码中存在分派或参数解析不等于厂商开放该能力，也不等于通过真机测试。本文没有新增任何实体电视执行记录。

发布基线为 `desktop-v0.5.2`。本轮开发分支新增的兼容处理另行注明，不能把它写成已经包含于 0.5.2 安装包。测试执行结果由兼容性清单及其报告记录，本文提供可复核的命令依据。

## 核查范围与读法

检查 AOSP 固定版本标签的命令分派、参数解析和服务调用，不仅检查帮助文字。Android 5.0 的 `pm install --user`、Android 4.4 的 `content call --user` 就属于解析器支持而帮助文字遗漏的情况。

核查覆盖 Android 4.4/API19、5.0/API21、5.1/API22、6.0/API23、7.0/API24、7.1/API25、8.0/API26、8.1/API27、9/API28、10/API29、11/API30、12/API31、12L/API32、13/API33、14/API34、15/API35、16/API36 的相关入口。固定标签为 `android-4.4_r1` 及各版本的 `android-X.Y.0_r1`（例如 `android-12.1.0_r1`）。这不是所有补丁版、所有 Android TV 镜像或所有厂商固件的执行覆盖声明。

API20 对应 Android 4.4W，可在其 AMS 源码中找到用户历史不变量，但它是 Wear 版本，未作为电视目标核验其他命令，也未纳入当前 Manager 的旧系统用户回退白名单。

下表“有／无”只说明所核查 **AOSP 命令入口**；实际权限、输出、目标用户、APK 条件和执行结果仍须分别验证。API 等级应读取 `ro.build.version.sdk`，不能以品牌名称、营销名称或厂商 UI 版本替代。

## 当前 Android 用户

| Android / API | `am get-current-user` | `cmd activity get-current-user` | 已核实的旧系统只读依据 |
| --- | --- | --- | --- |
| 4.4 / 19 | 无 | 无 | `dumpsys activity processes` 的 `mUserLru` 末项 |
| 5.0、5.1、6.0 / 21、22、23 | 无 | 无 | 同格式、同不变量的 `mUserLru` 末项 |
| 7.0、7.1 / 24、25 | 有 | 无该分派 | 使用 `am`，不需要旧系统回退 |
| 8.0 至 16 / 26–36 | 有；普通 `am` 调用转发 activity shell | 有 | 使用明确返回的当前用户 ID |

AOSP 4.4 的 `mCurrentUserId` 虽然存在于服务内部，但没有作为这个字段打印到 `dumpsys activity`；不能只新增 `mCurrentUserId=` 解析便宣称支持 4.4。这里使用的是源码明确说明的历史列表：**“Most recently current is at the end.”**

Android 5–6 的后台用户／托管资料并不破坏该不变量：`startUser` 在同一 `synchronized (this)` 临界区先更新 LRU；前台分支更新 `mCurrentUserId`，后台分支将仍然处于前台的 `mCurrentUserId` 重新放到末尾。`dumpProcessesLocked` 在相同服务锁下打印列表。所有版本都必须严格解析完整字段，拒绝空列表、非数字、负数、超范围、重复用户、重复字段和额外尾随内容；不得从 `UserInfo`、`running`、最近 Activity 或缺失信息猜测用户 0。

| 固定 AOSP 源码 | 不变量 / 输出 / 切换保护 |
| --- | --- |
| [4.4 AMS](https://android.googlesource.com/platform/frameworks/base/+/android-4.4_r1/services/java/com/android/server/am/ActivityManagerService.java#557) | L557 明文不变量；L10678 输出 `mUserLru: [...]`；L15856 在锁内设置当前用户并移到末尾 |
| [5.0 AMS](https://android.googlesource.com/platform/frameworks/base/+/android-5.0.0_r1/services/core/java/com/android/server/am/ActivityManagerService.java#18354) | L630 不变量；L12871 同格式输出；L18354 同步区，L18403–18404 将前台用户移回末尾 |
| [5.1 AMS](https://android.googlesource.com/platform/frameworks/base/+/android-5.1.0_r1/services/core/java/com/android/server/am/ActivityManagerService.java#18883) | L645 不变量；L12982 输出；L18883 同步区，L18932–18933 处理后台用户 |
| [6.0 AMS](https://android.googlesource.com/platform/frameworks/base/+/android-6.0.0_r1/services/core/java/com/android/server/am/ActivityManagerService.java#19772) | L686 不变量；L13488 输出；L19772 同步区，L19822–19823 处理后台用户 |
| [7.0 Am.java](https://android.googlesource.com/platform/frameworks/base/+/android-7.0.0_r1/cmds/am/src/com/android/commands/am/Am.java#459) | `am get-current-user` 的命令分派；7.1 同样存在 |
| [7.1 ActivityManagerShellCommand](https://android.googlesource.com/platform/frameworks/base/+/android-7.1.0_r1/services/core/java/com/android/server/am/ActivityManagerShellCommand.java) | 尚无 `cmd activity get-current-user` 分派 |
| [8.0 activity shell](https://android.googlesource.com/platform/frameworks/base/+/android-8.0.0_r1/services/core/java/com/android/server/am/ActivityManagerShellCommand.java#204)、[am 包装脚本](https://android.googlesource.com/platform/frameworks/base/+/android-8.0.0_r1/cmds/am/am) | 明确的 `get-current-user` 分派及 `am` 转发 |
| [16 activity shell](https://android.googlesource.com/platform/frameworks/base/+/android-16.0.0_r1/services/core/java/com/android/server/am/ActivityManagerShellCommand.java#356) | 相同命令入口仍存在；8.1、9、10、11、12、12L、13、14、15 的固定标签也逐一核对该分派 |

Manager 0.5.2 的旧系统回退只允许 SDK19，因而纯 AOSP 5–6 存在“可读全局系统信息、无法确认应用管理用户”的缺口。本轮源码将白名单扩为 **19、21、22、23**；它仍先尝试 `am` 和 `cmd activity`，只有严格匹配 SDK 后才使用上述旧格式。用户切换后重新扫描、写前与写后核验同一用户、未知身份禁止写入及取消语义都应继续保留。此修改不表示已经在小米或其他品牌的 Android 6 固件上执行成功。

## Package Manager 命令

| 命令入口与参数 | API19 / 4.4 | API21–23 / 5–6 | API24–25 / 7 | API26–27 / 8 | API28–36 / 9–16 |
| --- | --- | --- | --- | --- | --- |
| `pm list packages --user`，含 `-s/-d/-u` | 有 | 有 | 有 | 有 | 有 |
| `pm install --user` | 无 | 有 | 有 | 有 | 有 |
| `pm uninstall --user` | 无 | 有 | 有 | 有 | 有 |
| `pm path --user` | 无 | 无 | 有 | 有 | 有 |
| `pm default-state --user` | 无 | 无 | 有 | 有 | 有 |
| `cmd package install-existing --user` | 无 | 无 | 无 | 有 | 有 |
| `pm install-existing --user` | 无 | 无 | 无 | 无 | 有 |

- [4.4 Pm.java](https://android.googlesource.com/platform/frameworks/base/+/android-4.4_r1/cmds/pm/src/com/android/commands/pm/Pm.java#268)：L268 起支持包列表的 `--user`。L789 起安装默认 `INSTALL_ALL_USERS`；L1093 起卸载默认 `DELETE_ALL_USERS`，两者不解析 `--user`。
- [5.0 Pm.java 安装解析](https://android.googlesource.com/platform/frameworks/base/+/android-5.0.0_r1/cmds/pm/src/com/android/commands/pm/Pm.java#867)：L913–914 实际解析 `--user`，即使旧帮助没有列出；[卸载解析](https://android.googlesource.com/platform/frameworks/base/+/android-5.0.0_r1/cmds/pm/src/com/android/commands/pm/Pm.java#1265)也明确处理用户参数。5.1、6.0 保留这些能力。
- [6.0 Pm.java](https://android.googlesource.com/platform/frameworks/base/+/android-6.0.0_r1/cmds/pm/src/com/android/commands/pm/Pm.java#760)：`path` 尚不接受用户参数，L1936 附近直接以用户 0 查询；分派没有 `default-state`。
- [7.0 Pm.java](https://android.googlesource.com/platform/frameworks/base/+/android-7.0.0_r1/cmds/pm/src/com/android/commands/pm/Pm.java#647)：明确实现 `path --user`，L185 增加 `default-state`。**7/8 的 `cmd package` 尚无这两个入口，不能把所有 `pm` 命令一律改为 `cmd package`。**
- [7.0 package shell](https://android.googlesource.com/platform/frameworks/base/+/android-7.0.0_r1/services/core/java/com/android/server/pm/PackageManagerShellCommand.java#85)无 `install-existing`；[8.0 实现](https://android.googlesource.com/platform/frameworks/base/+/android-8.0.0_r1/services/core/java/com/android/server/pm/PackageManagerShellCommand.java#313)新增并接受 `--user`。同版本旧 Java `pm` 入口尚无该分派。
- [9.0 pm 脚本](https://android.googlesource.com/platform/frameworks/base/+/android-9.0.0_r1/cmds/pm/pm)改为 `cmd package "$@"`，两个入口才共享这些能力。[16 的 pm.sh](https://android.googlesource.com/platform/frameworks/base/+/android-16.0.0_r1/cmds/pm/pm.sh)仍保留转发。

`pm enable/disable-user --user` 在所核查 4.4 起版本已有入口，但厂商和设备策略仍可能拒绝操作。`default-state` 与 `enable` 的含义不同，前者恢复系统默认启用状态，不能为了兼容旧系统静默改为强制启用。

Manager 的安装使用电脑端 `adb install --user <id> -r <apk>`，其结果还取决于主机 ADB、设备 Package Manager、APK 的 minSdk/targetSdk、ABI、签名、存储和安装策略。上表说明设备端能力边界，不代表任何 APK 必定可装。

**任何写操作都不能为兼容性删掉 `--user`。** 旧版安装／卸载默认作用于所有用户，现代接口的缺省用户语义也不能代替明确的操作目标。4.4–6 的旧 `pm path PACKAGE` 固定查用户 0；即使只是读取大小，也不能对当前非零用户无条件删参数回退。

## HOME 与布局 Provider

| Android / API | HOME 查询与设置 | `content call --user --method --arg` |
| --- | --- | --- |
| 4.4、5、6 / 19、21–23 | 所核查标准 `pm` 无 `query-activities`、`resolve-activity`、`set-home-activity` | 解析器已有这些参数 |
| 7、8 / 24–27 | `cmd package` 有三项命令及 `--user`；Java `pm` 尚不分派它们 | 保留 |
| 9 / 28 | `pm` 包装 `cmd package`，两入口共享；设置仍采用具体 ComponentName | 保留 |
| 10–16 / 29–36 | HOME 入口保留，设置改走包级 `RoleManager.ROLE_HOME` | 保留，但 Provider、权限及用户范围仍须核验 |

证据：

- [4.4 Content.java 的 parseCallCommand](https://android.googlesource.com/platform/frameworks/base/+/android-4.4_r1/cmds/content/src/com/android/commands/content/Content.java#244)在 L244–273 接受 `--uri/--user/--method/--arg`，虽然该版本帮助漏写 call 的 `--user`。后续版本至 [16 Content.java](https://android.googlesource.com/platform/frameworks/base/+/android-16.0.0_r1/cmds/content/src/com/android/commands/content/Content.java)保留参数解析。
- [6.0.1 Pm.java](https://android.googlesource.com/platform/frameworks/base/+/android-6.0.1_r1/cmds/pm/src/com/android/commands/pm/Pm.java)没有三项 HOME 命令；[7.0 package shell](https://android.googlesource.com/platform/frameworks/base/+/android-7.0.0_r1/services/core/java/com/android/server/pm/PackageManagerShellCommand.java#114)明确分派，在 L864–917 查询、L1076–1107 设置。
- [8.1 Pm.java](https://android.googlesource.com/platform/frameworks/base/+/android-8.1.0_r1/cmds/pm/src/com/android/commands/pm/Pm.java#118)仍是旧入口；未知的三项 HOME 命令会报错，不能把“cmd 不可用时换 pm”当成普遍可行方案。
- [9.0 设置 HOME](https://android.googlesource.com/platform/frameworks/base/+/android-9.0.0_r1/services/core/java/com/android/server/pm/PackageManagerShellCommand.java#2239)仍使用 ComponentName；[10.0](https://android.googlesource.com/platform/frameworks/base/+/android-10.0.0_r1/services/core/java/com/android/server/pm/PackageManagerShellCommand.java#2506)与 [16.0](https://android.googlesource.com/platform/frameworks/base/+/android-16.0.0_r1/services/core/java/com/android/server/pm/PackageManagerShellCommand.java#3645)改为 HOME role，输入扁平组件时仅提取包名。因此 Android 10+ 同包多个 HOME activity 的具体选择不能由 `Success` 文本保证。

Manager 的 `homes()` 使用 `cmd package`，没有 HOME 能力时保留可读应用目录但不确认默认桌面，停用／卸载继续关闭。错误、空输出、Resolver／Chooser 或多个候选组件都不能当作已确认的默认 HOME；猜测厂商桌面包名也不能替代读取结果。设置 HOME 后精确比较实际默认组件的复查必须保留。

布局调整另外要求：当前默认启动器明确、目标用户一致、启动器提供兼容 Provider、返回有效协议与布局、写入后复查一致。仓库十款启动器的 `resource/launcher/*/app/build.gradle` 均声明 **minSdk 26**。所以“管理器能读取 Android 4.4/6 电视”“系统有 content call”“本仓库启动器 APK 能安装并编辑”是三项独立验收，不能互相替代。

## 当前缺口及可以保持语义的修复

| 范围 | 0.5.2 / 当前实现情况 | 可采取的处理及边界 |
| --- | --- | --- |
| AOSP 5–6 当前用户 | 0.5.2 的回退仅允许 SDK19 | 本轮源码扩展到已核实的 21/22/23；保留严格解析、身份未知禁止写入和用户变更复查。开发改动不等同于已发布安装包或小米电视实测。 |
| 全局系统信息 | 0.5.2 已与当前用户查询解耦；旧 df 有回退 | 确保身份识别／应用目录失败仍可看设备信息；单项不可读保持未知。不得将查询发出视为读到真实数值。 |
| 旧系统包大小 | API19–23 不支持 `pm path --user`，旧设备也可能缺 `stat` | 当前保持未知合理。可研究仅对**已确认当前用户 0**的只读旧格式回退；未确认或非零用户不回退，不借此更改写命令。 |
| 无 HOME 查询 | API19、21–23 标准命令入口不足；OEM 还可能限制新版本 | 保留应用目录及必要保护。可以独立尝试只读候选列表和默认解析，避免一个失败掩盖另一个；只有单一明确默认 HOME 才建立保护事实。 |
| 多候选／Resolver HOME | 不能从解析结果中挑第一个组件当默认 | 本轮源码收紧为唯一、有效、非 Resolver/Chooser 的组件；失败继续关闭停用／卸载。具体回归结果见本轮测试报告。 |
| Android 10+ 设置 HOME | 角色服务按包选择，未保证同包具体组件 | 保留写后精确复查；不将 `Success` 或同包名当成完全成功，也不强行改写系统数据库。 |
| 旧系统安装／卸载／恢复 | 用户范围、默认启用状态和 install-existing 存在真实能力分界 | 显示真实失败或能力限制；不能删除用户参数、把恢复默认状态变为强制 enable、通过删除数据／绕过策略“修好兼容”。 |

## 小米电视 4 / Android 6 的验收拆分

用户报告的型号和 Android 版本用于建立待测条目；仍须实际读取 SDK、固件构建号及当前用户，不能假定所有“小米电视 4”运行相同系统。

- **连接及只读信息**：核验授权、重连、设备型号／系统属性、内存和 `/data`，再核验 API23 的受限用户回退与 `pm list packages --user <实际用户>`。本轮已补源码路径，尚不能据此宣称这台电视通过。
- **应用安装**：AOSP API23 具备 `--user` 安装参数；需要另测可安装于 API23 的 APK，以及正常安装、更新、签名不符和 minSdk 不符的真实结果。当前仓库 minSdk26 的启动器不能充当“Android6应安装成功”的样本。
- **默认桌面和布局**：标准 AOSP API23 缺当前使用的 HOME shell 入口。小米可能存在定制能力或额外限制，需要实际只读探测与明确授权后的行为验证；不能从品牌或 `content call` 的存在推断支持。
- **多用户与保护**：身份不能确认时不写入；切换用户后重新确认；默认 HOME 不能确认时停用／卸载应被保护逻辑拒绝。这些预期限制也是验收项，不能为得到“全绿”而删除。

## 厂商与真实测试记录要求

同品牌可因型号、地区、固件更新、运营商定制、企业设备策略而改变 ADB、HOME 或 Provider 能力。Android TV、Google TV、定制 Android 电视和外接 Android 盒子分别记录；不能把非 Android 系统套入此命令矩阵。

每个实际组合应保存：型号与品牌原文、SDK／Android 版本、构建指纹或脱敏构建号、主机系统与 ADB 版本、当前用户、查询的命令参数、退出码和有限原始输出、操作前后状态、失败／取消结果、执行日期，以及是否使用模拟 ADB。没有设备时标为“待真机验证”，源码检查和模拟测试单独列出。

建议至少覆盖以下不同结果：官方命令可用、未知命令／帮助页、零退出码但错误文本、权限拒绝、未授权／离线、用户切换、多候选 HOME、默认桌面无法确认、Provider 不存在或协议不符、安装后复查未确认、取消发生在读取／写入后核验阶段。读到能力不足是有效结果；不能把缺失证据登记成通过。

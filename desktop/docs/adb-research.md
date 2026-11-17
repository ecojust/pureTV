# ADB 能力调研

以下为官方文档、AOSP 源码及本机 ADB 37.0.1 帮助的只读核对，尚未连接电视验证。SERIAL 为已确认设备，U 为客户端通过下列兼容查询核实的当前用户，PACKAGE／COMPONENT 为从设备查询并校验后的标识。

| 操作 | 命令 |
| --- | --- |
| 网络连接 | `adb connect IP:PORT` |
| 配对式无线调试 | `adb pair IP:PAIR_PORT`（交互传入配对码），随后 `adb connect IP:DEBUG_PORT` |
| 检查授权／在线状态 | `adb devices -l` |
| 当前用户 | 优先 `adb -s SERIAL shell am get-current-user`，再尝试 `cmd activity get-current-user`；仅 SDK 19/21/22/23 可回退到 `dumpsys activity processes` 的 `mUserLru`，见下文 |
| 已安装应用 | `adb -s SERIAL shell pm list packages --user U` |
| 系统应用／已停用应用 | 在以上查询中分别加 `-s`、`-d` |
| 停用／启用 | `adb -s SERIAL shell pm disable-user --user U PACKAGE` / `pm enable --user U PACKAGE` |
| 当前用户卸载并保留数据 | `adb -s SERIAL shell pm uninstall -k --user U PACKAGE` |
| 恢复仍保有安装包的应用 | `adb -s SERIAL shell cmd package install-existing --user U PACKAGE`，随后复查安装状态；此操作不自动还原历史启用状态 |
| 查询 HOME 启动器 | `adb -s SERIAL shell cmd package query-activities --components --user U -a android.intent.action.MAIN -c android.intent.category.HOME` |
| 当前默认 HOME | `adb -s SERIAL shell cmd package resolve-activity --brief --user U -a android.intent.action.MAIN -c android.intent.category.HOME` |
| 设置 HOME | `adb -s SERIAL shell cmd package set-home-activity --user U COMPONENT` |
| 安装 APK | `adb -s SERIAL install --user U -r FILE.apk` |

普通网络 ADB 常见端口为 5555，但以设备实际显示值为准。配对端口和调试端口可能不同，按电视是否提供配对界面处理；不能假设所有 Android 11 电视都支持配对式无线调试。当前官方文档列 TV Android 13 起支持此方式。

`connect` 输出成功不代表已授权，须再次检查设备状态。连接状态区分连接中、等待电视授权、在线、离线和失败。断开只针对当前设备。

普通应用列表不加 `-u`；该选项还会包含当前用户已卸载但设备仍保有的包，后续单独用于“可恢复”列表，不应计入已安装数量。

安装自定义启动器后先查询并验证 HOME 组件，再切换并重新解析默认桌面。保留原组件；部分厂商会拒绝设置或在重启后恢复默认值，按实际结果反馈。

任何修改都同时检查退出码、命令返回的 Success／Failure 文本与设备状态复查，不能仅凭退出码 0 宣称成功。停用撤销须区分原本 DEFAULT 与显式 ENABLED 状态，可用 `pm default-state`／`pm enable` 还原。分包安装须另用 `install-multiple`，首版文件选择只接受单 APK。

## Android 4.4（SDK 19）

0.5.2 修复连接后 `am get-current-user` 输出 usage 并中断全部读取的问题。只读型号、系统版本、内存、CPU、分辨率和容量查询不再依赖当前用户识别；应用扫描和修改仍核实用户身份。

KitKat 没有 `am get-current-user` 或现代 `cmd activity`。AOSP 的 `dumpsys activity processes` 输出 `mUserLru: [0, 10]`；源码明确最后一项是当前用户，并在切换用户的同一锁内更新。当前源码仅在实时读取的 SDK 严格为 19、21、22、23 时使用该路径（0.5.2 发布版仅支持 19；5.x/6.0 的源码证据见 [版本能力矩阵](android-command-compatibility.md)），拒绝空、重复、非法及越界字段，不从正在运行的用户或前台应用推测身份，也不默认用户 0。每次修改仍重新核实用户；取消与同用户保护继续生效。

KitKat 的 `df` 将 `-k` 当作路径，因此容量查询在现代格式不可用时回退 `df /data`，解析明确的 `Size Used Free Blksize` 表头及 K/M/G 二进制单位。数值来自工具已舍入到一位小数的显示值，精度受系统输出限制。

本轮 API19 镜像实际发现非致命的完整 `libdvm.so` text-relocations 警告混入旧 ADB shell 的包列表。当前源码仅忽略已核实的这一完整诊断行；usage、权限错误、未知警告与无效包名仍拒绝，主安装目录仍须非空。该修复尚不在已发布0.5.2安装包内。

Android 11 的 toybox `df` 按设备号匹配挂载表，可能为固定 `/data` 查询打印同一文件系统的其他挂载路径。本轮镜像实际末列为 `/storage/emulated/0/Android/obb`；没有因此把任意分区行当作 data 容量。当前源码在两种 df 均无法解析时，回退固定命令 `stat -f -c %S:%b:%a /data`：按 toybox 源码，三个字段分别为 `f_bsize`、`f_blocks`、`f_bavail`，以检查溢出的乘法换算总量及非特权可用量。只接受唯一完整的三个无符号数，未知／异常输出继续显示未知，不依赖用户0或root。Android6和11的AOSP源码已核实此接口；厂商仍可能缺少它。

4.4 的 `pm list packages --user U` 支持应用扫描，但没有现代 HOME 查询、`cmd package install-existing` 或 `pm default-state`。无法确认默认桌面时保留列表，并停止停用／卸载。4.4 原生安装及卸载命令不支持本客户端所需的 `--user`，不会通过去掉该参数改为影响全部用户的操作。连接可用不表示所有修改功能或市场 APK 都兼容；APK 自身最低 Android 版本、架构和签名仍须符合设备要求。缺少 `stat` 时安装包大小可显示未知。

来源：

- [Android 官方 ADB 文档](https://developer.android.com/tools/adb)
- [ADB 命令手册](https://android.googlesource.com/platform/packages/modules/adb/+/refs/heads/main/docs/user/adb.1.md)
- [当前 PackageManagerShellCommand](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/services/core/java/com/android/server/pm/PackageManagerShellCommand.java)
- [Android 8.0 PackageManagerShellCommand](https://android.googlesource.com/platform/frameworks/base/+/android-8.0.0_r1/services/core/java/com/android/server/pm/PackageManagerShellCommand.java)
- [Android 4.4 ActivityManagerService：当前用户历史定义及切换逻辑](https://github.com/aosp-mirror/platform_frameworks_base/blob/android-4.4_r1/services/java/com/android/server/am/ActivityManagerService.java#L557)
- [Android 4.4 Package Manager 命令实现](https://github.com/aosp-mirror/platform_frameworks_base/blob/android-4.4_r1/cmds/pm/src/com/android/commands/pm/Pm.java)
- [Android 4.4 toolbox df 输出与参数](https://github.com/aosp-mirror/platform_system_core/blob/android-4.4_r1/toolbox/df.c)

- [Android 4.4 bionic linker 的非致命 text-relocations 诊断](https://android.googlesource.com/platform/bionic/+/android-4.4_r1/linker/linker.cpp#1534)
- [Android 11 toybox df 挂载匹配](https://android.googlesource.com/platform/external/toybox/+/android-11.0.0_r1/toys/posix/df.c#195)
- [Android 11 toybox stat 文件系统字段](https://android.googlesource.com/platform/external/toybox/+/android-11.0.0_r1/toys/other/stat.c#135)
- [Android 6 toybox stat 实现](https://android.googlesource.com/platform/external/toybox/+/android-6.0.0_r1/toys/other/stat.c)

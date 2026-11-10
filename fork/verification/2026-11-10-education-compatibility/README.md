# 教育 APK 与 APK Checker 电视环境的兼容性

检查日期：2026-11-10。原包来自 pureTV 提交 `6a2f865aef930ecea868ad185fba6ad59f824b80`，本轮不修改 APK 字节或证书。

| 应用 | 原包 SHA256 | 已确认情况 |
| --- | --- | --- |
| 儿歌多多TV 1.3.1.0 | `f02e205460dc68af3a8161feb042737b175beea64073d03502fb113e155de6f5` | 仅有32位 ARM 库；用户 Apple Silicon / APK Checker TV 安装报 `INSTALL_FAILED_NO_MATCHING_ABIS`。 |
| 宝宝趣学 3.0.1 | `41ea8a44d3febece6284b10c05ff7ddd08dbd8f5555253ffe661dc40a2c67121` | 有 ARM64 库及普通启动入口，无电视桌面入口；Linux TV 对照已捕获启动后的应用空指针崩溃。 |

## 儿歌多多：原生库架构不兼容

[实际原生库检查](ergeduoduo-native-libraries.json)显示8个 `.so` 全在 `lib/armeabi-v7a/`，均为 ELF32 / EM_ARM。用户错误中的缓存文件名与原包 SHA256 完全一致，安装器直接返回 ABI 不匹配，不能通过延长超时、重复安装、改文件名或重新签名解决。

APK Checker 0.2.6 的 Apple Silicon TV 环境配置为 Android TV 16 / API 36 / ARM64，见其[固定资源目录](https://github.com/ecojust/apk-checker/blob/ce99f7d896ccb660e7f3bec32ca1e67aa8c0cdea/resources/runtime-catalog.json)。目前未取得用户设备的完整 `ro.product.cpu.abilist`；“当前原包无法安装”的判断直接依据用户安装器错误及原包 ELF，并不泛指所有64位 Android 系统都不能运行32位应用。

可行条件是使用明确支持 `armeabi-v7a` 的 Android 系统，或取得原作者实际提供 ARM64 库的同应用 TV 版本。ABI 满足后仍需检查启动和播放。固定上游快照与检查当时的最新 `main` 都只有1.3.0.0、1.3.1.0两个TV包；[旧版实检](ergeduoduo-old-native-libraries.json)也仅有ARM32，因此不能推荐用该旧版绕过错误。有限公开查询未找到可验证的 ARM64 TV 替代包，范围与限制见[来源核查](ergeduoduo-sources.json)。

## 宝宝趣学：桌面图标与实际启动分开判断

[静态报告](baby-static-report.json)、[原生库头部](baby-native-libraries.json)和[解码 Manifest](baby-manifest.xml)确认：

- `com.wn31.cuteSpark`，版本3.0.1 / code3，minSDK21、targetSDK34。
- 提供真实 ARM64、ARMv7、x86、x86_64 库，包含 ARM64 加固库 `assets/libjiagu_a64.so`。
- `com.wn31.cuteSpark.HomeActivity` 声明 `MAIN` + `LAUNCHER`，没有 `LEANBACK_LAUNCHER`。电视系统桌面可能没有图标，可以从 APK Checker 的“桌面”打开。
- Application 为 `com.stub.StubApp`；[DEX 反汇编](baby-dex-disassembly.txt)只包含加固壳的4个类，业务代码运行时恢复。不能据加固壳存在就判定闪退根因。

用户最初描述“点开后闪退”，随后补充提示“好像就是说桌面图标不显示啥的”，尚未提供准确原文。代码中有与该描述相符的说明：APK Checker 0.2.6 的 [App.tsx](https://github.com/ecojust/apk-checker/blob/ce99f7d896ccb660e7f3bec32ca1e67aa8c0cdea/src/App.tsx) 中，“从这里打开应用；电视系统桌面可能不会显示手机应用图标。”是在 APK Checker 桌面存在电视模式应用时显示的固定说明，不检测某个 APK 是否启动失败。[android.ts](https://github.com/ecojust/apk-checker/blob/ce99f7d896ccb660e7f3bec32ca1e67aa8c0cdea/electron/android.ts) 在找不到电视入口后还会继续寻找普通入口，不把该提示作为失败终止条件。

Mac 上尚无宝宝趣学实际崩溃堆栈，暂不能确认为加固壳、Android版本、权限或其他原因。若从 APK Checker 的应用卡片打开后确实退出，需要保留该次启动错误与 crash/main/system logcat；无 Java/native 堆栈时还需 `dumpsys activity exit-info com.wn31.cuteSpark`。只截取包含包名的行会遗漏后续堆栈。

## 运行对照与证据边界

实际测试使用 APK Checker 诊断提交 `d864145a7637a6501e7e282b48d599364d771410`，生产运行时代码保持0.2.6，扩展固定原包测试参数和失败日志采集。宿主 Linux x86_64、系统 Android TV 16 / API36，设备 `ro.product.cpu.abilist=x86_64,arm64-v8a`、native bridge 为 `libndk_translation.so`，两次均是干净私有 AVD。原包下载后核对固定 SHA256，未修改原包。

| 原包 | 首轮工作流 | 安装 | 启动 | 证据 |
| --- | --- | --- | --- | --- |
| 儿歌多多 | [42814117728](https://github.com/ecojust/apk-checker/actions/runs/42814117728) | 失败：`INSTALL_FAILED_NO_MATCHING_ABIS` / -113 | 未执行 | [原始检查输出](runtime/ergeduoduo/annotations-129822706626.json)、[设备与阶段结果](runtime/ergeduoduo/diagnostics.json) |
| 宝宝趣学 | [42814114176](https://github.com/ecojust/apk-checker/actions/runs/42814114176) | 成功，当前用户可查询到准确包名 | 失败：应用进程抛出 Java `NullPointerException`，随后回到系统桌面 | [完整 crash buffer](runtime/baby-fun-learning/logcat-crash.txt)、[原始检查输出](runtime/baby-fun-learning/annotations-129822693919.json)、[入口与阶段结果](runtime/baby-fun-learning/diagnostics.json) |

宝宝趣学两条未截断异常都属于进程 `com.wn31.cuteSpark`：

```text
Thread-6: AllJsonData.getChildrenAllVideo() on a null object reference
  at com.wn31.util.AndroidUtil.noBoxParseJson(AndroidUtil.java:22)
Thread-7: UpdateManager$ReleaseMetadataJson.getElements() on a null object reference
  at com.wn31.util.UpdateManager.getRemoteVersionCode(UpdateManager.java:3)
```

这证明本次 Linux 对照的失败发生在应用业务代码处理视频列表/更新信息时，原包没有处理这些空对象。为何对象为空仍未确定，不能据此断言服务器停服、特定域名被阻断或换网络一定解决。修复需要原作者在数据读取失败/解析为空时处理异常，并提供可验证的新版本。

[后续来源核查](baby-source-search.json)在固定及当前上游均只找到2.0.0与3.0.1，未找到可验证的新修复包或业务源码；未测试2.0.0，不能把降级描述为解决方案。APK隐私文件中的自述署名没有独立验证，归档 `provider` 保持原值。这是有限检查范围，不代表其他地方不存在更新。

两次运行均按真实结果记为失败，没有重跑掩盖失败；宝宝测试完成卸载，私有模拟器进程清理通过。测试生成的截图及一般 logcat 随 GitHub artifact 上传，但本环境下载该归档返回 HTTP403，任务日志接口返回空内容；因此只归档了可读取的原始 checks、由分段输出重组的诊断 JSON 和完整 crash buffer，没有声称看过截图，也没有 HTTP 请求细节。诊断中的 `cmd user is-user-unlocked` 在镜像不受支持，另外的 `am get-started-user-state` 明确返回 `RUNNING_UNLOCKED`；该附加采集错误不是应用崩溃原因。

Linux 对照不能代替 Apple Silicon Mac 验证；用户 Mac 是否发生同一异常仍待该次日志。没有实体电视或内容播放测试，宝宝 `apkExecuted:true` 仅表示已实际启动过进程，不表示运行成功。

APK Checker 侧的[完整报告与证据](https://github.com/ecojust/apk-checker/blob/a5188ef4547107b877c1b68dc04c41ac9222acce/docs/testing/education-apk-compatibility.md)已在独立诊断分支归档；没有修改生产运行时代码或发布新客户端安装包。

静态 Manifest/DEX 由 androguard 4.1.3 只读解析，归档反汇编文本只清理了行末空白，原生库 ELF 头部由 Python 标准库 `zipfile` / `struct` 读取；ZIP CRC、实际包摘要与归档元数据交叉核对。原始 APK 不在宿主机执行。静态证据内的工作目录指本次临时环境，后续应通过上述固定提交恢复原包。

[本轮完整归档检查](archive-check.json)：49项通过，19款/28个APK；这是归档完整性检查，不是两款应用运行成功。

[返回教育目录](../../education/README.md) · [归档验证索引](../README.md)

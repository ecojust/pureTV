# 梨园 TV 0.1.0 验证记录

更新日期：2026-11-10。本地最终完整检查已通过；源码提交、CI、签名与下载信息由主任务在实际完成后补齐。尚未填写的检查不视为通过。

应用包名 `com.ecojust.operatv`，版本名0.1.0 / versionCode 1，声明最低Android4.4 / API19、targetSDK29。声明的最低系统版本不等于已在所有相应设备验证。项目采用原生Java界面和系统播放器，最终APK是否包含原生库仍须对签名产物核对。

## 来源与公开网络检查

[来源调查](research/SOURCES.md)记录了五个央视公开栏目、栏目ID和官方接口出处；[五栏目网络探测](research/public-column-probes.json)与[HLS片段探测](research/public-hls-probe.json)保留实际结果。

- 使用应用的User-Agent，五个栏目各检查列表、点播信息及HLS master，共15个请求均返回HTTP200，点播信息的公开播放与版权限制标记符合本次解析条件。
- 另对一个节目检查VOD子列表及首段TS，首段仅请求、读取65,536字节，返回HTTP206 / `video/MP2T`，具有MPEG-TS同步字节。
- 以上证明当时可从本次网络环境读取这些公开响应，不证明Android设备已经解码播放、整期节目持续播放、声画同步或其他地区可用。官网拒绝、版权限制、空数据和网络失败应保留为明确错误。
- 原七星戏曲的[静态参考证据](research/original-apk-reference.json)与本应用的功能验证分开记录；没有运行或改签原七星APK，也没有据其ABI声明宣称复现用户这次安装错误。

## 本地构建与失败记录

使用项目共享Gradle工程，任务范围为：

```sh
cd resource/launcher/puretv
./gradlew --no-daemon --continue \
  :opera:assembleDebug :opera:verifyReleaseSize \
  :opera:testDebugUnitTest :opera:lintDebug
```

工具链由主任务准备的JDK17、Android Platform35与Build Tools34提供。工具目录在仓库外；构建环境位置不是唯一证据入口。

| 阶段 | 实际结果 | 说明 |
| --- | --- | --- |
| 本地attempt1 | 整轮失败，单元测试未执行 | `OperaHttpTest` 使用的 `com.sun.net.httpserver.HttpServer/HttpExchange` 不在Android测试编译路径中，测试源编译失败。Debug/Release构建与lint完成不能抵消本次失败。 |
| HTTP测试夹具修正 | 已改用 `java.net.ServerSocket` | 保留真实重定向、chunked/gzip、正文边界、UTF-8、取消与TLS断言；不增加生产依赖，不改用模拟成功。服务器限制请求头与读超时，并在测试后关闭线程和连接。 |
| 本地attempt2 | 72项执行，70通过、2失败 | 两项SAF文档测试失败；完整失败XML与汇总已保留。 |
| SAF夹具及attempt3 | 完整构建与测试通过，后续仍重跑 | 补齐测试ContentProvider的真实文件描述符行为；Importer另新增1项受阻读取超时检查，测试总数从72变为73。后续以冻结输入的attempt4作为最终本地证据。 |
| 本地attempt4 | 最终通过：73项全部通过，0跳过；lint 0错误、8警告 | 执行前后冻结输入的SHA256一致。Debug/Release构建、测试、lint及体积检查完成；未签名Release为44,264字节。签名后的APK仍须独立核对。 |

attempt1的[原始构建日志](validation/local-attempt1-build.txt)、attempt2的[构建日志](validation/local-attempt2-build.txt)、[汇总](validation/local-attempt2/summary.json)、[全部JUnit XML](validation/local-attempt2/test-results/)及[lint报告](validation/local-attempt2/lint-results-debug.xml)均保留；attempt3的[构建日志](validation/local-attempt3-build.txt)另存。最终结果见[attempt4完整本地证据](validation/local-attempt4/)。不得用重跑结果覆盖前面的失败记录。

attempt2两项失败位于 `OperaImporterTest`：

- `selectedPlaylistIsReadAsBoundedTextWithoutGivingItsUrlsDocumentAccess`：测试读取SAF片单时得到读取授权失效错误。
- `videoSelectionKeepsItsContentUriAndDoesNotCopyOrParseTheMovie`：测试无法打开所选媒体文档。

修复针对测试ContentProvider的文件描述符夹具；这不等于已在真实系统文件选择器完成授权、持久授权或重新授权验证。新的超时检查需独立计入最终结果。

### attempt2各类计数

下表来自已归档XML，失败数保留原值。

| 测试类 | 执行 | 通过 | 失败 | 跳过 |
| --- | ---: | ---: | ---: | ---: |
| `CctvCatalogTest` | 8 | 8 | 0 | 0 |
| `MainActivityTest` | 12 | 12 | 0 | 0 |
| `OperaHttpTest` | 7 | 7 | 0 | 0 |
| `OperaImporterTest` | 6 | 4 | 2 | 0 |
| `OperaItemTest` | 6 | 6 | 0 | 0 |
| `OperaStoreTest` | 14 | 14 | 0 | 0 |
| `PlaybackActivityTest` | 12 | 12 | 0 | 0 |
| `PlaylistParserTest` | 7 | 7 | 0 | 0 |
| 合计 | 72 | 70 | 2 | 0 |

最终attempt4仅Importer计数增加为7，其他七个测试类的执行数与上表相同；合计73项、73通过、0失败、0错误、0跳过。最终记录来自完整重跑，没有把新增检查计入旧72项报告。

lint保留8条警告，不描述为“零警告”。本地未签名Release体积44,264字节满足严格小于10,000,000字节的体积检查，但不能当作正式签名包的大小或摘要。Robolectric覆盖逻辑和平台替身行为，不能作为真实MediaPlayer解码、设备文件授权或实体电视性能证据。

## 界面截图的含义

原生界面预览使用Robolectric和固定演示数据生成。它们用于检查中英文布局、文字、焦点与各状态展示，需单独目视检查并记录分辨率与溢出情况。

这类预览不是实体电视截图，也不是央视节目实际播放截图。测试夹具中的节目卡片、标题、播放器状态不能用作真实内容可用性或播放成功证据。最终截图文件、尺寸及目视检查结论：**待主任务补充**。

## 真实Android模拟器检查

真实AVD测试必须使用与签名记录SHA256一致的APK、独立干净设备，通过普通界面操作；不使用生产测试入口修改状态。计划的运行脚本为仓库根目录 `tools/test-opera-emulator.py`，运行平台与最终脚本源码提交在完成后填写。

| 检查 | 当前验收状态 | 必须保留的证据 |
| --- | --- | --- |
| 可控测试视频与片单 | 待实际AVD结果 | 从普通导入界面进入播放；媒体时间真实推进、暂停、续播；对应请求、UI、播放器状态与错误日志。 |
| 公开央视节目 | 待实际AVD结果 | 实际栏目加载、动态解析、原生播放器准备与时间推进；失败或网络限制如实单列。 |
| 安装、电视入口与遥控操作 | 待实际AVD结果 | 准确包名、设备API/ABI、启动Activity、前台状态及实际按键结果。 |
| Mac Apple Silicon / ARM64模拟器 | 未验证 | 需要目标Mac上的安装、启动与播放记录，不能沿用Linux结果。 |
| 实体电视与其他真实设备 | 未验证 | `physicalTvTested:false`；不能将模拟器结果扩大为品牌或所有Android版本兼容。 |

可控fixture视频通过，只能证明所测设备上的受控媒体路径。公开节目失败时，整体验收必须保留这项失败；不能因为fixture通过而标记所有在线节目可用。HTTP响应成功、HLS文本可读和MediaPlayer命令已发出，也不能替代实际媒体时间推进。

## 最终交付记录（待主任务填写）

| 项目 | 当前记录 |
| --- | --- |
| 冻结源码完整提交SHA | 待补；文档草稿不提前指定未来提交。 |
| 本地最终完整构建/测试/lint | attempt4通过：73/73，0跳过；lint 0错误、8警告；未签名Release 44,264字节；执行前后冻结输入SHA256一致。见本地证据目录，最终源码提交仍待填。 |
| 原生预览及目视验收 | 待补最终图片路径、尺寸和检查结论。 |
| CI工作流/运行编号/attempt | 待补；工作流文件存在不表示已执行。 |
| 签名APK文件、字节数、SHA256 | 待补；本地未签名构建不能当作正式下载包。 |
| 发布证书SHA256与签名方案 | 待与仓库固定pureTV证书及实际 `apksigner` 输出核对。 |
| 实际最低SDK/目标SDK/原生库条目 | 待检查最终签名APK，不能仅抄源码配置。 |
| 真实AVD fixture结果 | 待补，和公开节目结果分别记录。 |
| 真实AVD公开节目结果 | 待补，不扩大只读网络探测结论。 |
| 远程提交、合并、公开下载与资源索引 | 待补各自实际状态及链接；不将生成APK等同于已发布。 |

若冻结后修改源代码或测试脚本，应记录新提交及哪些检查重跑；旧失败和旧预览继续作为历史保存，不冒充新产物的验证结果。

# BiliTV 0.1.0 验证记录

本记录对应首版预览安装包。自动化检查和签名完成；真实账号扫码、收藏／历史同步与实体电视实际播放尚未完成端到端验收。

## 来源与安装包

- 源码：[`4320cd213fc0d717ea0f8219a4b1c9c1617ac9a7`](https://github.com/ecojust/pureTV/commit/4320cd213fc0d717ea0f8219a4b1c9c1617ac9a7)。
- 构建、测试、签名与导出：[CI 42235270829](https://github.com/ecojust/pureTV/actions/runs/42235270829)，三个任务全部成功。
- 包名 `com.ecojust.bilitv`，versionName `0.1.0`，versionCode `1`；最低 Android 4.4 / API 19，target SDK 29。
- APK：`bilibili-0.1.0.apk`，**525,640 字节**。
- SHA256：`7a6f2801dbc1fcbc9614784710fe5eb0c1ab350247c1cfa9f6241e2804a6b508`。
- 证书 SHA256：`eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23`，与仓库现有固定发布证书一致。
- 本机再次执行 `apksigner verify --verbose --min-sdk-version 19 --print-certs`、`zipalign -c 4`、`aapt dump badging`；v1/v2/v3签名和对齐检查通过。
- APK内2份依赖许可证与冻结源码逐字节一致。代码来源依据成功CI的准确提交和产物哈希；没有把许可证比较当作字节码反编译比对。

原始报告、签名与包信息输出、签名元数据和机器可读摘要保存在 [ci-42235270829](validation/ci-42235270829/)。`export-metadata.json` 保留原导出路径及哈希；原始导出全部38个文件已校验，永久归档按本目录结构重新放置。

## 自动化与界面

- **51/51测试通过**，0失败、0错误、0跳过；lint 0错误、8条非阻断警告。
- 覆盖真实API响应结构的离线解析、WBI签名、HTTPS来源和cookie边界、会话注销与过期、二维码状态、收藏确认、历史游标、异步取消、遥控器输入、播放生命周期、断点位置和观看进度上报条件。
- Robolectric API19检查TLS1.2及播放器创建／释放，API23检查系统TLS保持，其他逻辑与原生界面使用API28。模拟系统检查不等于电视固件、根证书和硬件解码验收。
- 播放器初始焦点、窗口切换保留有效焦点、隐藏控制栏后遥控器唤醒均使用真实View树焦点断言；未手工设置ShadowActivity的焦点字段。
- 13张画面来自真实Android View的Robolectric native graphics渲染，包括中英文搜索／详情／扫码／收藏／历史和紧凑播放器。搜索页检查960×540及640×360；播放器检查640×360。原图见 [previews](previews/)，文件尺寸与哈希见机器可读 [result.json](validation/ci-42235270829/result.json)。
- 已目视检查搜索、收藏、历史、二维码、详情和播放器的布局、文字及焦点。视频、账号、二维码与封面占位内容为fixture，播放器视频区域为空；这些图片不能证明真实账号登录或媒体解码成功。

第二轮与第三轮失败报告分别保留在 [ci-42233099774](validation/ci-42233099774/) 和 [ci-42234298207](validation/ci-42234298207/)，没有覆盖为成功报告。第三轮焦点误报来自 [Robolectric 4.11.1 ShadowActivity](https://github.com/robolectric/robolectric/blob/robolectric-4.11.1/shadows/framework/src/main/java/org/robolectric/shadows/ShadowActivity.java#L554-L563) 的手动字段getter，最终改为检查真实View焦点。

## 真实网络探测与边界

脱敏结果见 [视频接口探测](network-video-probes.json) 和 [账号接口探测](network-account-probes.json)。已实际获得搜索20条结果、QR生成与待扫码状态、未登录nav／历史的正常拒绝响应。部分详情和后续搜索请求在当前网络返回HTTP412访问校验。

未取得可用于实播的媒体地址；没有进行真实扫码登录、收藏写入、账号历史同步或实际音视频解码。没有测试实体Android4.4、Android6或其他电视。平台权限、访问校验、旧系统证书与硬件解码限制仍可能影响使用；应用对失败显示错误，不使用演示内容替代真实结果。

安装包、源码和README资源已在 `99f0ef3d` 交付到GitHub master；公开下载大小和SHA256再次核对一致，见 [publication.json](validation/publication.json)。本次未创建pureTV管理器的新版本或GitHub Release，也未上传Gitee市场。

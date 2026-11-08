# putrtv商城0.1.0与启动器添加入口验证

历史报告：以下结果对应0.1.0及资源发布提交 `ca10d1460c756114776dbec0371dbb23d3366607`；其中APK与预览文件映射应在该提交读取。当前版本见 [VALIDATION.md](VALIDATION.md)。

源码固定在 `8f8024400673c7afdeea8b64cccb03da579c1d75`。商城首版为 **0.1.0 / code 1**；配套启动器为 pureTV **0.5.2 / code 16**、Nova **0.5.1 / code 5**，其余八款 **0.5.1 / code 4**。

## 商城

[CI 42376018146](https://github.com/ecojust/pureTV/actions/runs/42376018146) 的构建、测试、lint、固定证书签名和导出均成功。**99 项测试通过，0 失败、0 错误、0 跳过**；lint 无 Error/Fatal。原始报告、导出清单与文件映射见 [release-evidence/42376018146](release-evidence/42376018146/)。

正式 APK 大小 **144,133 字节**，最低 Android 4.4 / API 19，target SDK 29。

```text
SHA256: 53e5c279204b52fa262bc040b003d09b7fd9374ee0aecbb9325edf452e322f2f
Certificate SHA256: eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23
```

本地再次验证实际 APK 的包名、版本、最低系统、固定签名、zipalign 和冻结源资产字节；包内目录快照与源码相同。目录、下载、安装状态和界面检查覆盖：

- 固定 GitHub 提交、严格 JSON、重复或未知字段、目录缓存与过期提示；APK 大小上限统一 128 MiB。
- 下载的完整大小、SHA256 与 Git blob 校验、损坏缓存、截断、超量、磁盘不足、取消和路径边界。
- API 19/23/28 的版本与签名判断；旧系统 file URI、API 24+ 私有只读 Provider、API 26+ 未知来源授权。
- APK 包名／版本／签名不符阻止安装；取消、假的 RESULT_OK 和当前包版本不会被当作更新成功；进程重建后仍核验真实包管理器状态。
- 当前 HOME 的显式添加请求与外部 handler 拒绝；中文／英文、搜索、分类、更新、分页、遥控焦点、取消和错误反馈。
- 实际 TLS socket 显式启用 TLS 1.2、支持时保留 TLS 1.3，不修改全局证书或域名验证。Android 4.4 源码依据见 [TLS 审查](release-evidence/android-4.4-tls-review.json)。

9 张图来自实际 Android View 的原生测试渲染，使用演示目录和模拟包管理器。完整画面为 960×540、1280×720；3 张详情图为真实 Dialog decor 的 600×470 区域，并非完整电视画面。目录中的示例名称、版本与安装状态不代表测试机实际安装了这些软件。

## 启动器

[CI 42376018127](https://github.com/ecojust/pureTV/actions/runs/42376018127) 固定同一源码。第二次 attempt 只重跑 Circuit 及后续签名／导出，复用同次运行中其余九款已通过的构建。最终 **563 项测试全部通过，0失败/错误/跳过**；包含十款各13项新增共享检查，以及每款原有回归。10份lint均无Error/Fatal，固定证书签名和导出成功。原始报告与映射见 [release-evidence/42376018127](release-evidence/42376018127/)。

50张唯一原生图已核验：主页／应用页为1920×1080，添加页面为960×540。10份源码归档的SHA256、共享源码和配置应用源码已核验，见[源码归档记录](release-evidence/source-archives.json)。

启动器仍要求 **Android 8 / API 26 或以上**。确认页面只接收已安装应用包名和可选 SVG；名称由包管理器读取，默认白字。测试覆盖首页／应用页选择、空位和碰撞、重复／隐藏应用、两页满额、取消、无效包或 SVG、已卸载的旧块、损坏布局、并发编辑和写后读回。现有布局 Provider 的 `android.permission.DUMP` 保护保持不变。

按十款真实默认布局测试过候选空位；Forma、Sol 的默认首页已满，因此提供应用页选择。添加确认页的原生预览使用测试应用与空用户布局，不冒充六应用满首页的图。pureTV、Forma、Sol 的确认页已目视检查标题、页签、位置预览、确认／取消和焦点，无明显截断或重叠。

## 保留的失败记录

- [42375548761](release-evidence/42375548761/)：商城首轮 91 项中一项测试 fixture 不完整，Robolectric 把外部 handler 包名改为当前 HOME。补齐 ApplicationInfo 并增加包名保留断言后，原拒绝断言通过；生产检测未放宽。
- [42375548780](release-evidence/42375548780/)：十款生产编译、R8、lint 已通过；共享测试的 Files.readString 不受 Android 测试 bootclasspath 支持。改为 UTF-8 bytes 读取后完整执行测试。
- [42376018127 attempt 1](release-evidence/42376018127-attempt1/)：563 项仅 Circuit 的既有英文预览因 Maven POM HTTP 503 失败，新增共享测试全部通过。原始报告、图、任务和 artifact IDs 已保留；归档后只移除失败 Circuit 的临时报告 artifact 与本轮临时导出分支，再重跑失败任务。

## 验证边界

`physicalTvTested:false`。上述 Android 测试使用 Robolectric 和模拟包管理器，未在实体电视上完成联网下载、系统安装确认、覆盖更新或遥控操作的端到端验收。最低系统要求与逻辑测试不等于所有厂商电视均已实测。

原厂桌面必须使用其自身的应用列表或添加方式；旧版 pureTV 系列桌面须先更新。网络与系统根证书、未知来源安装策略仍由电视系统决定。商城不会静默安装、自动卸载旧签名应用或绕过系统权限。

首次内置目录固定旧的 126 项已发布资源，明确标记离线过期状态。正式远程目录已加入商城自身及新版启动器，默认严格验证 **127 项** 资源；后续发布按 [目录维护说明](CATALOG.md) 更新，包内快照不写入自身 APK 的哈希。

## 发布文件

签名APK、resource.json、校验清单、源码归档、原生图与127项目录同时入库。商城为0.1.0预览版；本次不创建GitHub Release，也未同步Gitee市场。下载入口使用仓库资源目录，不能把这两种发布渠道混为一谈。

资源发布提交 [`ca10d146`](https://github.com/ecojust/pureTV/commit/ca10d1460c756114776dbec0371dbb23d3366607) 已同步master。公开的127项目录及11份APK均重新通过HTTPS完整读取，5,261,748字节APK与本地大小/SHA256全部一致；见[公开下载校验](release-evidence/public-downloads.json)。这项检查验证下载文件，不代表电视端安装验收。

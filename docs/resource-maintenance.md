# 维护 APK 资源

电脑管理器与公共资源入口位于根目录，第三方小体积 APK 独立收录于 [fork/](../fork/README.md)，维护方式见其 [MAINTENANCE.md](../fork/MAINTENANCE.md)。下列 resource 约定用于原有启动器与应用目录；fork 不计入自研资源目录或自动上架商城。

原 Android 源码整体位于 `resource/launcher/puretv/` 与 `resource/apps/`；启动器与应用均按软件分目录：`resource/launcher/<启动器名>/` 和 `resource/apps/<应用名>/`，每个目录直接存放对应 APK。每个软件目录必须有实际 APK、resource.json、README、LICENSE 和 SHA256SUMS.txt。源码可直接放在目录中，也可附对应源码归档；封面使用 thumb.png。

新应用还必须随 APK 提供同目录的 `logo.svg`：`width="64"`、`height="64"`、`viewBox="0 0 64 64"`，UTF-8 文件不超过 8192 字节，遵循 layout.json 的静态 SVG 子集。README 链接图标，SHA256SUMS.txt 记录其校验值；第三方图标保留来源及许可说明。完整要求、市场多版本目录示例及缓存到布局 `icon` 的流程见 [应用资源与 logo.svg 约定](../resource/README-development.md#应用资源与-logosvg-约定)。历史商店资源没有图标时仍可下载安装。

市场按 APK 同目录的固定名称 `logo.svg` 发现图标，不读取 resource.json 中的图标 URL。同目录的多个 APK 共用图标；需要区分版本时，在市场仓库中将各版本 APK 与图标放入独立版本目录。管理器会保存下载时的图标，在新增应用块或明确切换 action 时填入 SVG，已有布局的自定义图标不会因刷新列表而改变。

Gitee 市场仓库的影音资源放在 `apps/media/<软件>/`，游戏放在 `apps/game/<软件>/`，启动器放在 `launcher/<软件>/`。管理器按目录分类，并依次显示「启动器」「影音」「游戏」三个 tab，无需修改客户端中的软件名单；旧版未分目录的 `apps/<软件>/` 兼容显示于影音。本源码仓库的 `resource/apps/` 目录结构保持不变。

Gitee 市场的每款软件可在 APK 同目录提供 `manifest.json`，管理器将 `provider` 原文显示在卡片应用名右侧，不额外显示“作者”标签；同目录多个 APK 共用该作者，不从软件名或仓库拥有者推测。示例：

```json
{"provider": "桔子桑"}
```

作者信息只用于显示，不替代 APK 的版本、大小或内容校验。读取固定目录提交中的文件，刷新市场后更新；缺少 manifest、provider 为空或无法读取时显示「未提供」，不影响正常浏览和下载。

第三方 APK 保留上游原始二进制、证书与许可证。自研应用使用固定的 pureTV 发布证书，旧证书安装包不能直接覆盖安装，更新前按各目录说明处理。密钥与密码不能进入 Git、源码归档或 Release。

```bash
python tools/resource_catalog.py --build-tools "$ANDROID_HOME/build-tools/34.0.0"
python tools/update-resource-index.py
python tools/update-tv-store-catalog.py --build-tools "$ANDROID_HOME/build-tools/34.0.0"
```

README 的启动器、影音应用、游戏和工具各组按制作顺序倒序展示。`tools/resource-order.json` 按**从早到晚**记录每组资源目录；新增资源时追加到所属数组末尾，版本更新、重新截图或目录文件修改不调整位置。索引生成器逆序展示，并检查重复、缺失和分类错误，不使用文件修改时间或最近发布版本排序。

现有顺序依据首次新增资源的 Git 历史（目录搬迁前的条目继续追溯原路径），百款 Game Kit 游戏依据 `resource/game-kit/progress.json` 的 `number` 从 1 到 100 登记。旧游戏先于这百款游戏；影音从早到晚为 ShortVideo TV、WebTV、HIFINi TV、CCTV Live。同一提交批量新增、无法证明独立制作先后的条目按目录名固定登记，不把这些条目之间的位置视为精确的时间先后。新资源尚未提交时也须先登记，因此浅克隆或源码归档中重新生成索引会得到相同顺序。

根目录中英文 README 对新增百款游戏暂时只展示 `tools/readme-featured-games.json` 中的精选项，原有游戏仍显示；`resource/README.md` 保持完整目录。分类标题统计当前显示数量，徽章统计整个资源目录。调整精选名单后运行同一索引生成器，无需删除游戏或修改百款完成记录。

## 更新 Android APK

1. 提交源码后手动运行 Android build，设置 `stage_resources=true`。CI 构建、测试后把 APK、元数据和 TV 渲染图暂存到 `build-assets/resources-运行编号`。这不会创建 Release。
2. 在本机设置 `PURETV_KEYSTORE_PATH` 和 `PURETV_KEYSTORE_PASSWORD`，使用既有 pureTV 发布密钥。
3. 更新启动器：

```bash
python tools/prepare-launcher-resource.py \
  --stage-branch build-assets/resources-运行编号 \
  --source-sha 构建对应的40位提交SHA \
  --build-tools "$ANDROID_HOME/build-tools/34.0.0"
```

更新自研应用使用相同参数运行 `tools/prepare-app-resources.py`。两者核验构建来源、包名、版本和签名后，直接更新对应软件文件夹的 APK、校验值和索引。应用直接保留源码；启动器同时附精确版本的源码归档。

`prepare-app-resources.py` 会保留应用目录中已有的 `logo.svg`，把它加入更新后的校验清单，并保留中英文 README 的图标下载链接。修改图标时先提交新的 SVG，再准备对应 APK 资源；脚本不会从 APK 或封面自动生成图标。

只更新单个应用时加 `--app 应用目录名`，可重复指定。例如独立的 HIFINi TV 使用 `--app hifini`，不会更新 Music TV。为了保留原批量行为，不传 `--app` 时仍只更新 `music`、`shortvideo`、`webtv`。

4. 提交资源并重新运行严格校验。Android CI（包括手动准备任务）不允许缺少 APK 或元数据。校验完成后删除临时 build-assets 分支。

启动器源码指纹仅覆盖 Gradle、源码、字体许可和安装脚本等构建输入，资源目录中的 APK、封面和元数据不参与计算，避免循环依赖。目录搬迁不改变现有 APK 的源码指纹。

## 发布管理器

以后只使用 `desktop-v版本号` 标签发布电脑管理器，四平台构建和校验全部成功后发布。Android 工作流只构建、测试和校验资源，不创建电视端 Release；历史版本保持可用。管理器 Release 说明链接到资源目录下载电视 APK。

## 电视商城目录

putrtv商城使用本仓库的 `resource/tv-store-catalog.json`，按真实包名、versionCode、最低系统和证书判断更新。它与电脑管理器的 Gitee 上架目录分别发布。新增或更新 APK 时，在严格资源校验通过后重新生成电视目录；具体命令见商城构建说明。目录和 APK 必须在同一个提交中可读取，不能只修改显示版本而没有对应安装包。

工具应用在 `tools/resource-order.json` 的 `tools` 数组登记，仍按创建顺序倒序展示。根目录八款百款游戏精选规则不影响商城和完整资源目录。

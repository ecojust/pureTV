# 维护 APK 资源

根目录只保留电脑管理器与公共资源入口。原 Android 源码整体位于 `resource/launcher/puretv/` 与 `resource/apps/`；启动器与应用均按软件分目录：`resource/launcher/<启动器名>/` 和 `resource/apps/<应用名>/`，每个目录直接存放对应 APK。每个软件目录必须有实际 APK、resource.json、README、LICENSE 和 SHA256SUMS.txt。源码可直接放在目录中，也可附对应源码归档；封面使用 thumb.png。

新应用还必须随 APK 提供同目录的 `logo.svg`：`width="64"`、`height="64"`、`viewBox="0 0 64 64"`，UTF-8 文件不超过 8192 字节，遵循 layout.json 的静态 SVG 子集。README 链接图标，SHA256SUMS.txt 记录其校验值；第三方图标保留来源及许可说明。完整要求、市场多版本目录示例及缓存到布局 `icon` 的流程见 [应用资源与 logo.svg 约定](../resource/README-development.md#应用资源与-logosvg-约定)。历史商店资源没有图标时仍可下载安装。

市场按 APK 同目录的固定名称 `logo.svg` 发现图标，不读取 resource.json 中的图标 URL。同目录的多个 APK 共用图标；需要区分版本时，在市场仓库中将各版本 APK 与图标放入独立版本目录。管理器会保存下载时的图标，在新增应用块或明确切换 action 时填入 SVG，已有布局的自定义图标不会因刷新列表而改变。

第三方 APK 保留上游原始二进制、证书与许可证。自研应用使用固定的 pureTV 发布证书，旧证书安装包不能直接覆盖安装，更新前按各目录说明处理。密钥与密码不能进入 Git、源码归档或 Release。

```bash
python tools/resource_catalog.py --build-tools "$ANDROID_HOME/build-tools/34.0.0"
python tools/update-resource-index.py
```

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

# 维护与复现

超过10 MB、未收录的文件见 [完整清单与复刻参考](OVERSIZED.md)。其版本、系统和架构仅为文件名线索；应用家族与开发评估维护在 `planning/app-notes.json`，运行 `python3 tools/update-tvapp-oversized.py` 生成 Markdown、JSON、CSV，使用 `--check` 验证205个文件的完整覆盖及生成结果。此清单与已下载小包的实际元数据验证分别记录。

范围为上游固定提交的实际APK文件，按 **0 < bytes < 10,000,000** 筛选，保留所有合格版本和架构命名变体。当前228个APK中符合条件23个，按实际包名分为14款应用。分类由用途和上游目录确定；娱乐目录中的直播、音乐、戏曲归media，游戏归game。没有为凑分类收录超限文件。

目录结构：`fork/<media|game|education|tools|fitness>/<应用>/`。每款提供 `manifest.json`（真实包信息、来源、签名及provider）、`assets.json`（原图标及生成方式）、`logo.svg`、可提取的原始图标、960×540的 `thumb.png`、原APK、README和SHA256清单。相同包名的多个版本保留在同一目录；VsTV HarmonyOS使用不同包名，因此单独分组。

## 校验现有收录

需要Python 3及Pillow，不需要重新下载APK或执行APK：

```bash
python3 tools/verify-fork-tvapp.py --root fork --report /tmp/tvapp-verification.json
```

校验器对照完整上游树检查筛选是否漏项或多收，核对实际APK大小、SHA256、Git blob、ZIP结构、签名证据、分类统计、图像、SVG静态子集、manifest及校验清单。原始aapt与apksigner输出保存在 `verification/apks/<GitBlobSHA>/`。

## 从固定快照重建

需要JDK 17、Android SDK Build Tools 34.0.0、Python 3/Pillow、Node.js、Inkscape及可用Chromium。资源工具使用仓库已有Playwright依赖（`desktop/node_modules`）；也可按工具参数指定浏览器。下面的变量必须替换成实际工具目录：

```bash
TVAPP_STAGE=/absolute/scratch/tvapp
TVAPP_BUILD_TOOLS=/absolute/android-sdk/build-tools/34.0.0
TVAPP_JDK=/absolute/jdk17

python3 tools/fetch-tvapp-apks.py \
  --inventory fork/upstream/candidates-raw.json \
  --output "$TVAPP_STAGE" --build-tools "$TVAPP_BUILD_TOOLS" --java-home "$TVAPP_JDK"

python3 tools/import-tvapp.py \
  --inventory fork/upstream --audit "$TVAPP_STAGE/apk-audit" \
  --apks "$TVAPP_STAGE/apks" --output fork \
  --batch-output "$TVAPP_STAGE/assets-batch.json"

python3 tools/fork-tvapp-assets.py \
  --batch "$TVAPP_STAGE/assets-batch.json" --build-tools "$TVAPP_BUILD_TOOLS"

python3 tools/import-tvapp.py --output fork --finalize
python3 tools/verify-fork-tvapp.py --root fork --report "$TVAPP_STAGE/report.json"
```

下载工具固定仓库、提交和Git blob，不信任清单中的任意下载域名。检查时不执行APK。导入器遇到同名但哈希不同的本地APK会停止；`--move`仅用于移动专用暂存目录中的已验证文件以减少磁盘占用。

原图标保留APK内部文件字节；`logo.svg`是符合启动器静态SVG子集的转换或简化版本，具体方法和是否近似在assets中说明。封面为真实浏览器渲染的信息卡，明确标注“应用介绍封面 · 非运行截图”。

## 更新上游版本

重新固定上游提交，获取未截断的完整树并生成新的候选清单和分类记录，再执行上述下载、静态检查和资源生成。不要仅替换APK或修改版本文字：必须同步来源快照、manifest、证书记录、图标/封面、目录统计及校验清单。若遇到新增包名或用途，补充导入器的分类名称和描述后审查。

源文件名不等于实际包信息。例如本次宽带直播两版有相同versionCode，VsTV的ARM/x86_64命名文件都含多架构库，戏曲多多两个版本的证书不同。这些差异已保留，不据此自动判断覆盖升级关系。

# putrtv商城 构建与签名

独立原生 Android TV 模块 `:putrtv-store`，包名 `com.ecojust.putrtvstore`，首版0.1.0／versionCode1。构建根目录为 `resource/launcher/puretv`，使用已有 Gradle Wrapper、JDK17、Android SDK35与Build Tools34.0.0。

```bash
cd resource/launcher/puretv
./gradlew --no-daemon --continue :putrtv-store:assembleDebug :putrtv-store:verifyReleaseSize :putrtv-store:testDebugUnitTest :putrtv-store:lintDebug
```

调试包位于 `resource/apps/putrtv-store/build/outputs/apk/debug/`，未签名release包位于同目录的 `release/`。Release使用R8及资源压缩，并要求APK严格小于10,000,000字节。本地构建不读取发布密钥。

最低Android4.4／API19，target SDK29；基础主题使用Holo，API21起使用Material。图标和banner由旧系统可绘制的shape/layer-list组成，没有仅API21支持的矢量图依赖。应用采用平台原生API，未引入运行时第三方库；测试使用JUnit4.13.2及Robolectric4.11.1，后者保留API19支持。

## 原生预览与测试

设置 `PUTRTV_STORE_UI_CAPTURE_DIR` 可导出原生测试图。CI至少要求 `putrtv-store.png` 和 `putrtv-store.en.png`，并归档该目录中的其他PNG。这些图应使用实际Android View和明确标记的fixture数据，不代表实体电视已安装、更新或完成实测。

Robolectric4.11.1的`ShadowActivity.getCurrentFocus()`读取手动设置的shadow字段；遥控器焦点检查应使用真实视图树的`root.findFocus()`、`isFocused()`及`isShown()`，并补齐窗口获得焦点的生命周期。不要手工伪造shadow焦点来通过断言。

安装权限由系统控制。Manifest声明`REQUEST_INSTALL_PACKAGES`，私有`ApkProvider`仅通过明确的只读URI授权提供APK；不声明`QUERY_ALL_PACKAGES`或宽泛的存储权限。API26起还需用户允许此来源安装应用，系统安装确认不能由商城绕过。API19至23的系统安装器对文件地址的要求与API24起不同，具体路径和失败处理由安装模块及对应测试约束。

## 定向CI

[putrtv Store build](../../../../.github/workflows/putrtv-store.yml)在`feat/putrtv-store`／`master`相关push、相关PR及手动dispatch时运行，仅构建此模块，不创建GitHub Release或上传Gitee。

1. build任务完成debug／release构建、单元测试、lint、包大小／身份检查和原生截图。使用`--continue`收集完整诊断，但任何失败仍阻止签名。
2. sign任务仅在可信分支且build成功后读取现有仓库发布密钥，核对固定证书并启用v1／v2／v3签名。PR不签名；build和sign均仅有仓库读取权限。
3. export任务单独拥有`contents: write`，把有界诊断及成功签名的产物写入新的临时分支；不修改master，不覆盖已有导出分支，不导出密钥。失败流程只导出诊断，不声称生成正式APK。

证书指纹来自 `tools/puretv-release-certificate-v2.sha256`，当前为：

```text
eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23
```

| Artifact | 内容 |
| --- | --- |
| `putrtv-store-build` | `unsigned.apk`、`build-metadata.json`、`previews/` |
| `putrtv-store-release` | 正式签名`putrtv-store-版本.apk`、`metadata.json`、`SHA256SUMS.txt`、`previews/` |
| `putrtv-store-test-reports` | JUnit／lint／日志及已有原生截图，失败时也保留 |

## 取回及核验

先核对实际流程结论和完整源码SHA，再下载签名产物：

```bash
gh run view RUN_ID --repo ecojust/pureTV --json conclusion,headSha,url
gh run download RUN_ID --repo ecojust/pureTV --name putrtv-store-release --dir /absolute/scratch/putrtv-store-release
```

如果artifact下载不可用，使用可信流程创建的 `build-assets/putrtv-store-RUN_ID` 分支：

```bash
mkdir -p /absolute/scratch/putrtv-store-export
git fetch origin refs/heads/build-assets/putrtv-store-RUN_ID:refs/remotes/origin/build-assets/putrtv-store-RUN_ID
git show origin/build-assets/putrtv-store-RUN_ID:release-staging/putrtv-store/export-metadata.json
git archive origin/build-assets/putrtv-store-RUN_ID release-staging/putrtv-store | tar -x -C /absolute/scratch/putrtv-store-export
```

将`RUN_ID`换成实际流程编号。`release-staging/putrtv-store/`包含导出清单、`reports/`和签名成功时的`release/`。首先逐项核对清单中的`sourceSha`、`runId`、build/sign结论、文件大小与SHA256；随后核验签名APK的包名、版本、min SDK19、固定证书及`apksigner verify --min-sdk-version 19`、`zipalign -c 4`。不得把失败流程的截图或unsigned.apk当成发布成功。

完整验证后再登记APK、resource.json、校验清单、中英文预览和README目录。临时导出分支在证据归档后可删除。Robolectric、模拟安装器和平台API测试不等同于实体电视安装／更新成功，验证记录须分别说明。

## 十款启动器的商城联动构建

[Launcher store integration build](../../../../.github/workflows/launcher-store-integration.yml)仅响应`feat/putrtv-store`／`master`中的启动器、证书、目录校验器和本流程修改，以及相关PR／手动dispatch。十款启动器分别在自己的构建根目录并行执行`:app:assembleDebug :app:assembleRelease :app:testDebugUnitTest :app:lintDebug`，不会构建游戏或电脑端管理器。

十个`app/build.gradle`通过`sourceSets`纳入`resource/launcher/shared/src/main/java`与`shared/src/test/java`，公共入口使用`com.ecojust.launcher.shared`包。各启动器仍使用Android8／API26以上及Robolectric4.14.1；这与商城自身的Android4.4／API19最低要求不同。共享确认页的原生测试按`ADD_TO_HOME_CAPTURE_DIR`输出`add-to-home.png`，与已有中英文主页／应用页的四张图一起作为构建必需产物。

当前构建版本为pureTV0.5.2／code16、NovaTV0.5.1／code5，另外八款0.5.1／code4。签名仍使用上面的固定证书，所有版本均已高于历史证书切换点。十款的构建、测试、lint及截图全部通过后才集中签名；PR只构建验证，不读取签名凭据。成功产物位于`launcher-store-release`artifact，每款一个子目录，包含APK、`metadata.json`、`SHA256SUMS.txt`和`previews/`。

Artifact下载失败时可取回`build-assets/launcher-store-RUN_ID`分支，其目录合同为：

```text
release-staging/launcher-store/
  export-metadata.json
  release/<slug>/
    <LauncherTV>-<version>.apk
    metadata.json
    SHA256SUMS.txt
    previews/{home-render,apps-render,home-render.en,apps-render.en,add-to-home}.png
  reports/
```

`<slug>`为`puretv`、`nova`、`aster`、`sol`、`moss`、`forma`、`mono`、`drift`、`circuit`、`pixel`。pureTV文件名保留`pureTV`拼写，其余使用`NovaTV`等现有拼写。导出优先保留已验证的签名产物，总量最多100MB；诊断单文件最多4MB，超限跳过项记录在清单内。`metadata.json`记录`launcher`、`apk`、包身份／版本、固定证书、SHA256、`sourceSha`和`buildRun`，以及`signatureVerified:true`、`physicalTvTested:false`。每次导出新建分支，已有同名分支不会覆盖；只有诊断的失败流程不能作为可发布APK来源。

各款APK、源码归档、资源目录和预览仍须在核验后登记。源码归档必须同时包含对应启动器和`shared`目录；只打包单个启动器目录无法重建商城联动入口。

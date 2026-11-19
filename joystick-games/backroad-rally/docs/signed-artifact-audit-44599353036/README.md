# Backroad 原签名大包独立核验

核验对象为原 Android run [44599353036](https://github.com/ecojust/pureTV/actions/runs/44599353036)、attempt 1、冻结源 `d548bccbe816bd4c03620388556ceef507b67d30` 的已签名 artifact `14567692465`。本次只读取现有包和固定 Git 源码，没有构建、签名、安装、运行游戏或上传文件。

核验通过，原始结果在 [result.json](result.json)：

- 原 artifact API、draft 转存 asset `769042251` API 与本地 ZIP 均为 **104,995,469 字节**，SHA-256 `7266f2a123eda2c8196abf6f9156fcacc453f3d70258dba75ca3b3afa6a7bd95`。精确 7 个普通文件安全提取，拒绝重复或越界路径、链接及其他条目。
- **906 份原 sourceInputs**逐字节哈希对照上述冻结 Git 提交，且完整清单与原 source selector 重算一致；observer 原输入也逐项核对。
- **338 份全部包内资源**逐字节等于冻结构建器只做数据组合产生的 payload，并与原签名 receipt 一致。所有 APK ZIP 条目均读出校验，非 META-INF 内容完整匹配签名前后回执。
- 游戏 APK 与 observer APK 分别由本地 `apksigner` 和 `aapt` 验证固定证书、包名、版本与哈希；原小回执保持原字节收录在 `original-receipts/`。

游戏 APK 为 **105,020,455 字节**，SHA-256 `8596350c7868352a9494d0667037ef4a75709af25cf50066df137bab3bcd8808`；包名 `com.ecojust.joystick.backroadrally`，版本 `0.1.0 / 1`，证书 `eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23`。它符合此游戏明确声明的 128,000,000 字节 APK 预算，但超过仓库导出门槛 100,000,000 字节，也超过 GitHub 单文件 100 MiB **162,855 字节**。

完整 ZIP / APK 仅在本次环境 scratch，未收入游戏目录。draft asset 仍只是原 artifact 的转存入口，不是正式发布。本次核验不改变原运行失败状态，不代表 Android 游戏运行验收通过；未测试实体电视或 ESP32。

实际执行脚本 [audit.py](audit.py) 的哈希绑定在结果中。复查时需要本地 Git 已包含上述精确提交、原 ZIP、JDK 17 与 Android build-tools 34.0.0，并使用新的 scratch 目录；脚本拒绝覆盖已有完成结果。

```bash
nice -n 19 python3 audit.py \
  --repo /absolute/pureTV \
  --archive /absolute/backroad-signed-artifact-14567692465.zip \
  --scratch /absolute/new-backroad-audit \
  --build-tools /absolute/android-sdk/build-tools/34.0.0 \
  --jdk /absolute/jdk17
```

保留同目录的四份原 API metadata；为避免覆盖此次证据，复查应将脚本和 metadata 复制到新的审计目录后执行。

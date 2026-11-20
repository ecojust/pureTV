# Last Track 原签名 APK 独立包审

原 `c5ad63e8` / run `44606071748` / attempt 1 / export `35fca55f` 的包审通过，**运行验收仍失败**。

- APK：8,900,372 字节，SHA256 `81b421360bd40181470d92940d900f63e0886aa23e7ee5ed1e3b3ca3a0219b8c`。
- 包名 `com.ecojust.joystick.lasttrack`，版本 `0.1.0` / code 1；实际 aapt 最低 SDK 26、目标 SDK 29。
- 实际 apksigner 验证通过，证书与仓库固定证书 `eb31978a…492cf23` 一致；Observer 亦逐签名、身份和原来源核验。
- 504 个完整源码输入逐一等于固定 Git 与原导出；完整 APK ZIP/CRC/内容与签名回执一致；153 个资产（含 144 个嵌套资源）逐字节等于原 GameKit 规则生成的 payload。

结果见 [report.json](report.json)，实际执行脚本、工具源码、完整条目摘要与 aapt/apksigner 原输出随附。原包与原始证据位置见 [original-artifact-references.json](original-artifact-references.json)；此目录不重复存放 APK 或整份源码。

正常模式原 5 项通过后设备失联、占用模式未开始，均保持失败，见 [原运行记录](../android-attempt-3/findings.json)。本次未构建、签名、运行游戏或派发工作流；没有新增 Android 交付或实体设备兼容结论。

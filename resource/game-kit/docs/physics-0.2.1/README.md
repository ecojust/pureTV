# 桥梁与镜光 0.2.1 实际规律修正

生产源码冻结于 [71677da5](https://github.com/ecojust/pureTV/commit/71677da57aa00c3dbcb140a2812c0f801338365d)。桥梁保留离桥瞬间的速度与轮距，按重力推进自由运动，并补足固定塔基；镜光将普通棱镜误称改为带分色镜、转向镜和单向隔离端口的RGB分光模块。两款各六关，未新增关卡。

两款正式签名均首轮通过，28个最小生产输入匹配冻结Git，每款12个包内资产与冻结构建一致；Android图标与SVG也核对来源。随后两款均完成最终验收和独立发布提交，正式APK、封面及完整六关录像已更新；原件清单保持不变。

- [签名核验汇总](signed-assets-verification.json)
- [冻结来源核验](frozen/frozen-verification.json)
- [图标来源核验](icon-source-verification.json)
- [逐文件原件清单](archive-manifest.json)

`preflight/`保留原预检截图与报告。桥梁第一轮FIXED标记与挠度行重叠，第二轮移开后通过；`preflight-review/`为主agent的实际目视记录。签名辅助核对曾误读本地收据字段产生KeyError，原日志保留；改按signed receipt的nativeSourceSha256字段核对后通过，正式CI及下载核验没有失败或重签。

模型报告及最终QA已随对应应用0.2.1归档。桥梁录像360.409秒／6033768字节，镜光150.867秒／4170327字节；两款各六个实际模型目标通过，包含两分辨率画面、原始完整解码报告及实际执行脚本来源。

- [最终发布摘要](integration/release-summary.json)
- [两款发布一致性审计](integration/final-audit.json)：签名、资产、图标、原始报告、脚本来源、六关目标、旧版及校验和全部通过。
- [原件和未改六款核验](integration/batch-consistency.json)：61份公共原件及其余六款文件保持一致，98条未改进度和123条未改英文目录条目保持不变。
- [完整125项资源签名校验](integration/resource-catalog.json)与[README索引幂等检查](integration/index-check.json)：索引仅将英文名称Prism Relay改为Light Relay，原四列、精选名单、排序和数量均未改变。
- [最终核验文件清单](integration/archive-manifest.json)：报告与实际执行脚本哈希。

旧版安装包、录像及原验证报告均保留。所有路径中的scratch为本次临时来源；本目录保存原件副本。未进行实体电视或手机测试。

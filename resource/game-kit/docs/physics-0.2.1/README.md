# 桥梁与镜光 0.2.1 实际规律修正

生产源码冻结于 [71677da5](https://github.com/ecojust/pureTV/commit/71677da57aa00c3dbcb140a2812c0f801338365d)。桥梁保留离桥瞬间的速度与轮距，按重力推进自由运动，并补足固定塔基；镜光将普通棱镜误称改为带分色镜、转向镜和单向隔离端口的RGB分光模块。两款各六关，未新增关卡。

两款正式签名均首轮通过，28个最小生产输入匹配冻结Git，每款12个包内资产与冻结构建一致；Android图标与SVG也核对来源。此阶段最终游玩录像仍在进行，签名成功不代表完整发布验收已经完成。

- [签名核验汇总](signed-assets-verification.json)
- [冻结来源核验](frozen/frozen-verification.json)
- [图标来源核验](icon-source-verification.json)
- [逐文件原件清单](archive-manifest.json)

`preflight/`保留原预检截图与报告。桥梁第一轮FIXED标记与挠度行重叠，第二轮移开后通过；`preflight-review/`为主agent的实际目视记录。签名辅助核对曾误读本地收据字段产生KeyError，原日志保留；改按signed receipt的nativeSourceSha256字段核对后通过，正式CI及下载核验没有失败或重签。

模型报告及最终QA另随对应应用0.2.1发布归档。旧版安装包、录像及原验证报告均保留。所有路径中的scratch为本次临时来源；本目录保存原件副本。未进行实体电视或手机测试。

# Sugarplum Drop 0.1.0 交付验证

本目录在环境重建后，从已完成 CI 的不可变 Git 导出恢复原包与证据。没有重新构建、重签、改动游戏源码或启动新的游戏运行；下载内容逐 Git blob、字节数、SHA256 和原导出清单核对。

- 构建源码：`a73a1976e7d38ff27b8e457b933519ea66eaa949`；当前 `dist/tv.html` 与两个平台包内均为 `2b156382a5c72b55f917b3d75c79974666796df2396d1c9a36134ab327fe9a05`。
- Android：[44150603503](https://github.com/ecojust/pureTV/actions/runs/44150603503)，导出 `1e2ebdd67c80d39bdf187c6981957f4389853935`；普通/占端口两份原报告全部通过，固定发布证书再次使用 apksigner 验证。APK 所有非签名条目与签名回执一致。
- Mac 原包构建：[44150598155](https://github.com/ecojust/pureTV/actions/runs/44150598155)；仅 QA 修复后的原包验收：[44162656545](https://github.com/ecojust/pureTV/actions/runs/44162656545)，QA 源 `408c52de00f78373fb8548c639254b9e41f53c85`，导出 `dfa8f10d25d3ce02bd8c2a08eefe80a9efb2eaca`。Intel、ARM、Rosetta、占端口四份报告各九项通过；每组均有实际非空游戏存档在正常退出后跨 HTTP origin 重启恢复。原生 CI 已验证 ZIP/DMG 安装副本、完整文件集和 ad-hoc 签名；本次 Linux 恢复复核 ZIP 每个 App 文件及 fat Mach-O 两架构，未冒称在 Linux 挂载 DMG 或执行 Mac。
- 原始两个 Android 游戏录像完整解码成功；录像仍保留在不可变导出，不在当前目录重复拷贝。视频链接、哈希与尺寸见 [archive-index.json](archive-index.json)，完整解码结果见 [video-decode.json](video-decode.json)。视频帧率不作实体设备性能声明。

[独立核验](independent-verification.json)记录 217 份选中下载和 361 份原提交输入的核对结果；[source-input-verification.json](source-input-verification.json)列出准确原源码入口。[raw/](raw/)保留两份原始导出 manifest、两份 Android 和四份 Mac 原始报告、实际执行脚本、playing/paused 原图及原验包凭证；[archive-index.json](archive-index.json)列出精确归档范围，其他原始截图、日志、录像通过其中不可变链接读取。旧失败证据仍保留于仓库 `joystick-games/qa/catalog-native-ci/`，此次成功不覆盖旧失败。

[visual-review.json](visual-review.json)记录原生截图目视复核。Android 8.0+、macOS 11.0+；未做实体电视、手机、ESP32手柄或实体Mac显示器测试，未声明完整通关；Mac 未经过 Apple 公证。无 GitHub Release 或应用市场上传。

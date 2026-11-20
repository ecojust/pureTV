# Emberbrood 0.1.0 安装包验证

此次仅从 GitHub 的不可变导出恢复已构建、已测试的原包，没有重新构建、启动 CI 或修改游戏生产资产。包源固定 `dfae2fb0979314424ef3e4f2c7cb7cfcac91885d`；Android/Mac 均携带与本目录 dist 完全相同的 HTML。

- Android 来源：run `44157199507`，export `d3d9238e2028e750dfbfa55bcb32685a0cb243c6`。包名、0.1.0/code1、固定证书 `eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23`、完整 ZIP CRC、全部 7 个资产再次逐字节复核。
- macOS 来源：build `44157205988`，QA `44161620441` / `8fbc37223ec016f0c1716b27a5babaf56f894123`，export `fe98224d07a3052324cc9503674cc5aafa0ac340`。完整 228 文件、Git blob 与清单 SHA256 全部核验；每游戏 Intel/ARM/Rosetta/占用端口四模式各 9 项及真实非空存档跨 origin 重启恢复均通过。两游戏共 16 张实际 playing/paused 截图逐张审查。

Emberbrood 在 Android 原批次 44157199507 的 normal/occupied 两场景均为 53 项 passed；该批次的全局 failure 源于 GLUP 的旧对话路线。旧公共归档 qa/catalog-native-ci/44157199507 的完整签名/资产核验和 Emberbrood 14 图评审保持有效；此次仅取回同一 SHA256 原包。

`android/` 保留两场景完整报告、14 张原截图、wire 记录、签名/构建收据、完整远端导出清单和本次复核。原录像保留在不可变 Git 导出，确切链接、字节、SHA256、时长及完整解码结果见 `android/video-verification.json`。首次默认输出时间基造成 DTS 取整告警，日志留 `previous-video-checks/`；最终保留原 demuxer time base 完整解码，每帧无错误，未改写原视频。视频编码信息不作为设备帧率。

`macos/` 保留该游戏四模式原报告、截图、执行脚本、包校验与存档证据。原 DMG/ZIP 大小和 SHA256 再次核对，ZIP 全部 12 文件、双架构 Mach-O 与 Web 资产独立核验；DMG 挂载、代码签名和实际安装副本检查来自既有真实 macOS CI，本次 Linux 不冒充重新运行 Mac。完整来源见各 `export-manifest.json`，只归档与本游戏相关的原始证据，未重复所有源文件副本。

包使用 Android 仓库固定证书及 Mac ad-hoc 签名；Mac 未 Apple 公证。未测实体电视、手机或 ESP32 手柄，未验证全部关卡通关。`physicalTvTested:false`、`physicalPhoneTested:false`、`physicalEsp32Tested:false`。

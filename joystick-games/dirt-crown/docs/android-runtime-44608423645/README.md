# Dirt Crown Android 原签包复验

原 APK 已完成独立校验，可按本记录交付。此目录保存原始证据，不重新构建、签名或改写原报告。

- APK：`dirt-crown-0.1.0.apk`，1,124,106 字节，包名 `com.ecojust.joystick.dirtcrown`，版本 `0.1.0` / code `1`，最低 API 26，运行需要 WebGL 2。
- APK SHA256：`e6a535e00f76f5b3f52f3a79a65a29ea0358896f1b8b56da0c57d7f3aa378b4c`。
- 固定证书 SHA256：`eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23`。本地 `apksigner` 再次确认 v2/v3 签名有效，`aapt` 确认版本、API、电视启动入口。
- 原包源提交：`06f1ab2b77e45d5fabcbd7233f8d3e9279a9d5c7`；原流程 [44600442272](https://github.com/ecojust/pureTV/actions/runs/44600442272) 的 Dirt build 和 sign 成功，原 runtime 失败；不可变原导出 `1c0de1034ac0bd6954cb0958a7f2ada3bb3d69a4`。
- 本次 QA 源：`68d343d22c762c904eb83854d4ab9c4113a7c30f`；原包复用流程 [44608423645](https://github.com/ecojust/pureTV/actions/runs/44608423645)，attempt 1；runtime job `135858960697` 和 export job `135879727785` 均成功；不可变新导出 `1a93426ce337b13ef4a35b9f96790afb8ed54f1a`。

独立校验覆盖 314 份导出 Git blob、313 份 manifest 记录，210 份原输入逐字节对应固定 Git 源与本次运行归档，APK 内恰好 68 份资产全部对应原构建与签名清单。当前 63 份游戏 dist 文件与原包相同。原签名文件从原导出的精确 blob 取回，交付文件与之相同。

| 模式 | 原检查 | ACK | 服务端口 |
| --- | ---: | ---: | ---: |
| 正常 | 62 / 62 | 1100 / 1100 | 63485 |
| 默认端口占用 | 62 / 62 | 1094 / 1094 | 42677 |

检查通过原 SDK 和正常输入推进新建生涯、原菜单、自由赛、真实倒计时、显式油门、左右转向、漂移、氮气、复位、镜头、暂停，以及持续按住 START 后保持恢复。还覆盖九键独立按下/松开、第二手柄拒绝、失焦取消、断线、同 ID 重连、按住 START 重连不自动恢复，以及原进程/端口稳定。没有修改模型或时钟。没有跨重启存档验收项，也未完成全部赛事，不能从新建生涯成功推断这些检查已完成。

14 张原始 1920×1080 截图已逐张目视和哈希校验。驾驶图可见 17 km/h、赛车、赛道、计时与完整客户端 ID；暂停、失焦、断线和重连提示清晰。`connected.png` 实际仍是原加载画面，不能当作完成菜单截图；实际菜单另在录像采样中可见。展开侧卡的客户端 ID 完整换行显示，次要游戏/连接说明超过固定高度，需要使用原有滚动区域。

两段原 MP4 约 179.56 / 180.52 秒，保留原录制上限。10、90、170 秒采样显示加载、新生涯表单和地区地图/车库菜单；它们是验收开头的录像，**不是完整驾驶视频**。后续驾驶由原 `playing.png`、SDK 消息和连续模型观察证明，录像帧率不作为实体设备性能结论。

主要记录：

- [独立包、源与运行核对](independent-package-runtime-verification.json)
- [原导出完整性核对](original-export-verification.json)
- [原正常模式报告](original-export/evidence/joystick-android-runtime-dirt-crown/dirt-crown-normal/report.json)
- [原端口占用报告](original-export/evidence/joystick-android-runtime-dirt-crown/dirt-crown-occupied/report.json)
- [原签名收据](original-package/signing-receipt.json)及[本地验签输出](local-apksigner-verification.log)
- [截图与录像采样目视记录](visual-review.json)
- [保留的初次失败](original-failure-44600442272/source.json)：两个模式在连接后的 Observer snapshot 传输失败，原报告保持 failed。

本次为 Android 模拟器与原 SDK 验证。实体电视、手机、ESP32 手柄未测试；原包字节不变，未上传市场服务器。

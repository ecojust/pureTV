# Backroad Android 原包复验 44608419205

原运行 attempt 1 失败；正常与占用端口两模式均在 `adb install -r` 等待 240 秒超时，尚未运行游戏。原 QEMU PID 5752 在 98 个诊断样本内保持存活，未记录 gone；可用内存最低 10,878,700 KiB，OOM 计数为零。

原 logcat 显示准确包名 `com.ecojust.joystick.backroadrally` 已进入安装验证：APK Analysis 报告 SAFE，最终 ScanResultPicker 为 POTENTIALLY_UNWANTED，并启动 PlayProtectDialogsActivity。两种原结果均保留。这说明不能只按大包传输等待归因；原材料没有安装对话框截图、UI XML 或前台窗口状态，不能推断具体按钮。未更改验证设置、传输方式或超时，也未进行 UI 点击。

仅取回不可变导出 `7b9abaf97ff2a89c8347d985b974a3908d44de05` 中的小报告、诊断及两份内嵌 logcat 的原命令日志，各文件通过 Git blob 和原导出 manifest 的大小/SHA 核对。未下载完整游戏源或 APK。`selected-blob-verification.json` 明确列出复核范围；这不是完整导出验证或运行成功。

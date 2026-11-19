# Backroad 安装确认 v5 · 44620493325

QA 源 `2a18a5c87eef0888ff75d38f6db5d5078ebc0702`，原 APK/Observer 未改。原两模式均失败，SDK/游戏检查为零；原240秒安装超时及所有现场均保留。

- normal：唯一session `431805986` 和目标UI检查通过后，`sha256sum /data/app/vmdl431805986.tmp/base.apk` 实际 exit 1，`Permission denied`。助手在任何点击前停止。
- occupied：检测到normal残留及新安装会话，违反唯一会话约束；没有再读staged APK或点击。

两张新1920×1080截图均已实际逐张目视，仍是 Backroad Rally 的折叠 Play Protect 旧Android隐私保护提示。没有实际展开或观察到 Install anyway；没有设置修改、安装重试或提权。不能将此失败写成游戏渲染或玩法失败。

不可变导出 `2b7898fd7a43a6acf518b91f29cb7085ac72cf4d` 的121个原运行/现场/来源文件（10,377,388字节）逐Git blob及manifest校验通过；重复APK和artifact-source不再次下载。[findings.json](findings.json) 绑定原report、PNG、XML、session和原CLI日志。后续新安装方案需另行严格绑定本次唯一session与原字节，不能跳过既有失败或静默放宽检查。

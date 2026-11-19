原 Android run 44591488463、attempt 1、冻结源 `032924026f00dba24133ae6cfbf1e99b704c1011`。原导出提交 `23d9b4e11b8409cb3c63cf1dc051bac54ffb6de5`，本次审计没有重跑游戏或触发新工作流。

独立核验全部 267 导出文件、195 份冻结源输入与 30 个 APK 资源通过；22,465,268 字节 APK 的固定发布证书、包名和版本均经本地 apksigner/aapt 核对。APK 仅保存在本次 scratch，未放入游戏发布目录。见 `independent-verification.json` 和实际执行的 `verify-export.py`。

原 normal/occupied 两种运行均失败于倒计时中的固定时长油门步骤。已实际完成安装启动、原画面渲染、SDK 连接身份显示、START 开始倒计时；未证明加速及后续暂停/取消/存档检查。`runtime-analysis.json` 保留具体原快照、ACK、失败和目视记录。底部中文帮助条遮住部分主菜单按钮，也需要处理。

`original-evidence/` 保存原报告、执行脚本、证据截图与录像及签名回执原字节；`video-review/` 是明确标注时点的原录像抽帧。尚未验收通过，未测试实体电视或 ESP32。

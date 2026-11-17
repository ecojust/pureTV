# Tank 发射观察修正证据

原 Android APK 测试在第四组 `weapon fires` 失败，原始报告与实际执行脚本完整保留于 [original-android-failure/](original-android-failure/)。原始快照显示玩家 1 在 frame 681 已发射，在 frame 705 撞钢墙；最终采样时该子弹已消失。`game-model-from-signed-apk.js` 中 `fire()` 先成功加入真实子弹，再生成带玩家编号的 `fire` 事件。

只修正 Tank 测试的观察条件：先保存本次 A 操作前的真实快照，记录玩家 1 的既有 fire frame 边界，再使用原 SDK 正常 A 输入，要求同一玩家产生严格更新的 fire 事件。旧事件或 AI 子弹不能满足条件。未修改游戏、输入协议、SDK、碰撞或时钟。

[browser-signed-apk-assets/report.json](browser-signed-apk-assets/report.json) 为完整九组重验原始报告：9/9，通过四条 TCP 连接收到全部 97/97 同序号回执，无页面或传输错误。加载的是原失败运行相同签名 APK 的未修改 assets；逐条资源与执行脚本哈希核对见 [independent-review.json](independent-review.json)。本次快照同时捕获了新的玩家 1 fire 事件和真实飞行中的子弹。

此处新通过结果是桌面 Chromium + 生产 Java TCP 服务 + 原虚拟手柄/SDK 测试，使用模拟原生桥；不等于实际 Android APK 复验，也未测试实体电视、手机或 ESP32。最终 Android 复验由发布验收记录单独登记。所有原报告、失败脚本与 stdout/stderr 均保留原文。

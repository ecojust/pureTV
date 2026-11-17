# 实施记录

- 上游 commit 54adc1fb64155f9dd7c1c90ecae7b8185ac540b8，原文件哈希已留存。
- 首次 npm ci 访问原锁文件的 bnpm.byted.org/three/-/three-0.186.0.tgz 返回 HTTP 403；resolved 主机改为 registry.npmjs.org，版本/integrity 保持。
- 第一次 7 项输入映射测试全过；加入原生遥控无需 Wi-Fi 断言后一次 6/7，原因是空方向生成 -0 与期望 0 的深比较不同；空方向改为明确 0 后 7/7。没有游戏规则改动或绕过断言。
- 共享 controller-clients.js 保留原 guarded CommonJS 导出，esbuild 在 ESM 包中给出 warning；浏览器分支正常，未删原许可或改共享文件。最终以页面运行和 build:check 为准。
- 游戏地图/机器人/弹道/伤害/胜负规则沿用上游。手柄输入使用独立 player.pad，不覆盖键盘或触屏 held 状态；暂停、失焦、断线清空输入，回前台不自动继续。
- 更换主武器页现在暂停模拟，使手柄选择时不会在后台被机器人击杀。关闭后恢复进入换装前的暂停状态。原键盘 B 关闭换装页保留。
- 本目录不新增实体电视、手机或 ESP32 测试结论。平台 APK/Mac 验收与公开下载状态由最终交付记录说明。

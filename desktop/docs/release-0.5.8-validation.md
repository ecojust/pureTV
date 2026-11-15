# pureTV Manager 0.5.8 构建记录（未发布）

0.5.8未公开发布。冻结提交 `0e0fa09dfb20fb068a9fc0f103bf8c58b12d2eae`、标签 `desktop-v0.5.8` 保留不重写。正式流程 [43702139682](https://github.com/ecojust/pureTV/actions/runs/43702139682) 在发布前取消。

补查发现服务器根网址 `https://apps.b14f.com/` 返回403，而客户端与三个市场分类目录正常。“查看下载目录”按钮原先误用根网址，需要明确打开 `client/`；市场来源入口改为 `launcher/`。下载核心与已通过的真实下载不受此入口问题影响。修正后以0.5.9发布。

本版本的 [迁移前置证据](release-0.5.8-evidence/preflight.json) 保留：真实目录及小/大APK、启动器、客户端安装包直连和缓存验证通过；53项相关UI及Rust模块回归通过。它们不代表0.5.8正式四平台CI或公开安装包已完成。后续版本将明确哪些证据复用、哪些检查新执行。

[机器状态](release-0.5.8-validation.json) · [0.5.9验证记录](release-0.5.9-validation.md)

# 共享游戏三赛道实际输入回归

2026-11-15 执行，脚本退出 0。8 项通过；真实操作系统失焦在 headless Chromium 中标为 unsupported，未计为通过。全部三赛道以普通键盘输入实际跑完两圈；窄横屏双指右转/漂移、取消与恢复检查通过。

这是 **正常输入的 AI 辅助竞速回归**，用于验证完整比赛、漂移、小喷、氮气、跳跃与触控流程；不是独立的左右方向判定 oracle。没有写模型状态、强制获胜或覆盖时间。独立方向验证及原生 Mac/SDK 验收由同版本其他证据提供。

| 赛道 | 名次 | 比赛秒数 | 漂移 | 小喷 | 氮气 | 跳跃 | 碰撞 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| skyport | 2 | 59.37 | 9 | 9 | 5 | 0 | 0 |
| coast | 1 | 58.37 | 15 | 12 | 4 | 0 | 0 |
| canyon | 1 | 59.98 | 15 | 15 | 5 | 2 | 0 |

## 来源与范围

- 开始时 HEAD 为 `600b6addfda394e1a58b567d00d32731a387cccd`，工作树已包含修正；完成时这 9 份捕获源文件/脚本/生成 bundle 均逐字节匹配冻结提交 `cc04129f0369c1e9f9262ab798b353f276f1dc3b`，且运行期间哈希未变，见 [hash-verification.json](hash-verification.json)。
- 测试使用共享游戏 `game-config.json` 的 **0.1.1** 标签，实际 model/bundle 已是本次方向修复后的内容；截图不是最终 Mac 0.1.3 安装包。`game-model.js` SHA256 为 `1cf7b1c91076deff8e8ccde601551a075a48e0cbe1682e7a6e7afc157eec5aa5`，`game.js` 为 `28c9e67adbdde30a81bd67c27a4270205a78bcfa17b5c60a537b241b058bfed8`。
- `assets/` 是本次真正加载的 14 个文件；`executed-sources/` 保留捕获并核验的源码、生成文件与辅助脚本；`evidence/executed-*` 为测试工具开始时保存的准确运行脚本。
- Chromium 155.0.8059.79 / ANGLE SwiftShader。帧间隔仅代表该软件渲染环境，不是实体设备帧率。未测实体电视、手机、ESP32或原生 macOS。
- 本工具没有录制录像。完整输入记录和只读状态轨迹保存在三份 `evidence/race-*.json` 及原报告中；实际截图共 16 张，目视复核见 [visual-review.json](visual-review.json)。
- [evidence/report.json](evidence/report.json) 保持工具原始输出，未改其 `visualReviewCompleted:false`；目视结论另存，未覆盖标准报告。本轮未发生测试失败或重试。

## 实际执行

在仓库根目录执行（输出目录开始时为空）：

```bash
python3 resource/apps/neon-rush/tools/prepare-web.py \
  --output /dev/shm/neon-macos-013-direction/full-races/assets
PURETV_PACKAGE=/dev/shm/puretv-market-sync/desktop/package.json \
node resource/apps/neon-rush/tests/browser-smoke.mjs \
  --assets /dev/shm/neon-macos-013-direction/full-races/assets \
  --output /dev/shm/neon-macos-013-direction/full-races/evidence \
  --seconds 300
```

未使用 skip 参数，三赛道与触控均启用。`run.log` 保存完整标准输出；`source-state.json` 保留运行前来源记录；[summary.json](summary.json) 仅为补充摘要。重新执行应使用新的空输出目录和可用的 Playwright 安装；本轮运行中 `/tmp` 所在盘耗尽，但脚本持续正常并完成，未删除任何运行 profile。

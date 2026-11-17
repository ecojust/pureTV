# 星盘皇后：独立规则复核

测试按 [公开契约](model-contract.md) 另写逐行搜索及皇后攻击公式，不导入生产实现的判定函数，不修改模型状态。模型执行只通过 `create` / `step` 的普通方向、A 和 B 输入。

```bash
node resource/apps/queen-constellation/tests/independent-check.mjs /absolute/scratch/queen-constellation/independent
```

15 组检查通过，执行 25 次普通提交。完整模型哈希、解集与结果见 [independent-report.json](independent-report.json)。6×6／7×7／8×8 的公开禁格和固定皇后分别得到 4／2／1 组合法解，全部通过普通放置后提交验收；测试没有使用隐藏目标布局。

每次放置／移除后独立核对横行、纵列、对角线的全部攻击对，以及固定皇后、禁格、数量上限与 `canSubmit`。完整合法排列仍须维持 playing，按 B 才胜利。每关分别验证先错两次后第三次正确获胜，以及自然三次错误失败；失败检查保留已摆棋子，免费调整不返还检查次数。另覆盖数量上限后的移除修复、固定／禁格免费阻止、持续按 A 不重复和取消后重新武装。终局按键不会改变最终状态。

该报告是模型证据。浏览器实际输入、图像检查、录像、正式签名 APK 和实体设备测试分别记录，不能由这些纯规则检查推断。

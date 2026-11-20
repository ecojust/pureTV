# Royale Windows 起跑后加速：有限 QA 修正

原 `232d` / `44628818020` 两模式全部 11 个菜单步骤与自然倒计时已通过，但加速速度断言失败。原 raw UP=true 的观察里 cached UP 仍 false、accel=0；固定等待后松开，最终速度0.457。详见[保留原报告分析](../windows-44628818020-analysis/analysis.json)。

原计划共 20 步，仅加速步骤选择已有 `windowsHoldUntilExpect`；其余 19 步完全不变，加速步骤的 speed>1、位置向量变化和60秒上限也不变。第一轮实际 schema 校验失败：旧规则仅允许 progress changed。失败脚本/计划/log 已保留。现仅允许同样明确的 position changed，原单 UP、速度、焦点/身份/取消、ACK、真实帧、释放两帧等条件保持，Windows runner和游戏源码没有修改。

[执行记录](result.json)包含：两个原模式快照经真实 helper 的只读重放仍失败（没有捏造成功状态）；16项共享边界通过，新增两项覆盖向量运动与 schema 拒绝条件。合成 fixture 时钟只存在于单元测试，原游戏/倒计时/物理没有变。后续需要独立审查与真实原生验收，不能据此声明交付。

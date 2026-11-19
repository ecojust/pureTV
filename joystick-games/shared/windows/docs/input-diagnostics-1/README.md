# Windows JavaScript 输入事件只读诊断

Back v5 原生 trace 没有 suspend/失焦事件；完整 disabled seed→首次 enabled 三种本地时序也不触发暂停。旧失败根因仍未确定，本补丁不修取消或恢复规则。

仅以实际 `--diagnostics` 决定是否在每文档 bootstrap 开启记录。桥接器缓存最多64条固定事件：输入状态/来源是否改变/cancelSeq变化、blur/focus/visibility、原 suspend 调用及首次 poll/首次 active poll。记录文档epoch与页面时间，不输出身份、偏好、任意异常文本。diagnostics只读取副本，绝不额外调用原生 snapshot。

25组本地检查通过；移除诊断插入后，四生产源原语句与2ea1383精确相同。原测试前缀保持。首次新增fixture语法错误原件保留，中间24组通过记录和最终25组脚本副本均留存。真实Windows运行待主agent固定源后决定，未自行派发。

# Backroad Windows v5 原始失败证据

原 run `44630691787` / source `2ea1383f` 已实际通过构建、安装/卸载和四文档首次脚本存档检查，但两模式第 33 步仍在 `paused / intro / clock=0` 失败。原 export `ab7bcd0b` 仅导出成功，游戏没有通过。

21 原文件经 Git blob 与双 manifest 字节校验，以硬链接归档；没有下载两个约 105 MB 原包、重跑游戏或改写报告。完整恢复清单见 `small-report-verification.json`。新原生 trace 没有 suspend 调用或失焦 foreground 变化，无法支持此前的原生失焦候选；JS blur/visibility 与首次启用的完整顺序仍待核实。详见 `analysis.json`。

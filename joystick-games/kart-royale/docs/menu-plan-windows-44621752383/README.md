# Kart Royale Windows 菜单 QA 修正

原 run 44621752383 / source 039d210 的两种失败保留，出处为 immutable export f559a71e99ff27c8f262ed2a82a70674ee90f9dc。

只修六个 Y 菜单步骤：原期望仅为 Controls 面板，按键前已经成立。现在使用已有 menuTap，并检查每个选项完整焦点文本；同 ID/session、九键计数增量、全松键与随后两次新 poll 稳定要求保持。12 份原失败快照对旧谓词全部误过，对新谓词全部拒绝。

原 Menus、ControlsMenu、TouchControls、ControlPrefs、TV adapter 与未修改 Windows bridge 在真实 Chromium DOM 的 960×540、1280×720 分别完成 11 步菜单，正常保存 left 并到达 Start race。这里只代替原生宿主注入 revision/计数，race 与 renderer 为 DOM fixture，没有 TCP、WebGL、驾驶或性能验收，也没有修改游戏时钟。13 项本地单测通过。

normal 原 roster 60 秒稳定失败仍未解决。329 次读取只留 first16+last48，因此中间日志空隙不证明卡读，也不能重建最早 qualified 时刻。原 poll55→63 / native timestamp 约53.953秒，最终 roster/Start race 正确，但原严格稳定检查仍失败。保持 60 秒和原两新 poll 要求，等待实际原生复验；600 秒原启动步骤与后续所有驾驶期望未变。

最小变更见 qa-plan.diff；原报告与源码 SHA、局部结果见 result.json / original-failure-analysis.json。未 dispatch、未修改公共宿主/验证器、未重新打包。

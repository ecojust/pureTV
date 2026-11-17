# GLUP 验证记录

最终 `browser-attempt-7-960` 与 `browser-attempt-7-1280` 通过，`layout-attempt-1` 补充两尺寸的逐文本边界、侧栏滚动尺寸和完整长控制器 ID。实际执行脚本与 QA plan 随报告归档，全部报告绑定同一 `dist/tv.html` SHA256，汇总见 `verification.json`。使用正常手柄输入进入原开场、地图和关卡，验证移动、跳跃、吸入、暂停、菜单音量、焦点取消、断线及明确重连继续；没有写入模型、快进时钟或强制获胜。暂停检查实际规则与位置/速度等状态及 AudioContext suspension。

GLUP 是纯 Canvas 2D。为避免等待其它 WebGL 游戏，主代理授权其使用 `--disable-gpu`，逐尺寸串行运行；启动参数保留在报告。该结果不是 GPU 性能、实体电视、原 SDK TCP、正式 APK 或 native Mac 运行证据。

原 9 关数据检查和 24 项模拟器烟雾流程通过，另有原模型暂停/取消以及输入上下文与 A/B/X 文案回归。模型测试使用原模拟器夹具，不能当作普通玩家完整通关。最终 `model-tests-attempt-3.log` 保留完整通过输出。

保留的历史失败与修复：

- 原 attempt 1 没有留下实际浏览器输出；attempt 2/4 仅在锁队列中取消、未启动浏览器，不计验收。
- input attempt 1 是测试 eval 词法作用域错误；attempt 2 复现从菜单 confirm 切换到游戏 pause 后旧 held 状态残留。明确初始化全部 native 动作后通过。原执行脚本与测试适配器快照保留。
- browser attempt 3 发现原音频源码的 `$'` 被打包时 String.replace 解释，破坏内联音频脚本。改为回调插入，并编译检查每段最终脚本。保留失败图、堆栈及原 builder。
- browser attempt 5 的开场第二次按键早于原作 20 帧可跳过门槛；只读快照增加 intro/title 帧观察，QA 等到原动画实际就绪再发送正常按键。没有改变原动画规则。
- attempt 6 完整通过 960，但画面检查发现原键盘提示与 pureTV 按钮不同。仅增加 pureTV 的 A/B/X/START 文案分支，原键盘、USB 和触屏提示保留，最终两尺寸重新验证。
- model attempt 2 的新增文案测试直接调用关卡启动却未初始化原 Save，属于测试夹具错误；改用原模拟器 start 后全部通过。

目前尚未生成或验证正式固定证书 Android APK 与 macOS 包，实体电视/手机手柄均未测试。

## Coarse pointer layout follow-up

`docs/coarse-layout-attempt-1/report.json` runs `hasTouch:true` at 960×540 and 1280×720 on the same final distribution. Four real START presses traverse the original introduction/title/map/boat sequence, then an actual touchscreen tap activates the original touch path. All original `.touch-only` elements stay hidden under the existing TV CSS. Sidebars, full long controller ID, text bounds and scroll dimensions pass; both gameplay screenshots were visually reviewed. This retains the authorized Canvas2D `--disable-gpu` launch; it does not measure TV/GPU performance. No game/dist bytes changed.

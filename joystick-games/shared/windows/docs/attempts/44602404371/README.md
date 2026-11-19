Windows 原包样本 v9（原失败保留）

Run: https://github.com/ecojust/pureTV/actions/runs/44602404371

原导出 `93b6fc98da9ef5f186c1b13cc8c17dec3f985e12` 的179文件、6997018字节均按原manifest SHA256校验。两runner各100次完整原子替换实测通过，Night实际经历55次暂时重试；构建和安装通过。两款两模式均通过真实SDK身份/三次busy拒绝、DNS-SD和窗口尺寸。

Sugarplum已通过真实玩法及前台暂停，最小化后的原生快照继续、输入清零、模型冻结，但WebView2后台rAF停止导致原QA要求poll增长超时。Night的high预设下真实WebGL2渲染很慢，60秒仍在倒计时，不算race通过。原失败、图、源和日志不改；没有完整通过游戏。

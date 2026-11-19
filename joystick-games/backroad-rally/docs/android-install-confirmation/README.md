# Backroad 单应用安装确认助手（QA）

默认关闭；只允许原 `com.ecojust.joystick.backroadrally` APK（105,020,455 字节，SHA256 `8596350c7868352a9494d0667037ef4a75709af25cf50066df137bab3bcd8808`）。原240秒超时、CLI输出和截图保留；不重试安装、不改验证设置。Workflow opt-in 还固定原 d548bcc / run44599353036 / artifact14567692465 / attempt1，不能选其他游戏。

助手重新捕获前台、窗口、PNG、XML和会话。必须只有一个本次 shell 发起、已提交且未完成的安装会话，并从该会话明确 stageDir 的 base.apk 读取真实 SHA 与原包一致。无法读取或存在残留会话即停止，不点击。

页面必须明确为 PlayProtectDialogsActivity、Backroad Rally 和已观察到的旧 Android 隐私文案。从实时 XML 的唯一可点击控件父节点取得 bounds，点击前再查前台与同一会话；正常展开 More details 后立即保存新 PNG/XML。只有新页面实际有同一应用明确 Install anyway 才执行第二次普通点击。任何缺失或变化都保留失败，不尝试其他按钮或绕过。点击后必须由 pm path 得到唯一 base.apk，再核实际设备文件 SHA 和字节数，完全一致才允许继续原游戏 QA。输入命令超时也保留 attempted action，不误写“未点击”。

18 新边界测试、原53共享回归和 actionlint 通过；[validation.json](validation.json) 绑定确切源码、日志、旧失败与范围。新测试复用原折叠页文字/XML，但 PNG 与展开控件是明确的合成夹具。**尚未在真实 Android 上执行助手，尚未实际观察到 Install anyway；暂存 APK 是否可由 shell 读取也未确认。** 原图与报告见 [安装现场证据](../android-install-ui-44614635591/README.md)。

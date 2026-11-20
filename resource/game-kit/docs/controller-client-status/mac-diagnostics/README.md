# macOS 手柄身份的只读诊断与验收

`main.swift`只修改writeDiagnostics内的JavaScript读取：采样可见手柄卡的ID/席位/图标、实际矩形、ID文字Range及各层滚动裁剪边界，不增加原生输入snapshot调用，不改变TCP、生命周期或游戏输入。其他Swift字节与修改前一致。

`verify-native.py`在既有原SDK流程中，使用实际hello消息的controller_id检查菜单、真实驾驶、暂停、断线消失及同ID重连。原方向、驾驶、按键同步、焦点、ACK及退出完整流程保留。驾驶中截图通过既有通道异步请求，驾驶结束暂停后收集，不阻塞正常输入循环。无WebGL机器只检查菜单ID并仍返回limited_graphics，不将其描述为驾驶通过。

本目录保留修改前两文件、实际诊断JS及测试源码。`attempt-1`是初版组件的五个合成DOM正反例；组件做等价margin兼容修正后，`attempt-2`用最终模块重新运行五例（正常、隐藏、裁剪、屏外、ellipsis），并以真实Python client_display方法运行九项检查器边界。原生snapshot调用计数为零；Python语法通过。

这些局部检查运行于Linux/Chromium，仅验证读取和断言逻辑。它们不是macOS编译、安装、实际应用或手柄联调；完整Mac验证必须由现有macOS工作流执行。

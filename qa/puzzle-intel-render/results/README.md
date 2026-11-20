# Intel Mac 上的拼图原包与 WebGL 探针

两个 GitHub 托管的 x86_64 虚拟机分别使用 macOS 15.7.9 和 26.6.1。二者均报告 Apple Paravirtualized Graphics Device 与 Metal 2。原生 WKWebView 在两台机器上都无法创建顶点着色器、片元着色器或着色程序。四种对照覆盖默认、高性能、低功耗 WebGL 2，以及默认 WebGL 1。全部上下文在连续三次动画帧观测时均已丢失，首个 GL 错误为 37442（CONTEXT_LOST_WEBGL），红色三角形未能绘制。

从三批原 macOS 安装 ZIP 重新核验 SHA256 与应用签名，再通过本地 HTTP 将原 Web 资源载入独立的默认 WKWebView。六款 Three.js 原页面在两个镜像上共 12 次收到空的顶点高精度查询结果，实际上下文已丢失，故在 r165 初始化时抛出异常。对照组 Story Thief 进入原 Canvas2D 菜单，两台分别观测到第 8 和第 4 帧。每款的原包版本、ZIP、可执行文件和页面哈希均保存在各机的 packages.json。

这些证据适用于这两种 Apple 虚拟显示器及所列原包。实体 Intel Mac 的原生输入验收仍需使用能真实绘制 WebGL 2 像素的设备。

[汇总和原文件哈希](summary.json) · [原生探针运行](https://github.com/ecojust/pureTV/actions/runs/44716323532) · [原始报告字节导出](https://github.com/ecojust/pureTV/actions/runs/44716944955)

display.json 原样保留 system_profiler 输出，末尾有一行该工具的标准错误诊断。

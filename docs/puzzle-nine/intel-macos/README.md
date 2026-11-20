# 六款 WebGL 游戏的 Intel Mac 兼容性

六款游戏的 macOS 通用包包含 Intel 可执行程序。Intel 机型的完整实玩仍待带有可用 WebGL 2 图形设备的实体 Mac 复验。Apple Silicon 的验收和各版本下载状态见[九款游戏目录](../README.md)。

| 游戏 | 此次诊断的原包 | 本轮项目版本 |
| --- | --- | --- |
| 炼金方阵 | 0.1.0 | 0.1.1 |
| 蜜蜂果篮 | 0.1.0 | 0.1.2 |
| 霓虹秘仪 | 0.1.0 | 0.1.1 |
| 誓约宝石 | 0.1.0 | 0.1.0 |
| 雨夜维修铺 | 0.1.0 | 0.1.0 |
| 星际弹弓 | 0.1.1 | 0.1.1 |

2026 年 11 月 20 日，两台 GitHub 托管的 Intel 虚拟机分别运行 macOS 15.7.9 和 26.6.1，均报告 Apple Paravirtualized Graphics Device 和 Metal 2。测试核验原 ZIP 的 SHA256 及应用签名，再用系统 WKWebView 读取包内原页面。六款游戏在两台机器上均在打开菜单前丢失 WebGL 上下文，Three.js 随后读取顶点着色器精度时得到空值。使用 Canvas2D 的《灰斗篷山的故事大盗》0.1.0 在同两台机器上均打开了菜单，分别观测到第 8 和第 4 帧。[原始运行](https://github.com/ecojust/pureTV/actions/runs/44716323532)

独立的红色三角形绘制测试分别使用 WebGL 2 的默认、高性能、低功耗设置及 WebGL 1 默认设置。两台机器的八种组合均无法创建顶点着色器、片元着色器或着色程序，运行未到像素读取步骤。[分机原始报告](https://github.com/ecojust/pureTV/tree/99665b50fedfbb6f44f4b4e0fa8208d302287ca0/qa/puzzle-intel-render/results)

各发行版本的完整原生验收单独记录。比如此次使用的《蜜蜂果篮》为 0.1.0，0.1.2 的手柄、菜单及游戏流程需依据 0.1.2 安装包的验收记录。原始构建归档链接、逐款原 ZIP、可执行程序和未修改页面的 SHA256 均可查阅。[来源与校验值](observations.json) · [原包一](https://github.com/ecojust/pureTV/actions/runs/44713386724/artifacts/14617933985) · [原包二](https://github.com/ecojust/pureTV/actions/runs/44714845423/artifacts/14618858589) · [原包三](https://github.com/ecojust/pureTV/actions/runs/44713647487/artifacts/14618822058)

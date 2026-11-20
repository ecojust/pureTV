# Kart Rush 在 Intel macOS 上的原包复验

2026 年 11 月 20 日，在 GitHub 托管的 `macos-26-intel` 上运行公开的 Kart Rush 0.1.0 通用包。原应用成功进入前台，游戏初始化在 90 秒内没有产生可用快照，未进入驾驶验收。仍保留 Intel 图形运行「未验证」的交付说明。[原生运行 44687922302](https://github.com/ecojust/pureTV/actions/runs/44687922302)

## 原包与运行器

- 原 ZIP 为 1,247,121 字节，SHA-256 为 `8ea5efefc2338332bd3dfd78205bed8111fbdd0f8e1455fc002579147ada5913`，与已发布的 ZIP 完全相同。解压后的 `KartRush` 主程序 SHA-256 为 `4af8f6b45c89d68fe2135f08e5f295528382b187935fff3e5cdd1b0472f23dff`。原代码签名验证通过，直接以 x86_64 架构启动。[原包](../../macos/KartRush-0.1.0-macos-universal.zip)
- 系统为 macOS 26.6.1 (25G76)，CPU 为 Intel Core i7-8700B。系统报告 Apple Paravirtualized Graphics Device，Metal 枚举到一台 Apple Paravirtual device。应用最后一帧的前台进程是 Kart Rush，宿主 `active=true`、`ready=true`，游戏快照仍为 `null`，此时没有报告 JavaScript 异常。
- 独立打开默认 WKWebView，分别申请 WebGL 1 与 WebGL 2。两种上下文均返回对象，随后各连续三个动画帧报告 `isContextLost()=true`、版本为空。每帧清成纯绿后回读的像素均为 `[0,0,0,0]`，每种上下文的第一帧 GL 错误均为 37442（CONTEXT_LOST_WEBGL）。测试没有向游戏注入绘制或输入状态。[原始证据 ZIP](https://github.com/ecojust/pureTV/blob/06682e26e93345a5f4bfe36a5345d4cb27e75986/evidence.zip)
- 上述归档保留原 artifact 14607626110 的 30,444 字节，SHA-256 为 `b95e16892a534a68fe2e8e317c0f8d3f4c5b319ca31b2980b0c0e947c5aad616`。解压后可分别查看 `webgl.json`、`webgl2.json`、`displays.json`、`metal.txt`、`native/report.json` 和 `native/diagnostics/state.json`。[原始归档校验](https://github.com/ecojust/pureTV/actions/runs/44688344556)

## 与 macOS 15 原结果对照

先前的 `macos-15-intel` 记录来自 macOS 15.7.9 (24G830)。复核下列九次原生运行中可读取的 26 份九款赛车 Intel 游戏报告，均止于初始化，实际 SDK 游戏检查计数均为零。同期归档了 39 份带系统版本的独立 WebGL 2 探针记录，每份三个动画帧均失去上下文。记录覆盖不同构建和复验，同一游戏可出现多次。

| 原始运行 | 本次复核范围 |
| --- | --- |
| [44596707197](https://github.com/ecojust/pureTV/actions/runs/44596707197)、[44602407034](https://github.com/ecojust/pureTV/actions/runs/44602407034)、[44608415225](https://github.com/ecojust/pureTV/actions/runs/44608415225)、[44615672670](https://github.com/ecojust/pureTV/actions/runs/44615672670) | Backroad Rally、Ponpoko Kart、Night Racer 原生报告。Ponpoko 部分样本最后由通知中心占据前台。 |
| [44605769518](https://github.com/ecojust/pureTV/actions/runs/44605769518) | Penguintrack、Last Track、Dirt Crown 原生报告。 |
| [44605303936](https://github.com/ecojust/pureTV/actions/runs/44605303936)、[44615678373](https://github.com/ecojust/pureTV/actions/runs/44615678373)、[44615880581](https://github.com/ecojust/pureTV/actions/runs/44615880581)、[44617064631](https://github.com/ecojust/pureTV/actions/runs/44617064631) | Kart Rush、Turbo Kart Rush、Kart Royale 原生报告。四份 Kart Rush 最后均在前台且宿主已就绪，游戏快照为空。 |

15 系列的 26 个最终窗口里，23 个为游戏前台；另三个失焦记录全属 Ponpoko Kart。Ponpoko Kart 与 Turbo Kart Rush 留有着色器精度查询错误，其他游戏还出现初始化超时，不能由独立探针推定九款拥有相同根因。本次 26 系列单独测试了原游戏支持的 WebGL 1 和 2，并直接检验像素。两代托管系统均缺少 Intel 赛车驾驶通过记录；实体 Intel Mac、其具体 GPU 和驱动仍待实测。

# Turbo Kart Rush

[BridgeMind 原作](https://github.com/bridge-mind/turbo-kart-rush/tree/6c0456c7642447eae29e0832e7e542fec07ec07d)的独立 pureTV 适配：八位车手、四条赛道、三档难度，保留程序生成场景、道具的全部变体、漂移加速、跳跃、原版音乐与后处理。原资源无需网络即可运行；不是 pureTV 自创游戏。


## macOS 下载

0.1.0 Universal：[DMG](macos/TurboKartRush-0.1.0-macos-universal.dmg)（1,199,951 字节）· [ZIP](macos/TurboKartRush-0.1.0-macos-universal.zip)（850,314 字节）· [SHA256 校验](SHA256SUMS.txt)。DMG 内应用可拖入 Applications；ZIP 解压后提供相同应用。需要 **macOS 11 或更新版本及 WebGL 2**，包包含 arm64 / x86_64，采用 ad-hoc 签名，未经过 Apple 公证。

Apple Silicon 原生、默认端口占用回退及 Rosetta 三种模式各通过 9 项原 SDK 和实际游戏检查。**Intel Mac 图形运行仍未验证**；Intel 原失败和初始化分类结果保留，独立探针的 context-loss 不能证明游戏失败原因。本游戏没有声明持久存档字段；原测试只验证无存档状态下重启与换本地地址后的恢复一致，没有宣称实际存档保存已验。 未做实体手柄或完整通关测试。

已知界面限制：原三种模式的赛中帮助卡遮住右下小地图上部，暂停展开卡也会盖住背景地图；圈数、计时、完整手柄 ID 和三个暂停按钮仍可见。三张赛中截图均显示 0 km/h，实际驾驶依据原运行记录，不能由静态图推断。 本次 Mac 原截图为 1024×642／1024×645，浏览器的 960×540／1280×720 布局检查是另一组证据。详情见 [Mac 交付核验](docs/macos-delivery/) 与 [逐张目视记录](docs/macos-ci-44615880581-visual-review.json)。安装文件沿用源码 `6c7cb4fdb99dce236b634c842326bae6aed5f232`、原流程 [44615880581](https://github.com/ecojust/pureTV/actions/runs/44615880581) 的原始字节，未重新打包；Android、Windows 仍待各自验收。

| pureTV 键 | 比赛 | 菜单 |
| --- | --- | --- |
| ↑ / ↓ | 加速 / 刹车与倒车 | 上 / 下 |
| ← / → | 转向 | 左 / 右 |
| A | 跳跃 / 按住漂移 | 确认 |
| B | 使用道具；配合刹车或回看向后投掷 | — |
| X | 回看 | — |
| Y | 操作说明 | 返回 |
| START | 暂停 / 手动继续 | 确认 |

共享原生宿主默认监听 TCP **63485**，占用时显示实际回退端口。侧边卡片展示真实席位与 controller ID；无 RSSI 数据时不显示虚构信号。原键盘和标准 Gamepad 继续有效。菜单可用方向与确认操作，无需鼠标或指针锁。

断线、后台和失焦会取消动作、道具待处理输入与未释放的蓄力漂移，并暂停比赛；不奖励漂移释放。已获得的道具、加速、位置和速度不会被重置。重连不能自动继续，需重新确认。加载中断线也会在进入比赛后保持暂停。

需要 **WebGL 2**。macOS 安装包的验证范围见上方；源码/浏览器结果不代表 Android 4.4 或未测电视可用，Android、Windows 仍待各自验收。

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
npm run build:check
```

`dist/tv.html` 可用本地 HTTP 服务离线预览；浏览器预览没有原生 TCP 服务器。生产包排除上游可写调试全局和开发自动驾驶入口；`window.JoystickGameQA.snapshot()` 只读取状态与缓存控制器帧。

`upstream.json` 固定原始 72 文件与提交；`docs/source-changes.json` 记录有限输入/取消改动。原 `package-lock.json` 运行依赖及工具版本保留，额外 esbuild 0.28.2 用于平铺打包。初期 npm HTTP 503 的尝试保留在 `docs/dependency-attempts.json`；网络恢复后精确依赖安装、原配置及完整源码的 TypeScript 检查均通过，见 `docs/npm-ci-attempt-3.json` 与 `docs/typecheck-exact.log`。这些源码检查与上方 macOS 原生结果分别记录，不能据此推断其他平台已通过。

[浏览器验证记录](docs/browser-validation.json)包含两种分辨率实际驾驶、暂停冻结、持续 START 恢复、回看、说明展开与漂移断线。[角色页面布局记录](docs/character-layout-validation.json)单独记录实测发现的 960×540 溢出及后续 CSS 修正；保留原八位车手、属性和确认操作。[缩略图来源](docs/thumb-source.json)记录未编辑的实际比赛截图。

许可证见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。源码 MIT，Three.js MIT；构建工具许可证单独保留。没有为适配新增商业模型或在线资源。

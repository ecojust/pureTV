# GLUP · 沼泽猫鱼 · pureTV

0.1.0 安装包：[Android TV APK](glup-0.1.0.apk) · [macOS DMG](Glup-0.1.0-macos-universal.dmg) · [macOS ZIP](Glup-0.1.0-macos-universal.zip) · [SHA256](SHA256SUMS.txt)。

Android 包最低 Android 8.0（API 26），需要可正常运行现代网页的 WebView；本游戏使用 DOM/Canvas 2D，不要求 WebGL2。macOS 为 Apple Silicon / Intel 通用包，声明最低系统 11.0；使用 ad-hoc 签名，未做 Apple 公证。下载 DMG 后将 App 拖到“应用程序”；首次运行按系统提示允许本地网络，供 pureTV 手柄发现并连接。

Nila 带着猫鱼 Bigotes 探索沼泽，通过吸入物体、跳跃、吐出和逐步学到的能力救回小猫鱼。保留原作 9 个地点、121 只小猫鱼、导师任务、关卡解锁、地图、剧情、首领和程序音乐；原作界面与对白为西班牙语，侧栏提供中文操作说明。

改编自 [gavilanbe/glup](https://github.com/gavilanbe/glup/tree/db4bc2cf502b9b53bd06fe65491215ea2324ef82)，固定上游 `db4bc2cf502b9b53bd06fe65491215ea2324ef82`，MIT 许可。保留原 Canvas 2D 像素画、物理、关卡与音频，不是原创 pureTV 游戏。原文件清单与哈希见 [upstream.json](upstream.json)，许可见 [LICENSE](LICENSE)、[NOTICE.md](NOTICE.md)。

- 左右移动；上方交谈或向上瞄准，下方蹲下或放下。
- A 跳跃、确认；B 吸入、蓄力或吐出；X 吹气（学习后）。部分能力组合方向与 A/B 使用。
- Y 游戏内切换声音，在菜单返回；START 开始、暂停、明确继续。地图方向选择、A 确认；暂停菜单上下选择、A 确认，左右翻提示。

九个 pureTV 按键保持独立，单人游戏使用在线有效座位中编号最小者；侧栏显示协议提供的完整控制器 ID。默认 TCP 端口为 63485，通过 `_puretv._tcp` 发现；信号强度仅在协议提供有效数据时显示。断线、失焦和输入取消都会清键、停止实际模拟与音频，蓄力取消不会自动吐出物体；重连后需明确继续。

`src/` 是编辑入口，`dist/tv.html` 是 Android TV 与 macOS 共用的离线负载。原服务工作线程与自动更新检查不进入安装版；无 CDN、远程字体、图片或音频依赖。`glup.v1` 保存原关卡进度、能力、收集记录与音量设置，不保存关卡中途每一帧位置。

```sh
npm ci
npm test
npm run build
npm run build:check
```

esbuild 固定 0.28.2。原 `check-levels.js` 检查九关数据，`humo.js` 使用原模拟器覆盖关卡、导师、学习、结局、地图与暂停等流程；其测试夹具可以构造状态，不等同实际输入通关。另有 `tests/pause.cjs` 检查真实模型暂停、保留吸入物与取消不产生投射物。

浏览器回归使用普通按键推进原游戏，只读 `window.JoystickGameQA.snapshot()`；没有新增写状态、快进或获胜接口。`qa-plan.json` 供原生宿主使用相同输入步骤，声明实际模型的暂停稳定字段与非空存档重启要求。浏览器脚本、原始日志与截图保留在 `docs/`，每次重试独立存档。

源码适配、两尺寸浏览器输入与画面检查见 [验证记录](docs/verification.json)。固定证书 APK 已完成普通端口与端口占用两种原 SDK 场景，各 53 项通过；macOS 的 Intel、Apple Silicon、Rosetta 及端口占用四种场景各 9 项通过，并验证真实非空存档跨服务端口重启恢复。

Android 重验所在工作流最后状态为 cancelled；两次游戏测试此前已各自正常退出并留下完整通过报告、14 张截图与两段录像。本次逐项复核这些原始证据后归档原包，没有把整个工作流改称成功，详见 [安装包验证说明](docs/native-delivery/README.md)。未测试实体电视、手机或 ESP32 手柄，也没有完成全游戏通关；软件环境结果不代表设备帧率。

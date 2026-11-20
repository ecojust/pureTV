# GameKit 手柄客户端标识 · 浏览器预检

最终源的 9 款游戏 × 960×540 / 1280×720 共 18 例通过；Neon macOS 展示层另 2 例通过；既有输入生命周期回归 16 项通过。Neon `build:check` 通过，模型 SHA256 仍为 `1cf7b1c91076deff8e8ccde601551a075a48e0cbe1682e7a6e7afc157eec5aa5`，与起点提交逐字节一致。

本目录使用实际组装 Web 资产与显式合成的 native 元数据／连接样本。开始与暂停用普通键盘输入；Mac 展示层开关用普通点击。布局脚本不写游戏模型或时钟。它不是 TCP、签名 APK、原生 WebKit、完整比赛或实体设备验收。输入生命周期脚本则是原有、明确标注的人工 RAF／探针模型协议 fixture。所有实体测试标志为 false，固件没有 RSSI 数据，不显示信号强度。

## 最终证据

- `attempt-2/report.json`：9 款实际资产的 18 例；初始隐藏、连接图标／1P／完整 ID、菜单、正常开始、暂停、断线隐藏、同 ID 新会话重连不恢复游戏、96 字符换行。
- `neon-macos-final-2/report.json`：英语 Mac CSS/JS 展示层 2 例，并检查菜单与暂停时手动收起操作栏，独立侧标继续可见。暂停遮罩不会压暗侧标。此处仍是 Chromium 合成宿主，不是原生 macOS。
- `input-lifecycle-final/report.json`：原 16 项输入生命周期回归；只在 fixture 资产拷贝名单添加 `puretv-controller.js`，断言未改。实际执行脚本和公共依赖保存在 `executed-source/`。
- `neon-build-check.*`：生成包校验原始 stdout/stderr、模型不变及环境记录。
- `verification.json`：最终源码哈希、结果与限制；各游戏 `assets-manifest.json` 和 `assets/` 保留该次实际加载的字节；每次布局执行保存自身脚本副本。`support-source/` 保存公共测试/组装脚本。

目视检查了最终 9 款在两种尺寸的菜单或游玩原图。八款保持原先各自的布局，图标／ID 不遮必要操作与主画面；Neon 游玩浮标在右上方，避开左侧 HUD 和右下角氮气表。960 宽时 Neon 普通 ESP32 ID 完整一行；其他窄栏可自然折为两行。标准 ID 无需滚动；96 字符上限测试在四则二十四、叠塔工匠、拉索桥梁的两种尺寸及折光工坊 960 横栏需要内部纵向滚动，完整文字仍保留，没有横向外溢，不能声称长 ID 全部同时可见。部分 960 原侧栏较低优先级提示仍需滚动，真实边界在 report 中逐项记录。

## 保留的预览过程

`attempt-1` 的 18 例全部通过，但仍是早期组件／Neon 定位方式。`neon-final` 的 2 例验证了集中定位，仍用较窄浮卡；`neon-macos-final` 的 2 例验证了 Mac 面板开关，暂停遮罩仍会压暗浮卡。这些原始报告、资产、截图没有覆盖。最终轮增加横栏连接态隐藏冗余直连 IP（断线恢复），Neon 960 浮卡加宽到 224px 并移到遮罩上方；组件以兼容旧 WebView 的 margin 替换 flex gap。不要把前述预览截图当作最终安装包证据。

## 复现

在最终源码树使用 Playwright 1.64.1 / pngjs 7 与 Chromium，设置 `PURETV_PACKAGE`、`CHROMIUM_PATH`、`TMPDIR` 和 `PLAYWRIGHT_BROWSERS_PATH`。输出路径必须是新的目录，不能覆盖既有尝试。

```sh
node resource/game-kit/qa/controller-client-ui.mjs --output <new-output> --qr resource/game-kit/docs/controller-client-status/gamekit/attempt-2/qr-fixture.png
node resource/game-kit/qa/controller-client-ui.mjs --games neon-rush --macos --language en --output <new-mac-output> --qr resource/game-kit/docs/controller-client-status/gamekit/attempt-2/qr-fixture.png
node resource/game-kit/qa/input-lifecycle-test.mjs --output <new-input-output>
npm run build:check --prefix resource/apps/neon-rush
```

二维码取自既有 UI fixture，仅用于布局，地址与连接信息均明确为合成样本。真实 SDK／原生宿主验收由本轮独立的发布验证证据承担。

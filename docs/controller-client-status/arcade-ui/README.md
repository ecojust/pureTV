# 旧街机手柄连接侧标：浏览器布局验证

本目录检查 Tank、Jackal、Jewel、Tetris、Super Mario、Bomb Jack、Adventure Island 的连接侧标与原界面共存。它使用 **合成 native bridge** 提供连接/断线帧，使用真实页面和普通键盘 START 推进游戏；不修改模型、时钟或 RNG，不冒充实体电视、Android APK、ESP32 或 TCP 协议验证。

每款检查 960×540 中文和 1280×720 英文：零连接隐藏、单/双连接、1P/2P 区分、完整 ID、正常进入游玩与暂停、逐个断线、同 ID 新 session 重连、长 ID 换行、侧栏滚动后连接区域仍可见、手机连接不冒充 Wi-Fi 手柄。记录文档和侧栏边界、截图状态与实际载入资产 SHA256。二维码在 fixture 中为空，截图的手机连接占位文字不能视为真机截图。

运行条件：`PURETV_PACKAGE=/dev/shm/controller-status-deps/package.json CHROMIUM_PATH=/usr/bin/chromium TMPDIR=/dev/shm/controller-status-tmp`。脚本沿用 `resource/game-kit/qa/common.mjs` 的 Playwright、HTTP 服务器和资产哈希工具。资产以 `tools/readme-controller-qa/prepare-assets.py` 从源码准备；Jackal 使用既有提取器从正式基线 0.5.3 APK 提取美术，APK SHA256 为 `f081fc7843bffe4d1d1b2b903d822960546a45e2d45be6e397afe9a55d081739`。

## 保留的过程与失败

- `attempt-1`：14/14 布局检查通过。实际记录 Tank `stageintro`、Jackal `intro`，所以其中名为 playing 的截图不能充当实际游玩证据。目视发现 960px 旧 194px 侧栏使正常 ID 换两行，随后在有连接时把该窄屏侧栏放宽至 224px；此前截图保留为初版侧栏证据。
- `attempt-2`：等待 Tank 实际 playing 超时，报告/截图显示选关。测试原先遗漏选关正常所需的第二次 START；仅改测试加入普通按键。
- `attempt-3`：100ms 第二次 START 后仍超时。该轮没有记录按键消费轨迹，无法确定具体时序原因。后续测试改为观察正常输入被运行时读到或阶段变化，再释放按键并观察释放；没有改生产输入或游戏模型。
- `attempt-4`：最终侧栏样式、早期共享组件。Tank 两尺寸及 Jackal 960 检查通过。Jackal 1280 正常开场只运行到 546/632 帧，超过原 30 秒等待预算；该轮失败快照保留。这里的 playing 与 paused 截图记录真实对应阶段。
- `attempt-5-jackal-1280`：同一生产资产，只把等待正常开场预算放宽至 90 秒，并显式断言普通 START 暂停；Jackal 1280 通过。未跳过开场、未强写状态。
- `attempt-6-frozen-component`：共享模块最终 CSS 改用 margin 兼容旧 WebView 后，7×2 共 14 用例全部通过。最终模块 SHA256 为 `3aa03cc8f276aa3c8b7f218fb3a5cac176bb2bb01b3aaec2cc59a69596a36e2a`。运行时原输出目录名为 `final`，结束后只把目录改名保留，本轮报告与 PNG 未改写。目视发现 Jewel 的新增 sticky 黑底与原紫色背景不一致；随后只将 Jewel、Bomb Jack、Adventure Island 该容器背景分别改为原主题色 `#101020`、`#080b17`、`#071916`。
- `final-theme`：仅重跑这 3 款两尺寸，6/6 通过；新底色没有改变布局/输入/模型。其余 4 款的完整载入字节保持不变，因此复用 attempt-6 的 8 个通过用例。

每轮的 `report.json`、PNG、`executed-run-layout.mjs` 及 stdout/stderr 均为原始记录。`attempt-1/executed-ui-assets/` 保存初版 UI；`attempt-2/executed-ui-assets/` 保存 attempt-2 至 attempt-5 的相同生产 UI。各轮完整 loaded-asset 哈希在自己的报告中，不能将旧组件截图替换解释为后续组件效果。

## 最终状态

最终选取 **14/14 用例通过**：Tank、Jackal、Tetris、Super Mario 使用 `attempt-6-frozen-component` 的 8 个用例；Jewel、Bomb Jack、Adventure Island 使用 `final-theme` 的 6 个用例。`final-summary.json` 给出逐款来源、报告哈希、正常/长 ID/滚动尺寸，且核对每款全部载入资产与最终准备目录相同、当前源码每个 asset 与对应报告相同。7 个 runtime 的 `node --check` 和 21 个 UI 文件的 `git diff --check` 通过。

`visual-review.json` 记录 19 张实际目视 PNG 及 SHA256，包含 7 款两尺寸真实 playing、菜单、暂停与长 ID 滚动样例。连接区在两尺寸可见，正常 ID 单行、长 ID 完整换行。原帮助/音乐控件在内容较长时需要滚动，连接卡片保持置顶；不声称所有侧栏内容同时可见。没有用信号格或数值代替不存在的 RSSI。

源码精确哈希在 `final-ui-source-hashes.json`；`attempt-6-ui-source-hashes.json` 保留主题修正前的哈希。最终执行的 4 个 UI/helper 文件在各选定报告的 `executed-ui-assets/<slug>/` 中。失败和旧视觉证据继续保留，不能将旧截图解释为 3 款最终主题效果。

最终完整轮和主题补验命令（临时目录仅为本次环境）：

```bash
PURETV_PACKAGE=/dev/shm/controller-status-deps/package.json CHROMIUM_PATH=/usr/bin/chromium TMPDIR=/dev/shm/controller-status-tmp node docs/controller-client-status/arcade-ui/run-layout.mjs --assets-root /dev/shm/controller-status-arcade-assets-final --output docs/controller-client-status/arcade-ui/final
PURETV_PACKAGE=/dev/shm/controller-status-deps/package.json CHROMIUM_PATH=/usr/bin/chromium TMPDIR=/dev/shm/controller-status-tmp node docs/controller-client-status/arcade-ui/run-layout.mjs --assets-root /dev/shm/controller-status-arcade-assets-theme --slugs jewel,bomb-jack,adventure-island --output docs/controller-client-status/arcade-ui/final-theme
```

第一条命令产物结束后归档改名为 `attempt-6-frozen-component`。每次重跑应指定新的空输出目录，脚本会拒绝覆盖既有证据。本目录结果不替代原生 SDK、TCP 客户端、正式签名 APK、实体电视或 ESP32 的验收。

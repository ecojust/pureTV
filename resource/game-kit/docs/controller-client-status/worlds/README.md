# 4 款 3D 游戏的手柄连接侧标验证

Cozy 在802已签名候选包（0.5.4，尚未发布）的 Android 像素复核中发现 Music 焦点触发滚动锚定的新问题。初次 `final-results.json` 保留为历史结果，Cozy 后续修正与当前证据见 [cozy-scroll-anchor/README.md](cozy-scroll-anchor/README.md)；其余3款没有重跑或改动。当前四款的合并清单为 [current-results.json](current-results.json)，仅替换Cozy的两场证据并额外引用16个焦点/滚动采样。

覆盖 Coast Kart、Cozy Island、Alien Shooter、Used Car Racing。生产界面调用 `PureTVControllerAdapter.renderClients(..., controllerAdapter.peek(), ...)`，复用已经消费的原生快照缓存，不额外调用宿主 `snapshot()`。只显示已连接的 Wi-Fi 客户端，卡片包含手柄图标、席位和完整 ID；没有 RSSI 数据，不显示强度。

- Coast：现有侧栏顶部粘性卡片。
- Cozy：连接卡片和 Music 独立于中间详情滚动区，避免焦点触发滚动后覆盖二维码。
- Alien：菜单时置于房间侧栏顶部；进入游戏时同一张卡片移到独立右侧 dock，暂停后回到房间侧栏。
- Used：独立左侧 dock，位于比赛计时与驾驶 HUD 之间；车库位置避开标题和车辆参数。

## 测试范围

`layout-check.mjs` 是浏览器 UI 测试，注入明确标记的合成原生传输快照；不是实体手柄、真实 TCP SDK、Android APK 或电视验收。菜单开始和暂停仅用普通键盘输入推进，不写模型、不改时钟。每例核对测试前后所有游戏资产 SHA256、页面错误、完整 ID、换行、视口边界、关键 HUD/按钮/标题不相交和侧栏滚动尺寸。

960×540 中文与 1280×720 英文分别检查：零连接隐藏、菜单正常 ID、菜单 96 字符单/双 ID、实际游玩正常/96 字符 ID、暂停、仅手机连接隐藏、Wi-Fi 重连、断线后本地键盘、连接与本地键盘同时输入。Alien 按其单人协议只验 1P。

`physicalTvTested:false`、`physicalPhoneTested:false`、`physicalEsp32Tested:false`、`androidAppTested:false`。真实 SDK 协议和签名 APK 由本次任务的独立 QA 与发布流程验证。

## 保留的尝试

- `attempt-0-import/`：原始执行脚本和导入路径错误日志，尚未进入浏览器测试。
- `attempt-2-exploratory/`：原始报告/截图/实际执行脚本全部保留。Coast/Cozy 的最初脚本用 Enter 暂停（实际上应为 P），Cozy 的短 Enter 脉冲亦遇到软件渲染帧未消费；后续改为普通 keydown，等待实际状态改变后 keyup。Alien 首轮暴露投影输入丢失 controllerId，生产 UI 改读 adapter.peek()。Used 960 通过；Used 1280 在验证期间源码发生 CSS/共享 helper 修正，最终 SHA 守卫失败，不能当作最终冻结证据。
- `attempt-3-final-assets/`：Coast、Cozy、Used 的两个分辨率全部通过。Alien 的菜单、游玩通过；暂停碰撞检查误将现有全屏暂停菜单背后的战斗 HUD 当作可见层，原始失败记录保留。
- `attempt-4-alien-final/`：只补验 Alien 两个分辨率。测试按实际显示层排除被完整暂停菜单遮蔽的底层 HUD，并同时检查暂停/开始按钮；两场全部通过。生产资产没有修改，未重跑其余已通过游戏。

首轮汇总保留为 `final-results.json`：**8 / 8 场、112 项检查通过**，该轮记录时的资产哈希与当时工作区一致；原始报告未覆盖。菜单、实际游玩及暂停截图已逐款目视，正常与96字符 ID均完整可读。首轮 Coast/Cozy 较长侧栏内容需滚动；Cozy 后续已改为独立连接区与内部详情滚动，当前说明以上方补验链接为准；Alien / Used 独立 dock 避开必要 HUD、标题与按钮。Used 没有再次运行已知失败的 Android 宿主环境，这里的结果只证明浏览器 UI。

模型与渲染器未改动的 11 个文件及基线提交见 `model-renderer-unchanged.json`；4 个 UI runtime 的原生快照调用次数亦未增加。

复现：在 `PURETV_PACKAGE` 指向包含 Playwright 的 package.json、`CHROMIUM_PATH` 指向 Chromium 后，运行 `node resource/game-kit/docs/controller-client-status/worlds/layout-check.mjs /absolute/new-empty-output`。可加第三参数 `alien-shooter` 只运行该款；输出目录必须为空。

共享组件最终 SHA256：`3aa03cc8f276aa3c8b7f218fb3a5cac176bb2bb01b3aaec2cc59a69596a36e2a`。

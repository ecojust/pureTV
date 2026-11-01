# 可执行浏览器 QA / 实际操作录像

这些工具读取构建后的游戏资源，将结果写入指定的 scratch 目录，不修改游戏源码、构建文件或 Git 状态。模型规则的 Node 测试由每款游戏实现；通用流程通过不能代替独特规则覆盖。

## 最短调用

```sh
node resource/game-kit/qa/qa.mjs \
  --assets /absolute/path/to/extracted-apk-assets \
  --output /workspace/scratch/hundred-games/results/gravity-courier \
  --automation /absolute/path/to/automation.mjs \
  --seconds 25 --record \
  --apk /absolute/path/to/gravity-courier.apk \
  --package com.ecojust.gravitycouriertv
```

`--assets` 应指向 APK 解出的完整 assets 目录，包含公共运行时和本游戏资源。入口默认 `tv.html`，可传 `--entry index.html`。`--seconds` 控制普通操作回归时长，默认 15 秒。录像默认 30 秒；`--recipe recipe.json` 可指定 `{ "durationSeconds": 45 }`。省略 `--record` 或 `--apk` 时报告不声称相应项目已通过。

产物：`report.json`、实际截图、性能样本、输入状态轨迹；`recording/gameplay.mp4`、`recording/recording.json` 与完整解码结果。`gameplay.mp4` 严格小于 10,000,000 字节。

独立录制：

```sh
node resource/game-kit/qa/record.mjs --assets /game/assets --output /capture --automation /game/tests/automation.mjs
```

独立 APK / 视频检查：

```sh
python3 resource/game-kit/qa/verify-artifacts.py --apk /game.apk --assets /game/assets --package com.example.game --video /gameplay.mp4 --output /validation.json
```

## Runtime 契约

`window.PureTVQA.snapshot()` 返回可 JSON 序列化的深拷贝：

```js
{ phase: 'menu'|'playing'|'won'|'lost', paused: false, tick: 0, model: { /* 游戏特有可读状态 */ } }
```

监听真实 `keydown` / `keyup`：Enter 开始、Arrow/WASD 方向、Space 动作 A、B 动作 B、P 暂停/继续、R 重开。暂停冻结 tick 和 model；R 重置 tick 并进入 playing。浏览器可脱离 Android host 正常键盘试玩；录制不会调用 `PureGame.key()`、写入模型、修改分数、强制胜利或覆盖时钟。

## 每款 automation.mjs

策略只能取得从浏览器读出的快照和墙钟时间，不能取得 page/context。返回需要保持按下的键名；harness 发出真实浏览器键盘事件，并在释放、结束、暂停时清理按键。录像也允许策略在胜负结算页用普通按键选择下一关；初始菜单由 recipe 启动，暂停期间不操作。

```js
export const budgets = { maxWebGLDrawCalls: 8 }; // Canvas 游戏改用 maxCanvasPaintCommands

export function keys(snapshot, { elapsed, mode }) {
  // 这里依据正常游戏状态导航/瞄准；不得控制分数或结果。
  return snapshot.model.player.x < 400 ? ['ArrowRight'] : ['Space'];
}

export function assertProgress({ before, after, trace }, assert) {
  // 必须断言本游戏独有机制。例如货物先拾取，再低速交付，交付次数真实增长。
  assert.ok(after.model.delivered > before.model.delivered);
}

export function assertRetry({ before, after }, assert) {
  assert.equal(after.model.delivered, 0);
}
```

无 `assertProgress` 时 `uniqueRulesVerified` 明确为 false。该 hook 只验证实际游玩轨迹；完整胜/负、边界、碰撞、资源消耗和计分规则仍应由 Node 模型测试验证。

不使用策略时可给录像 recipe：

```json
{"durationSeconds":30,"steps":[{"at":1,"type":"tap","key":"Enter"},{"at":2,"type":"down","key":"ArrowRight"},{"at":3,"type":"up","key":"ArrowRight"}]}
```

## 覆盖与边界

- 通用 QA：菜单加载、页脚版本与打包配置一致、快照隔离、画布可见、Enter 开始、P 暂停时 tick/model 冻结、继续、普通输入推动模拟、特有玩法断言、R 重开、960×540 / 1280×720 视口、无页面/控制台/资源错误。两种视口都检查侧栏无需滚动，连接地址、操作说明和提示正文的所有文字边界完整可见，提示内容与 `GameDef.tip` 一致。
- 性能单独测试会话：拦截实际 WebGL drawArrays/drawElements/instanced 调用；Canvas 仅统计 paint API 命令，不能称 GPU drawcall。WebGL multi_draw 记录 API 提交次数，不能等同子 draw 数；worker OffscreenCanvas 不在观察范围。RAF 间隔是这台 Chromium/SwiftShader 机器的事件循环观测，不能推断电视 FPS。阈值必须由游戏显式提供。
- 录像全新 context：不注入性能 instrumentation，正常墙钟推进，CDP screencast 记录真实时间戳，普通键盘自动操作。视频为静音 H.264/yuv420p/30 fps 导出，30 fps 不是设备实测帧率。保留源文件哈希、输入时间、状态样本、帧哈希。不能描述为人工操作或手机/电视实拍。
- 画面自动检查只能发现空白或单色帧，不能替代人工打开截图/视频核对构图、文字和玩法。`visualReviewCompleted` 默认 false，完成后应由审阅流程另行留证。
- APK：小于 10 MB、ZIP 完整性、包名/版本/可启动 activity、apksigner 签名校验、APK assets 与测试源码逐文件哈希完全一致。
- 视频：小于 10 MB、H.264/yuv420p、有效时长、全片 ffmpeg 解码。缺少音频已如实标记。
- 当前环境 adb 无设备、无 emulator；报告始终保留 `physicalTvTested:false` / `physicalPhoneTested:false`。APK 安装和真实手机触控/LAN 协议回归需相应设备或既有 host/controller 专项测试，不由此脚本假定通过。

## 工具链与自检

Node 24、Playwright 1.64.1、`/usr/bin/chromium`、系统 ffmpeg 7.1.5、Python 3。默认 Playwright headless-shell/ffmpeg 缓存缺失，所以指定系统 Chromium 并使用系统 ffmpeg；无需下载浏览器附件。`CHROMIUM_PATH` 可覆盖浏览器，`PURETV_PACKAGE` 可覆盖依赖解析用的 desktop/package.json。

公共工具的验证不能计入游戏完成数量。每款游戏的规则回归、实际游玩视频、最终 APK 资源一致性及完整解码结果分别保存在其发布目录的 `docs/verification.json` 中。

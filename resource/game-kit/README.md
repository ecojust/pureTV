# pureTV 小游戏公共组件

这里复用原生电视宿主、局域网手柄、绘制批次和菜单。每个游戏在 `resource/apps/<id>/` 中维护独立规则、地图、美术组织与测试，生成独立包名的 APK。公共组件本身不计作游戏。

## 构建

需要 JDK 17、Android SDK Platform 35、Build Tools 34.0.0 和 ZXing Core 3.5.3。

```bash
python3 resource/game-kit/build.py \
  --game resource/apps/gravity-courier \
  --output /tmp/gravity-courier-build \
  --sdk "$ANDROID_HOME" --jdk "$JAVA_HOME" \
  --zxing /path/to/core-3.5.3.jar
```

产物为未签名的 `unsigned.apk` 和包含资源哈希的 `build-receipt.json`。本地工具不读取发布密钥。签名使用 `Sign one Game Kit APK` 工作流中的现有仓库证书；它只生成下载产物，不发布 Release 或市场内容。最终 APK 必须小于 **10,000,000 字节**。

游戏目录提供 `game.json`、`src/main/assets/game-model.js`、`game.js`；公共 `web/` 文件在构建时合入。重名、符号链接和越界路径会被拒绝。构建生成资源白名单，原生 WebView 只加载白名单中的本地文件。每款游戏需提供自己的 `logo.svg`、实际画面 `thumb.png`、说明、测试、校验和及录像。

## 游戏接口

- `PureModel.create(seed, difficulty)` 创建独立状态；`step(state, dt, input)` 更新规则，终局冻结。
- 输入为 `x/y`、`a/b` 和 `aPressed/bPressed`，摇杆坐标按屏幕方向归一化。
- `GameDef.holdConfirmAsA=true` 可把键盘/遥控器确认键作为持续按住的 A；默认仍为每次确认触发一次 A。开始、暂停恢复与结算菜单的确认操作不算游戏动作。
- `input.cancelEpoch` 在输入清除或手机 `cancelSeq` 变化时递增，暂停或没有物理步时保留到下一次 `step`。`input.cancelled=true` 表示取消所属的整帧，或被取消的 A/B/确认键仍未真实松开；这种合成中立输入不能用于“松开后计分”或重新武装按键。需要按住时长的游戏应在新 epoch 清除未完成信号，并等下一次非取消输入中的真实松开后再接收信号。
- `GameDef` 声明标题、说明、手柄标签、HUD、结算文字与 `render(renderer, state, time, input)`。
- `PureTVQA.snapshot()` 只返回深拷贝，用于观察真实输入的结果；不提供改分数或强制胜利的入口。
- `PureRenderer` 用单个烘焙图集合并图形与 ASCII 字符；中文界面在 DOM 层绘制。可通过 `GameDef.atlas` 使用[每款游戏自己的素材布局](RENDERER.md)。`metrics.drawCalls` 只统计 WebGL 提交，Canvas 降级单独标记。

手机手柄使用左侧自由起点摇杆，右侧三分之一为连续触控区：单动作覆盖整个右区，双动作分上下两半。禁用选字、长按菜单和触摸滚动；指针取消、后台、断线会释放输入。首次连接走随机房间令牌，陈旧输入由服务端超时清零。

输入取消后，本地 A/B/确认键必须收到真实 `keyup`，手机 A/B 必须收到仍连接客户端的原始 `false`，才能解除按住隔离；手机暂时缺席不代表松手。断线取消送达后可用本地键盘继续，远端隔离记录仍保留；手机重连会再次取消旧输入，持键仍须松开。DOM 自动重复 `keydown` 被忽略，方向连走由各游戏模型处理。其他游戏可忽略新增取消字段，默认确认键行为不变。

## 验证与计数

原生安全/生命周期/LAN 测试位于 `android/src/test`，`controller-test.mjs` 验证手机触摸交互。每款还需规则测试、浏览器真实输入回归、界面目视核对、最终签名与资源一致性检查，以及正常游玩录像。

```bash
node resource/game-kit/qa/input-lifecycle-test.mjs --output /tmp/puretv-input-lifecycle
```

此项在 Chromium 中用手动推进的 RAF、探针模型和受控手机快照验证输入协议，包括持续确认键、短按、取消、暂停及断线恢复；它不代表实际游玩、帧率或实体硬件测试。旧游戏兼容性和新游戏的实际操作仍需分别回归。

进度见 [progress.json](progress.json)。只有完成上述项目并逐款提交到 GitHub 后才计数，草稿与公共组件不计数。浏览器软件渲染的帧耗时不代表实体电视表现；报告必须说明是否做过真机验证。

原生宿主与局域网协议基于本仓库既有游戏实现，继续遵循根目录 [MIT 许可证](../../LICENSE)。新增公共渲染素材为代码绘制的原创图集，不包含第三方游戏资源。

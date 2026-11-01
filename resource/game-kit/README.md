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
- `GameDef` 声明标题、说明、手柄标签、HUD、结算文字与 `render(renderer, state, time, input)`。
- `PureTVQA.snapshot()` 只返回深拷贝，用于观察真实输入的结果；不提供改分数或强制胜利的入口。
- `PureRenderer` 用单个烘焙图集合并图形与 ASCII 字符；中文界面在 DOM 层绘制。`metrics.drawCalls` 只统计 WebGL 提交，Canvas 降级单独标记。

手机手柄使用左侧自由起点摇杆，右侧三分之一为连续触控区：单动作覆盖整个右区，双动作分上下两半。禁用选字、长按菜单和触摸滚动；指针取消、后台、断线会释放输入。首次连接走随机房间令牌，陈旧输入由服务端超时清零。

## 验证与计数

原生安全/生命周期/LAN 测试位于 `android/src/test`，`controller-test.mjs` 验证手机触摸交互。每款还需规则测试、浏览器真实输入回归、界面目视核对、最终签名与资源一致性检查，以及正常游玩录像。

进度见 [progress.json](progress.json)。只有完成上述项目并逐款提交到 GitHub 后才计数，草稿与公共组件不计数。浏览器软件渲染的帧耗时不代表实体电视表现；报告必须说明是否做过真机验证。

原生宿主与局域网协议基于本仓库既有游戏实现，继续遵循根目录 [MIT 许可证](../../LICENSE)。新增公共渲染素材为代码绘制的原创图集，不包含第三方游戏资源。

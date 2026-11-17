# STARBLAZER '86 · pureTV

四向移动与持续射击，使用炸弹清除敌军。保留原波次、三类Boss、奖励波、升级机库、Mira剧情、像素渲染及本地高分。

改编自 [Andrew Wooldridge / triptych 的 game-109](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-109)，固定上游提交 `a7051c34fe2e7550fd206e6272f758df171855b0`，MIT 许可。原始规则、Canvas 2D 渲染及程序音效保留；此目录不是原创 pureTV 游戏。

四向：飞行；A：射击/剧情下一句；B：炸弹/剧情跳过；X：机库出击；Y：返回。姓名输入框左右改字母，A 切换字位。 START 开始、暂停、明确继续；菜单上下选择、A 确认，设置左右调整。断线、失焦、取消输入清除所有按键并暂停真实模拟；重连不会继续游戏。九键保持独立，最低在线座位控制单人游戏。侧栏显示桥接协议提供的真实客户端ID，只有源提供有效信号时才显示信号。

`src/` 是编辑入口，`dist/tv.html` 是 Android TV 与 macOS 共用的离线负载。无CDN、远程图片、网络字体或音频；系统字体代替Google字体，音效与音乐由原WebAudio代码生成。可选系统语音只允许已安装的本地语音。程序图形保持原作风格，独立SVG与Android图标是pureTV包装标识。

```sh
npm ci
npm test
npm run build
npm run build:check
```

精确锁定 esbuild 0.28.2；完整原MIT见 [LICENSE](LICENSE)，来源与修改范围见 [NOTICE.md](NOTICE.md)，上游逐文件Git blob校验见 `docs/upstream-source.json`。上游模型测试位于 `src/dev/simtest.mjs`，原始执行输出留在 `docs/upstream-simtest.log`。

`window.JoystickGameQA.snapshot()`只读返回实际菜单阶段、RAF计数、冻结的模型时间、模型动作计数和当帧控制器缓存；没有写状态、快进或自动获胜接口。`qa-plan.json`使用普通按键驱动真实玩法，并声明暂停期间必须稳定的模型字段。`docs/browser-attempt-*/`保留串行浏览器输入、960×540/1280×720截图、布局尺寸与原始失败。

目前为源码适配与浏览器验收阶段；正式签名APK、原生Mac安装包及实体电视/手柄验收由总交付流程单独完成。`physicalTvTested:false`，`physicalPhoneTested:false`；浏览器合成桥接不等同原SDK TCP或实体硬件。

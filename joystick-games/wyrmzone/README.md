# WYRMZONE · pureTV

地面左右转向、上下前进后退；飞行阶段四向推动准星，A喷火。保留原第一人称线框地面战斗、巨龙飞行、敌军与Boss、八阶段路线和循环，不需要鼠标锁定。

改编自[Andrew Wooldridge / triptych 的 game-083](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-083)，固定提交 `a7051c34fe2e7550fd206e6272f758df171855b0`。原模拟与渲染规则保留，不是原创pureTV游戏。所有图形/音效由原作程序生成，Three.js固定原版本0.165.0并本地捆绑；原MIT与Three完整许可见[NOTICE.md](NOTICE.md)和[LICENSE](LICENSE)。可选外链/PWA辅助脚本移除、网络字体改用系统字体，无运行时CDN依赖。

START开始/暂停/明确继续，Y返回或暂停；菜单上下选择，A确认，设置左右调整。九键独立、单人取最低在线座位；只在唯一RAF内poll共享Wi-Fi输入，诊断与客户端ID侧栏都读取缓存。断线、取消、失焦清键并冻结真实模拟，重连不自动继续。

编辑 `src/`，然后构建离线的扁平 `dist/tv.html`；Android TV和macOS必须使用同一份验证字节。

```sh
npm ci
npm test
npm run build
npm run build:check
```

`docs/upstream-source.json`记录固定源Git blob验证；原模型测试及输出分别在`src/dev/simtest.mjs`和`docs/upstream-simtest.log`。原上游调试写状态接口已从生产入口移除。只读`window.JoystickGameQA.snapshot()`返回实际WebGL版本、RAF帧数、模型时间/位置/动作、阶段及输入缓存。`qa-plan.json`驱动普通手柄输入，`tests/browser.mjs`在单GPU浏览器顺序验证960×540与1280×720，原始报告/截图保留在`docs/browser-attempt-*`。

当前为源码适配与浏览器验收阶段；未在本目录宣称正式签名或原生双平台验收。`physicalTvTested:false`，`physicalPhoneTested:false`；合成桥接不能替代原SDK TCP或实体设备结果。

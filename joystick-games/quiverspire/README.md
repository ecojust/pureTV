# Quiverspire · pureTV

原作的停步自动射箭动作Roguelite：移动时闪避，停下才向敌人射箭；保留10个章节、每章12个房间、Boss、三选一祝福、天赋与永久进度。四向移动；菜单方向键导航、A确认；START开始/暂停/继续，Y返回，X切换音效。每张升级卡和天赋按钮均可遥控聚焦。

改编自 Andrew Wooldridge / triptych 的 game-046，固定上游提交 `a7051c34fe2e7550fd206e6272f758df171855b0`。保留原模拟、Three.js 0.165.0渲染、程序素材和音效，不是原创pureTV游戏；MIT及Three完整许可见NOTICE.md和LICENSE。运行资产完全本地化，网络字体换成系统字体；源码保存在src，构建输出是扁平dist/tv.html。

```sh
npm ci
npm test
npm run build
npm run build:check
```

九键独立，单人取最低在线座位；共享输入桥每RAF只poll一次，真实客户端ID侧栏与只读JoystickGameQA.snapshot读取缓存。失焦/断线取消按键并冻结模拟，重连不自动继续。Mac跨启动存档键`quiverspire-v1`登记在game.json.storageKeys。

qa-plan.json通过普通按键进入祝福选择、真实房间移动与停步射击，并声明暂停稳定字段。原模型测试输出在docs/upstream-simtest.log；tests/browser.mjs串行测试960×540、1280×720，原始报告及截图存入docs/browser-attempt-*。原调试写状态入口已从生产代码移除。

目前为源码和浏览器验收阶段，未宣称正式签名APK或原生Mac验收；physicalTvTested:false，physicalPhoneTested:false。合成桥接与原SDK TCP、实体设备测试分别记录。

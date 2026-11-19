# crisp 游戏的 pureTV 适配

本目录只共享输入、时钟、电视菜单与构建。11 款游戏各自的 `src/game.js` 保留上游 d81f02a0928b35d9c979e9918aa9dc3c2770821b 原件，实际规则和画面没有合并成同一玩法。原 npm 发布包的浏览器运行库位于 `vendor/`，每次构建验证 `vendor-lock.json` 中的 SHA256。每款原件和全部音频也由 `upstream.json` 校验。`build:check` 比较完整 dist 字节及文件列表，不访问网络，不依赖全局打包器。

`patch-engine.mjs` 对原 crisp 1.4.0 做逐段唯一匹配的构建时补丁：

- 由 TV 的单个 requestAnimationFrame 循环驱动原引擎，沿用原 68Hz 上限；Pixi 自带 ticker 关闭并在同一游戏帧绘制。每个 TV 帧只调用一次 `createController.poll()`，其他地方读取缓存。
- 关闭原库的任意键/指针捕获，将 A 的按下、保持、主动松开直接传给原 input。高刷新率下待处理边沿保留到实际游戏帧。START、B 与方向键只处理菜单，不混入 A。
- 暂停、断线、失焦、后台时不执行原引擎 update，ticks、score、实体和粒子完全冻结，WebAudio 挂起。取消清空边沿，只有真正投递过的按住才能产生主动松开。重连、前台与重新聚焦均不自动恢复。
- 原 title 仅重绘（等待内置字形加载），不推进规则时钟；终局冻结，由电视菜单明确重开。原始标准难度为 1，额外进阶/挑战只改变初始难度，原随 ticks 增长规则不变。
- 原 simple/dark 主题用 Canvas2D；microbial-focus、pod-migration、tectonic-tether 保留原 shape / PixiJS 渲染。快照报告实际 WebGL 上下文版本；不强制把 WebGL1 当 WebGL2。

`window.JoystickGameQA.snapshot()` 是唯一 QA 接口，只克隆观察值，没有改状态、改时钟或改难度的方法。`frames` 是 TV 的 RAF 帧计数；`gameplay.ticks` 是原引擎游戏时钟；`controller.pollCount` 与 RAF 一一对应。`gameplay` 包含原引擎的 state/score/ticks/difficulty 与每款实际词法状态。音频状态异步变化，不应将 audioState 当暂停稳定性依据。

所有 11 首 BGM 与 Switchboard 7 个连接音效本地化。构建仅把原音频地址映射为 dist 下的安全文件名；没有 CDN 或运行时下载。原页面加载但未用到的 gif-capture-canvas 与非 shape 滤镜没有打包。第三方完整许可位于 `licenses/`，随每款 dist 分发。原库带源代码注释和版权声明；首次测试与失败保留在各款 docs/browser-qa。

可复查浏览器测试：先从仓库根目录启动 HTTP 服务，再用安装了 Playwright 的 Node 运行 `browser-qa.cjs <slug> <attempt>`；设置 `BASE_URL`（默认 `http://127.0.0.1:8768`）、`CHROMIUM` 与 `NODE_PATH`。共享环境请用 `flock /dev/shm/puretv-browser.lock` 包裹每款测试。测试通过正常键盘输入推进，模拟桥接仅验证连接/取消与身份卡，结果不冒充原生 TCP、真实 Android/Mac 或实体手柄验收。

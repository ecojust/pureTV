# Backroad Android 暗背景静态定位

原 APK 的图形交付仍受阻，根因未证实。本次只读固定源码、既有报告并实际查看两张原图，没有运行新浏览器、GPU 或原生测试，也没有改游戏、APK、时钟、模型或验收条件。

包源为 `4b6cf0b8cba288eae66bcae2ef2784acc279a695`，APK 为 105,024,551 字节、SHA256 `2cd35f145f5362264a720708325c22e283a3828d21899058f17422ba87103c08`。原 QA `382de3792628050773abec8821920348503f72ce` / run `44630023214` 的两模式报告仍保持通过；这些报告证明输入、导航和模型进展，不能覆盖实际图像中没有车与赛道的问题。

[`review.py`](review.py) 可重现固定 13 个源码/锁/实际 bundle 字节核对、两原报告和 playing 图片 SHA 核对及白名单状态提取。结果在 [`review.json`](review.json)。没有复制原报告中的房间 URL/QR。

## 已能确定的观察边界

- Android 两张 playing 图的前后样本均为 `renderer=webgl2`、`stage=playing`、`ready=true`、`paused=false`、`errors=[]`。帧数分别 538→542、652→655；模型时钟在截图期间继续前进。canvas 为 1920×1080，CSS/viewport 为 960×540，两次尺寸没有变化。
- 根的[原像素检查](../android-v7-root-image-analysis/review.json)记录两图各 1,958,059 / 2,073,600 像素恰为 CSS canvas 背景 `#1b1916`，即 94.428%。本审实际查看 normal 原图：只有平坦暗底、HUD 与手柄卡，没有车/路。颜色匹配支持“没有可见画布输出”的调查方向，单凭颜色不能区分上下文、后处理、合成或其他原因。
- 本审实际查看旧浏览器 [`driving-960.png`](../browser-attempt-4/driving-960.png)：可见车辆、道路、观众、植被及阴影，HUD 为 6 km/h。这是旧软件浏览器结果，不能当作 Android/DPR2 同条件通过。
- [既有 DPR2 对照](../android-v7-dpr2-browser-diagnosis/analysis.json)只到原 Low 菜单/暖场，未到可见驾驶场景。该桌面 context 未丢失、浮点扩展存在，不证明 Android 上同样成立；Low 时它的 canvas 也为 1920×1080。

## 按证据优先级核查的候选

| 候选 | 固定源码支持与当前限制 | 新 Observer 能核查什么 |
| --- | --- | --- |
| 当前文档 WebGL context 丢失，Three 随后不再绘制 | 实际打包 Three 中 `webglcontextlost` 调用 `onDeviceLost`；默认实现只 `console.error` 并设 `_isDeviceLost=true`，`_renderScene` 立即返回。RAF/物理/HUD可继续。没有本轮原事件证据，不能认定已发生。 | 检查 `consoleAttachedBeforeLoad`、`dropped` 及完整时间序列中的 `THREE.WebGPURenderer: WebGL Device Lost:`。必须将 `sequence/wallTime/source` 与 initial-menu/Low/stage 的 `/graphics.url`、`observedAt` 和 observer HTTP 时间线对应。旧页在 query 导航附近销毁的 context，不能直接归给新 stage。 |
| Low 的浮点 framebuffer / shader / 后处理链失败 | Low 仍有 HDR scene pass、8-tap HalfFloat DOF、深度雾、filmic grade 和 FXAA；并非“关闭后处理”。实际 bundle 的 HALF_FLOAT→RGBA16F 与 `EXT_color_buffer_float` 路径已绑定。创建 WebGL2 成功不证明这些绘制能成功。 | 同一 stage 的 console 中 shader compile/link、framebuffer incomplete、`INVALID_FRAMEBUFFER_OPERATION`、不支持扩展/纹理格式等具体消息；同时看系统 GL 日志。当前 Observer 不调用 `getContext/getError/readPixels`，没有这些消息时也不能直接宣布 framebuffer 健康。 |
| canvas/祖先样式或覆盖层隐藏了画面 | 原样本只给 `visible=true`、非零尺寸，不涵盖全部 opacity、transform、覆盖层；不过根截图颜色不是原浅色 loading curtain。stage 的 ready 是时间/帧耗时暖场条件，不是像素检查。 | 看 `canvases[].style/ancestors/centerStack`、opacity/display/visibility、rect、transform/filter、zIndex 和 `hidden/focused`，与系统 PNG 对齐。中心点列表不是全屏覆盖证明，隐藏/部分覆盖仍需结合实际图像。 |
| 真正 resize/比例变化清屏后没有新画面提交，或平台合成路径异常 | 原源码 resize handler 调 `setSize`，它重设 canvas width/height；调比例时亦可能清屏。但 Three `CanvasTarget.setPixelRatio` 有相等值提前返回，不能把每次相同 quality/ratio 调用误判成反复清屏。明确 Low 后自动调档被禁用；两截图样本尺寸稳定也不支持已证实的 resize storm。 | 对齐多次 viewport/DPR/buffer/CSS尺寸和 PNG；同尺寸的 `setSize` 赋值不一定能由间隔快照发现。当前 Observer 没有 resize 事件或 draw/present 计数，因此无尺寸变化不能彻底排除此候选。需要前面更强的 console/DOM 证据先缩小范围。 |
| 资产加载/相机/剔除问题 | 原包资产已经独立完整核验；模型完成芬兰关卡构建并运行。源中场景背景设为雾色，最终后处理输出 alpha=1；仅相机看不到车/几何，并不完整解释为什么几乎整屏是 CSS 底色。这是相对低优先级，不是已排除。 | 现有 `resourceTail` 的 URL/status/size 与同文档 console 中实际资源错误，结合 stage/car/坐标；tail 只有最后96条，缺失旧请求或 status=null 不应当作成功或失败。现在没有可读相机矩阵/scene draw calls，不虚构这些字段。 |

## 关键固定源码链

以下行号全部指向原包源 `4b6cf0b8cba288eae66bcae2ef2784acc279a695`，当前所读对应文件逐字节相同；13 文件完整 SHA 在 JSON 中。

- [`boot.ts:17`](https://github.com/ecojust/pureTV/blob/4b6cf0b8cba288eae66bcae2ef2784acc279a695/joystick-games/backroad-rally/src/upstream/src/boot.ts#L17)：强制官方 WebGL2 backend，alpha=true，DPR 上限2；renderer 初始化后一次写入 backend 标记。
- [`puretv-observation.ts:3`](https://github.com/ecojust/pureTV/blob/4b6cf0b8cba288eae66bcae2ef2784acc279a695/joystick-games/backroad-rally/src/upstream/src/puretv-observation.ts#L3) 与 [`puretv.ts:16`](https://github.com/ecojust/pureTV/blob/4b6cf0b8cba288eae66bcae2ef2784acc279a695/joystick-games/backroad-rally/src/upstream/src/puretv.ts#L16)：renderer/webglVersion 是缓存标签；errors 只监听 uncaught error / unhandled rejection，不收 console.error。
- [`main.ts:769`](https://github.com/ecojust/pureTV/blob/4b6cf0b8cba288eae66bcae2ef2784acc279a695/joystick-games/backroad-rally/src/upstream/src/main.ts#L769)：771增加frames，781计算ready，797进物理，860才调用look.render。故正帧数/物理进展不证明成功draw/present。原生产未暴露可变 `window.__br`；新 Observer 不读取内部 renderer。
- [`stageMenus.ts:141`](https://github.com/ecojust/pureTV/blob/4b6cf0b8cba288eae66bcae2ef2784acc279a695/joystick-games/backroad-rally/src/upstream/src/menu/stageMenus.ts#L141)：暖场达到时间/稳定帧条件或上限后淡出；ready不检查像素。原浅色 curtain 最终 display:none。
- [`quality.ts:27`](https://github.com/ecojust/pureTV/blob/4b6cf0b8cba288eae66bcae2ef2784acc279a695/joystick-games/backroad-rally/src/upstream/src/look/quality.ts#L27)、[`look.ts:147`](https://github.com/ecojust/pureTV/blob/4b6cf0b8cba288eae66bcae2ef2784acc279a695/joystick-games/backroad-rally/src/upstream/src/look/look.ts#L147)、[`post.ts:143`](https://github.com/ecojust/pureTV/blob/4b6cf0b8cba288eae66bcae2ef2784acc279a695/joystick-games/backroad-rally/src/upstream/src/look/post.ts#L143)：Low 后处理链与 browser upscale 路径；本次原 stage URL 没有 fsr 参数，不能直接归因 FSR。
- [`style.css:13`](https://github.com/ecojust/pureTV/blob/4b6cf0b8cba288eae66bcae2ef2784acc279a695/joystick-games/backroad-rally/src/upstream/src/style.css#L13)：body/loading浅底 `#f1ede7`，canvas底 `#1b1916`。
- 实际 `dist/assets/three-Bfh60JNy.js` 为 1,044,137 字节，SHA256 `aec21e9be65e1f9199c8d4be10efa4a015816ffd34847c6adcb9f1482e7d6013`。JSON保存关键 minified 片段与字符偏移。补充可读解释来自固定锁的 Three 0.186.1 已安装源码：`WebGLBackend.js:232`、`Renderer.js:1348/1654`、`CanvasTarget.js:136/185`、`PassNode.js:246`；不将本地依赖目录当作另一个原包。

新 Observer 的固定源为 `6d91b69`（JSON记录完整提交）；它收 console 与 DOM，不改变 context、生产 renderer 或验收。console ring 跨同 WebView 导航保留且没有 documentEpoch，必须按 URL/时间关联；缺日志或 ring 丢条时保持未知。原日志没有明确 context-loss/shader 错不能据此排除这些候选，因为旧宿主没有显式 WebChromeClient console 采集。

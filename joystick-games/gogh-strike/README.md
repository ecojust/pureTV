# 梵高突击 · Gogh Strike

在梵高笔下的小镇中进行六对六的颜料对抗。玩家从两个阵营的十二位画家中选一位，与五名电脑队友并肩作战。先得到 20 分的队伍获胜，三分钟时间到则比较得分。画家的造型、专属装备、喷绘、舞蹈，以及小镇的笔触、碰撞、对手和计分规则均沿用原作。

[在电视上连接手机手柄](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上游玩](../../docs/guide/README.md#在电脑上玩)

## 操作

| 动作 | 手柄 | 键盘 |
| --- | --- | --- |
| 大厅中切换阵营、画家 | ↑ ↓ 调阵营，← → 选画家 | 方向键 |
| 查看画家、设置 | X、Y | C、V |
| 开战、暂停、继续、再来一局 | START | P |
| 向前、后退、左右转身 | ↑ ↓、← → | 方向键，也可用 WASD 移动 |
| 调整准星 | 按住 X，用 ↑ ↓ 调高低、← → 微调方向 | C 加方向键，也可点击画面后用鼠标瞄准 |
| 发射颜料、装填、换装 | A、轻按 B、Y | Z、X、V |
| 跳跃、蹲下 | 按住 B 加 ↑、↓ | 空格、Ctrl |
| 烟雾、颜料弹 | 按住 B 加 ←、→ | Q、G |
| 喷绘、舞蹈、近身涂色 | 按住 B 加 Y、X、A | T、J；近身也可用 X 加 Z |
| 暂停、设置或角色预览中的选择 | 方向键移动焦点，A 确定，B 返回 | 方向键、Z、X，或 Tab、Enter、Esc |

匹配 Android TV 手机手柄、pureTV Wi-Fi 手柄以及浏览器标准映射的 USB / 蓝牙手柄。纯键盘也可用小键盘 8、2、4、6 控制方向，5、1、3、7、9 对应 START、A、B、X、Y。单人游戏中断开手柄、切到后台或窗口失焦都会暂停。再次按 START 可继续。

## 构建与游玩

在本目录执行 `npm ci && npm test && npm run build && npm run build:check`。原作的规则测试包含领先、平分、结束后冻结比分和开局倒数。在仓库根目录执行 `python3 -m http.server 8000`，打开 `http://localhost:8000/joystick-games/gogh-strike/dist/tv.html`。需要支持 WebGL 2 的浏览器或 WebView。所有画家模型、贴图、音效逻辑和渲染代码都在本地。

`tests/browser.py --evidence docs/browser` 以 Chromium 和 Python Playwright 读取实际角色、瞄准、弹药和对局状态。测试通过键盘事件和手机 / Wi-Fi 宿主输入快照操作同一个发行入口。原生包验证读取 [动作计划](qa-plan.json)。

[原作和固定提交](https://github.com/petergpt/gogh-strike/tree/2285e640097d9b12bcc42af72d5e8d0b37082f51) · [版权和素材来源](NOTICE.md) · [原作运行文件校验值](src/upstream/runtime-sha256.txt)

源目录保留十二位画家的原始 GLB 与 PNG。发行构建用 gltfpack 量化并压缩顶点，保留画家原有的近、远两级模型；四张共享角色贴图沿用原始分辨率。选角卡片和 HUD 头像从原始渲染图分别生成最长边 420 和 160 像素的 WebP。更新头像时运行 `npm run assets:portraits`。构建会核对原图与规范化 WebP 的 SHA-256，以保持各系统的发行字节一致。

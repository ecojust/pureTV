# Kart Royale 0.1.6 赛道验证

日落湾、海岬之冠和游艇港连弯使用同一套赛道网格生成器。三者按 0.5 米间距采样中心线，复用路肩、路缘石、拱顶隧道、桥梁、海水、房屋与植被材质。新路线分别定义曲率、坡度、倾角、宽度和加速带。[内置日落湾原图](../../src/docs/hero-coast.png) · [赛道配置](../../src/src/world/Circuits.ts)

## 浏览器选赛道与发车

Chromium 在 Linux 上用 Mesa llvmpipe 的 WebGL 2 软件渲染。测试从标题页按方向键选赛道，按 Enter 进入选车并开赛，绿灯后按住上方向键加速。测试使用软件 Low 档和 0.55 渲染比例，在倒计时和低速起步时减少了绘制次数。输入、计时和物理持续更新，达到 5 m/s 后恢复正常绘制并截取画面。这组截图记录发车场景，不能用于估计实体电视帧率。[浏览器测试脚本](../../src/tools/puretv-circuits.mjs)

| 路线 | 按油门后采样速度 | 画面 |
| --- | --- | --- |
| 海岬之冠 | 5.73 m/s | [960×540 发车画面](cape-crown.jpg) |
| 游艇港连弯 | 6.21 m/s | [1280×720 发车画面](marina-esses.jpg) |

两条路线都在第一圈开赛后 0.40 秒采样。海岬之冠截图裁去了浏览器在 960×540 游戏区域外留下的黑边。此次构建的 JavaScript SHA-256 为 `13b9bcf43b6824f2fc459ca4fb7e6f18b627b5446d1b7323e96e2bc99cfbb830`。

## 完整圈数与路线结构

AI 回归以每秒 30 步运行正式 Race、Kart、Track 和 AI。八辆车都从发车位出发，通过常规物理和检查点完成各自的三圈，模拟中未投放道具。海岬之冠含高差全长 1926.25 米，游艇港连弯全长 1684.08 米。单元测试另行检查赛道首尾相接、八个发车位、全部检查点、加速带碰撞面、AI 线路宽度和电视宿主选赛道地址。[完整圈数脚本](../../tests/ai-circuit-laps.mjs) · [赛道回归](../../tests/circuits.test.mjs)

在游戏目录运行以下命令可复查构建和圈数。Canvas 依赖仅用于在 Node 中生成 AI 赛车涂装纹理。

```sh
npm ci --ignore-scripts
npm test
npm run build:check
npm install --prefix /tmp/kart-sim-qa --no-save @napi-rs/canvas@1.1.1
node tests/ai-circuit-laps.mjs /tmp/kart-sim-qa
```

浏览器测试使用 `src/package-lock.json` 中的 Puppeteer。从游戏目录启动 `python3 -m http.server 8119 --directory dist`，另开终端执行以下命令。

```sh
npm ci --ignore-scripts --prefix src
CHROMIUM=/usr/bin/chromium node src/tools/puretv-circuits.mjs \
  'http://127.0.0.1:8119/tv.html?scale=0.55' /tmp/kart-course-captures --sample-draws
```

# Turbo Kart Rally · 涡轮卡丁拉力赛

在棕榈湾赛道上与七位电脑车手同场竞速。八位车手可选，支持 50cc、100cc、150cc 和 1、3、5 圈比赛。按住漂移键转弯蓄力，松开键发动短加速。拾取道具箱后可使用香蕉、龟壳、蘑菇或闪电。

此版移植自 BridgeMind，保留原有赛道、程序生成模型、八种道具、计圈规则、音乐与 WebGL 2 渲染器。着色器支持不足或使用软件 GPU 时，3D 画面采用直接渲染并缩小分辨率；菜单与仪表按窗口尺寸绘制。[上游固定版本](https://github.com/bridge-mind/turbo-kart-rally/tree/c52aca3f10c7995884c316810cac6514daa40e9c)

## 开始比赛

运行 `python3 -m http.server 8000 --directory dist`，然后打开 `http://localhost:8000/tv.html`。字体、Three.js 及游戏资源均已内置。第一次按确认进入选手画面，方向键选择车手，再按确认，焦点会移至 RACE!。直接确认开始，或按上选择难度、圈数后再开始。

| 操作 | 键盘 | pureTV 手柄 |
| --- | --- | --- |
| 菜单移动、确认 | 方向键、Enter | 方向键、A / START |
| 加速、刹车或倒车 | ↑、↓ 或 W、S | ↑、↓ |
| 转向 | ←、→ 或 A、D | ←、→ |
| 跳跃、按住漂移 | 空格 | A |
| 使用道具 | E / X | B |
| 回看 | C | X |
| 静音 | M | Y |
| 暂停、手动继续 | P | START |

选单按 Esc 或手柄 Y 返回。浏览器支持键盘与标准 Gamepad；通过 pureTV 原生宿主运行时，菜单连接卡显示局域网无线手柄及手机房间信息。失焦或控制器断开会清除操作并暂停。重新连接后需要手动继续。

## 构建与验证

```sh
npm ci
npm run build
npm run build:check
python tests/browser.py --output /tmp/turbo-kart-rally-qa
```

浏览器脚本使用 Python Playwright 和支持 WebGL 2 的 Chromium，覆盖键盘比赛与 pureTV 原生桥接协议模拟。原生验证方案见 [qa-plan.json](qa-plan.json)。上游源码使用 MIT，字体使用 OFL 1.1。[许可证](LICENSE) · [第三方说明](NOTICE.md)

# Nerd of Duty · 账本保卫战

选一个职业，从会场街区守住金色账本。欺诈分析师配备步枪，支付工程师使用冲锋枪，合规官使用手枪并拥有双倍护甲。清完一波敌人后，下一波会更难。每局可继续一次，最高分和最高波次保存在本机。街区、角色、材质和音效均由原版代码生成。[上游源码](https://github.com/sytaylor/nerd-of-duty/tree/1bd18d4e0c4c5116ffc3ae229bd0261cbd744148) · [许可与移植说明](NOTICE.md)

## 操作

| 动作 | pureTV 九键手柄 | 标准双摇杆手柄 | 键鼠 |
| --- | --- | --- | --- |
| 选择职业、出击 | 方向、A 或 START | 左摇杆或十字键、A 或 START | 点击职业卡，或方向键选择、Enter 出击 |
| 移动 | 方向 | 左摇杆 | WASD |
| 瞄准 | 按住 X 加方向 | 右摇杆 | 鼠标，Z/X 左右转向 |
| 射击 | A | 右扳机或 A | 鼠标左键 |
| 跳跃 | B | B | 空格 |
| 换弹、切换武器 | Y、X + Y | Y、X + Y | R、Tab |
| 暂停、继续 | START | START | Esc 或 P |

断开当前手柄会暂停正在进行的战斗，重新连接后按 START 继续。小键盘 8/2/4/6 对应方向，5 对应 START，1/3/7/9 对应 A/B/X/Y。[手柄连接指南](../../docs/guide/README.md#安装游戏与连接手柄)

## 离线试玩与构建

游戏需要 WebGL 2。在仓库根目录运行 `python3 -m http.server 8000 --bind 127.0.0.1`，再打开 `http://127.0.0.1:8000/joystick-games/nerd-of-duty/dist/tv.html`。构建产物自带 Three.js，不依赖外部服务。

在本目录运行 `npm ci`、`npm run build` 和 `npm run build:check` 可以重新打包并逐字节比对离线文件。[源码指纹](upstream.json) · [手柄验收步骤](qa-plan.json)

用 `python -m pip install playwright` 准备浏览器驱动，在装有 Chromium 和 FFmpeg 的系统上运行 `python qa/record-gameplay.py gameplay.mp4` 可以录制从选职到街区内移动、转向、射击、跳跃和暂停的实际画面。脚本向游戏发送真实小键盘事件，可用 `--chromium` 指定浏览器路径。

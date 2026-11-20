# 爆裂实验室 · Clawd Pop 3D

穿过按种子生成的实验室，清除每个隔离区的样本，打破机组的能源单元，再到核心室挑战最终首领。主菜单可选随机实验室或每日挑战。单人游玩，保留了原作的程序生成场景、音效、计分和结果评级。

| 新怪物 | 遭遇 | 应对 |
| --- | --- | --- |
| Codex Sentinel（编译哨兵） | 第 2 区起进入遭遇表。带有青色发光通风口，保持距离横移，蓄力后成对发射弹丸。 | 横移躲过扇形弹道，抓住齐射间隙接近。 |
| Ember Hopper（余烬跳虫） | 第 4 区起进入遭遇表。宽扁的红色躯体、粗后腿和发光裂缝。短距离高跳，死亡时爆开。 | 闪开落点，等它接近其他样本再射击，可造成连锁伤害。 |

| 操作 | pureTV 九键手柄 | 电脑键盘 |
| --- | --- | --- |
| 开始、暂停、继续 | START | P |
| 前进、后退、转身 | 上下、左右 | 方向键 |
| 平移、抬头、低头 | 按住 X 再按左右或上下 | 按住 C 再按方向键 |
| 射击、闪避、奔跑 | A、B、按住 Y | Z、X、按住 V |
| 菜单选择、确认、返回 | 方向、A、B | 方向、Z、X |

原作者的 WASD、鼠标瞄准、点击开火、Shift 奔跑、空格闪避和触屏控制均可使用。手机或 Wi-Fi 手柄由 pureTV 宿主提供；菜单显示配对详情，进入游戏后收为角落状态卡。断线及失焦会暂停，重新连接后按 START 继续。

## 构建

```sh
npm ci
npm test
npm run build
npm run build:check
python3 -m http.server --directory dist 8000
```

浏览器打开 `http://localhost:8000/tv.html`。离线资源都在 `dist/`。默认使用 WebGL 2；支持 WebGPU 的浏览器可在原作显示选项中切换或以 `?renderer=webgpu` 启动。菜单和二维码不占用场景尺寸。

[原仓库](https://github.com/VibezZzCoder/clawd-pop/tree/d79750b5e2afec99b42680471b2dd5ff7d2f5f79) 的发行代码存于 `src/upstream/`。两套渲染器由构建入口接入同一组 `src/specimens.js` 定义、波次、外观和分值。许可、署名见 [LICENSE](LICENSE) 和 [NOTICE.md](NOTICE.md)。

## 实测

在 Chromium / Mesa WebGL 2 上，固定种子 `clawd-bench` 的遭遇表包含两种新增怪。键盘可开局、移动、射击，浏览器宿主的 Wi-Fi / 手机输入样本均可射击。两次断开均暂停模拟并保持画布边界，手机重新接入需要按 START 继续。截图和具体测试范围见 [浏览器记录](docs/browser/verification.json)，复跑脚本为 [tests/browser.py](tests/browser.py)。本次未在实体电视和手机上验收，也未完成全程通关。

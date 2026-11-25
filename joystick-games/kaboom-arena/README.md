# 爆破竞技场 · Kaboom Arena

在迷宫里放置炸弹，躲开沿通道扩展的爆风，炸开木箱收集道具。主菜单默认选中三名电脑对手，按 START 即可进入四人竞技场。也可以选择剧情战役、每日挑战或本机多人对战。默认使用像素画面，主菜单的 Graphics 可切换到 3D 或第一人称视角。[上游游戏](https://github.com/janroudaut/kaboom-arena/tree/b9191f6f045e4153ec238a47969a21621a940713)

## 下载

[Android TV 0.1.1 · APK](kaboom-arena-0.1.1.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/kaboom-arena-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/kaboom-arena-windows-x64-setup.exe)

历史安装包（Android 0.1.0） · [Android TV APK](kaboom-arena-0.1.0.apk?raw=1) · [Windows x64 安装版](windows/KaboomArena-0.1.0-windows-x64-setup.exe?raw=1) · [Windows x64 便携版](windows/KaboomArena-0.1.0-windows-x64.zip?raw=1) · [macOS 通用 DMG](macos/KaboomArena-0.1.0-macos-universal.dmg?raw=1) · [macOS 通用 ZIP](macos/KaboomArena-0.1.0-macos-universal.zip?raw=1)

[文件校验值](SHA256SUMS.txt) · [Android TV 验证](docs/releases/0.1.0/android.json) · [Windows 验证](docs/releases/0.1.0/windows.json) · [macOS 验证](docs/releases/0.1.0/macos.json)

## 操作

| 动作 | pureTV 或标准手柄 | 键盘 |
| --- | --- | --- |
| 移动、浏览菜单 | 方向键 | 方向键或小键盘 8 / 2 / 4 / 6 |
| 放炸弹、确认菜单 | A | 小键盘 1 |
| 返回菜单上一级 | B | 小键盘 3 |
| 使用当前能力（启用角色能力时） | X | 小键盘 7 |
| 切换静音 | Y | 小键盘 9 |
| 开始、暂停、继续 | START | P 或小键盘 5 |

选择 **Local · 2–4 players** 进入同机对战。P1 使用 pureTV 手柄或小键盘。另一名玩家可按空格加入，用 WASD 移动、空格放炸弹、E 使用能力。其他 USB 手柄可按面键加入。至少两名玩家就位后，按 START 开始。选中填充电脑对手时，其余空位会加入机器人。[手柄连接指南](../../docs/guide/README.md#安装游戏与连接手柄)

## 运行与验证

在本目录运行 `npm ci`、`npm test`、`npm run build` 和 `npm run build:check`。使用 `python3 -m http.server 8000 --bind 127.0.0.1 --directory dist` 启动离线包，打开 `http://127.0.0.1:8000/tv.html`。游戏素材、字体、Three.js 均随包提供。浏览器可直接试玩，原生客户端还可连接手机或 Wi-Fi 手柄。

安装 Python Playwright 和 Chromium 后，运行 `python3 tests/browser.py` 可重放单人、双人、暂停和手柄重连测试。游戏状态和实玩截图保存在 [浏览器测试记录](docs/browser/) 中。原版核心逻辑与资源的来源、版本及散列在 [upstream.json](upstream.json) 中，许可证见 [NOTICE.md](NOTICE.md)。

# 12 款电脑游戏的输入验收

2026 年 11 月 20 日，12 个签名 APK 在 Linux x86_64 的 Chromium 156 中通过电脑播放器实测。每款先从键盘开局，再刷新回菜单，用仓库的 Wi-Fi 手柄 TCP SDK 连接、发送 START 并再次开局。测试读取游戏公开的状态，确认方向键按下、松开，以及客户端断开。支持两人的 9 款还同时接入两个独立 SDK 客户端，确认 2P 按右时 1P 保持静止。记录包含每款初始状态与两次开局达到的阶段。[逐款结果与 SHA-256](resource-inputs-2026-11-20.json)

本次使用 Python 3.12.14、Linux 的本地浏览器与软件 SDK 客户端。7 款经典游戏以及《霓虹飞车》《叠塔》在禁用浏览器 GPU 的情况下完成。Coast Kart、《极品二手车》和《孤胆枪手》使用 ANGLE 的 GL/EGL 路径。结果同时保留桌面发行 ZIP 和签名 APK 的 SHA-256。逐个比较两种容器中所有 `assets/` 文件的路径和内容，12 款共计 585 个文件全部相同。

## 复验

从仓库根目录运行下列命令。把同一轮签名 APK 放到一个目录，文件名使用 `游戏ID.apk`，或者在 `游戏ID/` 子目录下保留原 APK 文件名。也可使用 `游戏ID.zip` 格式的电脑发行包。同一个游戏在测试目录里只放一份。

```sh
python -m pip install -r tools/pc-games/requirements.txt playwright
python -m playwright install chromium
python tools/pc-games/verify_resource_inputs.py /path/to/packages
```

命令会逐款输出实际包 SHA-256、游戏阶段、无线席位和释放结果。任一游戏失败时进程返回非零。可在目录后追加游戏 ID 缩小范围。通过 `--browser /path/to/chrome` 选用已安装的浏览器。Linux 复验软件渲染配置可使用下列两组参数。[验收脚本](../verify_resource_inputs.py)

```sh
python tools/pc-games/verify_resource_inputs.py /path/to/packages \
  adventure-island bomb-jack jackal jewel neon-rush super-mario tank tetris tower-overlap \
  --browser-arg=--disable-gpu --browser-arg=--disable-software-rasterizer \
  --browser-arg=--disable-background-timer-throttling --browser-arg=--disable-renderer-backgrounding

python tools/pc-games/verify_resource_inputs.py /path/to/packages \
  alien-shooter coast-kart used-car-racing \
  --browser-arg=--use-gl=angle --browser-arg=--use-angle=gl-egl \
  --browser-arg=--ignore-gpu-blocklist --browser-arg=--enable-unsafe-swiftshader \
  --browser-arg=--disable-background-timer-throttling --browser-arg=--disable-renderer-backgrounding \
  --browser-arg=--disable-backgrounding-occluded-windows
```

## macOS 便携播放器

macOS 15.8.2 的 Apple Silicon runner 使用 Google Chrome 158.0.8127.37 复验了《俄罗斯方块》0.5.5 和 Coast Kart 0.5.5。两款均从解包后的便携启动器打开，分别用键盘和 TCP 手柄进入游戏，两个无线席位独立响应，松开和断开都能被游戏识别。《俄罗斯方块》还核对了落块坐标。键盘在第一局让落块左移，刷新后用 TCP 手柄在新一局让落块右移。[逐项结果](macos-portable-2026-11-20.json) · [macOS 通过记录](https://github.com/ecojust/pureTV/actions/runs/44762238258)

这次运行从指定的签名构建取得两个 APK，将测试目录内的两条下载地址指向对应原件，再通过便携启动器的正常下载、缓存和 SHA-256 检查启动。记录包含启动器、主机和输入桥的文件哈希。最初两轮定位到 macOS 在启动前等待本机 DNS 查询，修复后直接使用已经绑定的回环地址和系统网卡提供的局域网地址。[签名构建](https://github.com/ecojust/pureTV/actions/runs/44756990162) · [故障调用栈](https://github.com/ecojust/pureTV/actions/runs/44761752766) · [复验脚本](https://github.com/ecojust/pureTV/blob/38519fadf3140b482084d559f4b3b8f3dfb3422e/tools/pc-games/qa/macos_portable_probe.py)

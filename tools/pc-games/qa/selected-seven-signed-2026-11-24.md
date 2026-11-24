# 七款签名 APK 的电脑播放器实测

本轮直接将仓库内的七个 `0.1.0.apk` 交给电脑播放器的 `host.py`，由它读取 APK 中的页面和素材、启动本地 HTTP 服务并注入 `pc-bridge.js`。Chromium 打开宿主给出的地址，官方 Python `JoystickClient` 连接宿主实际监听的 TCP 端口。按键通过 TCP 发送，浏览器只读取游戏公开的状态。每个 APK 的字节数及 SHA-256 均与播放器目录相符，Android SDK `apksigner verify --print-certs` 也核对了各 APK 的发布证书。

| 游戏 | 在签名 APK 中操作并检查的原作行为 |
| --- | --- |
| Bloom Hop | 开局、跳上下一片荷叶、撤销 |
| Mechapede | 开局、横移切割器、发射切割脉冲 |
| Kaboom Arena | 与三个电脑对手入场、离开出生角、放置炸弹 |
| Nerd of Duty | 进入第一波、横移、转向、射击 |
| Gogh Strike | 进入十二位画家的对局、前进、转向、发射颜料、换装 |
| Martı | 开始飞行、横向转弯、俯冲 |
| Dolmuş | 开始第一班车、加速、转动前轮、鸣笛 |

七款共完成 39 个原作计划步骤，另外逐款执行了断线和重连检查。逐款收据保留包哈希、按键、动作前后的游戏状态，以及宿主、输入桥和 SDK 的源码哈希；其中也记录了发起外部资源请求和页面错误的数量。[完整收据](selected-seven-signed-2026-11-24.json)

每款游戏均通过 START 主动暂停与继续，然后按住方向键，在没有发送松开消息的情况下关闭 SDK 的 TCP 套接字，确认游戏再次暂停且方向键已清空。客户端使用原身份重连后须获得新会话，所有按钮回到松开状态，游戏中由计划指定的时钟、位置或其他字段保持静止，再按 START 才能继续。此次运行环境为 Linux、Chromium 156.0.8078.79 和 SwiftShader 软件图形渲染。无线输入协议由官方 SDK 在本机回环地址执行。Windows 安装包、Android TV 和实体手柄使用各自的验证记录。

七个 APK 的字节与签名包入库提交一致，宿主、输入桥与 SDK 的字节与 46 款游戏的播放器版本一致。[APK 入库记录](https://github.com/ecojust/pureTV/commit/48e65237) · [46 款游戏的播放器版本](https://github.com/ecojust/pureTV/commit/03b85875)

## 复验

在仓库根目录执行以下命令。将 Android SDK 的 `apksigner` 放在 PATH 中。要使用本机 Chromium，可添加 `--browser /path/to/chromium`。

```sh
python -m pip install -r tools/pc-games/requirements.txt playwright
python -m playwright install chromium
python tools/pc-games/qa/signed_apk_plans.py \
  bloom-hop mechapede kaboom-arena nerd-of-duty gogh-strike marti dolmus \
  --apksigner apksigner --output selected-seven-signed.json
```

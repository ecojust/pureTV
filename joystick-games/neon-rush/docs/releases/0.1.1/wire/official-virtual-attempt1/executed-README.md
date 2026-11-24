# pureTV 手柄接入与测试

开发支持 pureTV Wi-Fi 手柄的游戏时，按本目录的协议实现游戏端，并用虚拟手柄验证九键输入。工具使用 Python 3.8+ 标准库。

## 用虚拟手柄测试游戏

在电视或开发机启动游戏的 TCP 输入服务。在电脑进入本目录，把下例地址换成游戏主机的实际 IP，然后启动桥接程序。

```sh
python3 bridge.py 192.168.1.100 --port 8765
```

打开 [虚拟手柄](http://127.0.0.1:8767/)，点「连接游戏」。可使用鼠标、触控或键盘方向键、Enter 和 A/B/X/Y。按住约 500 ms 触发长按。虚拟手柄使用指定地址直连，用于验证游戏的 TCP 输入协议。mDNS 发现可另用实体手柄的 GPIO 23 搜索键验证。

## 用监测页检查手柄输出

也可以用参考服务接收实体或虚拟手柄的输入，观察每只手柄的连接和按键状态。

```sh
python3 server.py --host 0.0.0.0 --port 8765
```

打开 [手柄监测页](http://127.0.0.1:8766/)。实体手柄填写电脑的局域网 IP。虚拟手柄在同一台电脑上测试时使用 `python3 bridge.py 127.0.0.1`。

## 游戏 App 接入 pureTV Wi-Fi 手柄

- 支持手柄自动发现的游戏 App，必须在局域网提供 TCP 手柄输入服务，并通过 mDNS/DNS-SD 发布 `_puretv._tcp`。可由游戏 App 自行实现，也可复用 pureTV 原生宿主统一发布的服务，由宿主将输入转发给当前游戏。
- Android TV 端先启动 TCP 监听，再用 `NsdManager` 注册服务。发布可辨认的实例名及实际监听端口，默认端口为 `8765`，TXT 属性使用 `version=1`。停止服务时撤销注册。
- TCP 服务按换行读取 UTF-8 JSON，使用 `controller_id` 区分手柄，按 `key`、`action`、`pressed` 处理输入，并用相同的 `seq` 回复逐行 JSON ACK。重连时用 `sync` 更新按键状态。
- 验收时让电视与手柄加入同一局域网，确认手柄能发现广播的地址和端口。当前固件只在发现单个服务时自动连接。连接后验证按下、松开和断线重连。

### Android TV 的 NsdServiceInfo 字段

| 字段 | 注册要求 |
| --- | --- |
| `serviceType` | 必须为 `_puretv._tcp`，与手柄搜索的服务类型一致 |
| `serviceName` | 使用可辨认的实例名，例如 `客厅电视` |
| `port` | 必须是 TCP 服务实际监听的端口，默认使用 `8765` |
| TXT `version` | 使用 `setAttribute("version", "1")` 声明协议版本。当前 ESP32 固件尚未按此字段筛选 |

### 按键消息字段

| 实体按键 | 上 | 下 | 左 | 右 | 确认 / START | A | B | X | Y |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `key` | `UP` | `DOWN` | `LEFT` | `RIGHT` | `START` | `A` | `B` | `X` | `Y` |

| 字段 | 类型 | 约定 |
| --- | --- | --- |
| `type` | 字符串 | 按键消息固定为 `button` |
| `seq` | 整数 | 手柄逐条递增的消息序号，重启后重新计数 |
| `controller_id` | 字符串 | 基于 ESP32 出厂 MAC 生成的手柄 ID |
| `key` | 字符串 | 使用上表中的值，区分大小写 |
| `pressed` | 布尔值 | 当前是否按住该键 |
| `action` | 字符串 | `down`、`tap`、`long_press`、`long_release` 或 `sync` |
| `duration_ms` | 整数 | 已按住的毫秒数，`down` 和 `sync` 为 0 |

`down` 和 `long_press` 的 `pressed` 为 `true`。短按松开时发送 `tap`，长按松开时发送 `long_release`，两者的 `pressed` 为 `false`。`sync` 携带各键当前状态。搜索键只触发手柄本机的服务发现。

```json
{"type":"button","seq":12,"controller_id":"esp32-001122334455","key":"A","pressed":true,"action":"down","duration_ms":0}
```


服务端示例见 [server.py](server.py)。建立连接后手柄发送 `hello` 和九条 `sync`，随后约每五秒发送 `ping`。`hello` 和 `ping` 携带 `type`、`seq` 和 `controller_id`。每条消息的 ACK 形如 `{"type":"ack","seq":12}`，以换行结束。游戏端在连接断开时应清除该连接的按键状态，避免按键卡住。

## Python SDK

将 [joystick_sdk.py](joystick_sdk.py) 放到自己的项目中。虚拟手柄网页的 TCP 桥接也使用这个 SDK。

```python
import time
from joystick_sdk import JoystickClient

controller = JoystickClient("192.168.1.100", 8765)
controller.connect()
try:
    controller.button("A", "down")
    time.sleep(0.1)
    controller.button("A", "tap", duration=100)
finally:
    controller.disconnect()
```

每个实例拥有独立手柄 ID。连接后自动发送 `hello` 和九键初始同步。调用方负责将输入映射为 `down`、`tap`、`long_press` 和 `long_release`，并约每五秒调用一次 `ping()`。断线后可再次调用 `connect()`。

## ESP32 固件

[puretv-esp32dev.bin](firmware/puretv-esp32dev.bin) 是经典 ESP32 Dev Module（PlatformIO `esp32dev`）的合并烧录镜像，包含九键输入和 GPIO 23 搜索键。镜像不含本机 Wi-Fi 凭据。

使用 esptool 4.x，将下列串口改成开发板实际串口。

```sh
python3 -m esptool --chip esp32 --port /dev/cu.usbserial-0001 write_flash 0x0 firmware/puretv-esp32dev.bin
```

SHA-256 为 `6f0e3e2d552ae718f749b3f62da877616f4406263c8b8beed17bbe5433dcb277`。

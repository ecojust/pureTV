# 六款游戏从入口到核心动作的验收

每款游戏分别从新会话的正常入口开始，使用扫码手机触屏、电脑数字小键盘或官方 TCP 手柄 SDK 完成下表的动作。JSON 保留实际输入、游戏状态与签名 APK 的 SHA-256。手机报告另附电视显示的扫码菜单、游戏截图及其哈希。六款均使用[下载清单](../downloads.json)中的 APK。

| 游戏 | 实际操作及可观察结果 | 手机触屏 | 电脑键盘 | 电脑手柄 SDK |
| --- | --- | --- | --- | --- |
| Kart Royale | 选车发车，按住油门使速度和位置改变，暂停比赛 | [报告](phone/kart-royale.json) | [报告](keyboard/kart-royale.json) | [报告](sdk/kart-royale.json) |
| Turbo Kart Rally | 选车起跑，油门使车辆加速且赛道进度改变 | [报告](phone/turbo-kart-rally.json) | [报告](keyboard/turbo-kart-rally.json) | [报告](sdk/turbo-kart-rally.json) |
| Clawd Pop 3D | 进入实验室，移动后开炮，射击计数增加 | [报告](phone/clawd-pop.json) | [报告](keyboard/clawd-pop.json) | [报告](sdk/clawd-pop.json) |
| 光刃魔塔 | 进入第一层，走过入口走廊，拔剑击败首个守卫 | [报告](phone/saber-magic-tower.json) | [报告](keyboard/saber-magic-tower.json) | [报告](sdk/saber-magic-tower.json) |
| Operation Ironhold | 在堆场移动、转向、开火并切换武器 | [报告](phone/operation-ironhold.json) | [报告](keyboard/operation-ironhold.json) | [报告](sdk/operation-ironhold.json) |
| Lumenrift | 进入战役，建墙消耗资金，召唤第一波敌人 | [报告](phone/lumenrift.json) | [报告](keyboard/lumenrift.json) | [报告](sdk/lumenrift.json) |

扫码测试在 Linux Chromium 上用 ZXing 读取电视画面中的二维码，由独立的触屏浏览器打开房间，经过原 Java 服务发送输入。完成游戏操作后，关闭手机页面并检查按键释放。电脑测试使用已发布便携包中的宿主，在 Linux Chromium 或 Chrome 上分别用数字小键盘及 SDK 操作。每个 SDK 会话均核对游戏显示的手柄身份及协议确认序号。实体手机、电视和手柄尚未测试。[电视模拟器及双端口报告](../android.md) · [Windows 与 macOS 输入报告](../pc/native/)

## 复跑

从仓库根目录解压 `tools/pc-games/packages/pureTV-Games-portable.zip` 到 `player/`。将所测游戏的签名 APK 按[下载清单](../downloads.json)核对 SHA-256，再复制或链接到 `payloads/<游戏 ID>.zip`。Python、浏览器及 Java 依赖的版本和 JAR 校验值见[控制器验收说明](../../../qa/controller-input/README.md)。

```sh
game=operation-ironhold
qa=joystick-games/qa/controller-input
python "$qa/phone.py" --gameplay --payloads payloads --output results/phone \
  --android-json /path/to/android-json.jar --zxing /path/to/core-3.5.3.jar "$game"
for input in keyboard sdk; do
  python "$qa/pc.py" --gameplay "$input" --host player/host.py \
    --payloads payloads --output "results/$input" --angle swiftshader "$game"
done
```

最初的桌面分片中，一项下载依赖失败，三个分片在玩法检查通过后导出报告失败。这些会话用原签名 APK 单独重跑。[初次运行](https://github.com/ecojust/pureTV/actions/runs/44858590255) · [Clawd 键盘重跑](https://github.com/ecojust/pureTV/actions/runs/44858679534) · [Kart 双输入重跑](https://github.com/ecojust/pureTV/actions/runs/44859149482) · [Clawd SDK 重跑](https://github.com/ecojust/pureTV/actions/runs/44859152253)

Lumenrift 首次本地 SDK 会话在并发软件渲染时达到 50 秒启动时限。复跑使用同一 APK，加上 Chromium 的 `--disable-accelerated-2d-canvas` 并将启动时限设为 180 秒。[首次记录](attempts/lumenrift-sdk-startup.json)

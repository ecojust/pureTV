# 达拉斯飞行模拟 0.1.0 试玩记录

2026 年 11 月 27 日，从本地构建的 APK 加载中文游戏，驾驶波音 737-800 进入达拉斯–沃思堡国际机场 35C 跑道的日间进近。录像记录了第三人称视角下的转弯、改变推力和切换襟翼。离线飞行期间，浏览器记录的站外请求、页面异常、控制台错误和失败的本地响应均为零。[44 秒实玩录像](gameplay.mp4) · [960 × 540 飞行画面](playing-960.png) · [1280 × 720 飞行画面](playing-1280.png)

## 键盘、手柄与暂停

在 Linux Chromium 156.0.8078.79 的软件 WebGL 环境中，Playwright 发送键盘 D 键，飞机向右倾斜 17.30°。随后，软件手柄客户端经本机回环 TCP 发送左转、加推力、调整襟翼与刹车指令。推力从 25.7% 升至 55.7%，襟翼从第 3 挡切至第 4 挡，同时按住 A、B 只切换一次刹车。标准游戏手柄的摇杆由浏览器 Gamepad API 测试夹具模拟。[输入与飞行状态](report.json) · [试玩脚本](../../qa/play.py)

START 暂停后，飞行状态在 400 毫秒观察期内保持稳定。按住右转时断开 TCP 连接，游戏进入暂停并清除右转输入。重连后继续保持暂停，再按 START 才恢复飞行。两个尺寸的菜单也分别检查了开始按钮的位置。[960 × 540 菜单](menu-960.png) · [1280 × 720 菜单](menu-1280.png)

## 手机扫码

另一次验收使用 Game Kit 的 Java 局域网房间服务。电视端由 960 × 540 Chromium 模拟原生桥，ZXing 直接从完整菜单截图读出二维码。第二个启用触屏模拟的 Chromium 打开该地址，通过手机手柄页面发送 START、X 与方向输入。游戏开始、襟翼从第 3 挡切至第 4 挡，断线后输入释放。两次测试都在同一台计算机上运行。实体电视、手机和物理手柄的体验尚未实测。[扫码菜单](../phone-controller/menu.png) · [手机端操控后的飞行画面](../phone-controller/playing.png) · [房间验收记录](../phone-controller/report.json)

## 构建与画面来源

冻结提交 `3c86af5f2482a030d92c50ea5f3b164140686c45` 中的 109 个游戏文件与受测未签名 APK 中的对应文件逐字节相同。APK 另含 Game Kit 的 5 个控制器和配置文件。原始浏览器报告的 `assetTreeSha256` 覆盖全部 114 个文件。清单分别记录两棵资源树、APK、本次录像和各张截图的 SHA-256。签名与 Android TV 模拟器验收由关联的 CI 流程记录。[校验清单](../source-check.json) · [冻结提交](https://github.com/ecojust/pureTV/commit/3c86af5f2482a030d92c50ea5f3b164140686c45) · [CI 流程](https://github.com/ecojust/pureTV/actions/runs/46009385440)

游戏卡片封面取自较早一次中文候选版的白天进近飞行。将 1280 × 720 原图按 Lanczos 缩放到 640 × 360，可以逐像素还原仓库中的封面。首次任务页和飞行录像采用上方冻结版的独立采集。[封面原图](cover-source-1280.png) · [游戏封面](../../thumb.png)

安装 Chromium、FFmpeg、Python Playwright 及测试脚本所需的 SDK 后，在游戏目录运行以下命令可重新生成浏览器报告、截图和录像。

```sh
python qa/play.py /tmp/flight-qa --apk /path/to/openaero-dfw.apk
```

# Backroad Rally 0.1.1 的 RGBA8 赛道画面

在 Linux x86_64 的 Chromium 156.0.8078.79 中，以 ANGLE SwiftShader 运行 0.1.1 构建的芬兰赛道。测试通过浏览器初始化脚本屏蔽 `EXT_color_buffer_float` 和 `EXT_color_buffer_half_float`，保留实际 WebGL2 绘制。游戏从网址进入芬兰快速赛段，未传入 `post=0`。原作 HUD 自行显示 `post off · quality low 50%`，统计 5,430 个可见实例。[原始日志](chromium.log) · [冻结构建源](https://github.com/ecojust/pureTV/tree/65a782561c91b45beae64d9b1a7874a27adf2830/joystick-games/backroad-rally)

第 219 帧采样显示赛段已就绪，比赛阶段仍为 `intro`，计时为零。原始 480 × 270 截图可见 Swift Mk1、起跑拱门、道路和路旁植被。与 Android 画面检查相同的两个赛道采样区共有 1,568 种颜色。本次浏览器观察不覆盖 Android 安装包、手柄输入或帧率表现。[截图](finland.png) · [结果与截图 SHA-256](result.json)

单独对实际 WebGL2 帧缓冲区进行 1 × 1 纹理测试。在扩展未启用的上下文中，RGBA8 通过完整性检查，RGBA16F 未通过。在启用浮点颜色缓冲区扩展的另一个上下文中，两种格式均通过。[测试程序](framebuffers.cjs) · [输出](framebuffers.json)

## 复现

在游戏目录完成 `npm ci` 并运行 `npm run build:check`，用任意静态服务器提供 `dist/`。以下命令默认使用系统 Chromium 和端口 17427。可通过 `CHROMIUM_BIN` 和 `BACKROAD_ORIGIN` 指定其他路径或地址。

```sh
python3 -m http.server 17427 --directory dist
```

在同一目录的另一个终端执行。屏幕截图写入当前目录或 `BACKROAD_SCREENSHOT` 指定的位置。

```sh
node docs/browser-rgba8-0.1.1/framebuffers.cjs
node docs/browser-rgba8-0.1.1/capture.cjs
```

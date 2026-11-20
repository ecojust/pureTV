# Backroad Rally 0.1.5 的芬兰碎石路对照

0.1.5 只在旧 Android GLES 软件翻译器的芬兰赛段，改变原 Gravel 材质应用 sRGB 解码的时机。顶点颜色先插值，再由片元着色器执行原公式。草地、赛车、灯光和其他赛段继续用原路径。原签名 APK 版本号 6，105,024,551 字节，SHA-256 为 `daa293331ed6d545e0ec458874678210f9cb3dd9ab60b6d496c7d43851ed9152`。[源码对照](https://github.com/ecojust/pureTV/commit/b9009bd) · [原包签名复核](https://github.com/ecojust/pureTV/actions/runs/44696704977)

Android TV API 36 上的 `Android Emulator OpenGL ES Translator (Google SwiftShader)` 用原手柄驾驶，112 条输入都获得确认。游戏速度升到 13.05 km/h，车从 54.00 米移到 55.40 米，稍后的系统截图显示 17 km/h。画面仍可见蓝色地面和黑色车身。两版本发车原图中正前方一块 115 × 87 像素的道路，全部 10,005 个 RGB 三元组逐像素完全相同。[0.1.4 发车原图](https://github.com/ecojust/pureTV/blob/6f376f3c591919727625fdd1e57a2711e86ed86e/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/original-stage-running.png) · [0.1.5 发车原图](https://github.com/ecojust/pureTV/blob/f5e5494ccafe56df5c94b20afde63ebece2036dc/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/original-stage-running.png) · [0.1.5 加速原图](https://github.com/ecojust/pureTV/blob/f5e5494ccafe56df5c94b20afde63ebece2036dc/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/original-stage-accelerated.png)

在第 314 至 315 帧之间，原 WebGL 默认帧缓冲中央九个点中八点读取 RGBA(0,0,255,255)，另一个点是 RGBA(1,0,255,255)。同帧读取的清屏颜色为 (1.25, 0.85, 0.66, 1)，与该赛段日落条件相符。5,184 个样本的 alpha 均不透明。调整解码位置未能恢复这条路面的配色。[原运行状态、GL 读数及输入回执](https://github.com/ecojust/pureTV/blob/f5e5494ccafe56df5c94b20afde63ebece2036dc/evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/report.json)

独立的桌面 Chromium 编译对照用两版本的真实 dist 加载同一芬兰赛段，仅模拟旧设备名称以进入目标分支。0.1.4 没有片元程序包含该 sRGB 解码，0.1.5 观察到两个实际链接的片元程序使用原公式。目标绘制在桌面上绑定浮点 RGB 属性，材质颜色参数与原日落的 Gravel 色调 (1.06, 0.84, 0.66, 1.15) 一致。Android 设备的默认帧缓冲读数与这组桌面着色器检查分别记录。[取样坐标、颜色统计、着色器指纹与桌面绑定](sample-and-shader.json)

原芬兰 GLB 中，Gravel 对应 18 个颜色 accessor，解码后有 17,822 个顶点、100 种 RGB。三个通道的范围依次为 78–184、45–163、22–138。没有顶点的蓝色通道同时超过红色与绿色。桌面对照中第一份匹配绘制的属性开头是 (78,45,22)/255。[模型原数据和 GPU 输入对照](sample-and-shader.json)

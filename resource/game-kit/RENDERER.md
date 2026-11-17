# 每款游戏的烘焙图集

`PureRenderer` 保持一张 1024 × 1024 RGBA 图集，逻辑画面为 960 × 540。游戏可以在自己的 `game.js` 中提供 `GameDef.atlas`；公共 `runtime.js` 自动将它传给 `new PureRenderer(canvas, { atlas: GameDef.atlas })`。

不提供 `atlas`，或设为 `null`，继续绘制原有全部 14 个素材，保留原 UV、字符布局和未找到素材时的 `orb` 回退。已有游戏无需修改。提供配置后，只绘制所选内置素材、自定义素材以及必需的 `white`、`disc` 和 ASCII 字符；缺少的素材名会明确报错，避免把错误静默画成其他物体。

```js
GameDef.atlas = {
  builtins: ['glow', 'shadow', 'ring'],
  tiles: [{
    name: 'boat', x: 0, y: 0, w: 256, h: 160,
    paint(c, w, h, art) {
      art.path(c, [[16, 90], [240, 90], [210, 134], [44, 134]],
        art.linear(c, 0, 90, 0, 134, [[0, '#58b7ca'], [1, '#244c68']]),
        '#d4f3f6', 2);
    }
  }]
};

// 在 GameDef.render 内使用：
renderer.sprite('boat', 480, 270, 256, 160, 0, '#fff');
```

`builtins` 和 `tiles` 可省略，省略时均为空数组。`{}` 因而只包含基本图形与文字。每个 renderer 拥有独立画布和布局；配置只在构造时读取，之后修改配置不会重烘焙。

## 绘制约定

`paint(context, width, height, art)` 在初始化时同步调用一次。传入的 Canvas 2D 上下文已平移到素材左上角并裁剪到该素材区域，绘制坐标从 `(0, 0)` 开始。请平衡自己的 `save()`/`restore()`，不修改画布尺寸，不在回调结束后继续绘制，不加载异步图片或字体。

第四个参数提供以下帮助函数；它们与旧内置素材使用的是同一实现：

- `art.ellipse(c, x, y, radiusX, radiusY, color)`：填充椭圆。
- `art.path(c, points, fill, stroke, lineWidth)`：闭合多边形；`fill`、`stroke` 可省略。
- `art.linear(c, x1, y1, x2, y2, stops)`：线性渐变。
- `art.radial(c, x, y, radius, stops, innerX, innerY)`：径向渐变；内圆位置默认与外圆相同。

渐变的 `stops` 是 `[[位置, CSS颜色], ...]`。颜色、光影、材质尽量在这里烘焙；运行时仅用 sprite 的位置、尺寸、旋转和 tint 调整。每款新游戏的绘制函数放在自身 `game.js`，无需不断向公共图集加入素材。

## 布局与校验

所有矩形先统一校验，再运行任何绘制回调。坐标与尺寸必须是有限整数；宽高大于零，矩形完全位于 1024 × 1024 内。所选素材、自定义素材、两个基本素材和字符单元不能重叠，边缘相接可以。最多允许 128 个素材（包括 `white` 和 `disc`）。素材名必须匹配 `[A-Za-z][A-Za-z0-9_-]{0,63}`，不能重复，也不能使用 `constructor` 或 `prototype`。

以下是内置素材的固定位置。`white` 和 `disc` 自动加入，不应重复列入 `builtins`。未选择的内置素材区域可被自定义素材使用。

| 名称 | x | y | 宽 | 高 |
| --- | ---: | ---: | ---: | ---: |
| orb | 0 | 0 | 224 | 224 |
| ship | 224 | 0 | 224 | 224 |
| crate | 448 | 0 | 192 | 192 |
| station | 640 | 0 | 256 | 256 |
| glow | 0 | 256 | 192 | 192 |
| ring | 192 | 256 | 192 | 192 |
| shadow | 384 | 256 | 192 | 128 |
| spark | 576 | 256 | 128 | 128 |
| disc（必需） | 704 | 256 | 128 | 128 |
| white（必需） | 848 | 272 | 16 | 16 |
| mirror | 0 | 800 | 192 | 192 |
| prism | 192 | 800 | 192 | 192 |
| locomotive | 384 | 800 | 224 | 128 |
| freight | 608 | 800 | 192 | 128 |

ASCII 32–126 共 95 个字符一直保留。字符序号 `i = code - 32` 的单元为 `x = (i % 20) * 48`、`y = 448 + floor(i / 20) * 64`、宽 48、高 64。前四行占据 `x=0..960, y=448..704`，第五行占据 `x=0..720, y=704..768`。配置模式将文字墨迹裁剪到各自单元，剩余区域可以安全复用；中文字仍由 DOM 界面显示。

## 性能与恢复

选择较少素材减少初始化绘制，不改变图集尺寸；像素数据仍为 4 MiB，GPU 与用于恢复的 Canvas 各有自己的存储。像素比例仍限制在 1–1.5。一个 WebGL 帧不超过 8192 个实际提交的 quad 时仍为一次 `drawElements`，超过后分批；文字每个可见字符也占一个 quad。

WebGL context 恢复会重新上传该 renderer 已烘焙的同一图集，不重新运行素材函数。无 WebGL 时 Canvas 2D 使用相同布局与图像；其性能与绘制指标应按 Canvas 降级单独报告，不能记为一次 GPU 提交。

便携浏览器回归脚本为 `renderer-atlas-test.mjs`，使用本机 Chromium 与 `desktop` 的 Playwright 依赖。它验证布局、配置隔离、错误输入、Canvas 降级、实际 WebGL 提交及 context 恢复，并绘制旧三款游戏各三个关卡。默认输出位于系统临时目录的 `puretv-atlas-regression/`。

```bash
node resource/game-kit/renderer-atlas-test.mjs --output /tmp/atlas-check
# 可选：与变更前 renderer 逐像素核对图集和旧游戏画面
node resource/game-kit/renderer-atlas-test.mjs \
  --baseline /path/to/previous-renderer.js --output /tmp/atlas-compare
```

Chromium 默认路径为 `/usr/bin/chromium`，可用 `--chromium` 或 `CHROMIUM_PATH` 指定。浏览器软件渲染不代替实体电视性能验证。

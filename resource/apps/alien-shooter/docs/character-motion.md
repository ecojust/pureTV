# 孤胆枪手 0.1.2 角色与移动动作

0.1.2 参考原版官方公开画面，重新制作人物和五类异形的低模轮廓与关节动画。人物从原来的装甲圆头形象改为短发、深色短袖、蓝灰长裤和双手持枪；怪物按自己的战斗类型区分体态，强化头、爪、后腿和尾部。模型和动画均为本项目独立制作，参考范围见 [reference.md](reference.md)。

## 新旧动作对照

[观看 0.1.1 与 0.1.2 的并排对照视频](character-motion-0.1.2.mp4) · 24.4 秒 · 1280 × 720 · 2.06 MiB

左侧为 0.1.1，右侧为 0.1.2。视频依次展示待机、前进、倒退、侧移、停步、顶墙、转向、斜向移动、五类怪物追踪与尸体。两侧使用相同输入和相同的逐帧模拟状态，实际游戏逻辑以 60 Hz 推进，视频以 20 fps 编码。镜头为动作检查专用近景，场景隔离了其他战斗干扰，不是电视实拍或完整人工通关录像。

资源 SHA256、逐帧状态校验、视频规格和测试结果见 [character-motion-0.1.2.json](character-motion-0.1.2.json)。官方参考截图与视频没有复制到本仓库或 APK。

## 模型与步态

| 角色 | 轮廓 | 动作处理 |
| --- | --- | --- |
| 人物 | 约七头身、收腰躯干、圆楔形靴头、双手持枪 | 上身保持瞄准，下肢跟随移动方向；支持前跑、倒退与侧移 |
| 爬行异形 | 低伏四足、楔形头背、尾部 | 交替支撑和抬脚，屈伸爪腿 |
| 疾行异形 | 较细长的躯干、长后腿、小前爪 | 后腿承重，快速交替迈步 |
| 喷吐异形 | 较宽的后躯、四肢支撑 | 较低的重心与独立的步幅、抬脚高度 |
| 重型异形 | 宽厚上身、粗后腿、前爪和脊尾 | 后腿屈伸承重，前爪随躯干摆动 |
| 母巢守卫 | 更大的角、背脊和身体比例 | 保留重型步态，并使用独立的关节尺寸 |

五类怪物继续对应本作原有的战斗规则，不宣称与原版敌种一一对应。

脚步由实际位移驱动，速度变化会改变步频和步幅。持续推向墙壁而没有位移时，不会原地跑步；松开方向后动作逐渐收住。膝、踝和髋的连接使用同一套 GPU 关节变换，支撑脚与摆动脚分开处理。瞄准、转向、暂停、实体重用和切换地图都有独立的状态处理，尸体保持静止。

## 性能与验证

保留 0.1.1 的烘焙场景、静态合批、视野裁剪和动态缓冲局部上传。每类异形及其尸体共用一个实例化网格，关节动画在同一批绘制中完成；五种武器只绘制当前使用的一种。实际编译的着色器最多使用 9 个顶点属性槽。

12 个性能场景全部通过原有预算：三关 × 密集/全地图分布 × 48/96 敌人。48 是游戏中的敌人上限，96 是额外压力测试；每场另含 10 具尸体及补给、弹道和特效。分辨率为 1280 × 720，预热 2 帧、采样 8 帧，前后场景状态哈希一致。下表取全部敌人与尸体可见的密集场景：

| 地图 | 敌人数 | Draw call / 帧，0.1.1 → 0.1.2 | 三角形 / 帧，0.1.1 → 0.1.2 |
| --- | ---: | ---: | ---: |
| 货运站 | 48 | 27 → 25 | 48,138 → 54,250 |
| 货运站 | 96 | 27 → 25 | 83,082 → 93,994 |
| 实验室 | 48 | 27 → 25 | 48,886 → 54,998 |
| 实验室 | 96 | 27 → 25 | 83,830 → 94,742 |
| 反应堆 | 48 | 28 → 26 | 49,812 → 55,924 |
| 反应堆 | 96 | 28 → 26 | 84,756 → 95,668 |

关节、人物和怪物轮廓的细节增加了三角形数量，仍低于 48 敌人 60,000、96 敌人 100,000 的预算。绘制批次低于 32 次预算；实测每帧动态缓冲上传最高 55,036 字节，低于 64 KiB 预算。更详细的关节也带来额外的着色器计算成本，电视上的整体性能仍需实机测量。

45 项动作与渲染检查通过，其中关节检查直接调用游戏使用的 GPU 函数，读取变换后的髋、膝、踝、手和握把位置；不使用另一套近似算法代替实际着色器。覆盖方向与步频、停步、碰墙、暂停、屏外状态、实体重用、切图、五种武器握持和尸体，并扫描六类角色共 1,152 组姿态。关节连接检查不等同于证明整个网格在所有姿态下都不与地面相交。

图形恢复测试还覆盖丢失上下文、恢复、换图和首次切换武器，修复了旧 GPU 缓冲监听器在恢复后换图时引发的错误。另有 5 项运行时场景、29 项 Android 原生测试，以及 APK 的 22 个资源逐字节校验通过。

测试使用 Chromium / ANGLE SwiftShader 软件渲染；这些结果不能用于承诺电视实机帧率。原有环境优化的历史对照见 [0.1.1 性能报告](performance.md)，不应把其中旧角色的三角形数量当作本版本数据。

## 复测

在仓库根目录执行，需要 `desktop` 的 Playwright 依赖及 Chromium：

```sh
CHROMIUM_PATH=/usr/bin/chromium node resource/apps/alien-shooter/tests/animation.mjs
CHROMIUM_PATH=/usr/bin/chromium node resource/apps/alien-shooter/tests/performance.mjs \
  --samples 8 --warmup 2 --regressions --output /tmp/alien-shooter-performance
CHROMIUM_PATH=/usr/bin/chromium node resource/apps/alien-shooter/tests/runtime-performance.mjs
node resource/apps/alien-shooter/tools/bake-materials.mjs --verify
```

动作脚本加 `--record` 可生成当前资源的检查视频，需要安装 FFmpeg。`--assets` 指向指定版本的资源快照；`--compare-trace` 可传入另一侧的 `motion-trace.json`，要求每一帧的输入与模拟状态相同。CI 默认执行动作断言并保存检查 JSON，不录制视频。

The side-by-side clip compares the actual 0.1.1 and 0.1.2 WebGL renderers under identical fixed inputs and simulation states. It uses an inspection camera, not physical-TV footage or a full human playthrough. Models and animation are newly authored; original-game references are linked, not bundled. Software rendering checks do not establish television FPS.

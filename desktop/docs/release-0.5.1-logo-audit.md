# 0.5.1 外部应用图标兼容性审计

2026-11-05：修复 74 个应用目录的外部 `logo.svg`，保留现有严格 SVG 测试及 layout.json v5 协议。全部 115 个应用图标现在满足 64×64、`viewBox="0 0 64 64"`、不超过 8192 字节及静态 SVG 子集要求，最大文件为 7766 字节。

## 原始失败与范围

[Desktop build #42028553723](https://github.com/ecojust/pureTV/actions/runs/42028553723) 的 Windows x64、macOS ARM64、macOS x64、Linux x64 均在原生测试 `app_logos::tests::shipped_apks_bind_persisted_logos_to_real_package_names` 失败，原因是外部图标不符合现有协议。步骤名称 `Test Platform Tools installer` 实际运行整个原生测试套件；本次失败不是 Platform Tools 下载问题。全日志未发现网络偶发错误，后续联网检查与打包尚未执行，不能把这次失败运行当成联网验证通过。

修复前的基线为 [`d14ce12c90754229e1b7b032e62ea6ddc22440e3`](https://github.com/ecojust/pureTV/tree/d14ce12c90754229e1b7b032e62ea6ddc22440e3)。115 个图标中，67 个尺寸或 viewBox 不符，43 个含不支持的元素、属性或超限内容；两类合计涉及 74 个图标。22 个使用渐变，另一个复杂图标 `dots-boxes` 使用虚线。

只改动这 74 个目录的根 `logo.svg` 和各自 `SHA256SUMS.txt` 中的图标行，共 148 个资源路径。APK、`resource.json`、`icon.xml`、`src/main/assets`、游戏规则、历史 QA、录像、签名收据及冻结记录均未改变。所有 115 个 APK 的当前大小和 SHA256 仍与原有 `resource.json` 一致，所有校验清单的非图标条目逐行保持原样。

根目录图标是供市场下载与管理器布局缓存使用的外部文件。Game Kit 构建器读取 `src/main/assets` 和 `icon.xml`，不将根 `logo.svg` 自动打包；本次检查也未在 115 个 APK 或源资产 SVG 中发现与修改前根图标相同的文件内容。游戏内画面、已签名 APK 及旧游玩证据仍属于原版本，本次未重新打包或重新录制游戏。

## 转换方法

- **51 个图标保留原几何和颜色。** 统一声明 64px 尺寸，必要时以外层 `g` 等比缩放原坐标到 64px viewBox；移除非绘制的说明属性。`clockwork-align` 的 18 个精确双半圆弧改为等价 `circle`，压缩路径命令间空白，文件从 9019 降至 7766 字节，未删除齿轮细节。
- **22 个渐变图标作明确的视觉简化。** 保留原轮廓、层次、描边和已有高光，渐变改用原色板的中间色；镜片保留采样透明度，`triangle-pegs` 用原渐变色的嵌套圆保留珠面高光。此步骤会改变明暗效果，不能称为无损转换。
- **引用和虚线展开为真实几何。** `kaleido-keys` 的 12 个 `use` 展开为原路径；`dots-boxes`、`glass-fold`、`lens-distance`、`measure-pour`、`tower-overlap` 的虚线展开成对应的绘制线段，保留短尾段及间隔。

安全的几何整理工具为 [`tools/normalize-app-logos.py`](../../tools/normalize-app-logos.py)。默认仅报告，`--write` 才修改图标及其已有校验条目；复杂绘图会明确列入人工检查，工具不会静默删除绘图元素或替换颜色。转换完成后再次运行，结果为 `normalized: 0`、`manualReview: []`。

## 验证与证据

- 现有 `CHROMIUM_PATH=/usr/bin/chromium npm run test:svg` **7/7 通过**，包括遍历全部 115 个目录、严格协议、固定尺寸及 `prepareSvg` 返回内容逐字节不变的原断言。测试范围、断言和运行时验证器均未修改。
- 115 个图标的独立静态检查、尺寸、字节上限和 SHA256 检查全部通过；115 个 APK 的原有哈希与大小全部通过。`git diff --check` 通过。
- 全部 74 对图标使用 Chromium 在 64px 与 256px 下绘制，并生成下方前后对照。资源与发布协调者均实际查看全部四张拼图，未发现裁切、错位或辨识图形丢失。
- 51 个几何等价转换的最大平均 RGBA 通道差为 **0.053223 / 255**。外层缩放和等价圆形表示会产生少量边缘抗锯齿差异，不能声称渲染像素完全相同。复杂渐变图标的明暗变化已在前后对照及逐项方法中保留。

[逐项机器可读审计](release-0.5.1-logo-audit/audit.json) 保存全部 115 个图标的前后 SHA256、大小、尺寸、是否变化、转换方法、色板和浏览器比较指标，也列出全部 148 个资源变更路径。未修改的 41 个图标同样列入审计。

前后拼图均为左侧原图、右侧转换后图标：

- [第 1 张：beat-braid 至 lane-bowling](release-0.5.1-logo-audit/contact-1.png)
- [第 2 张：lantern-rhythm 至 pocket-solitaire](release-0.5.1-logo-audit/contact-2.png)
- [第 3 张：pollinator-contract 至 sorting-wires](release-0.5.1-logo-audit/contact-3.png)
- [第 4 张：stack-dispatch 至 word-ladder](release-0.5.1-logo-audit/contact-4.png)

本报告只证明外部图标修复与相关验证；桌面端跨平台安装包发布、真实联网检查和安装更新验证以 0.5.1 正式发布工作流为准。

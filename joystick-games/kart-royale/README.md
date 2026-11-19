# Kart Royale · 海湾卡丁车

基于 [ryancampbell/kart-royale](https://github.com/ryancampbell/kart-royale/tree/036c0efb025f5ecf8fc31c405e9d818c61e03e21) 的 pureTV 手柄版。固定原源为 `036c0efb025f5ecf8fc31c405e9d818c61e03e21`，保留 Sunset Bay Circuit、八辆卡丁车、AI 对手、道具、原轮胎/悬架物理和漂移奖励规则。网上后来替换的 homie 多人版本不属于本次移植。

| 按键 | 比赛 | 菜单 |
| --- | --- | --- |
| ↑ / A | 油门 | 方向选择，A 确认 |
| ↓ | 制动 | 下一个控件 |
| ← / → | 转向 | 上一个 / 下一个控件 |
| B | 漂移 | 返回 |
| X | 使用道具 | 上一个控件 |
| Y | 向后看 | 下一个控件 |
| START | 暂停 / 明确恢复 | 开始或返回 |

原键盘、标准手柄、触控仍保留。九个 pureTV 键独立输入，可同时转向、油门和漂移。连接卡展示实际客户端 ID，未提供信号数据时不编造 RSSI。默认 TCP 63485，服务发现和端口冲突由共享宿主处理。

断线、失焦与后台清空输入，暂停比赛，并走原 `forfeitDrift` 路径放弃未兑现的漂移蓄能，不触发释放加速或道具。重连不自动继续，需要释放旧按键，再按 START 或选择 Resume。原版“松开再踩油门自动恢复”不适用于此手柄版。

原作者在固定 README 中披露多数漂移尝试没有获得加速、收益集中一个弯；这些旧版规则没有被替换或调整成新线上版本。这里只有一条主要赛道，未宣传新增杯赛或联机模式。

```bash
npm ci --ignore-scripts
npm test
npm run build
npm run build:check
python3 -m http.server 8080 --directory dist
# http://127.0.0.1:8080/tv.html
```

`src/` 保留完整 103 个原源文件及其原 package-lock；新增桥接也在该目录维护。根适配包固定原四个运行依赖的精确版本，额外使用 esbuild 0.28.2 生成离线 IIFE/CSS。构建明确从根依赖锁解析，忽略原源目录里可能存在的旧 node_modules；干净 npm ci 与本地缓存安装的资产一致性见 docs/build-reproducibility/。所有网格、纹理、声音由原代码生成，没有运行时 CDN。根 LICENSE 是 MIT（Ryan Campbell），原 package.json 标记 ISC，两者事实均保留；依赖许可随 dist/THIRD-PARTY-NOTICES.txt 打包。

需要 WebGL2 和现代 WebView。发布默认沿用原设备质量判断；原 `?quality=low` 渲染预设可用于软件 GPU 验证，不改变比赛时钟、物理、赛道或发布默认。Linux SwiftShader 不代表实体电视性能。

当前是源码适配/浏览器验收阶段，尚无本目录的正式 Android、macOS、Windows 安装包或实体电视验收。原 SDK TCP、三平台原生与浏览器模拟桥接结果将分别保存。

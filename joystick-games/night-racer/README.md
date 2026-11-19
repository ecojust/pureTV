# Night Racer · 霓虹街区

来自 [zhuqipaopao-maker/night-racer-public](https://github.com/zhuqipaopao-maker/night-racer-public) 的非官方 pureTV 手柄适配，固定上游 `3a432cd3bf059dbaaa00d700f0f83e0e5313d40b`。保留雨夜街道、山路、海岸、长安等原场景，以及竞速／计时、漂移氮气、车库改装、金币任务和本地幽灵。

**目前为源码适配阶段，尚无完成三平台验收的安装包。** 画面比较与来源见[赛车评审](../../docs/racing-nine/reviews/driving/comparison.json)。

| 手柄按键 | 驾驶 | 菜单 |
| --- | --- | --- |
| ↑／↓ | 油门／刹车 | 选择 |
| ←／→ | 左／右转向 | 选择；调节滑块 |
| A | 漂移 | 确认 |
| B | 氮气 | 返回 |
| X | 原作赛道复位 | 文字键盘完成 |
| Y | 切换原作视角 | 返回 |
| START | 暂停 | 开始／手动继续 |

默认 TCP **63485**，占用时以实际显示端口为准；连接期间保持端口稳定。连接侧卡使用原生快照中的客户端 ID，不生成信号数值。断线、失焦和进入后台取消输入并暂停；重新连接后按 START 继续。取消漂移不会触发松手加速。

安装版采用离线资源，保留原车辆、赛道和程序音乐，不连接原托管房间和全球排行榜。原 Chakra Petch 字体已本地化，中文沿用系统字体回退。车型、赛道和依赖来源及许可见 [NOTICE](NOTICE.md) 和 [上游清单](upstream.json)。

本地进度／设置与各赛道两组幽灵分别持久保存，避免多赛道回放挤入同一个原生存档字段；单段幽灵超过原生 1 MiB 上限时保留上一段并显示提示，成绩与其他进度继续保存。

```sh
npm ci
npm test
npm run build
npm run build:check
```

`dist/` 包含离线页面和原始模型／纹理，测试不会更改游戏时钟或物理规则。Android TV、macOS 两架构和 Windows 的原 SDK、原生图形、存档与安装包验证仍待完成；实体电视和 ESP32 尚未测试。运行要求 WebGL2。

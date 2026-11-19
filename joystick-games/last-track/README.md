# Last Track · 末路战车

基于 [Alexander Uspenskiy / LastTrack](https://github.com/alexander-uspenskiy/LastTrack/tree/7fdf7cfb6affb84748e11980f837255b12130bb7) v0.10.6 的 pureTV 手柄适配。保留原作 PBR 车模、赛道、AI 对手、武器、商店、装甲升级和存档。

| 按键 | 比赛中 | 菜单中 |
| --- | --- | --- |
| 上 / 下 | 油门 / 刹车 | 选择 |
| 左 / 右 | 左转 / 右转 | 选择 / 调整 |
| A | 射击 | 确认 |
| B | 漂移 | 返回 |
| X | 切换武器 | — |
| Y | 氮气 | — |
| START | 暂停 / 继续 | 确认 / 关闭设置 |

pureTV 原生服务默认 TCP **63485**；连接侧栏显示实际手柄 ID。断开、失焦和后台切换清空操作并暂停，重新连接保持暂停。所有诊断读取缓存，不额外消费原生输入或游戏事件。

```sh
npm ci
npm run build
npm run build:check
npm test
```

完整固定源码及原锁保存在 `src/upstream/`。保留上游 vendored Three.js r170 和全部 `assets/`；静态复制构建不升级依赖。安装包不包含原仓库的录制/宣传工具和测试目录，但它们仍保留在源码中。网页统计脚本移除；开始新存档的原生确认框改为可用遥控器/手柄操作的界面确认。

上游项目 MIT，Three.js MIT，许可证随包保留。原版开发调试器的写入/跳关/快进接口不对安装包页面暴露，`JoystickGameQA.snapshot()` 只返回副本。

当前完成源码接入和确定性构建；浏览器、真实 TCP、三平台安装包及实体设备结果分别记录，尚未完成原生交付。

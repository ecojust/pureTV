# Backroad Rally · 乡野拉力

基于 [jason-c-dev/backroad-rally](https://github.com/jason-c-dev/backroad-rally/tree/e5542f96b9a9a2912fdaa160396054e81f022f23) 的 pureTV 手柄适配。保留原作五辆车、六个地区、天气、正反赛段、幽灵车、生涯、存档和 Rapier 物理；不是重新实现或换皮。

| 按键 | 比赛中 | 菜单中 |
| --- | --- | --- |
| 上 / 下 | 油门 / 刹车 | 选择 |
| 左 / 右 | 左转 / 右转 | 调整选项 |
| A | 手刹 | 确认 |
| B | 扶正车辆（原规则罚时） | 返回 |
| X | 切换视角 | 下一首音乐 |
| Y | 牵引力辅助开关 | 上一首音乐 |
| START | 暂停 | 确认；暂停菜单中继续 |

pureTV 原生宿主默认在 TCP **63485** 提供服务。连接后侧栏显示实际手柄 ID；固件未提供信号强度时不虚构数值。断开、失焦、进入后台会清空操作并暂停；重新连接不会自动继续。

```sh
npm ci
npm run build
npm run build:check
```

原作完整固定源码与依赖锁在 `src/upstream/`。安装版使用原作自带的 **WebGL2 后端**，保留相同 TSL 材质、模型与规则；原网站会优先尝试硬件 WebGPU。资源使用本地相对路径，原始 GLB 由安装包无损压缩，避免旧 WKWebView 缺少 `DecompressionStream`。325 份原始 public 资源均保留，不转码或删减音乐、音效和模型。

上游代码声明 MIT；README 说明美术原创，音乐/部分音效由 ElevenLabs 生成，其他音效合成。Three.js 为 MIT、Rapier 为 Apache-2.0、Inter 字体为 OFL-1.1，许可证随包保留。上游音乐仅有 Ogg Opus：不支持此格式的旧 WKWebView 没有背景音乐，音效仍可使用原有 M4A 备选。

源码与资源核验见 `docs/source-changes.json`、`docs/asset-closure.json`。浏览器合成手柄、真实 SDK TCP、安装包和实体设备验证分别记录；当前原生包及实体电视验收尚未完成。

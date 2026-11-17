# Rocket Trail 来源与许可

原游戏：ABA Games / [claude-one-button-game-creation](https://github.com/abagames/claude-one-button-game-creation)，固定提交 `d81f02a0928b35d9c979e9918aa9dc3c2770821b`，源码 `docs/rocket-trail/main.js`。`src/game.js` 是原文件，构建校验其 SHA256；原游戏与仓库内音频按上游 MIT 许可保留，原版权声明见 LICENSE.txt。

pureTV 适配增加中文电视菜单、明确暂停/恢复、Wi-Fi 手柄输入、离线资源和只读 QA；游戏规则、碰撞与画面仍使用原版源码，不是原创纯重写。构建时仅把音频相对地址替换为平铺本地文件。

运行库固定 crisp-game-lib 1.4.0 / sounds-some-sounds 3.1.1；原 shape 主题保留 PixiJS 5.3.0。完整依赖许可随 dist/THIRD-PARTY-NOTICES.txt 分发。CDN、不使用的录像/GIF与非本款滤镜不会加载。共享引擎补丁详见 ../shared/crisp/README.md。

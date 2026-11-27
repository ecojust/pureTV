# 光球挑战 · 制作与授权

原作 ZOF//RANGE 来自 mike007jd 的 ZofDuty 仓库。移植基于提交 `0d165e4e9953eb927c0a3f25d0d46bfc1786d5c1` 的球体小游戏。上游将项目最初创意归功于 @mattshumer_ 的 Gauntlet Loop / Claude of Duty 提示词。原作版权归 mike007jd，使用 MIT 许可证。[固定版本](https://github.com/mike007jd/ZofDuty/tree/0d165e4e9953eb927c0a3f25d0d46bfc1786d5c1) · [许可全文](LICENSE)

本移植保留 `src/portable/game.mjs` 的三维球体判定、积分、连击和评级，以及 `src/range/map.js`、`src/range/targets.js` 的三层场地与彩球模型。移植版使用中文菜单、光标脉冲交互、合成提示音和 pureTV 九键控制。所有场景由本地程序绘制。

Three.js 0.166.1 以 MIT 许可证分发。离线渲染器取自 npm 正式版 `three@0.166.1/build/three.module.min.js`。两份许可证均随网页和电视包分发。[Three.js 许可证](src/vendor/three-LICENSE.txt)

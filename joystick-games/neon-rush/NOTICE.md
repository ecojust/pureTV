# 来源与许可

霓虹飞车 / Neon Rush TV 的本作代码、车型、三条赛道、场景、程序化纹理与音效为独立实现，按本目录 [MIT License](LICENSE) 提供。源资产中的 [LICENSE.txt](src/main/assets/LICENSE.txt) 保留相同许可。

## 玩法参考

用户指定参考为 [riba2534/claude-opus-5-5-demo](https://github.com/riba2534/claude-opus-5-5-demo)，调查固定在提交 [`54adc1fb64155f9dd7c1c90ecae7b8185ac540b8`](https://github.com/riba2534/claude-opus-5-5-demo/tree/54adc1fb64155f9dd7c1c90ecae7b8185ac540b8)。本作借鉴其 `qq-speed` 展示的三维街机竞速、漂移集气及氮气反馈，未复制上游游戏源码、模型或纹理，也未复制腾讯品牌或官方赛道；本作不是腾讯官方产品。

上游 QQ 和鹈鹕项目的 `package.json` / lock 根条目声明 **ISC**，仓库没有单独 LICENSE 文件；运输船项目未发现项目许可声明。此信息描述参考仓库，并不是本作 MIT 许可的替代说明。实际文件、版本差异和调查范围见 [REFERENCE.md](docs/REFERENCE.md)。

## 本作依赖

| 组件 | 用途 | 许可与保留方式 |
| --- | --- | --- |
| Three.js 0.160.1 | 随本地 `game.js` 打包的三维渲染库 | MIT；完整许可随 APK 资产保存在 [THREE-LICENSE.txt](src/main/assets/THREE-LICENSE.txt)，版权归 three.js authors。 |
| esbuild 0.25.12 | 开发时打包 ESM 模块 | MIT；仅构建工具，不作为游戏运行服务。 |
| pureTV Game Kit | 电视宿主、页面、输入生命周期和扫码手机手柄 | 沿用本仓库 MIT 代码及其许可。 |
| ZXing Core 3.5.3 | Game Kit 原生宿主生成二维码 | Apache-2.0；版本、固定哈希与构建流程沿用 [Game Kit](../../game-kit/BUILD.md)，不属于 Three.js 的 MIT 许可。 |

本作依赖的 Three.js 版本是 0.160.1；参考 QQ 项目锁定的是 0.169.0，两者分别记录。参考仓库 README 的 r186 总体徽章不能替代具体项目的依赖记录。

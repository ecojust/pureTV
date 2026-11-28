# 达拉斯飞行模拟（OpenAero DFW）

本移植基于 Mutaaf Aziz 的 OpenAero DFW，固定提交为 `8319ac77b624ddf31d2f345bfeb266a48b61c230`。原作以 MIT 许可证发布。保留原版飞行动力学、三架飞机、达拉斯地区机场与跑道、灯光、座舱、导航图和任务评分。中文界面、手柄适配、本地高程地形与可离线使用的静态目录为本移植的改动。[上游源码](https://github.com/mutaaf/openaero-dfw/tree/8319ac77b624ddf31d2f345bfeb266a48b61c230)

卫星图层按需连接上游使用的 Esri 服务，显示 Esri、Maxar 和 Earthstar Geographics 署名。安装包使用本地地形与情景天气。完整的第三方素材、飞机模型、物理引擎、空域和地形数据说明见 [CREDITS.md](public/CREDITS.md)，许可证随包保存在 [licenses](public/licenses)。Google 实景图层及实时气象服务限原站可用。

JSBSim 由可替换的独立 WebAssembly 文件提供，仅在实验参数 `?fdm=jsbsim` 下加载。接口包版本固定为 `@0x62/jsbsim-wasm@1.2.4-beta.4`。使用方可替换对应的 wasm 模块。飞机参数以文本文件存放，载入 JSBSim 虚拟文件系统时使用原 XML 名称。[JSBSim 源码](https://github.com/JSBSim-Team/jsbsim) · [WASM 构建源码](https://github.com/0x62/jsbsim-wasm)

# 原 SDK 浏览器联调前置验证

20款根README游戏均通过一个实际玩法案例。Tetris另通过完整9组：正常菜单与实际服务端口、原SDK hello与九键sync、START开局、真实方向/动作、暂停冻结/恢复、按住键断线/重连必须新START、九键和长按、双席身份/held-sync安全、全部消息同序号ACK。最终完整Tetris使用4条TCP连接，94条原SDK消息对应94个ACK，无传输错误或页面错误。

这些是桌面Chromium、生产Java接收器及未修改的Python SDK/virtual.html联调，不是Android APK、实体电视或ESP32的实测。浏览器宿主getInfo明确模拟，不声称Android NSD注册或实体发现。最终20个签名APK的完整验收由独立Android TV工作流执行；此目录不替代那一层证据。

实际输入来自虚拟页正常键盘/鼠标，以及调用原SDK的第二手柄适配器。只读PureTVQA观察游戏模型、实际渲染相机和车体；没有写模型、设置关卡种子、改游戏时钟或伪造输入快照。手动暂停与断线后通过对比真实模型证明冻结。双席测试验证席位和同步安全，不声称双人合作通关。

## 已通过的玩法范围

| 游戏 | 实际观察 | 成功报告 |
| --- | --- | --- |
| 霓虹飞车 | 左右实际相机投影、氮气计数 | [报告](smoke-batch-3/neon-rush/report.json) |
| 四则二十四 | 左右选数、A选数、B取消 | [报告](smoke-batch-3/twenty-four/report.json) |
| 夜桥接力 | 左右选人、A选人、B过桥 | [报告](smoke-batch-3/torch-bridge/report.json) |
| 叠塔工匠 | 正常对齐后A落层 | [报告](smoke-batch-2/tower-overlap/report.json) |
| 异形装箱 | 左右选件、A拿取、B旋转 | [报告](smoke-batch-3/packing-sculptor/report.json) |
| 窗口装配 | 左右夹具移动、A抓取回执 | [报告](smoke-batch-3/conveyor-window/report.json) |
| 折光工坊 | 左右选折线、A折叠、B撤销 | [报告](smoke-batch-2/glass-fold/report.json) |
| 拉索桥梁 | 左右选缆、A安装 | [报告](smoke-batch-2/tension-span/report.json) |
| 镜光接力 | A/B镜面顺反旋转 | [报告](smoke-batch-2/prism-relay/report.json) |
| 孤胆枪手 TV | 左右移动、B手雷消耗 | [报告](smoke-batch-3/alien-shooter/report.json) |
| 极品二手车 | 普通油门、左右实际相机投影、B踏板压力 | [报告](smoke-batch-4/used-car-racing/report.json) |
| Cozy Island TV | 左右移动、Y换工具；B操作仅记录 | [报告](smoke-batch-3/cozy-island/report.json) |
| Coast Kart TV | 左右实际车体相机投影、B漂移 | [报告](smoke-batch-3/coast-kart/report.json) |
| Super Mario TV | 左右移动、A跳跃 | [报告](smoke-batch-2/super-mario/report.json) |
| Mighty Bomb Jack TV | 左右移动、A跳跃 | [报告](smoke-batch-2/bomb-jack/report.json) |
| Adventure Island TV | 左右移动、A跳跃 | [报告](smoke-batch-2/adventure-island/report.json) |
| Tetris TV | 左右落块、A旋转；另完整9组 | [报告](tetris/attempt-9/report.json) |
| Magic Jewelry TV | 左右宝石列、A改色序 | [报告](smoke-batch-3/jewel/report.json) |
| Jackal TV | 左右移动、A真实武器 | [报告](smoke-batch-2/jackal/report.json) |
| Tank TV | 自然出生后左右移动、A真实子弹 | [报告](smoke-batch-2/tank/report.json) |

## 执行版本与证据边界

各报告保存实际执行源/资产哈希和executed-*原脚本，运行结束核对未变。这里保留多次开发前置测试的原版本，不能把旧报告冒充最终APK结果。最后Tetris attempt-9执行的run.mjs SHA256为cff2f700d613225d04d4f9a083fd63798e132df05dc35d45dcca9f9707775ec7。随后按主审要求，仅把Android screencap的子进程等待从exit改成close，确保stdout PNG尾部读完；最终工具SHA为c912791ee3543f73298a631015c2c6f2ac225b1cc929ba4bba31bf60ae5b12c4。该Android分支没有在桌面测试中执行，最终APK CI负责验证。

原版virtual.html、bridge.py、joystick_sdk.py，以及当次生产接收器源码均随报告逐次保存。assembled assets不重复复制，报告包含逐文件哈希；JDK/classes、Playwright缓存和可选桌面录像不入本归档。菜单在960×540和1280×720检查；最后版本的桌面玩法用960×540，准确尺寸见每次报告。软件渲染性能不代表电视性能。

## 原始失败与修正

所有失败报告、当次执行脚本、截图和已有标准输出/子进程stderr均原样保留，未以成功结果覆盖。主要前置问题包括缺少Playwright FFmpeg、旧输出资产/固定按键时间漏帧、GameKit开局尚未经过正常neutral帧、Tetris仍是不可旋转的O、正常DAS导致一次持有跨多格，以及赛车在测试中驶出路肩停住后再要求转向。

Tetris attempt-6/7暴露测试过早关连接截断释放键ACK，attempt-8暴露观察代理把transport error行当成消息；原SDK和生产接收器均未为这些问题改写。修正为第二手柄释放等真实ACK，代理正确转发FIN并读取服务器回程，错误单独保存。attempt-9完整通过且独立复核真实状态与五张截图。

smoke-batch-1中的Used Car在批次清理中被中断，无完成报告，不能计作通过。最初少数直接工具调用未单独持久化顶层stdout/stderr；其现有原始report、实际脚本及子进程stderr保留，不伪造重建缺失的流。后续批次有真实重定向run.log，Tetris后期有独立process日志和来源/哈希说明。

[summary.json](summary.json)索引全部尝试与最新成功项，[archive-manifest.json](archive-manifest.json)记录本目录每个证据文件的字节数及SHA256。文件清单不包含自身。

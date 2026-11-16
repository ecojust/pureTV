# 手柄身份显示组件

`PureTVControllerAdapter.renderClients(container, cachedPlayers, {language: 'zh'|'en'})` 只读取已消费的原生输入缓存。连接中的 `transport: 'wifi'` 手柄显示SVG图标、1P/2P、状态和完整`controllerId`；零连接隐藏容器。按钮、会话和取消计数变化不重建同一身份的DOM，也不重复ARIA播报。标识直接使用textContent和安全DOM属性，96字符ID完整换行；未收到RSSI，不显示伪造信号格。

Game Kit web、既有legacy canonical和11游戏中的模块逐字节一致。原`create/read/peek`输入适配器正文与9af9f197完全相同；既有6项输入边界测试通过，sync.py现同时检查Game Kit副本。

`test.mjs`需fresh输出目录，使用`PURETV_PACKAGE`指定有Playwright的package.json，`CHROMIUM_PATH`默认`/usr/bin/chromium`。初版`attempt-1/`运行8组组件检查（包含原6项适配器测试）。最终将flex gap换为等价margin，兼容旧WebView；`attempt-2/`重验7组DOM/副本/原输入正文一致性，复用未变输入的6项旧结果，不重跑输入。最终两张PNG与已目视初版逐字节相同，测量也重新通过。报告、实际脚本、副本哈希、截图及审阅均保留。这些是合成DOM测试，不是Android、真实TCP或实体手柄验收；各游戏的布局及实际SDK输入由独立集成检查负责。

只读协议调查见`protocol-findings.json`，对应上次公开提交9af9f197。固件和SDK当前均不提供RSSI，不能用电视RSSI、心跳间隔或RTT冒充手柄无线信号。

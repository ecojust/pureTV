首份只读审计的失败结果与准确脚本保留为 `independent-native-audit-attempt-1.json/.py`。两处失败来自审计脚本自身假设：原 SDK 的按下消息名为 `down`，不是 `press`；Rosetta 第一张菜单快照在 TCP listener 注册完成前记录 `state=registering, port=0`，未公布端口且没有会话。最终审计改为核对真实 `down/pressed=true` 消息，以及首次 `available` 后所有快照的固定端口，并单独记录注册前快照。没有修改 CI 报告或游戏文件。

第二份审计初稿也保留：它对启动期状态增加了过度严格的假设。实际 `registering` 可在 TCP 已选定端口但 Bonjour 注册尚未完成时携带最终端口；未连接玩家座位也会存在于快照中。最终审计要求首次 `available` 前只能出现 `registering`，端口只能是0或最终端口、连接数为0且所有座位 disconnected；首次 `available` 后每张快照端口必须不变。全部是对原始记录的再核对，没有重跑游戏。

# Ponpoko Kart Windows 原包交付证据

生产与 QA 同源 `232d544079a472aa0ffb259c1bc73c692b94504d`，原 run `44628818020` / attempt 1，原导出 `b7803b7f811e8eb45b511cc44dfa0f1d13de9c4c`。整体 run 因其他两款失败而失败；Pon 原 verify 成功且是原 `verifiedGames` 唯一条目。

[独立核验](independent-verification.json)重新验证 228 个固定 Git 输入、完整 16 个便携包文件、实际 AMD64 PE、原包 SHA/大小、当前 dist 与原产物一致。原安装器真实安装/卸载与无关文件保留检查通过；没有重新打包。审计实际脚本、固定原 selector、原 build/package 清单均保留。

[原 SDK 与计划复算](runtime-recomputation.json)：normal 311、occupied 315 个原消息都有唯一匹配 ACK，各 11 个原步骤谓词重新计算通过；两模式原 10 项检查通过，包括后台取消、断线不自动恢复、清空缓存后的真实存档恢复。四文档 bootstrap fixture 也实际通过。此前 bootstrap 失败保留且根因未被本次成功证明。

[12 张实际原图检查](visual-review.json)：960×540 仅未连接菜单，1280×720 为连接/驾驶/暂停/断线/重连；67 / 79 km/h 的驾驶画面保留。仅 96 DPI、虚拟原 SDK，未做实体设备、其他 DPI 或完整通关测试；没有 Authenticode 签名，WebView2 Runtime 需另行安装。

[原报告索引](retained-original-files.json)指向[同一次不可变原证据](../../../shared/windows/docs/attempts/44628818020/README.md)，所有原失败和原报告保持不变。

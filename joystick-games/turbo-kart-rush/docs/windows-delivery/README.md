# Turbo Kart Rush Windows 原包交付核验

原生产源 `039d210cfa4cc65f59adf0859a777f3591853a70`，run `44621752383` / attempt1，成功任务 `135905037968`；不可变导出 `f559a71e99ff27c8f262ed2a82a70674ee90f9dc`。本地未重建、执行安装包或重跑游戏。

[独立核验](independent-verification.json)核对180个固定源输入、16个便携文件、AMD64可执行文件、当前dist，以及原两模式各10项检查、各205条消息与唯一ACK。原油门步骤在真实语义UP仍按住时达到速度2.61和位置进展，约8秒墙钟后释放，再核两帧全松；没有改游戏时钟或用滑行样本代替输入消费。

[目视记录](visual-review.json)记录实际逐张查看的12张原图和已知地图遮挡。存档状态是 `not_exercised`；空存储重启一致不能当作真实游戏存档通过。原报告、旧失败与此批其他游戏的失败保持原样。普通端口63485，原占用回退57873。

`original-export/`保留完整116个原证据及包文件；`recovery/`保留原API、导出树与SHA核验、实际CLI日志和来源选择；`executed-local/`是本次执行的恢复及只读审核脚本。`before-delivery/`记录修改前跨平台元数据。Windows包仍未Authenticode签名，未做实体手柄或完整通关测试。

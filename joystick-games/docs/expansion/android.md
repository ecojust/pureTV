# Android TV 安装与手柄验收

五个新增游戏的 0.1.1 与 Kart Royale 0.1.6 都使用 pureTV 发布证书，最低 API 26，目标 API 35。五个 0.1.1 在 Android TV 16 模拟器上逐一安装、核对包名与版本并卸载，安装验证设置使用系统默认值。[安装检查](https://github.com/ecojust/pureTV/actions/runs/44824074057/job/136594484256) · [逐款下载和 SHA-256](downloads.json)

每项游戏操作通过原版 pureTV TCP SDK 发送，分别在默认端口与默认端口已被占用的情况下执行。下表链接到各款原始作业，可查看最新结果。场景涵盖实际游戏起步与输入。扫码测试另记录在[手机验证](phone/)。实体电视和实体手柄尚未验证。

| 游戏 | 模拟器 | 计划内的游戏操作 | 双端口作业 |
| --- | --- | --- | --- |
| Kart Royale | Android TV 14 | 菜单、选车、起步、加速与漂移 | [运行中](https://github.com/ecojust/pureTV/actions/runs/44822909081/job/136588624821) |
| Turbo Kart Rally | Android TV 14 | 选手、竞速、转向、漂移与暂停 | [运行中](https://github.com/ecojust/pureTV/actions/runs/44824074057/job/136594484311) |
| Clawd Pop | Android TV 14 | 进入实验室、移动与射击 | [运行中](https://github.com/ecojust/pureTV/actions/runs/44824074057/job/136594484431) |
| 光刃魔塔 | Android TV 16 | 探索、怪物手册与暂停 | [双端口通过](https://github.com/ecojust/pureTV/actions/runs/44824074057/job/136594484392) |
| Operation Ironhold | Android TV 16 | 前进、转向、开火与换枪 | [双端口通过](https://github.com/ecojust/pureTV/actions/runs/44824074057/job/136594484439) |
| Lumenrift | Android TV 16 | 进入战役、建墙与召唤第一波 | [运行中](https://github.com/ecojust/pureTV/actions/runs/44824074057/job/136594484333) |

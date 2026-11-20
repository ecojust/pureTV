# Android TV 安装与手柄验收

五个新增游戏的 0.1.1 与 Kart Royale 0.1.6 都使用 pureTV 发布证书，最低 API 26，目标 API 35。五个 0.1.1 在 Android TV 16 模拟器上逐一安装、核对包名与版本并卸载，安装验证设置使用系统默认值。[安装检查](https://github.com/ecojust/pureTV/actions/runs/44824074057/job/136594484256) · [逐款下载和 SHA-256](downloads.json)

每项游戏操作通过原版 pureTV TCP SDK 发送，分别在默认端口与默认端口已被占用的情况下执行。下表链接到各款原始作业，可查看最新结果。场景涵盖实际游戏起步与输入。扫码测试另记录在[手机验证](phone/)。实体电视和实体手柄尚未验证。

| 游戏 | 模拟器 | 计划内的游戏操作 | 双端口作业 |
| --- | --- | --- | --- |
| Kart Royale | Android TV 14 | 菜单、选车、起步、加速与漂移 | [双端口通过](https://github.com/ecojust/pureTV/actions/runs/44822909081/job/136588624821) |
| Turbo Kart Rally | Android TV 14 | 选手、竞速、转向、漂移与暂停 | [双端口通过](https://github.com/ecojust/pureTV/actions/runs/44824074057/job/136594484311) |
| Clawd Pop | Android TV 14 | 进入实验室、移动与射击 | [默认端口通过，备用端口达到时限](https://github.com/ecojust/pureTV/actions/runs/44824074057/job/136594484431) |
| 光刃魔塔 | Android TV 16 | 探索、怪物手册与暂停 | [双端口通过](https://github.com/ecojust/pureTV/actions/runs/44824074057/job/136594484392) |
| Operation Ironhold | Android TV 16 | 前进、转向、开火与换枪 | [双端口通过](https://github.com/ecojust/pureTV/actions/runs/44824074057/job/136594484439) |
| Lumenrift | Android TV 16 | 进入战役、建墙与召唤第一波 | [双端口通过](https://github.com/ecojust/pureTV/actions/runs/44824074057/job/136594484333) |

## 原始记录

下列报告记录安装包哈希、实际服务端口、逐项结果和操作录像。

| 游戏 | 默认端口 | 备用端口 |
| --- | --- | --- |
| Kart Royale | [58 项通过](https://raw.githubusercontent.com/ecojust/pureTV/90004c8eb694d054a974fac783609759fe4ae6d6/evidence/joystick-android-runtime-kart-royale/kart-royale-normal/report.json) | [58 项通过](https://raw.githubusercontent.com/ecojust/pureTV/90004c8eb694d054a974fac783609759fe4ae6d6/evidence/joystick-android-runtime-kart-royale/kart-royale-occupied/report.json) |
| Turbo Kart Rally | [46 项通过](https://raw.githubusercontent.com/ecojust/pureTV/3b0d818857cd897b9d4a1a4db02aa5998921a050/reports/joystick-android-report-runtime-turbo-kart-rally/turbo-kart-rally-normal/report.json) | [46 项通过](https://raw.githubusercontent.com/ecojust/pureTV/3b0d818857cd897b9d4a1a4db02aa5998921a050/reports/joystick-android-report-runtime-turbo-kart-rally/turbo-kart-rally-occupied/report.json) |
| Clawd Pop 3D | [41 项通过](https://raw.githubusercontent.com/ecojust/pureTV/3b0d818857cd897b9d4a1a4db02aa5998921a050/reports/joystick-android-report-runtime-clawd-pop/clawd-pop-normal/report.json) | [通过 35 项后中断](https://raw.githubusercontent.com/ecojust/pureTV/3b0d818857cd897b9d4a1a4db02aa5998921a050/reports/joystick-android-report-runtime-clawd-pop/clawd-pop-occupied/report.json) |
| Saber Magic Tower | [44 项通过](https://raw.githubusercontent.com/ecojust/pureTV/3b0d818857cd897b9d4a1a4db02aa5998921a050/reports/joystick-android-report-runtime-saber-magic-tower/saber-magic-tower-normal/report.json) | [44 项通过](https://raw.githubusercontent.com/ecojust/pureTV/3b0d818857cd897b9d4a1a4db02aa5998921a050/reports/joystick-android-report-runtime-saber-magic-tower/saber-magic-tower-occupied/report.json) |
| Operation Ironhold | [43 项通过](https://raw.githubusercontent.com/ecojust/pureTV/3b0d818857cd897b9d4a1a4db02aa5998921a050/reports/joystick-android-report-runtime-operation-ironhold/operation-ironhold-normal/report.json) | [43 项通过](https://raw.githubusercontent.com/ecojust/pureTV/3b0d818857cd897b9d4a1a4db02aa5998921a050/reports/joystick-android-report-runtime-operation-ironhold/operation-ironhold-occupied/report.json) |
| Lumenrift | [43 项通过](https://raw.githubusercontent.com/ecojust/pureTV/3b0d818857cd897b9d4a1a4db02aa5998921a050/reports/joystick-android-report-runtime-lumenrift/lumenrift-normal/report.json) | [43 项通过](https://raw.githubusercontent.com/ecojust/pureTV/3b0d818857cd897b9d4a1a4db02aa5998921a050/reports/joystick-android-report-runtime-lumenrift/lumenrift-occupied/report.json) |

Clawd Pop 在两个端口都进入实验室，完成移动与开火。备用端口第 35 项完成后，作业达到 40 分钟上限，后续退出、断开和重连等检查尚未完成。原始报告保留了截止时的快照。

# Kart Royale 0.1.1 Windows 画面核验

两组截图来自同一 Windows x64 构建的原 SDK 运行。下表保留两次运行各自的原图。[构建与运行](https://github.com/ecojust/pureTV/actions/runs/44680258590) · [文件校验和与运行结果](verification.json)

| 状态 | 默认端口 | 默认端口已占用 | 原图所见 |
| --- | --- | --- | --- |
| 最小窗口 | [960×540](screenshots/normal/minimum-window.png) | [960×540](screenshots/occupied/minimum-window.png) | 启动进度和 READY 居中，此帧仍是启动画面。 |
| 手柄连接 | [1280×720](screenshots/normal/connected-menu.png) | [1280×720](screenshots/occupied/connected-menu.png) | 标题菜单中 Start 获得焦点，左侧显示连接卡。 |
| 驾驶 | [赛道](screenshots/normal/playing.png) | [赛道](screenshots/occupied/playing.png) | 夕阳赛道、车手、其他赛车、计时、小地图和名次可见。两次分别处于第 5、6 位。 |
| 暂停 | [菜单](screenshots/normal/paused.png) | [菜单](screenshots/occupied/paused.png) | 原赛道在背景变暗，菜单右侧四项可见，Resume 高亮。 |
| 断线 | [断线帧](screenshots/normal/disconnected.png) | [断线帧](screenshots/occupied/disconnected.png) | 连接卡更新，背景停留在赛车所在位置。 |
| 重连 | [重连帧](screenshots/normal/reconnected.png) | [重连帧](screenshots/occupied/reconnected.png) | 连接卡重新显示设备，暂停菜单保留，等待手动恢复。 |

运行器采用 96 DPI。截图覆盖赛道驾驶片段，完整比赛、其他显示缩放和实体手柄仍待实测。

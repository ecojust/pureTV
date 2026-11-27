# 克劳德坦克 · Claude of Tanks

本地单人坦克游戏，车辆、竞技地图、机器人、渲染及声音取自 Kevin B. Liu 的 Claude of Tanks。可在车库选择车辆和地图，点击“开始单人对战”进入游戏。键鼠或 pureTV 手柄均可操作。对局内按 Esc 暂停。

## 构建

在本目录运行 `npm ci`、`npm run build`，使用 Node.js 24 和 Git。构建自动获取上游固定的 MIT 提交，只检出源代码和离线游戏所需资源。已有该提交的干净工作副本时，可将 `COT_UPSTREAM` 设为该目录以重复构建。它应包含 src、public/textures、public/fx、public/audio、public/maps、所需的车辆剪影和来源表列出的冬日湖畔截图。`npm run build:check` 会重新生成并逐文件比较 dist。

网页入口为 dist/tv.html，通过本地静态服务器、APK 内置资源服务器或 pureTV 管理器运行。完整归属、许可和固定版本见 upstream.json 和 THIRD-PARTY-NOTICES.txt。

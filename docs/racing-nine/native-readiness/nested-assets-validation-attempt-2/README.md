# 显式资源政策下的 Mac 递归资产

仅已匹配 registry 的 `assetPolicy` 开放嵌套资源与扩展类型；默认仍为平铺、原大小预算与 64 个精确存档键。匹配政策的存档键上限为 512，保留逐键枚举、每值 1 MiB 和按 bundle 隔离；没有修改原存档/ghost 淘汰逻辑。

六个修改文件的完整源码副本、SHA 与本地检查命令见 [result.json](result.json)。递归目录逐段只接受 ASCII 安全名称，最多 16 段/1024 字符、4096 节点/2048 文件、64 KiB 路径清单；拒符号链接、大小写别名、DOS 保留名、尾点、百分号、反斜杠、隐藏路径和缓存目录。完整相对路径与文件 SHA 进入原 Mac `webFiles`/`appFiles` 清单；包验证另外检查文件/目录别名及两份清单映射一致。

服务器保留根目录文件描述符，读取时每级 `openat` + `O_NOFOLLOW`，中间目录也使用 `O_DIRECTORY`。因此索引后把父目录换成指向外部的符号链接不能绕过根目录限制。原 64 KiB 流式响应、GET/HEAD、单 Range、strict host 与路径索引仍保留。原 `.opus`/`.m4a`、`.md`、`.webmanifest` 和确切 `LICENSE`/`*_LICENSE` 等原始通知文本均按显式政策保留字节和目录，不转码或移动。

- Linux 本地相关检查 **34 项通过**：catalog-tools 16、catalog-reuse 3、native-observation 10、build-source 1、reuse-source 4。原上轮记录另存，没有覆盖。
- [当前九款实际 dist 的复制核验](nine-game-copy-check.json) **9/9 通过**：完整相对路径/大小/SHA 相等，生成 bridge/config 后仍满足预算；Backroad 333 原文件与 367 个精确存档键均保留。源仍在适配阶段，此项不是冻结包或游戏运行验收。
- 扩充后的真实 Swift HTTP 套件为 **13 项**，包括相对模块/模型/字体路径、原始音频 Range、父目录替换、目录/深度/数量/路径清单边界；本机 Linux 全部明确 `skipped`，**尚未原生编译执行**。大小写碰撞的原生用例在不能创建大小写不同目录的卷上会单独明确 skip，Python builder 的对应拒绝已实跑。
- `GameStorageTests.swift` 新增 367 个精确 ghost 键、未知键/通配符拒绝、1 MiB 边界与跨 bundle 隔离，真实 UserDefaults 执行同样待下一次 Mac CI。

本轮没有新 dispatch。先前 Mac 样本 `44584471562` 已成功，但冻结源为 `eb45042`，不包含本次递归/音频格式/512 键代码，不能冒用其通过结果。

# Mac racing-03 原包草稿转存

原包来自源码 `6c7cb4fdb99dce236b634c842326bae6aed5f232`、原流程 `44615880581` attempt 1、artifact `14575925502`。原流程整体仍为 failure；本转存不改变游戏验收结论。

按已验证的固定转存工具 `bb1bd45fd503a1f87543a01b25b2e7d9d34f0003`，单次创建未发布草稿 `451967756`，随后唯一 dispatch `44622059122`，原 transfer job `135906029209` 实际 success。草稿 tag 为 `racing-package-staging-44615880581-attempt-1`，target 为原源码，`draft:true`、`published_at:null`，没有发布 Release、更新 latest 或重建安装包。

原转存回执从不可变提交 `95f7dfb56d1b3d1897922acedfafe1414e19420c` 按 Git blob 身份恢复。附件 `769385152` 为原 wrapper 的完整字节：8,448,180 字节，SHA256 `9f28f623a7577ced8fce67fef84093fc0edd42dedf4c812cf197347ed2b66a7a`。本地完整 GET 后大小和 SHA 一致，再按冻结 registry/executable/version 确认精确 12 文件集合，拒绝链接、越界路径、重名、加密与非支持压缩格式；读取至 EOF 核 ZIP CRC，并逐一核验六个包与原 build-manifest/SHA256SUMS。

第一次本地预提取把带空格的显示 appName 用作包文件 stem，安全预检拒绝且没有建立 packages 目录。原失败和执行源保留；第二次按冻结 builder 的 executable 命名规则修正，复用已下载且已完整核验的 wrapper，没有重复 GET 或 POST。

完整临时原件位于 `/dev/shm/root-mac03-v3-transfer/packages/{turbo-kart-rush,kart-rush,kart-royale}/`。本目录仅保留小回执、非敏感元数据、原 build-manifest/校验清单和实际执行脚本，六个二进制包尚未物化到游戏交付目录。这里的包哈希验证不等于内层完整源码、资源、Mach-O、原生游戏或实体手柄验证；后续由 native-readiness 独立审计。草稿附件下载也不等于正式公开游戏交付。

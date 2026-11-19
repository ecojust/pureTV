# Windows v4 源闭包独立只读复核

结论：**本次审查范围内通过，没有发现阻止冻结的源闭包缺陷**。未修改 Windows 文件；这不是 Windows 原生构建或玩法验收。

实际读取了 `windows-inputs.py`、builder / packages / evidence / export / verify 调用关系、workflow 与 CMake。被审代码逐文件 SHA 见 [result.json](result.json)。

- `select()` 统一覆盖 Windows CMake / pinned dependencies / Sources / Web / tests、直接执行工具及 `macos-verify.py → qa-plan.py → joystick_sdk.py` 调用链、registry / workflow、完整游戏 src / dist / 原 license / lockfile / build / QA，以及共享非平台派生输入。Windows verifier 自建初始化与观察字段，没有执行 Mac AppKit host 或 macOS 历史 docs。
- 已发布安装包只有在带 game 身份与受限安装包后缀的 release descriptor 中明确列出才排除；普通 assets 内 archive 不排除。game/docs、Windows host/docs、node_modules/cache 明确排除，不递归发现或执行归档中的旧测试。workflow 使用固定测试路径，CMake 固定 `tests/protocol.test.cpp`。
- `file:` 本地依赖和 lock 本地链接递归纳入，保留 package / lock 与原目录；去重支持循环依赖。本地 tarball 本体绑定；越界、symlink、缺依赖与不支持的 workspace/link 形式会拒绝。
- builder 调用 `verify_complete_git_selection()` 对完整 Git blob tree 检查，能拒绝删除已追踪 src/shared 文件后重新计算出一个更小清单；随后每文件用 object ID / `git cat-file blob` 比较原字节，构建后再次比较同一 selector 的完整 file set / hashes。
- packages 与 export 都调用同一 selector 并要求 file_records 等于原 build manifest，再核对源文件原字节和包哈希；不是只检验旧清单的一个子集。evidence 使用相同选择器保留完整 scope 清单及实际执行代码；选择失败时标 `sourceScopeComplete=false` 并保留直接工具，不冒称完整。

本机独立执行 10 项 source-scope 与 2 项 source-inputs 回归全部通过，原日志见本目录。实际 Sugarplum scope 为 **104 文件 / 2,399,755 字节**，其中 37 文件进入 executed-source；完整 src/dist 在列，Windows historical docs 不在列，详见 [actual-sugarplum-scope.json](actual-sugarplum-scope.json)。这些数值属于此次记录的文件哈希，后续新增源码须重新冻结。

剩余验证由真正 Windows CI 完成，包括 Windows 文件系统路径、MSVC 构建、WebView2、安装/卸载和实际手柄玩法。大于 Git 单文件上限的公开交付仍是主任务另行处理的通道，不应因此删源、删音频或缩小原输入清单。

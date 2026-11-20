# Windows 默认端口不可用时的一次回退

原 Backroad v6 在 WebView 创建前报 `Cannot bind controller TCP port: 10013`，document epoch 为 0，四文档与游戏均未执行。[原分析](../attempts/44636807407/backroad-bootstrap-analysis.json)和原失败保留；具体端口拒绝原因仍未知。

宿主仍先绑定 63485。首次为 WSAEACCES(10013) 或 WSAEADDRINUSE(10048) 时，仅再尝试一次系统分配端口0；其他错误仍失败。成功端口读取严格校验，默认失败码/回退原因保留于启动日志与只读 info，连接不会重绑。

Linux 普通及优化 NDEBUG 编译各通过七条策略检查。首次 CMake 尝试因本机没有 cmake/ctest 而未启动，原记录保留；没有因此安装工具或执行其他游戏。**尚未完成本补丁的 MSVC 编译或真实 Windows socket 验证。**

下一固定 Windows CI 的原 build/CTest 会自动执行新增 `controller-bind`：真实独占已绑定未监听、独占监听和无效 socket 三类；前两类用系统分配的隔离候选端口制造10013，再证一次回退与三次连接后端口稳定。CTest 上限20秒，`require` 检查不受 NDEBUG 影响。实际原 `LastTest.log` 新增为 `ctest-last-test.log` 保存，现有正常63485/占用63485游戏验收和四文档断言不改。

精确来源、独审、测试记录、导出兼容规则及未验证范围见 [result.json](result.json) 与 [freeze.json](freeze.json)。没有派发新流程、重跑原生或提交推送。

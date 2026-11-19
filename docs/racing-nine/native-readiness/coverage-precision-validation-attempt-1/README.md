# Ponpoko 原始 shader 初始化异常：精确边界修订

两个源文件的最终 SHA 见 `source-inventory.json`。独立审阅没有发现阻断，35 组边界测试通过，实际命令和原 stdout/stderr 均保留。没有修改游戏、shader precision 返回、renderer 或任何原报告，也没有触发原生 CI。

新分支只允许 `ponpoko-kart` 的既定完整错误表达式，且安装包 `webFiles/game.js` 与冻结源输入都必须精确等于 1,561,049 字节、SHA-256 `b26270b854a7672d67e36e987c2a5c938044556d5b91fc480c41211a5b959729`。原错误列表必须只含该一项，Python 原异常结尾必须完整一致；状态限于 initialization、boot、stage error、未创建 renderer、零 frame / renderCalls / tick / poll，原进程仍存活且原观察新鲜。

完整表达式与冻结调用链的来源证明见 [pon-precision-source-proof/proof.json](../ci-44596707197-attempt-1/pon-precision-source-proof/proof.json)。原 Three 0.186.1 npm 包实际匹配冻结 lock 的 SHA-512 integrity；保留原 module、LICENSE、冻结入口源码与唯一调用点片段。**原适配器没有捕获 JavaScript stack**，此事实明确为 `originalJavaScriptStackCaptured:false`，没有重建或伪造原调用栈。唯一表达式和固定 bundle 是源码对应依据，不是唯一硬件根因证明。

此分支仍须原包完整校验、同源 ARM 原生 / 占用端口 / Rosetta 全部实际通过，以及同一真实 Intel job 的前后完整三帧 context-lost 探针。输出保持原 `failed`、Intel `unverified` 和 `gameFailureCauseProven:false`。其他游戏、不同 bundle、泛泛 precision 字符串、额外 / 多个错误、已进入菜单或渲染、丢失 / 健康探针、任何 ARM 玩法失败均阻断；`full-v1` 没有放宽。

本地用原 Pon Intel 报告只读检查了这一初始化边界，原文件哈希不变。用于该单函数回放的 bundle 元数据来自固定 Git 源，**不是已恢复的完整安装包 manifest**，所以这里不宣称完成全流程 coverage 汇总或获得交付资格。现有两款 ARM 六份真实报告另有原证据，不能把本项边界回放当成新的原生执行。

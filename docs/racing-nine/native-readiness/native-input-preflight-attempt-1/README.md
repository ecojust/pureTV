# 九款赛车原生输入选择预检

本次用 `nice 19` 只读调用当前 `android-build.sources()`、`macos-build.inputs()` 和 `windows-inputs.select()`，共 **九款 × 三个平台，27 次选择均完成**。未运行 unit、构建、浏览器或 CI。原执行脚本和结果分别为 [executed-audit.py](executed-audit.py)、[report.json](report.json)；原报告 SHA-256 为 `261217be2dae1257c43ebf5ca97bcfd74e313d376d3117ca84326adfba9e7606`。

原遍历开始和结束 HEAD 均为 `e8ed392ee21072c16d277a845f25d4ee0c35370f`，同时明确对照旧 CI 冻结源 `8f283c73f52f857777306eafc88f710262367834`。随后补充根目录元数据差异时 HEAD 已为 `d548bccbe816bd4c03620388556ceef507b67d30`，见 [metadata-diff.json](metadata-diff.json)。两次记录保留各自时点，不能把后来的修复当成旧 CI 原输入。

| 范围 | 本次实际结果 |
| --- | --- |
| 九款 `src/`、`dist/` | 均未发现 `node_modules`、`__pycache__`、`.cache`、`.git` 目录或符号链接；无 tracked 文件在本地缺失 |
| Backroad、Ponpoko、Night、Penguintrack、Last Track、Turbo Kart Rush、Kart Rush | `src/dist` 全部已 tracked，逐文件 Git blob 与旧 `8f283c73` 相同 |
| Dirt Crown | 两份 `src/dist/vendor/three/build/three.module.js` 当时仍未 tracked；负责人已调整 ignore，所以本轮 `git check-ignore` 已不再报告忽略。新增本地 `.gitignore` 也尚未 tracked，均是已知修复范围 |
| Kart Royale | 本轮已无源码内嵌依赖目录；`dist/kart-royale.js` 与旧冻结源及当时 HEAD 不同，属于负责人正在修复的已知构建差异 |
| Backroad、Last Track NOTICE | 本轮工作树均存在且已 tracked，当前选择器通过；两者在旧 `8f283c73` 中都不存在，旧源的原失败必须保留 |
| Backroad 测试夹具 | `tests/adapter-fixture.cjs`、`tests/adapter-fixture.ts` 当时未 tracked，但会被 Mac/Windows 选择器纳入。已通知负责人和 root 后续独立 checkpoint |

除了上述已知或已交给负责人的差异，没有发现新的游戏资源漏收。必须将“工作树选择成功”和“与冻结 Git 提交一致”分开：这次没有运行 `assert_committed` 来冒充所有本地未提交内容已冻结，也没有更改任何选择器、资源或忽略规则。

共享输入方面，当前 Mac 选择器会遍历其他 shared 目录，包括 Windows 历史证据；因此报告中相对旧源多出的 90 个共享路径主要是已提交的 Windows v7 证据与观察测试。Windows 选择器相对旧源新增两份观察工具/测试，Android 的共享输入没有缺失路径。这些是当前选择范围与旧冻结源的真实差异，不是九款各自新增的依赖缓存。完整路径在原报告中保留。

本记录仅检查文件选择、存在性、tracked/ignored 状态和游戏源码资源字节身份，不代替依赖安装、原平台编译、签名或真实玩法验收。后续负责人提交修复后，应以新的明确源码提交执行原生流程，不覆盖此快照。

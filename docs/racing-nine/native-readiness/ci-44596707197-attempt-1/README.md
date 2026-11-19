# racing-01 首次 macOS 原生流程：44596707197 / attempt 1

本记录对应 root 单次触发的原流程 [44596707197](https://github.com/ecojust/pureTV/actions/runs/44596707197)，冻结来源 `e347d691d94042021717bd0a331371451d113a48`、ref `build-source/racing-macos-01-v1`，批次为 Backroad Rally / Ponpoko Kart / Night Racer。原流程已完成并保持失败；具体构建与玩法事实分项记录如下。

`identity.json` 固定来源与范围，`monitor/` 按状态变化保存原 GitHub run / jobs API 返回。监控只读，没有重复生产 dispatch。计划 job 已成功；build 与两个 verify job 最终失败，export 跳过。

后续将保留原测试、编译、helper 身份或运行失败，不通过删改 Backroad 资源来适应 Git 导出限制。若包超过当前 Git 导出限额，将记录真实尺寸与 SHA，由 root 落实目录与 Release 下载形式。只有实际完成同源 ARM 原生 / 占用端口 / Rosetta 和当次 Intel 原始观察后才能披露对应验证范围。

## 原构建失败已恢复

build job 已失败。直接 artifact GET，以及一次加 `Cache-Control: no-cache` / `Pragma: no-cache` / 唯一 nonce 的 GET 均返回 Forbidden；CLI 未返回可判别签名过期或缓存的 body，因此不对 403 根因作推断，也未保存重定向签名 URL。

原 build artifact `14566807259` 通过一次只读 exporter [44597336843](https://github.com/ecojust/pureTV/actions/runs/44597336843) 恢复到不可变提交 `a117ec05eb3b51fbb714e0e0599cda03e5300c08`。201 个原文件、317,812 字节全部匹配 Git blob 与原导出 manifest，见 `readonly-build-export-verification.json`；请求、HTTP 204 和原失败均保留。没有重跑生产构建。

原失败是 Backroad 的 `audio.test.ts` / `menus.test.ts` / `tuning.test.ts` 在读取 `public/audio/mix.json`、`public/data/menu.json`、`public/data/cars_tuning.json` 时出现 ENOENT。其余 17 个 suite / 138 项测试通过，依赖安装和冻结资源检查也通过；Backroad 原生构建按门槛跳过，因此还没有实际包大小，不能说它本次因 Git 大小限额失败。对应 owner 正修正测试入口的真实工作目录，保留原测试和资源。

14 个共享命令全部通过，包括新 capability 4 项、coverage 30 项、真实 Swift HTTP 13 项中的 12 通过 / 1 卷能力跳过。Ponpoko 与 Night Racer 的 universal 原生构建通过；原 builder 记录的 ZIP / DMG 大小及 SHA 见 `build-findings.json`。Ponpoko ZIP 1,904,745 字节、DMG 2,377,697 字节；Night ZIP 21,613,935 字节、DMG 22,025,992 字节。包 artifact `14567510080` 已上传，这两款随后完成了下面记录的原玩法检查。包构建通过不等于玩法通过，本地尚未下载安装包字节重新核验。

## 最终原玩法结果

ARM 原导出 `c8d985cbf04ff736ce6358fb7a053a84dbffc530` 的 310 文件 / 35,763,192 字节已逐 Git blob 与 manifest 校验。Ponpoko 和 Night 的 ARM 原生、占用端口、Rosetta 六模式原报告全部 passed，各完整 9 项原 SDK、玩法、断线与存档检查通过；36 张截图的实际 bytes/SHA 及 13 项冻结输入核验见 `arm-findings.json`。原 batch 仍失败，因为 Backroad 没有包。没有把缺少的 Backroad 结果补为通过。

Intel 原导出 `15a7dffc8119397ab33eadf4e1ddb7907476ed32` 的 208 文件 / 432,187 字节已校验。两款都保持原 initialization failed；同一真实 Intel job 的前后独立 WebGL2 探针都观察到三帧 contextLost。Night 原 game 为 null；Pon 原完整 precision 表达式异常及缺少 JS stack 的事实见 `intel-findings.json`、`intel-findings-provenance.json` 与 `pon-precision-source-proof/`。原 source e347 的 classifier 对 Pon 仍 blocked；后来新增的精确边界验证另存 `../coverage-precision-validation-attempt-1/`，不重写本次原结果。

本目录没有下载完整实际 ZIP/DMG 再做全量本地包复验，也没有对本次运行执行完整 `assess_game()` 交付汇总。上述六模式通过是原实际测试事实，不是三款全交付或 Intel 实测通过。修复后的第二次运行使用不同冻结源和独立目录。

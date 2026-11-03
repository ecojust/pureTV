# 百款游戏恢复入口

先读 [INDEX](INDEX.md)、当前任务记录、[交付队列](game-delivery-state.json)，然后核对 `master` 的 `resource/game-kit/progress.json` 与实际 Git 状态。队列是提示，不是验收证据；已发布记录以各游戏 `docs/verification.json` 和对应提交为准。

## 环境或上下文丢失后

1. 当前候选源码保存在远端 `feat/games-49-51`；该分支名称沿用早期任务，不表示仅包含49–51。正式资源在 `master`。使用独立工作树，避免把全部候选一起合入发布分支。
2. 对待办项读取队列中的 `sourceCommit`。有冻结提交就恢复该款的确切文件；只有 `draftCommit` 表示尚未完成画面冻结。不要把签名后的新模型／renderer与旧包、旧录像混用。
3. `scratch` 是可丢弃的本次缓存。签名成功的包可凭 `signingRun`、`sourceCommit`、`id` 使用 [fetch-signed.py](../resource/game-kit/fetch-signed.py) 重新下载核验，详见 [BUILD](../resource/game-kit/BUILD.md)。正式来源由receipt和实际资产哈希确认。
4. 从已核验APK提取完整 `assets/` 到新的临时目录；把 `game-model.js`、`game.js` 与冻结源码逐字节比较。不要只复制两份游戏文件而遗漏公共运行时、配置与资源索引。
5. 未完成的QA可从每款 `tests/` 重建：作者 `model-test.cjs`、独立 `independent-check.cjs`／`.mjs`、专项 `browser-checks.mjs`、共享 `qa.mjs`、`automation.mjs` 和 `recipe.json`。实际文件与脚本参数优先，阅读脚本再执行。已经通过且源码未变的检查可以复用，但必须保留原始报告及对应哈希。

生产签名来源与实际测试来源可能不同：第95款星阵防线和第96款渡河跃步仅在冻结后修正重开测试夹具，正式APK未变。重建时使用发布目录里的实际执行版tests，并核对各自docs下的双来源记录；不能用生产sourceCommit中的旧测试覆盖已修正版本。装配后若补入测试或证据文件，应在最后重算SHA256SUMS，再提交。

专项浏览器的通用调用如下，`<...>` 需要替换为本次真实路径：

```bash
node resource/apps/<id>/tests/browser-checks.mjs \
  --assets <absolute-assets> --output <absolute-browser-output>
node resource/game-kit/qa/qa.mjs \
  --assets <absolute-assets> --output <absolute-shared-output> \
  --automation <absolute-game-tests>/automation.mjs \
  --recipe <absolute-game-tests>/recipe.json --record \
  --apk <absolute-signed-apk> --package <actual-package-name>
```

依赖、录制和报告说明见 [QA README](../resource/game-kit/qa/README.md)。本次环境把 `PURETV_PACKAGE` 指向仓库外已安装Playwright的package.json；新环境需要重新配置，不依赖旧绝对路径。浏览器会话继续串行，结束后明确交接；模型检查和签名构建可并行。

## 单款最终交付

- 保留作者与独立规则证据、专项／共享浏览器原始报告、签名receipt、下载核验、录像manifest和完整解码报告。自动工具通过不能代替打开实际960／1280截图及编码后视频画面的检查。
- 确认APK和录像各小于10,000,000字节，测试资产、录像清单资产、冻结源码与正式APK完全一致；三关实际普通输入获胜，终局、自然失败和本款独有规则已有证据。失败重试必须记录原失败和复用范围。
- 在干净的发布工作树中只恢复本款冻结目录，再补入验收后的docs、正式APK、录像与 `resource.json`。更新证书包名映射、英文目录、实际预览、资源索引与 `SHA256SUMS.txt`；执行资源校验。参照最近已发布游戏的数据结构，不能套用仅支持旧游戏的 `verify-game-publication.py`。
- `progress.json` 只增加这一款；逐款提交推送后再将history状态更新为已发布。若发布组装中断，先检查暂存区和生成文件，不能重复盲跑或将半成品夹进history提交。
- 本次 `scratch/hundred-continuation/` 辅助脚本只是临时编排，不是恢复的必要依赖。以上源码、官方构建／签名／QA工具和正式证据均在仓库或记录的远端提交中。

未做实体电视／手机测试；GitHub提交、签名导出分支、GitHub Release、Gitee发布分别记录。全部100款完成前，持续目标保持 `in_progress`。

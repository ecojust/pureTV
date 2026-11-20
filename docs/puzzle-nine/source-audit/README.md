# 九款益智游戏的来源与分发核查

七款采用 `ec516141` 的生产文件。《蜜蜂果篮》采用 `84eedab7` 的 0.1.2，修正首次连线时的动画时间差。《幽灵空间站》采用 `a370be71` 的 0.1.2，Android versionCode 为 3，targetSdk 升至 35，以兼容新版 Android TV 的安装流程。首次冻结 `18836937` 与 `ec516141` 之间只有《灰斗篷山的故事大盗》和《幽灵空间站》的游戏目录发生变化。九款的包名互不相同，游戏配置、npm 包与锁文件的版本一致，23 个存档键均能在各自的存档代码中找到。[逐款版本、包名、存档键与文件摘要](report.json)

九款均来自 Andrew Wooldridge 的同一个 MIT 授权提交。共 483 个移植文件与原路径的 Git 对象一致，包括 50 个模拟与数据文件及《灰斗篷山的故事大盗》的 12 个场景文件。逐一解码比对了《炼金方阵》随页面嵌入的 56 张原画，并核对了《幽灵空间站》随包提供的全部 196 个图像和音频文件。三款带字体的游戏各自核对了分发字体与归属记录。九款的许可证均与原作逐字节相符，分发声明与游戏目录的 NOTICE 一致。[原作固定提交](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0)

九款共 214 个分发文件的 SHA-256 与对应的原始手柄 SDK 浏览器记录逐一匹配。18 个场次覆盖 960×540 与 1280×720，总计 278 步，全部完成了实际玩法、断线暂停和显式恢复，记录到的外部请求及页面错误均为零。九张 720p 展示图亦与各自云端实玩原图逐字节一致。运行环境为原始 TCP SDK、Chromium 和浏览器宿主夹具。各平台原生安装包另行验收。[七款基线云测原件](https://github.com/ecojust/pureTV/tree/888897d75faf073b758c0759b080a8f0ad276b3b) · [蜜蜂果篮 0.1.2 云测原件](https://github.com/ecojust/pureTV/tree/0acf8ec637dc7e5551982b737f25de5f62377fb9) · [幽灵空间站 0.1.2 云测原件](https://github.com/ecojust/pureTV/tree/d2f76cb6efc48667137c80c506a642abca5dbbc8)

## 复核

在包含上述生产提交与本批文档的仓库检出中，从根目录使用 Python 3.9 或更新版本运行以下命令。脚本使用本地 Git 对象，以及 GitHub 公开的固定提交、原始文件与云测归档。它逐一核对冻结分发文件、三次导出的手柄记录、图像和上游来源。游戏说明中的本地链接按当时的文档版本复核，安装包下载另有独立核验。

```sh
python3 docs/puzzle-nine/source-audit/verify.py --output /tmp/puretv-puzzle-source-audit.json
git diff --no-index docs/puzzle-nine/source-audit/report.json /tmp/puretv-puzzle-source-audit.json
```

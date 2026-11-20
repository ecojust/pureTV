# Windows 三款原生检查原始小证据

run `44628818020` / source `232d5440` / attempt 1，原不可变 export `b7803b7f811e8eb45b511cc44dfa0f1d13de9c4c`。整体失败，导出成功。

- Ponpoko Kart：四文档存档 fixture 通过，normal 与 occupied 各 10 项真实检查通过；原 verifiedGames 仅此款。包和图审另归其交付目录。
- Backroad Rally：原 build.log 明确在 windows-inputs.py:143 因远端已发布 Mac 包不存在于本地而断言失败；无该 run 的运行报告。后续 2ea/v5 修复构建后仍有独立暂停失败，不能合并为通过。
- Kart Royale：四文档 fixture 通过，两模式各 3 项通过后在实际游戏步骤失败；保留原报告，等待逐步骤诊断。

44 原小文件共 4,986,732 字节均核验原 Git blob 及导出/游戏双 manifest 后硬链接归档；没有修改原件或重新执行游戏。恢复脚本与精确校验清单一并保留。

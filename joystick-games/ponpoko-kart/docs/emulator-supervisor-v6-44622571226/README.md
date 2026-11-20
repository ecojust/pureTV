# Ponpoko Kart 原模拟器退出证据（v6）

原 QA run **44622571226 / attempt 1**，固定 QA 源 `d3b9178bfc4748ef0d8b983f4c6775969f946625`。仍使用 `8f283c73f52f857777306eafc88f710262367834` / run `44597115244` 的原签名 APK，没有重建或重签。

从不可变 export `b94f6dc6001e20bf5d2959aa72937fc247fa184a` 恢复 98 个原文件、1,921,471 字节，各自通过 Git blob 和导出 manifest 校验。为节省空间，没有重复下载原 APK 与原生产源码副本；保留实际 runtime、安装、环境、执行源与来源记录。另存完整原 CLI job 日志及只读 API 元数据。

实际 owned child PID 4634 / starttimeTicks 55355 从原 launcher exec 为 SDK QEMU；父进程 wait 明确返回 **-11 / SIGSEGV**，启动后 154.7795 秒退出。监督程序未收到信号、未执行 intervention。原版本查询逐字节相同，原可执行文件 SHA 未变，SDK 入口在 QA 后恢复成功。

normal 已安装原包并正常清除数据，但等待初始菜单失败：最后只读快照 game=null、没有 canvas；occupied 随后等待 ADB 超时。无驾驶验收或实际画面截图，不计成功。QEMU stdout 的 ColorBuffer 报错与 stderr 的 unmap 警告仅保留为相邻现象，尚无 fault stack，不能把它们直接认定为崩溃原因。61 次环境采样的 OOM 计数为零，最低所见 MemAvailable 11,175,776 KiB；kernel/systemd-oomd 过滤记录无对应事件，也不据此宣称排尽全部内存原因。

详见 `findings.json`、`recovery-validation.json` 和原始 `original-export/`。未再次 POST、安装、调参或改动游戏。

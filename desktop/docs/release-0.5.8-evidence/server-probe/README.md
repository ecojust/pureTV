# apps.b14f.com 只读调查 · 2026-11-15

本目录为新服务器实际响应及独立 Python 探测，未运行已安装管理器、未使用用户网络、未使用登录凭据、未修改服务器。大文件完整流式读取，不落地 APK。

## 目录协议

- `/game/`、`/launcher/`、`/media/`、`/client/` 均为 HTTP 200 的 Nginx 风格 HTML autoindex。`Accept: application/json`、`?format=json` 和 `?json` 仍返回 HTML；`game/index.json` 返回404。
- HTML文件大小如 `51M`、`81K` 是近似值；精确字节数来自HEAD响应的 `Content-Length`。
- 分类下直接应用目录：game20、launcher10、media6，共36个APK；当前每应用目录一个APK。部分游戏与hifini存在 `docs/` 或 `src/`，无须深入这些源码/文档目录。
- BBLL和宽带直播APK链接包含UTF-8百分号编码，应正确解码文件名并安全编码下载URL，不使用显示文本拼接。
- 20游戏均有manifest/provider、logo.svg、thumb.png；启动器仅puretv有manifest/thumb，其余9个只有APK；影音只有bbll有manifest/logo/thumb，其余5个只有APK。缺少附属资源时不能使APK不可见。
- client当前只有0.5.6的Windows setup及两个Mac DMG，没有Linux包或新版本。

详见 `listings-summary.json`、各分类与应用目录的原始HTML响应记录。`probe-listings.py` 是本次实际扫描脚本；运行时复用本目录已经读取的代表目录，其他目录以最多4并发读取。目录读取有1MiB上限。

## 文件元数据与条件请求

HEAD返回精确Content-Length、强格式ETag、Last-Modified、Accept-Ranges。ETag看似Nginx的mtime-size格式，**不是文件内容哈希**，不能将其声称为SHA256或Git blob校验。

真实条件GET确认：错误If-Match→412，正确If-Match配合bytes=0-15→206/16字节并给出精确总长；过早If-Unmodified-Since→412。详见 `conditionals.json` 与 `verified-downloads.json`。

根目录与client的SHA256SUMS.txt返回404，代表jewel/maidongktv目录也无清单。BBLL目录是例外：有SHA256SUMS.txt，且manifest.packages[]含file、bytes、sha256、gitBlobSha；provider为null。其他manifest例如jewel只有provider字段。

## 完整公开下载

`probe-downloads.py` 是实际执行脚本，`verified-downloads.json` 为结果。使用从HEAD读取的If-Match值，校验GET返回ETag与精确长度，并全量流式计算SHA256，与之前已验证的公开Gitee/GitHub产物比对。这里的参考SHA256来自旧验证证据，不是新服务器统一提供的哈希清单。

| 文件 | 字节 | 实际耗时 | 结果 |
| --- | ---: | ---: | --- |
| game/jewel/jewel-0.5.2.apk | 83,318 | 1.276s | HTTP200，完整大小及参考SHA256一致 |
| media/maidongktv/Maidong-KTV-2.1.10.apk | 53,570,243 | 95.375s | HTTP200，完整大小及参考SHA256一致 |
| client/pureTV-Manager-0.5.6-windows-x64-setup.exe | 2,273,072 | 8.103s | HTTP200，完整大小及参考SHA256一致 |

旧参考证据：desktop/docs/release-0.5.7-evidence/live-probe.json、large-blob-probe.json，以及desktop/docs/release-0.5.6-validation.json。新服务器的大APK不再出现旧Gitee raw403；这里只证明本次独立请求可下载，仍需对新管理器实现执行集成验证。

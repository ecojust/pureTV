# HIFINi TV

<!-- apk-resource:start -->
[下载 APK](hifini-0.1.0.apk?raw=1) · [校验值](SHA256SUMS.txt) · [签名及构建来源](resource.json) · [源码](src/)

此目录内 APK 使用 pureTV 发布证书签名。若设备中存在使用旧证书的同包应用，Android 无法直接覆盖安装；需先备份数据并卸载旧包。
<!-- apk-resource:end -->

[English](README.en.md) · [中文](README.md)

面向电视遥控器的独立 HiFiNi 音乐客户端，Android 8.0 及以上。包名 `com.ecojust.hifinitv`，版本 `0.1.0`，可与 Music TV 同时安装；不会修改或读取 Music TV 的数据。

![HIFINi TV 原生中文界面，使用虚构测试曲目；非线上播放或电视实机截图](docs/hifini-tv.png)

## 搜索与播放

- 输入歌曲或歌手名称搜索，搜索需要先登录 HiFiNi；也兼容包含静态播放器数据的官方帖子链接，例如 `https://www.hifini.net/thread-6544.htm`。
- 「随机播放」打乱当前搜索结果，一轮内避免重复；尚无结果时可以输入关键词后直接按随机播放。队列最多 50 首，不是对整个站点曲库随机抽样。
- 搜索使用 `musicparse-search.htm?keyword=...`，保留网易云／酷我的来源 ID，以及歌名、歌手、封面和时长。包括没有关联帖子的歌曲。
- 播放使用 `musicparse-play.htm?source=...&id=...`，每次重新请求官方播放入口，不保存临时音频地址、歌曲历史或收藏。连接失败最多重新尝试一次。
- 显示来源提供的封面和歌手，右侧为原生律动动画：播放时运动，暂停、停止或离开页面后静止。它是视觉动画，不采集麦克风或分析音频频谱；不提供歌词。
- 支持播放／暂停、上一首、下一首、进度调整、后台播放、系统媒体按键和播放通知。

方向键选择，确定键操作；搜索过程中按返回可取消。界面跟随系统语言，支持中文和英文。

## 登录与记住账号

从首页右上角「登录」进入账号页面。上方提供扫码注册二维码，下方依次为用户名、密码和登录按钮。有账号可直接登录；没有账号可用手机扫描二维码，打开官方注册页面 `https://www.hifini.net/user-create.htm`。二维码只包含该网址，在本机生成，没有额外的注册跳转按钮。

用户名和密码使用 Android Keystore 的 AES-GCM 加密后存储在电视本机，不记录到日志，不随系统备份导出。点击登录后填入并提交官方 HTTPS 登录表单；网站要求验证码或其他验证时，在官网区域按提示完成。自动恢复已保存的信息只填入表单，不自行提交。

官方网页的 Cookie 会保存在本机，并与原生搜索请求共享。会话仍有效时无需重复登录；会话到期、网站要求验证或账号状态变化时，仍需按网站提示完成登录。可以重新填入已保存的账号密码，也可以删除本机凭据或退出会话。

账号密码不会交给管理器或 agent。应用不把登录 Cookie 附加到第三方封面和音频地址。原生播放页面不执行站点脚本；只有用户打开的官方登录网页使用系统 WebView。

## 构建与验证

```bash
cd resource/launcher/puretv
./gradlew :hifini:testDebugUnitTest :hifini:lintDebug :hifini:verifyReleaseSize
```

在仓库根目录运行 `node --test resource/apps/hifini/src/test/js/login-autofill.test.mjs` 可验证实际自动填充脚本的表单及域名检查（Node.js 22）。

Release 构建产物位于 `resource/apps/hifini/build/outputs/apk/release/`，发布资源使用 pureTV 证书另行签名。设置 `HIFINI_UI_CAPTURE_DIR` 可从原生 UI 测试导出中英文截图。解析测试使用用户提供的脱敏搜索片段及合成边界样本，来源说明见 [测试样本说明](src/test/resources/hifini/README.md)。

生产依赖为 jsoup（解析 HTML）与 ZXing Core（本机生成注册二维码）；音频交给 Android MediaPlayer。Release 开启代码和资源压缩，大小上限 5 MiB。封面缓存上限 4 MiB，单次图片下载上限 2 MiB；歌曲列表最多 50 首。第三方许可见 [NOTICE.md](NOTICE.md)。

**在线验证状态：** 开发环境访问 HiFiNi 首页、搜索、播放入口及用户提供的详情页时返回连接错误，尚未验证真实账号登录、在线搜索和音频播放。原生界面、解析样本和播放器状态测试不能替代电视实测。网站结构、验证要求、音频链接格式或地区网络限制可能影响使用；应用使用官方搜索／播放入口与页面明示的数据，不执行解密脚本或接入第三方解析服务。

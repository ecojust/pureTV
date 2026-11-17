# VsTV

电视直播应用，保留上游 ARM 与 x86_64 命名变体。

![应用介绍封面，非运行截图](thumb.png)

分类：影音。原作者信息：上游未提供，manifest的provider保留为null。

| APK下载（上游原文件名） | 实际版本 / versionCode | 字节数 | 最低SDK |
| --- | --- | ---: | ---: |
| [vstv-2.5.20-x86_64.apk](vstv-2.5.20-x86_64.apk?raw=1) | 2.5.20 / 200502099 | 9,388,695 | 21 |
| [vstv-2.5.20-arm.apk](vstv-2.5.20-arm.apk?raw=1) | 2.5.20 / 200502099 | 9,388,693 | 21 |

每份APK均保留原始二进制与签名，通过上游Git blob、SHA256、ZIP CRC及apksigner校验。未在实体电视运行；最低SDK来自APK声明，不表示已验证所有设备兼容性。

- 部分文件的 versionCode 相同，文件名变体和版本名不代表可自动判定升级顺序。
- 上游架构命名仅保留为文件名；APK实际同时含arm64-v8a、armeabi-v7a和x86_64库，以nativeCode为准。

[完整元数据](manifest.json) · [资源生成来源](assets.json) · [64×64 SVG](logo.svg) · [校验清单](SHA256SUMS.txt)

图标来源和转换方式见assets.json；thumb是生成的应用介绍封面，不是应用运行截图。

来源：[youhunwl/TVAPP](https://github.com/youhunwl/TVAPP/tree/08ec332c0a25e9ae97fb73d3b3e40784dab65fc3)。每份APK的固定提交原路径、真实包名/版本/架构、证书SHA256及校验输出均在manifest中记录。APK和原图标权利归原作者；详见[来源与许可说明](../../NOTICE.md)。

[返回分类](../README.md) · [全部收录](../../README.md)

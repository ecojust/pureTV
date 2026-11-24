# 电视商城的应用来源

从 0.1.3 起，电视商城和桌面客户端的 APK 市场都读取 `https://apps.b14f.com`。服务器在各分类顶层或其下一级目录发布 APK 后，两端刷新即可发现。每个分类列出同一目录、同一文件名主体的最近五个版本，以数字版本从新到旧排列。没有数字版本后缀的文件也会显示。[影音](https://apps.b14f.com/media/) · [游戏](https://apps.b14f.com/game/) · [启动器](https://apps.b14f.com/launcher/)

文件大小和变更标识来自服务器。目录中的 `manifest.json` 可提供发布者和 SHA-256。安装和更新要核对实际 APK 的包身份、签名与系统兼容性。文件名中的版本用于浏览，系统包的版本号用于判断能否更新。商城自身在服务器的 `media/putrtv-store/` 目录出现，和客户端遵循相同的分组规则。

## 离线目录

正常刷新通过后，商城保存一份私有缓存。网络不可用时优先使用上次成功刷新的目录，首次离线可浏览安装包内的市场快照。构建新版本前，运行以下命令从同一市场读取目录并核验签名 APK，再把生成的 `src/main/assets/catalog-snapshot.json` 随源码提交。

```bash
python3 tools/freeze-tv-market.py --build-tools /path/to/android-sdk/build-tools/34.0.0
```

快照记录生成时各 APK 的服务器路径、大小、摘要和 Android 包身份，可以在仓库的[商城验证记录](VALIDATION.md)核对发布时的目录规模。网络恢复后，用户可手动刷新以取得新增、替换或已下架的条目。

## 旧版商城升级

电视商城 0.1.0 至 0.1.2 使用 GitHub 上的兼容目录获取商城升级。发布新版签名 APK 后，维护者同步更新这些旧入口。

```bash
python3 tools/update-tv-store-catalog.py --build-tools /path/to/android-sdk/build-tools/34.0.0
python3 -m unittest discover -s tools -p test_tv_store_catalog.py
```

[0.1.0 与 0.1.1 兼容目录](../../../tv-store-catalog.json) · [0.1.2 兼容目录](../../../tv-store-catalog-v2.json)

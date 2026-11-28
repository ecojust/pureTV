# Android TV 游戏模板

可下载游戏共用 `android-host.zip`。它包含 Game Kit 的编译产物、Android 清单及资源表。客户端写入所选游戏的网页文件、标题、图标和独立包名，再用管理器本机保存的密钥作 APK v2 签名。

维护者可用仓库正式《霓虹飞车》APK 运行 `python3 desktop/scripts/prepare-android-game-host.py /path/to/neon-rush-0.1.6.apk` 复现该骨架。脚本核对正式目录的 SHA-256，保留宿主许可。[Game Kit 源码和构建](../../resource/game-kit/BUILD.md)

## 六款作者托管游戏的正式 APK 模板

Manager 在用户选择「生成电视 APK」时按游戏 ID 从 `parts.bin` 取出 `index.rs` 列出的片段，按顺序写入 APK 并核对整包 SHA-256。各款共用的 DEX、手柄资源等内容只存一份。Android 签名块、清单与每款独有的内容按原始字节保存，组装后与该款正式签名 APK 完全一致。用户的电脑无需安装 Android SDK 或持有签名密钥。启动生成的电视应用时需要联网加载作者游戏。

维护者使用项目已有的签名流水线更新模板。在主分支运行「Hosted games for Android TV」的单款游戏批量发布，取得包含六份正式 APK 和 `packages.json` 的目录，再从仓库根目录执行以下命令，将路径替换为本地位置。

```sh
python3 desktop/scripts/pack-game-templates.py \
    --signed-dir /path/to/signed \
    --build-tools /path/to/android-sdk/build-tools/34.0.0
```

生成器复用正式签名包验收工具，核查证书、包名、唯一游戏配置、中文标题、电视启动入口和签发记录，再逐字节核对重组结果。桌面 Rust 回归验证全部在线游戏都能用提交的模板生成正确的安装包。[宿主源码及构建说明](../../resource/apps/hosted-games/README.md) · [正式发布工作流](../../.github/workflows/hosted-games-tv.yml)

0.7.0 的模板包含 1,550,626 字节共用数据。六份原 APK、签发记录和哈希清单取自固定提交。[原始签名包与收据](https://github.com/ecojust/pureTV/tree/ec8ae301945dd4eb3046d9b94f2a6671cac14571) · [签发工作流](https://github.com/ecojust/pureTV/actions/runs/46111689982)

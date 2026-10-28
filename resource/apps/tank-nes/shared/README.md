# NES TV 共享实现 / Shared NES TV implementation

[Tank NES TV](../README.md) 与 [Jackal NES TV](../../jackal-nes/README.md) 是两个独立安装的应用。共享代码放在 Tank NES TV 目录下，由两个 Gradle 模块引用，不是第三个应用。

## 支持范围

- Android 8.0（API 26）及以上，使用系统 WebView。
- [JSNES 2.1.0](https://github.com/bfirsh/jsnes) 负责执行 ROM、渲染 256×240 画面并生成音频；核心通过 esbuild 0.25.12 转译为 Chrome 61 兼容语法后随 APK 打包，运行时无需下载脚本；转译不刻意修改模拟器行为。
- 接受未压缩的 `.nes` 文件，最大 16 MiB。导入时验证 iNES 标识、声明尺寸、机器类型、mapper 和区域；校验不通过的文件不会替换已经保存的 ROM。
- 使用 NTSC 时序（约 60.0988 帧/秒）。不接受带 trainer 的 ROM、PAL、Dendy、FDS 磁碟镜像、压缩包或扩展硬件格式。NTSC 与兼容的多区域 ROM 可以导入。
- 支持的 mapper：`0, 1, 2, 3, 4, 5, 7, 9, 11, 34, 38, 66, 71, 79, 94, 118, 119, 140, 180, 240, 241`。支持基本 NES 2.0 头，但不支持非零 submapper、指数表示的容量与额外控制器硬件。当前自写诊断程序覆盖 mapper 0 / 2，其余 mapper 依赖 JSNES 的实现，未逐一进行游戏验证。
- 两个应用各保存一个 ROM，保存在应用私有存储；导入新文件会替换本应用之前的文件。当前不提供即时存档、游戏进度保存或跨设备同步。

两个名称表示预期导入的游戏，应用不会根据文件名声称已经验证其内容。不同地区版本、修改版或特殊 mapper 的兼容性依赖 JSNES；当前测试没有覆盖原作商业 ROM 的完整流程。

## 控制与暂停

手机 START / SELECT 原样传给游戏；START 是否暂停取决于 ROM。电视菜单键可展开或收起导入、模拟器暂停与重启操作。模拟器暂停会停止运行和声音；重启会从 ROM 的开机状态重新开始，不是继续存档。

键盘方向键移动，Z / X 对应 A / B，Enter 对应 START，Shift 对应 SELECT。手机失去连接或页面切入后台会释放按键；只使用手机控制时，失去全部手机连接会暂停模拟。

## 源码组成

| 路径 | 用途 |
| --- | --- |
| `src/main/java/com/ecojust/nestv/` | Android 容器、二维码、房间服务、ROM 校验与私有存储 |
| `src/main/assets/vendor/jsnes.min.js` | 面向 Chrome 61 转译的 JSNES 2.1.0 核心 |
| `src/main/assets/nes-adapter.js` | ROM 检查、双人输入映射与模拟器适配 |
| `src/main/assets/nes-audio.js` | Web Audio 音频输出 |
| `src/main/assets/controller.*` | 手机摇杆、A/B、START/SELECT 与 ROM 导入 |
| `src/test/java/` | 存储、网络接口、鉴权与 Android 生命周期测试 |
| `tests/` | 模拟器和浏览器集成测试 |
| `licenses/` | JSNES 完整许可、来源与原始／转译文件校验值 |
| `tools/vendor-jsnes.cjs` | 校验上游文件并重建兼容 WebView 的核心脚本 |

游戏的图像和音乐来自导入的 ROM，不使用独立重写版的画面或音频资源。

## ROM 导入与存储

电视端通过系统文件选择器导入；没有可用文件选择器时可使用手机。手机端先扫描带随机房间令牌的二维码，再向本机房间服务传输文件：

| 请求 | 作用 |
| --- | --- |
| `GET /api/info?room=<token>` | 当前房间和已保存 ROM 的元数据 |
| `POST /api/rom?room=<token>` | 导入原始 ROM 二进制；`Content-Type: application/octet-stream`，`X-ROM-Name` 为 URL 编码的 `.nes` 文件名 |

导入接口校验房间令牌及请求 Origin，并限制文件长度。通过校验后以 `AtomicFile` 写入应用私有文件；写入或校验失败保留原文件。ROM 的读取 URL 由可信的电视页面桥接提供，不需要把文件上传到公网。

## 构建

从仓库根目录执行，需要 JDK 17、Android SDK 35、Build Tools 34.0.0：

```bash
cd resource/launcher/puretv
./gradlew :tank-nes:assembleDebug :tank-nes:verifyReleaseSize :tank-nes:testDebugUnitTest :tank-nes:lintDebug \
  :jackal-nes:assembleDebug :jackal-nes:verifyReleaseSize :jackal-nes:testDebugUnitTest :jackal-nes:lintDebug
```

使用明确的模块任务可以单独验证这两个应用。Release APK 输出在各应用的 `build/outputs/apk/release/`，上限 5 MiB；这些 Gradle 输出未签名。软件目录中的已发布 APK 使用 pureTV 发布证书签名。

## 重建兼容核心

APK 内的 `vendor/jsnes.min.js` 以 JSNES 2.1.0 npm 分发文件为输入，由 esbuild 0.25.12 使用 `target: chrome61`、`minify: true`、`legalComments: inline` 生成，并添加旧版 WebView 所需的 `globalThis` 别名。此步骤降低类字段等较新 JavaScript 语法，不刻意修改游戏或模拟器逻辑。原始包、输入文件及产物的 SHA-256 见 [JSNES 来源说明](licenses/JSNES-NOTICE.md)。

从仓库根目录安装锁定依赖，并解压来源说明中指定的 npm 包后，可以复现生成结果：

```bash
npm ci --prefix desktop
node resource/apps/tank-nes/shared/tools/vendor-jsnes.cjs /absolute/path/to/package/dist/jsnes.min.js
```

脚本会验证 esbuild 版本以及输入和输出文件哈希。生成脚本和完整第三方许可证均保存在仓库；APK 也包含核心许可证及来源说明。

## 自动化验证与截图

从仓库根目录执行：

```bash
node --test resource/apps/tank-nes/shared/tests/*.test.cjs
npm ci --prefix desktop
cd desktop && npx playwright install chromium && cd ..
NES_UI_CAPTURE_DIR=/tmp/puretv-nes-previews node resource/apps/tank-nes/shared/tests/browser.mjs
```

如果已有 Chromium，可通过 `CHROMIUM_PATH` 指定可执行文件。独立 CI 入口为 [NES ROM apps](../../../../.github/workflows/nes-rom.yml)。

测试 ROM 是测试代码现场生成的独立 6502 小程序，用来验证真实模拟器的画面、音频、P1/P2 输入和生命周期；它不含商业游戏代码、图像或音乐，也不随应用提供为游戏。浏览器测试导出中英文导入页与手机手柄页；诊断 ROM 的截图明确标为测试场景，不能作为《坦克大战》或《赤色要塞》原作运行的证明。

当前证据范围是 Node、Chromium 和 Android 测试环境。尚未完成实际电视上的帧率、声音延迟或原作全流程验证。

## 许可与来源

应用集成代码：仓库 [MIT 许可](../../../../LICENSE)。JSNES 核心：[Apache-2.0 许可](licenses/JSNES-LICENSE.txt)，[来源、作者和 SHA-256](licenses/JSNES-NOTICE.md)。用户导入的 ROM 不属于以上许可范围，仓库和 APK 不包含原作游戏 ROM。

## English

These two Android applications share this implementation but have separate package IDs and private ROM storage. JSNES 2.1.0 executes the imported ROM, renders its native 256×240 frame and generates audio. The bundled core is transformed with esbuild 0.25.12 to Chrome 61-compatible syntax and includes a `globalThis` alias for older WebViews. This compatibility transformation does not intentionally change emulator behavior. It is bundled locally, not fetched from a CDN.

Import one uncompressed `.nes` file per application, up to 16 MiB. Validation checks the cartridge header, declared sizes, console hardware, mapper and region before replacing a saved ROM. This integration uses NTSC timing, supports the mapper list above, and accepts basic compatible NES 2.0 headers. Trainer-bearing ROMs, PAL, Dendy, nonzero NES 2.0 submappers, exponent-encoded sizes, expansion hardware, FDS disk images and archive files are unsupported. ROM storage is not save-state or progress storage. Authored diagnostic ROMs cover mappers 0 and 2; the other listed mappers rely on JSNES and have not each been validated with a game.

START and SELECT are sent directly to the ROM; in-game pause behavior depends on that game. The TV Menu key toggles the emulator controls for importing, pausing and resetting. Emulator reset returns to the ROM boot state. Keyboard controls are arrows, Z / X for A / B, Enter for START and Shift for SELECT.

Use the module-specific Gradle commands above to build, lint and test these two applications independently. Release build outputs are unsigned; published APKs in the application directories use the pureTV release certificate. The standalone workflow builds only these two applications.

Node and browser tests use an independently authored diagnostic cartridge assembled in memory. It contains no commercial game code or assets. Captures of the import interface and phone controller show the actual bundled UI with test room data; diagnostic screenshots are labeled as tests. None is a physical-TV capture or evidence of a complete original-game playthrough.

The integration is MIT licensed. The JSNES 2.1.0 input and the compatibility-transformed bundle are Apache-2.0 licensed, with upstream, input and output hashes under `licenses/`. The `tools/vendor-jsnes.cjs` command above reproduces the bundle and verifies the transformer version and both file hashes. No commercial ROM is included. Original-game compatibility, frame rate and audio latency still require testing with the intended ROM on physical TV hardware.

# 原始多层素材目录的 Android 打包验证

六款入选游戏保留原模型、模块、worker、音频和字体的相对目录。只有注册表与 game.json 的显式资源政策完全匹配时，构建器才接受多层目录；原 Game Kit CLI 仍使用平铺资源和小包限制。

- `android-attempt-1`：真实编译生成了未签名 APK，但编译期间 root 修改了 builder，末尾的源码一致性检查正确拒绝。原日志及回执保留，不算冻结源码验证通过；首次执行脚本未独立归档。
- `android-attempt-2`：JDK 17、aapt2、D8 真实编译 Night Racer，前后完整输入清单一致，APK 中 30 份资产与组合输入逐字节相同。包为 22,452,256 字节，SHA256 `8e3a27992fff9dc5e5833ba933c1f4431b0deb4a949064f4e799a21b0173aa25`。
- `android-resource-tests.log`：15 项边界与字节测试通过，包含真实 Java 路径及 MIME 方法编译运行、默认行为、相对依赖、目录别名、符号链接、大小写冲突和预算限制。

该 APK 仅在本次临时目录中用于未签名打包检查，没有签名、安装或实体设备运行结论。新增 MainActivity Robolectric 用例尚未在本地运行；本地 Java 方法测试和 APK 编译不能代替它们。Mac/Windows 的资源复制检查与真实原生验证分别在相邻记录中说明。

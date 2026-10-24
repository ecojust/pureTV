# 电视启动器

每个启动器使用独立的软件文件夹，APK 不直接放在本级目录。当前提供 [Nova TV](nova/)（Apple TV 风格）与 [pureTV Launcher](puretv/)，作者、版本、APK 大小和封面见[资源表](../README.md)。

```text
launcher/
├── puretv/
│   ├── pureTV-版本.apk
│   ├── resource.json
│   ├── README.md
│   ├── LICENSE
│   ├── SHA256SUMS.txt
│   └── … 源码、源码归档或封面
└── 其他启动器/
    └── … 对应的 APK、说明和元数据
```

新增启动器时创建独立目录，至少提供真实 APK、`resource.json`、使用说明、许可证和校验文件。元数据说明作者、包名、版本、文件大小、签名、来源以及是否支持自定义；可以额外附对应源码和 `thumb.png` 封面。

自定义布局协议、接入约束和构建说明见[开发与协议 README](../README-development.md)。资源校验和索引生成会扫描所有启动器目录；仅声明支持协议不会自动实现管理器与启动器的读写接口。

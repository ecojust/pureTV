#!/usr/bin/env python3
"""Render README tables from APK resource metadata, without placeholder entries."""
import json
from pathlib import Path
from resource_catalog import catalog_directories
root=Path(__file__).resolve().parents[1]
entries=[(folder.relative_to(root/'resource').as_posix(),json.loads((folder/'resource.json').read_text())) for folder in catalog_directories(root)]
def tables(prefix):
    output=[]
    for kind,title in [('launcher','启动器'),('app','电视应用')]:
        output+=['### '+title,'']
        output+=['| 名称 | 作者 | 版本 | APK 大小 | '+('支持自定义' if kind=='launcher' else '用途')+' | 封面截图 |','| --- | --- | --- | --- | --- | --- |']
        for key,info in entries:
            if info['kind']!=kind:continue
            directory=prefix+key+'/'
            image=f'<img src="{directory+info["cover"]}" width="180" alt="{info["name"]} 界面">' if info.get('cover') else '—'
            extra=('是' if info.get('supportsLayoutJson') and info.get('layoutJsonVersion') in (2,3,4) else '否') if kind=='launcher' else info.get('description','电视应用')
            size=(root/'resource'/key/info['apk']).stat().st_size
            assert size==info['apkBytes']
            display=f'{size/1024/1024:.2f} MiB' if size>=1024*1024 else f'{size/1024:.1f} KiB'
            output.append(f'| [{info["name"]}]({directory}) | {info["author"]} | {info["version"]} | {display}（{size:,} B） | {extra} | {image} |')
        output+=['']
    return '\n'.join(output).rstrip()
p=root/'README.md';text=p.read_text();start='<!-- resource-index:start -->';end='<!-- resource-index:end -->';left=text.index(start)+len(start);right=text.index(end);p.write_text(text[:left]+'\n\n'+tables('resource/')+'\n\n'+text[right:])
(root/'resource/README.md').write_text('# 电视 APK 资源目录\n\n目录分为 `launcher/`（启动器）和 `apps/`（应用）。源码与 APK 放在同一软件目录。每个软件文件夹至少包含一个真实 APK，以及 resource.json、许可证和校验文件；可附对应源码及封面。点击软件名称进入文件夹下载。第三方 APK 保持上游原始二进制与签名。\n\n“支持自定义”指管理器可识别的 layout.json 接口，当前配套启动器使用 v4 users/system 协议。上游截图、纯 TV 渲染示例与相关许可见各文件夹说明。\n\n'+tables('')+'\n\n开发者请参阅 [开发与协议 README](README-development.md)，包含 layout.json 字段说明、画面对照、构建与测试。'+'\n\n维护校验：`python tools/resource_catalog.py --build-tools <Android Build Tools 34.0.0 目录>`。索引由 `python tools/update-resource-index.py` 根据资源元数据生成。\n')

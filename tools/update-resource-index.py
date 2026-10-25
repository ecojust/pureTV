#!/usr/bin/env python3
"""Render README tables from APK resource metadata, without placeholder entries."""
import json
from pathlib import Path
from resource_catalog import catalog_directories
root=Path(__file__).resolve().parents[1]
entries=[(folder.relative_to(root/'resource').as_posix(),json.loads((folder/'resource.json').read_text())) for folder in catalog_directories(root)]
LOCALES={
    'zh':{'launcher':'启动器','app':'电视应用','name':'名称','author':'作者','version':'版本','size':'APK 大小','custom':'支持自定义','purpose':'用途','preview':'封面截图','yes':'是','no':'否','alt':'{name} 界面','fallback':'电视应用'},
    'en':{'launcher':'Launchers','app':'TV apps','name':'Name','author':'Author','version':'Version','size':'APK size','custom':'Customizable','purpose':'Purpose','preview':'Preview','yes':'Yes','no':'No','alt':'{name} preview','fallback':'TV application'},
}
APP_PURPOSES_EN={
    'apps/music':'Native TV music player',
    'apps/shortvideo':'Short video player with remote control support',
    'apps/webtv':'Live TV and M3U player',
    'apps/tvbro':'TV browser with remote control support, using the system WebView',
    'apps/jellyfin-tv':'Android TV client for Jellyfin media servers',
}
def tables(prefix,locale='zh'):
    labels=LOCALES[locale]
    output=[]
    for kind in ('launcher','app'):
        output+=['### '+labels[kind],'']
        columns=('name','author','version','size','custom' if kind=='launcher' else 'purpose','preview')
        output+=['| '+' | '.join(labels[key] for key in columns)+' |','| --- | --- | --- | --- | --- | --- |']
        for key,info in entries:
            if info['kind']!=kind:continue
            directory=prefix+key+'/'
            image=f'<img src="{directory+info["cover"]}" width="180" alt="{labels["alt"].format(name=info["name"])}">' if info.get('cover') else '—'
            if kind=='launcher':
                extra=labels['yes'] if info.get('supportsLayoutJson') and info.get('layoutJsonVersion') in (2,3,4,5) else labels['no']
            elif locale=='en':
                extra=info.get('descriptionEn') or APP_PURPOSES_EN.get(key,labels['fallback'])
            else:
                extra=info.get('description',labels['fallback'])
            size=(root/'resource'/key/info['apk']).stat().st_size
            assert size==info['apkBytes']
            display=f'{size/1024/1024:.2f} MB' if size>=1024*1024 else f'{size/1024:.1f} KB'
            output.append(f'| [{info["name"]}]({directory}) | {info["author"]} | {info["version"]} | {display} | {extra} | {image} |')
        output+=['']
    return '\n'.join(output).rstrip()
for filename,locale in [('README.md','zh'),('README.en.md','en')]:
    p=root/filename;text=p.read_text();start='<!-- resource-index:start -->';end='<!-- resource-index:end -->';left=text.index(start)+len(start);right=text.index(end);p.write_text(text[:left]+'\n\n'+tables('resource/',locale)+'\n\n'+text[right:])
(root/'resource/README.md').write_text('# 电视 APK 资源目录\n\n目录分为 `launcher/`（启动器）和 `apps/`（应用）。源码与 APK 放在同一软件目录。每个软件文件夹至少包含一个真实 APK，以及 resource.json、许可证和校验文件；可附对应源码及封面。点击软件名称进入文件夹下载。第三方 APK 保持上游原始二进制与签名。\n\n“支持自定义”指管理器可识别的 layout.json 接口，当前配套启动器使用 v5 users/system 协议。上游截图、纯 TV 渲染示例与相关许可见各文件夹说明。\n\n'+tables('')+'\n\n开发者请参阅 [开发与协议 README](README-development.md)，包含 layout.json 字段说明、画面对照、构建与测试。'+'\n\n维护校验：`python tools/resource_catalog.py --build-tools <Android Build Tools 34.0.0 目录>`。索引由 `python tools/update-resource-index.py` 根据资源元数据生成。\n')

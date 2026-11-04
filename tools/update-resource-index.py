#!/usr/bin/env python3
"""Render four-column README galleries from resource metadata and English data."""
import json,re
from html import escape
from pathlib import Path
from resource_catalog import catalog_directories
root=Path(__file__).resolve().parents[1]
entries=[(folder.relative_to(root/'resource').as_posix(),json.loads((folder/'resource.json').read_text())) for folder in catalog_directories(root)]
counts={kind:sum(info['kind']==kind for _,info in entries) for kind in ('launcher','app')}
LOCALES={
    'zh':{'launcher':'启动器','media':'应用-影音','game':'应用-游戏','alt':'{name} 界面'},
    'en':{'launcher':'Launchers','media':'Apps - Media','game':'Apps - Games','alt':'{name} preview'},
}
ENGLISH=json.loads((root/'tools/resource-index.en.json').read_text())
# Persist creation order so version updates and checkout dates cannot reorder cards.
RESOURCE_ORDER=json.loads((root/'tools/resource-order.json').read_text())
# Media apps have no game manifest or bundled game entry point.
MEDIA_APPS={'apps/cctv','apps/hifini','apps/shortvideo','apps/webtv'}

def section(key,info):
    if info['kind']=='launcher':return 'launcher'
    if key in MEDIA_APPS:return 'media'
    directory=root/'resource'/key
    if (directory/'game.json').is_file() or (directory/'src/main/assets/game.js').is_file():return 'game'
    raise ValueError(f'{key}: classify the new app before generating the README index')

def ordered_groups():
    """Validate the oldest-first manifest and return newest-first resource groups."""
    groups=('launcher','media','game')
    assert set(RESOURCE_ORDER)==set(groups),'Expected launcher, media and game creation order'
    indexed=dict(entries)
    keys=[key for group in groups for key in RESOURCE_ORDER[group]]
    assert len(keys)==len(set(keys)),'Duplicate resource in tools/resource-order.json'
    missing=set(indexed)-set(keys)
    stale=set(keys)-set(indexed)
    assert not missing and not stale,f'Update tools/resource-order.json: missing={sorted(missing)}, stale={sorted(stale)}'
    for group in groups:
        assert all(section(key,indexed[key])==group for key in RESOURCE_ORDER[group]),f'{group}: resource assigned to the wrong group'
    return {group:[(key,indexed[key]) for key in reversed(RESOURCE_ORDER[group])] for group in groups}

def validate_english():
    """Require complete English entries and captures before writing any index."""
    for key,info in entries:
        translated=ENGLISH[key]
        fields=('name','author','description') if info['kind']=='app' else ('name','author')
        for field in fields:
            value=translated[field]
            assert isinstance(value,str) and value.strip(),f'{key}: missing English {field}'
            assert not re.search(r'[\u3400-\u9fff]',value),f'{key}: untranslated English {field}'
        expected=f'docs/previews/en/{info["kind"]}-{key.split("/",1)[1]}.png'
        assert translated['cover']==expected,f'{key}: use its dedicated English preview'
        assert (root/expected).is_file(),f'{key}: missing English preview {expected}'

def root_readme_groups(groups):
    """Feature a temporary selection from the hundred games, keeping older games."""
    featured=json.loads((root/'tools/readme-featured-games.json').read_text())
    progress=json.loads((root/'resource/game-kit/progress.json').read_text())
    hundred={'apps/'+game['id'] for game in progress['games']}
    assert len(featured)==len(set(featured)),'Duplicate featured game'
    assert set(featured)<=hundred,'Featured games must belong to the hundred-game collection'
    return {**groups,'game':[(key,info) for key,info in groups['game'] if key not in hundred or key in featured]}

def tables(prefix,groups,locale='zh'):
    labels=LOCALES[locale]
    output=[]
    for group in ('launcher','media','game'):
        count=len(groups[group])
        suffix=f'（{count}）' if locale=='zh' else f' ({count})'
        output+=['### '+labels[group]+suffix,'']
        output+=['<table>']
        cells=[]
        for key,info in groups[group]:
            directory=prefix+key+'/'
            translated=ENGLISH[key] if locale=='en' else info
            name=translated['name']
            cover=translated['cover'] if locale=='en' else directory+info['cover'] if info.get('cover') else None
            alt=labels['alt'].format(name=name)
            image=f'<img src="{escape(cover,quote=True)}" width="180" alt="{escape(alt,quote=True)}">' if cover else '—'
            size=(root/'resource'/key/info['apk']).stat().st_size
            assert size==info['apkBytes']
            link=escape(directory,quote=True)
            cells.append(f'    <td align="center" valign="top" width="25%"><a href="{link}">{image}<br>{escape(name)}</a></td>')
        for start in range(0,len(cells),4):
            row=cells[start:start+4]
            row+=['    <td width="25%"></td>']*(4-len(row))
            output+=['  <tr>',*row,'  </tr>']
        output+=['</table>','']
    return '\n'.join(output).rstrip()
def main():
    validate_english()
    groups=ordered_groups()
    featured_groups=root_readme_groups(groups)
    for filename,locale in [('README.md','zh'),('README.en.md','en')]:
        p=root/filename;text=p.read_text()
        for kind,label in [('launcher','launchers'),('app','apps')]:
            text,replaced=re.subn(r'(https://img\.shields\.io/badge/'+label+r'-)\d+(?=-)',lambda match:match[1]+str(counts[kind]),text)
            assert replaced==1,f'{filename}: expected one {label} count badge'
        start='<!-- resource-index:start -->';end='<!-- resource-index:end -->';left=text.index(start)+len(start);right=text.index(end);p.write_text(text[:left]+'\n\n'+tables('resource/',featured_groups,locale)+'\n\n'+text[right:])
    (root/'resource/README.md').write_text('# 电视 APK 资源目录\n\n目录分为 `launcher/`（启动器）和 `apps/`（应用）。源码与 APK 放在同一软件目录。每个软件文件夹至少包含一个真实 APK，以及 resource.json、许可证和校验文件；可附对应源码及封面。点击软件名称进入文件夹下载。当前收录桔子桑（ecojust）开发的启动器和电视应用。\n\n启动器布局自定义使用管理器可识别的 layout.json 接口，当前配套启动器使用 v5 users/system 协议。界面预览与相关许可见各文件夹说明。\n\n'+tables('',groups)+'\n\n开发者请参阅 [开发与协议 README](README-development.md)，包含 layout.json 字段说明、画面对照、构建与测试。'+'\n\n维护校验：`python tools/resource_catalog.py --build-tools <Android Build Tools 34.0.0 目录>`。索引由 `python tools/update-resource-index.py` 根据资源元数据生成。\n')

if __name__=='__main__':
    main()

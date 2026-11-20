#!/usr/bin/env python3
"""Render four-column README galleries from resource metadata and English data."""
import json,re
from collections import Counter
from html import escape
from pathlib import Path
from resource_catalog import catalog_directories
from readme_game_gallery import card_link, card_table, game_catalog, game_index
root=Path(__file__).resolve().parents[1]
entries=[(folder.relative_to(root/'resource').as_posix(),json.loads((folder/'resource.json').read_text())) for folder in catalog_directories(root)]
counts={kind:sum(info['kind']==kind for _,info in entries) for kind in ('launcher','app')}
LOCALES={
    'zh':{'launcher':'启动器','media':'应用-影音','game':'应用-游戏','tools':'应用-工具','alt':'{name} 界面'},
    'en':{'launcher':'Launchers','media':'Apps - Media','game':'Apps - Games','tools':'Apps - Tools','alt':'{name} preview'},
}
ENGLISH=json.loads((root/'tools/resource-index.en.json').read_text())
# Persist creation order so version updates and checkout dates cannot reorder cards.
RESOURCE_ORDER=json.loads((root/'tools/resource-order.json').read_text())
# Media apps have no game manifest or bundled game entry point.
MEDIA_APPS={'apps/opera','apps/bilibili','apps/cctv','apps/hifini','apps/shortvideo','apps/webtv'}
TOOL_APPS={'apps/putrtv-store'}

def section(key,info):
    if info['kind']=='launcher':return 'launcher'
    if key in MEDIA_APPS:return 'media'
    if key in TOOL_APPS:return 'tools'
    directory=root/'resource'/key
    if (directory/'game.json').is_file() or (directory/'src/main/assets/game.js').is_file():return 'game'
    raise ValueError(f'{key}: classify the new app before generating the README index')

def ordered_groups():
    """Validate the oldest-first manifest and return newest-first resource groups."""
    groups=('launcher','media','game','tools')
    assert set(RESOURCE_ORDER)==set(groups),'Expected launcher, media, game and tools creation order'
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

def resource_card(key, info, prefix, locale, show_download=False):
    directory = prefix + key + '/'
    translated = ENGLISH[key] if locale == 'en' else info
    name = translated['name']
    cover = translated.get('cover')
    if cover and locale == 'zh':
        cover = directory + cover
    apk = info['apk']
    assert (root / 'resource' / key / apk).stat().st_size == info['apkBytes']
    alt = '' if prefix == 'resource/' else LOCALES[locale]['alt'].format(name=name)
    content = card_link(directory, cover, name, alt)
    if show_download:
        link = escape(directory + apk + '?raw=1')
        download = '下载' if locale == 'zh' else 'Download'
        content += (f'<br>{escape(translated["description"])}<br>Android TV'
                    f'<br><a href="{link}">{download} {escape(info["version"])} APK</a>')
    return content


def management_table(tool_apps, locale):
    version = '0.5.9'
    release = f'https://github.com/ecojust/pureTV/releases/tag/desktop-v{version}'
    if locale == 'zh':
        description = '在电脑上管理电视应用和启动器'
        platforms = 'Windows、macOS、Linux'
        guide = 'docs/guide/README.md#安装与升级电脑管理器'
        download = '下载'
    else:
        description = 'Manage TV apps and launchers from a computer'
        platforms = 'Windows, macOS, Linux'
        guide = 'docs/guide/README.en.md#install-or-upgrade-the-desktop-manager'
        download = 'Download'
    manager = card_link(guide, f'docs/previews/manager-{locale}.png', 'pureTV Manager', '')
    manager += f'<br>{description}<br>{platforms}<br><a href="{release}">{download} {version}</a>'
    cards = [manager]
    cards.extend(resource_card(key, info, 'resource/', locale, show_download=True) for key, info in tool_apps)
    return card_table(cards)


def tables(prefix,groups,locale='zh'):
    labels=LOCALES[locale]
    output=[]
    for group in groups:
        count=len(groups[group])
        suffix=f'（{count}）' if locale=='zh' else f' ({count})'
        output+=['### '+labels[group]+suffix,'']
        cards = [resource_card(key, info, prefix, locale) for key, info in groups[group]]
        output += [card_table(cards), '']
    return '\n'.join(output).rstrip()

def replace_index(text, name, markup):
    start = f'<!-- {name}:start -->'
    end = f'<!-- {name}:end -->'
    assert text.count(start) == text.count(end) == 1, f'Expected one {name} marker pair'
    left = text.index(start) + len(start)
    right = text.index(end, left)
    return text[:left] + '\n\n' + markup + '\n\n' + text[right:]


def main():
    validate_english()
    groups = ordered_groups()
    home_resources = {key: groups[key] for key in ('launcher', 'media')}
    genres = json.loads((root/'tools/readme-app-games.json').read_text())
    catalog = game_catalog(genres, dict(groups['game']), ENGLISH, root)
    rendered = {}
    for filename,locale in [('README.md','zh'),('README.en.md','en')]:
        p=root/filename;text=p.read_text()
        for kind,label in [('launcher','launchers'),('app','apps')]:
            text,replaced=re.subn(r'(https://img\.shields\.io/badge/'+label+r'-)\d+(?=-)',lambda match:match[1]+str(counts[kind]),text)
            assert replaced<=1,f'{filename}: duplicate {label} count badge'
        text = replace_index(text, 'management-index', management_table(groups['tools'], locale))
        text = replace_index(text, 'resource-index', tables('resource/', home_resources, locale))
        text = replace_index(text, 'game-index', game_index(catalog, locale))
        page_cards = Counter(re.findall(r'<a\s+href="([^"]+)">\s*<img\b', text))
        for genre in catalog:
            for card in genre['cards']:
                assert page_cards[card['page']] == 1, f'{filename}: expected one image card for {card["page"]}'
        rendered[p] = text
    rendered[root/'resource/README.md'] = ('# 电视 APK 资源目录\n\n目录分为 `launcher/`（启动器）和 `apps/`（应用）。源码与 APK 放在同一软件目录。每个软件文件夹至少包含一个真实 APK，以及 resource.json、许可证和校验文件；可附对应源码及封面。点击软件名称进入文件夹下载。当前收录桔子桑（ecojust）开发的启动器和电视应用。\n\n启动器布局自定义使用管理器可识别的 layout.json 接口，当前配套启动器使用 v5 users/system 协议。界面预览与相关许可见各文件夹说明。\n\n'+tables('',groups)+'\n\n开发者请参阅 [开发与协议 README](README-development.md)，包含 layout.json 字段说明、画面对照、构建与测试。'+'\n\n维护校验：`python tools/resource_catalog.py --build-tools <Android Build Tools 34.0.0 目录>`。索引由 `python tools/update-resource-index.py` 根据资源元数据生成。\n')
    for path, content in rendered.items():
        path.write_text(content)

if __name__=='__main__':
    main()

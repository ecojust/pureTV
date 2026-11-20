"""Render README card tables and the bilingual controller-game catalog."""
from html import escape
from pathlib import Path
import re


def game_catalog(genres, resources, english, root):
    """Resolve resource metadata once so both languages share the same downloads."""
    catalog = []
    genre_ids = set()
    pages = set()
    for genre in genres:
        genre_id = genre['id']
        assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', genre_id), f'Invalid game genre ID: {genre_id}'
        assert genre_id not in genre_ids, f'Duplicate game genre: {genre_id}'
        assert genre['zh'] and genre['en'] and genre['games'], f'{genre_id}: missing name or games'
        genre_ids.add(genre_id)
        cards = []
        for item in genre['games']:
            if 'resource' in item:
                key = item['resource']
                assert key in resources and 'page' not in item, f'{key}: expected a game in the resource catalog'
                info = resources[key]
                page = f'resource/{key}/'
                titles = {'zh': info['name'], 'en': english[key]['name'], **item.get('title', {})}
                covers = {'zh': page + info['cover'], 'en': english[key]['cover'], **item.get('cover', {})}
                downloads = {'apk': page + info['apk'] + '?raw=1'}
                controller = bool(info.get('wifiController'))
                if 'macos' in item:
                    dmg = Path(item['macos'])
                    assert not dmg.is_absolute() and '..' not in dmg.parts and dmg.suffix == '.dmg', f'{key}: invalid DMG path'
                    assert (root / page / dmg).is_file(), f'{key}: missing game download {dmg}'
                    downloads['macos'] = page + dmg.as_posix() + '?raw=1'
            else:
                page = item['page']
                assert re.fullmatch(r'joystick-games/[a-z0-9-]+/', page), f'Invalid game page: {page}'
                # This directory contains the standalone pureTV controller ports.
                controller = True
                titles = item['title']
                covers = item['cover']
                if isinstance(covers, str):
                    covers = {'zh': covers, 'en': covers}
                downloads = {'apk': item['apk']}
                downloads.update({platform: item[platform] for platform in ('macos', 'windows') if platform in item})

            assert page not in pages, f'Duplicate game page: {page}'
            assert all(titles.get(lang) and covers.get(lang) for lang in ('zh', 'en')), f'{page}: missing title or cover'
            assert all(isinstance(url, str) and url.strip() for url in downloads.values()), f'{page}: empty download URL'
            preview = item.get('macosPreview', False)
            assert not preview or 'macos' in downloads, f'{page}: missing macOS preview download'
            pages.add(page)
            cards.append({'page': page, 'titles': titles, 'covers': covers, 'downloads': downloads,
                          'controller': controller})
        catalog.append({'id': genre_id, 'zh': genre['zh'], 'en': genre['en'], 'cards': cards})
    return catalog


PLATFORM_ICONS = {
    'apk': ('android-tv', 'Android TV', 'APK'),
    'macos': ('macos', 'macOS', 'DMG'),
    'windows': ('windows', 'Windows x64', 'EXE'),
}


def support_icon(name, alt=''):
    return f'<img src="docs/branding/platforms/{name}.png" width="22" height="22" alt="{escape(alt)}">'


def card_link(page, cover, title, alt):
    image = f'<img src="{escape(cover)}" width="180" alt="{escape(alt)}">' if cover else '—'
    return f'<a href="{escape(page)}">{image}<br>{escape(title)}</a>'


def game_card(card, locale):
    title = re.sub(r'\s*TV$', '', card['titles'][locale].strip(), flags=re.IGNORECASE).rstrip()
    # The adjacent name labels the link even if the cover fails to load.
    page = card_link(card['page'], card['covers'][locale], title, '')
    icons = []
    for platform, url in card['downloads'].items():
        icon, system, package = PLATFORM_ICONS[platform]
        label = f'{title} {system} {package}'
        content = support_icon(icon, label)
        icons.append(f'<a href="{escape(url)}" title="{escape(label)}">{content}</a>')
    if card['controller']:
        if locale == 'zh':
            guide = 'docs/guide/README.md#安装游戏与连接手柄'
            label = '支持手柄，查看连接说明'
        else:
            guide = 'docs/guide/README.en.md#install-a-game-and-connect-a-controller'
            label = 'Controller supported. View setup guide'
        icons.append(f'<a href="{guide}" title="{label}">{support_icon("controller", label)}</a>')
    return f'{page}<br>{" ".join(icons)}'


def card_table(cards):
    """Give GitHub's shrink-to-fit tables the same width even with one card."""
    lines = ['<table>']
    for start in range(0, len(cards), 4):
        row = cards[start:start + 4]
        lines.append('  <tr>')
        # 180px cover plus GitHub's cell padding and border.
        for content in row + [''] * (4 - len(row)):
            lines.append(f'    <td align="center" valign="top" width="207">{content}</td>')
        lines.append('  </tr>')
    lines.append('</table>')
    return '\n'.join(lines)


def game_index(catalog, locale):
    cards = [card for genre in catalog for card in genre['cards']]
    total = sum(card['controller'] for card in cards)
    android, macos, windows = [sum(key in card['downloads'] for card in cards) for key in ('apk', 'macos', 'windows')]
    if locale == 'zh':
        summary = f'**{total} 款手柄游戏** · Android TV {android} 款 · macOS {macos} 款 · Windows x64 {windows} 款'
    else:
        summary = f'**{total} controller games** · Android TV ({android}) · macOS ({macos}) · Windows x64 ({windows})'

    headings = []
    sections = []
    for genre in catalog:
        count = len(genre['cards'])
        suffix = f'（{count}）' if locale == 'zh' else f' ({count})'
        heading = genre[locale] + suffix
        anchor = 'controller-' + genre['id']
        headings.append(f'[{heading}](#{anchor})')
        genre_cards = [game_card(card, locale) for card in genre['cards']]
        sections.extend([f'<a id="{anchor}"></a>', '', '### ' + heading, '', card_table(genre_cards), ''])
    legend = [f'{support_icon(icon)} {system}' for icon, system, _ in PLATFORM_ICONS.values()]
    controller_label = '支持手柄' if locale == 'zh' else 'Controller supported'
    legend.append(f'{support_icon("controller")} {controller_label}')
    return '\n'.join([summary, '', ' · '.join(headings), '', *sections, ' · '.join(legend)])

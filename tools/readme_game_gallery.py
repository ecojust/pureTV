"""Read and render the shared controller-game catalog for both homepages."""
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
                if 'macos' in item:
                    dmg = Path(item['macos'])
                    assert not dmg.is_absolute() and '..' not in dmg.parts and dmg.suffix == '.dmg', f'{key}: invalid DMG path'
                    assert (root / page / dmg).is_file(), f'{key}: missing game download {dmg}'
                    downloads['macos'] = page + dmg.as_posix() + '?raw=1'
            else:
                page = item['page']
                assert re.fullmatch(r'joystick-games/[a-z0-9-]+/', page), f'Invalid game page: {page}'
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
            cards.append({'page': page, 'titles': titles, 'covers': covers, 'downloads': downloads, 'macosPreview': preview})
        catalog.append({'id': genre_id, 'zh': genre['zh'], 'en': genre['en'], 'cards': cards})
    return catalog


def game_card(card, locale):
    title = card['titles'][locale]
    alt = title + ('游戏画面' if locale == 'zh' else ' gameplay')
    image = f'<img src="{escape(card["covers"][locale])}" width="180" alt="{escape(alt)}">'
    page = f'<a href="{escape(card["page"])}">{image}<br>{escape(title)}</a>'
    labels = {'apk': 'APK', 'macos': 'macOS', 'windows': 'Windows'}
    if card['macosPreview']:
        labels['macos'] = 'macOS 预览' if locale == 'zh' else 'macOS preview'
    links = [f'<a href="{escape(url)}">{labels[platform]}</a>' for platform, url in card['downloads'].items()]
    return f'    <td align="center" valign="top" width="25%">{page}<br>{" · ".join(links)}</td>'


def table_rows(cells):
    """Keep four equally sized columns, including the last row."""
    for start in range(0, len(cells), 4):
        row = cells[start:start + 4]
        row += ['    <td width="25%"></td>'] * (4 - len(row))
        yield from ['  <tr>', *row, '  </tr>']


def game_index(catalog, locale):
    cards = [card for genre in catalog for card in genre['cards']]
    total = len(cards)
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
        sections.extend([f'<a id="{anchor}"></a>', '', '### ' + heading, '', '<table>'])
        cells = [game_card(card, locale) for card in genre['cards']]
        sections.extend(table_rows(cells))
        sections.extend(['</table>', ''])
    return '\n'.join([summary, '', ' · '.join(headings), '', *sections]).rstrip()

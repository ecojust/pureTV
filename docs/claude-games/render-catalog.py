#!/usr/bin/env python3
"""Render standalone catalog pages from catalog.json, or check their contents."""
import argparse
import collections
import json
from pathlib import Path

DIRECTORY = Path(__file__).resolve().parent
GENRES = {
    '竞速与体育': ('racing-and-sports', 'Racing and sports'),
    '动作、角色扮演与探索': ('action-rpg-and-exploration', 'Action, role-playing and exploration'),
    '平台、弹幕与街机': ('platformers-shoot-em-ups-and-arcade', 'Platformers, shoot ’em ups and arcade'),
    '策略、塔防与卡牌': ('strategy-tower-defense-and-cards', 'Strategy, tower defense and cards'),
    '解谜与益智': ('puzzles-and-logic', 'Puzzles and logic'),
    '经营、沙盒与休闲': ('management-sandbox-and-casual', 'Management, sandbox and casual'),
    '音乐与节奏': ('music-and-rhythm', 'Music and rhythm'),
    '单键街机': ('one-button-arcade', 'One-button arcade'),
}


def esc(value):
    return str(value).replace('|', '&#124;').replace('\n', ' ').replace('\r', ' ')


def link(label, url):
    return '[' + esc(label) + '](' + url + ')'


def render(data):
    games = data['games']
    counts = data['categoryCounts']
    if (set(counts) != set(GENRES) or counts != dict(collections.Counter(g['category'] for g in games))
            or data['count'] != len(games)
            or data['repositoryCount'] != len({g['repository'].casefold() for g in games})):
        raise ValueError('Category, game or repository counts differ from catalog.json')
    lines = [f'# Claude 游戏参考清单（{data["count"]} 项 / {data["repositoryCount"]} 个仓库）', '', '[English guide](catalog.en.md) · [结构化数据](catalog.json) · [来源说明](README.md)', '',
             '本轮继续搜索 GitHub，新增 **79 项**，按玩法分为以下 8 类。新增条目排在各分类前面；点击展开可查看源码、玩法、运行入口、Claude 依据和许可。', '',
             '优先看看 **Voxel Musou（体素无双）、Inkline Town、Fall Line、Hollow Crown、Demolition Derby、Spirit Call、Solder & Rain、Rainglass**：分别是三国无双、城市经营、开放雪山滑雪、像素 RPG、碰撞赛车、元素小队动作、电子维修和雨窗休闲。', '',
             '按玩法完整度、实际源码、可运行入口和画面资料初筛，核对作者制作说明或确实修改游戏源码的 Claude 署名提交。Claude 参与不表示全部代码、美术和音乐均由它独立生成。**尚未逐款完整试玩；HTTP 可达不等于游戏运行通过。⭐ 是各条目检查时的仓库星标，新增项检查于 2026-11-19，原301项保留2026-11-17快照。**', '',
             '镜像、迁址、重命名和同一游戏的多个版本不重复计数；合集中的独立玩法可分列，相近模式按一项合并。许可证和运行条件分别标明，清单包含网页、原生引擎与特殊宿主项目，不代表均能直接安装到电视。核查与筛选记录见[来源说明](README.md)。', '',
             '九款赛车选自本次扩充前已登记的 **31 个候选**，见[赛车对比与三平台适配记录](../racing-nine/README.md)。原93项已完成[逐项评估](tv-assessment.md)，其余批量适配按用户要求暂停；新增参考不会自动加入适配任务。已交付安装包见[手柄游戏目录](../../joystick-games/README.md)，参考条目数不等于已发布游戏数。', '']
    for category, count in data['categoryCounts'].items():
        lines += [f'<a id="{GENRES[category][0]}"></a>', '', '<details open>' if category == '竞速与体育' else '<details>',
                  f'<summary><strong>{category}（{count}）</strong></summary>', '',
                  '| 游戏与源码 | 玩法与看点 | 运行方式 / 入口 | Claude 依据 / 许可 |',
                  '| --- | --- | --- | --- |']
        for game in (g for g in games if g['category'] == category):
            title = link(game['title'], game['sourceUrl']) + f' · ⭐ {game["stars"]}'
            runtime = esc(game['runtimeLabel'])
            demo = game['demo']
            if demo.get('url') and demo.get('httpStatus') == 200:
                runtime += ' · ' + link(demo.get('label', '演示'), demo['url'])
            else:
                runtime += ' · 从源码运行'
            evidence = link('Claude 依据', game['claudeEvidence']['url']) + ' · '
            evidence += link(game['licenseLabel'], game['license']['url']) if game['license'].get('url') else esc(game['licenseLabel'])
            lines.append('| ' + title + ' | ' + esc(game['summary']) + ' | ' + runtime + ' | ' + evidence + ' |')
        lines += ['', '</details>', '']
    lines += ['继续发现候选可参考 [Awesome AI-Built Games](https://github.com/lappemic/awesome-ai-built-games)、[Frontier Games](https://github.com/theolundqvist/frontier-games) 和 [Opus 5.5 Games](https://github.com/gamingnews5/awesome-opus-5.5-games)。这些聚合目录可能混有其他模型、重复项目或未核实作品，不计入上述数量。']

    english = [
        '# Claude-assisted game references', '',
        f"The [full catalog](catalog.md) lists {data['count']} games from {data['repositoryCount']} GitHub repositories. Each entry links to the original source, describes the gameplay and how to run it, and records the evidence of Claude’s involvement and the available license information.", '',
        '## Browse by genre', '',
    ]
    for category, count in counts.items():
        anchor, title = GENRES[category]
        english.append(f'- [{title} ({count})](catalog.md#{anchor})')
    english += [
        '', '## Sources and scope', '',
        'The November 19, 2026 expansion added 79 references, including Voxel Musou, Inkline Town, Fall Line, Hollow Crown, Demolition Derby, Spirit Call, Solder & Rain and Rainglass. Repository stars are dated snapshots from November 17 for the preceding 301 entries and November 19 for the expansion.', '',
        'The selection draws on original code, author statements or Claude-signed commits that changed game code, and available visual material. Demo availability was checked separately from playtesting, TV compatibility and redistribution rights. [Source and review records](README.md) · [Machine-readable catalog](catalog.json)', '',
        'The [nine-racer project](../racing-nine/README.md) selected games from 31 candidates. The remaining bulk ports from the original 93-entry [assessment](tv-assessment.md) are paused. Downloadable adaptations are listed in the [controller game directory](../../joystick-games/README.md).',
    ]
    return {'catalog.md': '\n'.join(lines) + '\n', 'catalog.en.md': '\n'.join(english) + '\n'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Report stale or missing pages without writing them.')
    args = parser.parse_args()
    pages = render(json.loads((DIRECTORY / 'catalog.json').read_text(encoding='utf-8')))
    for name, expected in pages.items():
        path = DIRECTORY / name
        if path.is_file() and path.read_bytes() == expected.encode('utf-8'):
            continue
        if args.check:
            raise SystemExit(f'{name} differs from catalog.json. Run render-catalog.py to regenerate it.')
        path.write_bytes(expected.encode('utf-8'))


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Select registered catalog batches and run both immutable installed-APK scenarios."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

spec = importlib.util.spec_from_file_location('joystick_build', Path(__file__).with_name('android-build.py'))
build = importlib.util.module_from_spec(spec); spec.loader.exec_module(build)


def select(batch, games):
    registry = build.registry_data((build.ROOT / build.REGISTRY).read_text())
    packages = build.registered_packages(data=registry)
    assert batch in registry.get('batches', {}), 'Unknown registered batch'
    batch_games = registry['batches'][batch]
    assert isinstance(batch_games, list) and batch_games and len(batch_games) == len(set(batch_games))
    selected = [game.strip() for game in games.split(',')] if games else batch_games
    assert isinstance(selected, list) and selected and len(selected) == len(set(selected))
    assert all(slug in batch_games and slug in packages and slug not in build.LEGACY_PACKAGES for slug in selected)
    return selected


def runtime(args):
    meta = build.metadata(args.game)
    assert args.game not in build.LEGACY_PACKAGES
    confirm_install = getattr(args, 'confirm_backroad_install', 'false') == 'true'
    assert not confirm_install or args.game == 'backroad-rally', 'Installation confirmation is Backroad-only'
    outcomes = []
    normal_only = getattr(args, 'normal_only', False)
    assert not normal_only or args.game == 'kart-royale'
    for mode in (('normal',) if normal_only else ('normal', 'occupied')):
        cmd = [sys.executable, str(build.ROOT / 'joystick-games/qa/android/run.py'), '--game', args.game,
               '--apk', str(args.input / 'packages' / args.game / (args.game + '-' + meta['version'] + '.apk')),
               '--observer', str(args.input / 'observers' / args.game / ('observer-' + args.game + '.apk')),
               '--output', str(args.output / (args.game + '-' + mode)), '--adb', args.adb]
        if mode == 'occupied': cmd += ['--occupy-default-port']
        if confirm_install: cmd += ['--confirm-backroad-install']
        outcomes.append({'mode': mode, 'exitCode': subprocess.run(cmd, check=False).returncode})
    build.write(args.output / (args.game + '-outcomes.json'), outcomes)
    assert all(item['exitCode'] == 0 for item in outcomes), 'Original scenario failures retained'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    subs = parser.add_subparsers(dest='command', required=True)
    p = subs.add_parser('select'); p.add_argument('--batch', default='one-button-01'); p.add_argument('--games')
    p = subs.add_parser('runtime'); p.add_argument('--game', required=True, choices=build.PACKAGES)
    for name in ('input', 'output'): p.add_argument('--' + name, type=Path, required=True)
    p.add_argument('--adb', default='adb')
    p.add_argument('--normal-only', action='store_true')
    p.add_argument('--confirm-backroad-install', choices=('false', 'true'), default='false')
    args = parser.parse_args()
    if args.command == 'select':
        games = select(args.batch, args.games)
        result = {'matrix': json.dumps({'game': games}, separators=(',', ':')), 'games': ','.join(games)}
        if os.environ.get('GITHUB_OUTPUT'):
            with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
                for key, value in result.items(): output.write(key + '=' + value + '\n')
        print(json.dumps(result))
    else: runtime(args)


if __name__ == '__main__': main()

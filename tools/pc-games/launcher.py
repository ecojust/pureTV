"""Choose a catalog game, verify its offline files, and start the local player."""
import argparse
import hashlib
import json
import locale
import os
import sys
import tempfile
from pathlib import Path
from urllib.request import Request, urlopen


def cache_directory():
    if sys.platform == 'win32':
        parent = Path(os.environ.get('LOCALAPPDATA') or Path.home() / 'AppData' / 'Local')
    elif sys.platform == 'darwin':
        parent = Path.home() / 'Library' / 'Caches'
    else:
        parent = Path(os.environ.get('XDG_CACHE_HOME') or Path.home() / '.cache')
    return parent / 'pureTV' / 'games'


def matching_file(path, game):
    if not path.is_file() or path.stat().st_size != game['bytes']:
        return False
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(256 * 1024), b''):
            digest.update(block)
    return digest.hexdigest() == game['sha256']


def fetch_game(game, directory):
    directory.mkdir(parents=True, exist_ok=True)
    target = directory / (game['id'] + '-' + game['sha256'][:16] + '.apk')
    if matching_file(target, game):
        return target
    request = Request(game['url'], headers={'User-Agent': 'pureTV-game-player'})
    print(f'{game["en"]}  ·  {game["bytes"] / 1048576:.1f} MiB', flush=True)
    with tempfile.NamedTemporaryFile(dir=directory, suffix='.part', delete=False) as output:
        temporary = Path(output.name)
    try:
        with urlopen(request, timeout=45) as response, temporary.open('wb') as output:
            received = 0
            for block in iter(lambda: response.read(256 * 1024), b''):
                received += len(block)
                if received > game['bytes']:
                    raise ValueError('Download is larger than the catalog entry')
                output.write(block)
        if not matching_file(temporary, game):
            raise ValueError('Game download did not match its catalog size and SHA-256')
        try:
            temporary.replace(target)
        except PermissionError:
            if not matching_file(target, game):
                raise
        return target
    finally:
        temporary.unlink(missing_ok=True)


def choose_game(games, language):
    zh = language == 'zh'
    try:
        import tkinter as tk
        from tkinter import ttk
    except ImportError:
        root = None
    else:
        try:
            root = tk.Tk()
        except tk.TclError:
            root = None
    if root is None:
        for number, game in enumerate(games, 1):
            print(f'{number:2}. {game[language]}')
        choice = input('游戏编号 / Game number: ').strip()
        if not choice:
            return None
        if not choice.isdecimal() or not 1 <= int(choice) <= len(games):
            raise ValueError('Invalid game number')
        return games[int(choice) - 1]
    root.title('pureTV 游戏' if zh else 'pureTV Games')
    root.minsize(330, 360)
    panel = ttk.Frame(root, padding=12)
    panel.pack(expand=True, fill='both')
    choices = tk.Listbox(panel, width=38, height=18, exportselection=False)
    for game in games:
        choices.insert('end', game[language])
    scrollbar = ttk.Scrollbar(panel, orient='vertical', command=choices.yview)
    choices.configure(yscrollcommand=scrollbar.set)
    choices.grid(row=0, column=0, sticky='nsew')
    scrollbar.grid(row=0, column=1, sticky='ns')
    panel.columnconfigure(0, weight=1)
    panel.rowconfigure(0, weight=1)
    selected = None

    def play(event=None):
        nonlocal selected
        indices = choices.curselection()
        if indices:
            selected = games[indices[0]]
            root.destroy()

    ttk.Button(panel, text='开始游戏' if zh else 'Play', command=play).grid(
        row=1, column=0, columnspan=2, sticky='ew', pady=(10, 0))
    choices.bind('<Double-Button-1>', play)
    root.bind('<Return>', play)
    choices.selection_set(0)
    choices.focus_set()
    root.mainloop()
    return selected


def main(argv=None):
    games = json.loads(Path(__file__).with_name('catalog.json').read_text(encoding='utf-8'))
    parser = argparse.ArgumentParser(description='pureTV desktop game player')
    parser.add_argument('game', nargs='?', choices=[game['id'] for game in games], metavar='GAME')
    parser.add_argument('--list', action='store_true', help='list game IDs')
    parser.add_argument('--language', choices=['zh', 'en'])
    parser.add_argument('--cache', type=Path, default=cache_directory())
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--http-port', type=int)
    parser.add_argument('--controller-port', type=int, default=63485)
    args = parser.parse_args(argv)
    system_language = locale.getlocale()[0] or ''
    language = args.language or ('zh' if system_language.lower().startswith(('zh', 'chinese')) else 'en')
    if args.list:
        for game in games:
            print(f'{game["id"]:<24} {game[language]}')
        return 0
    try:
        game = next((item for item in games if item['id'] == args.game), None)
        if not game:
            game = choose_game(games, language)
        if not game:
            return 0
        path = fetch_game(game, args.cache)
        import host
        options = ['--apk', str(path), '--game', game['id'], '--language', language,
                   '--controller-port', str(args.controller_port)]
        if args.http_port is not None:
            options.extend(['--http-port', str(args.http_port)])
        if args.no_browser:
            options.append('--no-browser')
        return host.main(options)
    except (OSError, ValueError, EOFError) as error:
        print(f'pureTV: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(0)

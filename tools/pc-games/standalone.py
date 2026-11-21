"""Run the single game shipped inside a pureTV desktop client."""
import argparse
import hashlib
import json
import locale
import re
import sys
from pathlib import Path
from zipfile import BadZipFile, ZipFile

import host


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--smoke-test', action='store_true',
                        help='check the bundled game files and print their identity')
    parser.add_argument('--language', choices=['zh', 'en'])
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--http-port', type=int)
    parser.add_argument('--controller-port', type=int, default=63485)
    args = parser.parse_args(argv)

    # The macOS app keeps the game's data in Contents/Resources, alongside
    # its frozen helper. The Windows build ships data next to the module.
    root = Path(__file__).resolve().parent
    if sys.platform == 'darwin' and getattr(sys, 'frozen', False):
        root = Path(sys.executable).resolve().parents[1] / 'Resources'
    apk = root / 'game.apk'
    try:
        game = json.loads((root / 'game.json').read_text(encoding='utf-8'))
        if not isinstance(game, dict) or any(
            not isinstance(game.get(key), str) or not game[key].strip()
            for key in ('id', 'version', 'en', 'zh')
        ):
            raise ValueError('game.json requires a game ID, version and both titles')
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,70}', game['id']):
            raise ValueError('Invalid bundled game ID')

        if args.smoke_test:
            if hashlib.sha256(apk.read_bytes()).hexdigest() != game['sha256']:
                raise ValueError('Bundled APK does not match this game’s catalog checksum')
            with ZipFile(apk) as archive:
                entry = archive.read('assets/tv.html').decode('utf-8-sig')
                if not re.search(r'<head(?:\s[^>]*)?>', entry, flags=re.I):
                    raise ValueError('Bundled game has no usable assets/tv.html')
                damaged = archive.testzip()
                if damaged is not None:
                    raise ValueError(f'Invalid APK checksum for {damaged}')
            if not Path(host.__file__).with_name('pc-bridge.js').read_bytes().strip():
                raise ValueError('Empty controller bridge')
            print(json.dumps({'id': game['id'], 'version': game['version']}))
            return 0

        system_language = locale.getlocale()[0] or ''
        language = args.language or ('zh' if system_language.lower().startswith(('zh', 'chinese')) else 'en')
        if sys.platform == 'win32' and not args.no_browser and sys.stdout and sys.stdout.isatty():
            import ctypes

            ctypes.windll.kernel32.SetConsoleTitleW(game[language])
            print('浏览器未打开时，请手动打开下方 Game 网址。按 Ctrl+C 或关闭此窗口可退出游戏。')
            print('If the browser stays closed, open the Game URL below. '
                  'Press Ctrl+C or close this window to quit.', flush=True)
        options = ['--apk', str(apk), '--game', game['id'], '--language', language,
                   '--controller-port', str(args.controller_port)]
        icon = root / 'game.ico'
        if sys.platform == 'win32' and icon.is_file():
            import ctypes
            # The Windows console host has its own window, separate from the EXE.
            shell = ctypes.windll.shell32
            shell.SetCurrentProcessExplicitAppUserModelID('ecojust.pureTV.game.' + game['id'])
            user = ctypes.windll.user32
            large, small = ctypes.c_void_p(), ctypes.c_void_p()
            if shell.ExtractIconExW(sys.executable, 0, ctypes.byref(large), ctypes.byref(small), 1):
                ctypes.windll.kernel32.GetConsoleWindow.restype = ctypes.c_void_p
                window = ctypes.windll.kernel32.GetConsoleWindow()
                if window:
                    for size, handle in ((1, large), (0, small)):
                        user.SendMessageW(ctypes.c_void_p(window), 0x0080, size, handle)
            options.extend(['--icon', str(icon)])
        if args.no_browser:
            options.append('--no-browser')
        if args.http_port is not None:
            options.extend(['--http-port', str(args.http_port)])
        return host.main(options)
    except (OSError, ValueError, KeyError, BadZipFile) as error:
        print(f'pureTV: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())

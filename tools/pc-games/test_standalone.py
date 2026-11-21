import contextlib
import hashlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from zipfile import ZipFile

import standalone


class StandaloneTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name).resolve()
        entry = patch.object(standalone, '__file__', str(self.root / 'standalone.py'))
        entry.start()
        self.addCleanup(entry.stop)
        host = patch.object(standalone.host, '__file__', str(self.root / 'host.py'))
        host.start()
        self.addCleanup(host.stop)
        self.game = dict(id='tetris', version='0.5.7', en='Tetris', zh='Tetris')
        (self.root / 'game.json').write_text(json.dumps(self.game), encoding='utf-8')

    def test_starts_only_bundled_game(self):
        with patch.object(standalone.host, 'main', return_value=0) as host:
            self.assertEqual(standalone.main(['--language', 'en', '--no-browser', '--http-port', '0']), 0)
        host.assert_called_once_with(['--apk', str(self.root / 'game.apk'), '--game', 'tetris',
                                      '--language', 'en', '--controller-port', '63485',
                                      '--no-browser', '--http-port', '0'])

    def test_interactive_windows_console_names_game_and_shows_exit_action(self):
        with (
            patch.object(standalone.sys, 'platform', 'win32'),
            patch('ctypes.windll', create=True) as win32,
            patch.object(standalone.host, 'main', return_value=0),
            patch.object(standalone.sys, 'stdout') as console,
        ):
            console.isatty.return_value = True
            self.assertEqual(standalone.main(['--language', 'zh']), 0)
            self.assertTrue(any('Ctrl+C' in line.args[0] for line in console.write.call_args_list))
        win32.kernel32.SetConsoleTitleW.assert_called_once_with(self.game['zh'])

    def test_macos_app_reads_resources_outside_frozen_helper(self):
        resources = self.root / 'Contents' / 'Resources'
        resources.mkdir(parents=True)
        (self.root / 'game.json').rename(resources / 'game.json')
        helper = resources.parent / 'Helpers' / 'player'
        with (
            patch.object(standalone.sys, 'executable', str(helper)),
            patch.object(standalone.sys, 'platform', 'darwin'),
            patch.object(standalone.sys, 'frozen', True, create=True),
            patch.object(standalone.host, 'main', return_value=0) as host,
        ):
            self.assertEqual(standalone.main(['--language', 'en']), 0)
        self.assertEqual(host.call_args.args[0][:4], ['--apk', str(resources / 'game.apk'), '--game', 'tetris'])

    def test_smoke_checks_game_and_bridge_offline(self):
        with ZipFile(self.root / 'game.apk', 'w') as apk:
            apk.writestr('assets/tv.html', '<html><head></head></html>')
        self.game['sha256'] = hashlib.sha256((self.root / 'game.apk').read_bytes()).hexdigest()
        (self.root / 'game.json').write_text(json.dumps(self.game), encoding='utf-8')
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(standalone.main(['--smoke-test']), 1)
        (self.root / 'pc-bridge.js').write_bytes(b'// controller')
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            self.assertEqual(standalone.main(['--smoke-test']), 0)
        self.assertEqual(json.loads(output.getvalue()), dict(id='tetris', version='0.5.7'))
        self.game['sha256'] = '0' * 64
        (self.root / 'game.json').write_text(json.dumps(self.game), encoding='utf-8')
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(standalone.main(['--smoke-test']), 1)

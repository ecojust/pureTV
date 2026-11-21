import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import game_icons


class GameIcons(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        (self.root / 'tools').mkdir()
        self.game = self.root / 'joystick-games/example-game'
        self.game.mkdir(parents=True)
        self.key = self.game.relative_to(self.root).as_posix()
        self.image = Image.new('RGB', (200, 100), 'red')
        self.image.paste('blue', (100, 0, 200, 100))
        self.image.save(self.game / 'thumb.png')
        self.write('game-icon-sources', {})
        self.write('game-icon-crops', {self.key: [.5, 0, 1, 1]})

    def write(self, name, data):
        (self.root / f'tools/{name}.json').write_text(json.dumps(data))

    def test_game_crop_and_full_banner(self):
        with io.BytesIO() as buffer:
            game_icons.save_png(self.game, buffer, 48)
            square = Image.open(buffer)
            self.assertEqual(square.size, (48, 48))
            self.assertEqual(square.getextrema(), ((0, 0), (0, 0), (255, 255)))
        with io.BytesIO() as buffer:
            game_icons.save_banner(self.game, buffer, (200, 100))
            self.assertEqual(Image.open(buffer).tobytes(), self.image.tobytes())

    def test_windows_resolutions_share_the_square_crop(self):
        with io.BytesIO() as buffer:
            game_icons.save_ico(self.game, buffer)
            ico = Image.open(buffer).ico
            self.assertEqual(ico.sizes(), {(s, s) for s in (16, 24, 32, 48, 64, 128, 256)})
            for size in ico.sizes():
                self.assertEqual(ico.getimage(size).convert('RGB').getextrema(),
                                 ((0, 0), (0, 0), (255, 255)))

    def test_alternate_capture_is_read_from_the_games_checkout(self):
        (self.root / 'captures').mkdir()
        alternative = self.root / 'captures/play.png'
        self.image.save(alternative)
        self.write('game-icon-sources', {self.key: 'captures/play.png'})
        self.assertEqual(game_icons.source_image(self.game), alternative)
        self.assertEqual(game_icons.source_bytes(self.game), alternative.read_bytes())

    def test_hidden_game_can_use_a_sparse_capture_without_reviving_deleted_art(self):
        subprocess.run(['git', 'init', '--quiet'], cwd=self.root, check=True)
        self.write('readme-app-games', [])
        (self.game / 'game.json').write_text('{}')
        capture = self.game / 'thumb.png'
        expected = capture.read_bytes()
        rel = capture.relative_to(self.root).as_posix()
        subprocess.run(['git', 'add', rel], cwd=self.root, check=True)
        subprocess.run(['git', 'update-index', '--skip-worktree', rel], cwd=self.root, check=True)
        capture.unlink()
        self.assertEqual(game_icons.catalog_game_dir(self.root, self.game.name), self.game)
        self.assertEqual(game_icons.source_bytes(self.game), expected)
        subprocess.run(['git', 'update-index', '--no-skip-worktree', rel], cwd=self.root, check=True)
        with self.assertRaises(FileNotFoundError):
            game_icons.source_bytes(self.game)

    def test_unknown_capture_and_invalid_crop_cannot_generate_an_icon(self):
        self.write('game-icon-sources', {self.key: '../outside.png'})
        with self.assertRaises(ValueError):
            game_icons.source_image(self.game)
        self.write('game-icon-sources', {})
        self.write('game-icon-crops', {self.key: [1, 0, 0, 1]})
        with self.assertRaises(ValueError):
            game_icons.save_png(self.game, io.BytesIO(), 32)


if __name__ == '__main__':
    unittest.main()

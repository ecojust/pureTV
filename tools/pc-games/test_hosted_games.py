from html.parser import HTMLParser
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from hosted_games import hosted_games, stage_hosted


class PageReader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.words = []
        self.translations = []
        self.elements = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if 'data-en' in attrs:
            self.translations.append(attrs['data-en'])

    def handle_data(self, data):
        self.words.append(data)


class HostedPageTests(unittest.TestCase):
    def test_guides_include_both_languages_and_original_screen_labels(self):
        with TemporaryDirectory() as temporary:
            output = Path(temporary)
            for game in hosted_games():
                with self.subTest(game=game['id']):
                    stage_hosted(game, output, lambda _: b'cover')
                    page = PageReader()
                    page.feed((output / game['id'] / 'tv.html').read_text(encoding='utf-8'))
                    body, = [attrs for tag, attrs in page.elements if tag == 'body']
                    self.assertEqual(body['data-src'], game['url'])
                    guide = game['guide']
                    self.assertTrue(guide['steps'] and guide['terms'])
                    for phrase in [guide['objective'], *guide['steps'], *guide['terms']]:
                        self.assertIn(phrase['zh'], page.words)
                        self.assertIn(phrase['en'], page.translations)
                    for term in guide['terms']:
                        self.assertIn(term['label'], page.words)

    def test_guide_text_with_markup_is_escaped_in_both_languages(self):
        game = hosted_games()[0]
        phrase = {'zh': '<em>输入 & 确认</em>', 'en': '"Choose" <Start> & confirm'}
        game['guide']['steps'].append(phrase)
        with TemporaryDirectory() as temporary:
            output = Path(temporary)
            stage_hosted(game, output, lambda _: b'cover')
            page = PageReader()
            page.feed((output / game['id'] / 'tv.html').read_text(encoding='utf-8'))
            self.assertIn(phrase['zh'], page.words)
            self.assertIn(phrase['en'], page.translations)
            self.assertNotIn('em', [tag for tag, _ in page.elements])


if __name__ == '__main__':
    unittest.main()

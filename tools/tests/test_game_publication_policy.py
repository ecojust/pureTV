"""Independent game releases cannot widen collection scopes or skip upgrade rules."""
import importlib.util
import sys
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS))

def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, TOOLS / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

publish = load('publish_android_release_policy', 'publish-android-release.py')
verify = load('verify_game_publication_policy', 'verify-game-publication.py')

class GamePublicationPolicyTest(unittest.TestCase):
    def test_independent_tag_only_selects_the_new_game(self):
        self.assertEqual(publish.release_scope('android-used-car-v0.1.0', 'used-car-racing'),
                         ('0.1.0', {'com.ecojust.usedcartv'}))
        self.assertEqual(publish.release_scope('android-used-car-v0.2.3', 'used-car-racing')[0], '0.2.3')
        for tag, scope in [('android-v0.1.0', 'used-car-racing'),
                           ('android-used-car-v0.1.0', 'games'),
                           ('android-used-car-v0.1.0', 'all'),
                           ('android-used-car-v0.1.0-extra', 'used-car-racing'),
                           ('android-v0.5.2', 'unknown')]:
            with self.subTest(tag=tag, scope=scope), self.assertRaises(AssertionError):
                publish.release_scope(tag, scope)

    def test_existing_game_collection_keeps_its_nine_packages(self):
        version, packages = publish.release_scope('android-v0.5.2', 'games')
        self.assertEqual(version, '0.5.2')
        self.assertEqual(len(packages), 9)
        self.assertIn('com.ecojust.coastkarttv', packages)
        self.assertNotIn('com.ecojust.usedcartv', packages)
        _, all_packages = publish.release_scope('android-v0.6.0', 'all')
        self.assertIn('com.ecojust.usedcartv', all_packages)
        self.assertNotIn('com.ecojust.music', all_packages)
        self.assertEqual(len(all_packages), 24)

    def test_only_registered_first_release_can_have_no_previous_metadata(self):
        identity = {'packageName': 'com.ecojust.usedcartv', 'versionCode': 1, 'version': '0.1.0'}
        verify.validate_version_transition('used-car-racing', 'used-car-racing', identity, None)
        for game, scope, changes in [('tank', 'games', {}), ('used-car-racing', 'games', {}),
                                    ('used-car-racing', 'used-car-racing', {'versionCode': 0}),
                                    ('used-car-racing', 'used-car-racing', {'versionCode': 2}),
                                    ('used-car-racing', 'used-car-racing', {'version': '0.2.0'}),
                                    ('used-car-racing', 'used-car-racing', {'packageName': 'com.ecojust.tanktv'})]:
            with self.subTest(game=game, scope=scope, changes=changes), self.assertRaises(AssertionError):
                verify.validate_version_transition(game, scope, dict(identity, **changes), None)

    def test_existing_releases_still_require_increasing_version_codes(self):
        for game, scope in [('tank', 'games'), ('used-car-racing', 'used-car-racing')]:
            verify.validate_version_transition(game, scope, {'versionCode': 8}, {'versionCode': 7})
            for code in (6, 7):
                with self.subTest(game=game, code=code), self.assertRaises(AssertionError):
                    verify.validate_version_transition(game, scope, {'versionCode': code}, {'versionCode': 7})

if __name__ == '__main__':
    unittest.main()

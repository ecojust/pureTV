#!/usr/bin/env python3
"""Target only the installed test game's observed macOS network permission UI."""
import importlib.util
import json
import plistlib
import tempfile
import unittest
from pathlib import Path

SHARED = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('network_prompts', SHARED / 'tools/allow-local-network.py')
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


class NetworkPrompts(unittest.TestCase):
    def test_actual_failed_ci_prompts_match_only_the_current_named_game(self):
        fixture = json.loads((Path(__file__).parent / 'fixtures/catalog-network-prompts-44152197128.json').read_text())
        for case in fixture['cases']:
            with self.subTest(game=case['game']):
                self.assertTrue(helper.prompt_matches(case['actualPrompt'], [case['appName']]))
                self.assertFalse(helper.prompt_matches(case['actualPrompt'], ['Another Game']))
                self.assertFalse(helper.prompt_matches(case['actualPrompt'], [case['appName'] + ' Update']))
                self.assertFalse(helper.prompt_matches('Allow “' + case['appName'] + ' Update” to find devices on local networks?', [case['appName']]))

    def test_network_permission_and_exact_quoted_identity_are_both_required(self):
        names = ['Sugarplum Drop', '糖梅落落']
        self.assertTrue(helper.prompt_matches('Allow “Sugarplum Drop” to find devices on local networks?', names))
        self.assertTrue(helper.prompt_matches('允许“糖梅落落”查找本地网络设备？', names))
        self.assertTrue(helper.prompt_matches('Allow “Python” to find devices on local networks?', names))
        for wording in ['Allow “Other Game” to find devices on local networks?',
                        'Allow “Python Helper” to find devices on local networks?',
                        'Allow “Sugarplum Drop” to access your camera?',
                        'Allow Sugarplum Drop to find devices on local networks?']:
            self.assertFalse(helper.prompt_matches(wording, names))

    def test_app_identity_comes_from_exact_installed_plist(self):
        with tempfile.TemporaryDirectory() as directory:
            app = Path(directory) / 'Sample.app'
            (app / 'Contents').mkdir(parents=True)
            plist = app / 'Contents/Info.plist'
            plist.write_bytes(plistlib.dumps({'CFBundleName': 'Sample', 'CFBundleDisplayName': '样例'}))
            self.assertEqual(helper.app_names(app), ['Sample', '样例'])
            plist.write_bytes(plistlib.dumps({'CFBundleName': 'Sample', 'CFBundleDisplayName': 'Sample'}))
            self.assertEqual(helper.app_names(app), ['Sample'])
            for invalid in [{}, {'CFBundleName': 'Sample\n'}, {'CFBundleName': ' Sample'}]:
                plist.write_bytes(plistlib.dumps(invalid))
                with self.assertRaises(AssertionError):
                    helper.app_names(app)


if __name__ == '__main__':
    unittest.main()

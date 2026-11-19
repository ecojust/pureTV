#!/usr/bin/env python3
"""Recorded collapsed UI and synthetic expanded-page contracts; not actual Android installation."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest import mock
import xml.etree.ElementTree as ET
import zlib

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('install_confirmation', HERE / 'install_confirmation.py')
helper = importlib.util.module_from_spec(spec); spec.loader.exec_module(helper)
FIXTURE = json.loads((HERE / 'fixtures/backroad-install-ui-44614635591.json').read_text())


def png():
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 1920, 1080, 8, 2, 0, 0, 0)) + \
        chunk(b'IDAT', zlib.compress((b'\0' + bytes(1920 * 3)) * 1080)) + chunk(b'IEND', b'')


class ConfirmationContracts(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.adb = ['/fixture/adb']
        self.apk = self.root / 'original.apk'
        self.apk.write_bytes(b'not an APK: positive workflow identity verification is mocked explicitly')
        self.failed = copy.deepcopy(FIXTURE['failedCommand'])
        self.failed['command'] = self.adb + ['install', '-r', str(self.apk)]
        self.original = self.root / 'original-failure'
        self.make_capture(self.original)

    def tearDown(self):
        self.tmp.cleanup()

    def make_capture(self, folder, *, expanded=False, mutate=None):
        folder.mkdir()
        for name, record in FIXTURE['files'].items():
            data = record['content'].encode()
            self.assertEqual(hashlib.sha256(data).hexdigest(), record['sha256'])
            self.assertEqual(len(data), record['bytes'])
            (folder / name).write_bytes(data)
        (folder / 'screen.png').write_bytes(png())
        if expanded:
            xml = ET.fromstring((folder / 'ui.xml').read_bytes())
            next(n for n in xml.iter('node') if n.get('text') == 'Got it').set('text', 'Install anyway')
            (folder / 'ui.xml').write_bytes(ET.tostring(xml))
        if mutate: mutate(folder)
        report = {'apk': helper.APK, 'targetPackage': helper.PACKAGE, 'uiActionsSent': False,
                  'originalFailedInstallCommand': self.failed, 'commands': []}
        for path in folder.iterdir():
            report['commands'].append({'outputPath': path.name, 'status': 'completed', 'exitCode': 0,
                                      'output': helper.observations.info(path)})
        (folder / 'report.json').write_text(json.dumps(report))
        return {'path': folder.name + '/report.json', **helper.observations.info(folder / 'report.json')}

    def mutate_xml(self, folder, edit):
        xml = ET.fromstring((folder / 'ui.xml').read_bytes())
        edit(xml)
        (folder / 'ui.xml').write_bytes(ET.tostring(xml))

    def folder(self, name, **kwargs):
        folder = self.root / name
        self.make_capture(folder, **kwargs)
        return folder

    def test_recorded_collapsed_ui_has_real_unique_more_details_and_no_install_anyway(self):
        action = helper.dialog_action(self.original, 'More details', self.failed)
        self.assertEqual(action['bounds'], [693, 662, 885, 758])
        self.assertEqual(action['tap'], [789, 710])
        self.assertEqual(action['session']['id'], 1094821096)
        with self.assertRaisesRegex(ValueError, 'Required explicit control'):
            helper.dialog_action(self.original, 'Install anyway', self.failed)

    def test_original_occupied_residual_sessions_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Exactly one active'):
            helper.session_identity(FIXTURE['occupiedSessions']['content'], self.failed)

    def test_wrong_app_reason_package_focus_and_unexpected_overlay_stop(self):
        cases = [('label', 'ui.xml', 'Backroad Rally', 'Other app'),
                 ('reason', 'ui.xml', 'older version of Android', 'dangerous malware'),
                 ('package', 'ui.xml', 'com.android.vending', 'com.example.overlay'),
                 ('focus', 'foreground.txt', helper.ACTIVITY, 'com.example/.Other')]
        for name, filename, before, after in cases:
            with self.subTest(name=name):
                folder = self.folder(name, mutate=lambda p: (p / filename).write_text((p / filename).read_text().replace(before, after)))
                with self.assertRaises(ValueError): helper.dialog_action(folder, 'More details', self.failed)

    def test_stale_capture_hash_or_missing_command_rejected(self):
        (self.original / 'ui.xml').write_text((self.original / 'ui.xml').read_text() + ' ')
        with self.assertRaisesRegex(ValueError, 'Capture bytes changed'):
            helper.dialog_action(self.original, 'More details', self.failed)
        folder = self.folder('missing')
        report = json.loads((folder / 'report.json').read_text()); report['commands'].pop()
        (folder / 'report.json').write_text(json.dumps(report))
        with self.assertRaises(ValueError): helper.dialog_action(folder, 'More details', self.failed)

    def test_disabled_duplicate_or_out_of_bounds_button_rejected(self):
        def edit(xml, kind):
            nodes = list(xml.iter('node'))
            label = next(n for n in nodes if n.get('text') == 'More details')
            parents = {child: p for p in xml.iter() for child in p}
            target = parents[label]
            while target.get('clickable') != 'true': target = parents[target]
            if kind == 'duplicate': target.append(copy.deepcopy(label))
            elif kind == 'disabled': target.set('enabled', 'false')
            else: target.set('bounds', '[0,0][9999,9999]')
        for kind in ('duplicate', 'disabled', 'bounds'):
            with self.subTest(kind=kind):
                folder = self.folder(kind, mutate=lambda p: self.mutate_xml(p, lambda x: edit(x, kind)))
                with self.assertRaises(ValueError): helper.dialog_action(folder, 'More details', self.failed)

    def test_session_size_state_time_package_and_path_rejected(self):
        original = FIXTURE['files']['installer-sessions.txt']['content']
        for before, after in [('sizeBytes=105020455', 'sizeBytes=1'), ('mDestroyed=false', 'mDestroyed=true'),
                              ('createdMillis=1795122683869', 'createdMillis=1'),
                              ('appPackageName=null', 'appPackageName=com.example.other'),
                              ('stageDir=/data/app/vmdl1094821096.tmp', 'stageDir=/data/local/tmp/other'),
                              ('isMultiPackage=false', 'isMultiPackage=true')]:
            with self.subTest(before=before), self.assertRaises(ValueError):
                helper.session_identity(original.replace(before, after), self.failed)

    def test_actual_apk_identity_and_target_are_not_only_declared(self):
        for package, identity in [(helper.PACKAGE, helper.APK), ('com.example.other', helper.APK),
                                  (helper.PACKAGE, dict(helper.APK, sha256='0' * 64))]:
            with self.subTest(package=package, identity=identity), self.assertRaises(ValueError):
                helper.original_identity(self.apk, package, self.failed, self.adb, identity)

    def replay(self, *, expanded=True, bad_stage=False, bad_installed=False, missing_installed=False, changed_session=False):
        commands = []
        def capture(adb, apk, package, folder, failed, **kwargs):
            mutate = None
            if changed_session and folder.name == 'expanded-details':
                mutate = lambda p: (p / 'installer-sessions.txt').write_text((p / 'installer-sessions.txt').read_text().replace('1094821096', '1094821097'))
            return self.make_capture(folder, expanded=expanded and folder.name != 'before-details', mutate=mutate)
        def command(argv, target, deadline, limit):
            commands.append(argv)
            args = argv[len(self.adb):]
            text = ''
            if args[:2] == ['shell', 'sha256sum']:
                wrong = bad_stage if 'vmdl' in args[-1] else bad_installed
                text = ('0' * 64 if wrong else helper.APK['sha256']) + '  ' + args[-1]
            elif args[:3] == ['shell', 'pm', 'path']:
                text = '' if missing_installed else 'package:/data/app/~~fixture/fixture-1/base.apk'
            elif args[:2] == ['shell', 'stat']: text = str(helper.APK['bytes'])
            else: self.assertEqual(args[:3], ['shell', 'input', 'tap'])
            target.write_text(text)
            return {'command': argv, 'status': 'completed', 'exitCode': 0, 'outputPath': target.name,
                    'output': helper.observations.info(target)}
        with mock.patch.object(helper, 'original_identity') as identity, \
             mock.patch.object(helper.observations, 'capture', side_effect=capture), \
             mock.patch.object(helper.observations, 'bounded_command', side_effect=command), \
             mock.patch.object(helper.time, 'sleep'):
            result = helper.confirm(self.adb, self.apk, helper.PACKAGE, self.root / 'confirmation',
                                    self.failed, expected_apk=helper.APK, original_evidence=self.original)
            identity.assert_called_once()
        report = json.loads((self.root / result['path']).read_text())
        return report, commands

    def test_synthetic_expanded_page_requires_two_exact_taps_then_installed_sha_and_size(self):
        report, commands = self.replay()
        self.assertEqual(report['status'], 'installed-exact-apk')
        taps = [c for c in commands if c[1:4] == ['shell', 'input', 'tap']]
        self.assertEqual(len(taps), 2)
        self.assertEqual([a['label'] for a in report['actions']], ['More details', 'Install anyway'])
        self.assertFalse(report['settingsChanged']); self.assertFalse(report['installRetried'])
        self.assertTrue(report['originalFailurePreserved'])
        self.assertEqual(report['installedIdentity'], helper.APK)
        self.assertTrue(any(c[1:3] == ['shell', 'stat'] for c in commands))
        self.assertFalse(any('settings' in c or 'install' in c for c in commands))

    def test_no_actual_install_anyway_stops_after_only_expansion(self):
        report, _ = self.replay(expanded=False)
        self.assertEqual(report['status'], 'blocked')
        self.assertEqual([a['label'] for a in report['actions']], ['More details'])
        self.assertTrue((self.root / 'confirmation/expanded-details/screen.png').is_file())

    def test_staged_hash_mismatch_stops_before_any_ui_action(self):
        report, commands = self.replay(bad_stage=True)
        self.assertEqual(report['status'], 'blocked'); self.assertEqual(report['actions'], [])
        self.assertFalse(any(c[1:3] == ['shell', 'input'] for c in commands))

    def test_changed_session_after_expansion_stops_before_install(self):
        report, _ = self.replay(changed_session=True)
        self.assertEqual(report['status'], 'blocked'); self.assertEqual(len(report['actions']), 1)

    def test_click_success_is_not_installed_apk_success(self):
        report, _ = self.replay(bad_installed=True)
        self.assertEqual(report['status'], 'blocked'); self.assertEqual(len(report['actions']), 2)
        self.assertNotIn('installedIdentity', report)

    def test_missing_package_after_click_remains_failure(self):
        report, _ = self.replay(missing_installed=True)
        self.assertEqual(report['status'], 'blocked'); self.assertNotIn('installedIdentity', report)


if __name__ == '__main__': unittest.main()

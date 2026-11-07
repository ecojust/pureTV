import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS))
SPEC = importlib.util.spec_from_file_location('prepare_tv_store_resources', TOOLS / 'prepare-tv-store-resources.py')
publisher = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(publisher)


class ExportContractTest(unittest.TestCase):
    def test_bounds_match_both_workflows(self):
        self.assertEqual(publisher.export_record_limit('store', 'release/putrtv-store-0.1.0.apk'), 9999999)
        for slug in publisher.LAUNCHERS:
            self.assertEqual(publisher.export_record_limit('launcher', f'release/{slug}/metadata.json'), 64000)
            self.assertEqual(publisher.export_record_limit('launcher', f'release/{slug}/launcher.apk'), 5 * 1024 * 1024 - 1)
            for name in publisher.LAUNCHER_PREVIEWS:
                self.assertEqual(publisher.export_record_limit('launcher', f'release/{slug}/previews/{name}'), 4000000)

    def test_rejects_escaping_unknown_and_noncanonical_paths(self):
        for path in ('../secret', '/release/a.apk', 'release/../a.apk', 'release//a.apk',
                     'release/./a.apk', 'release/a\\b.apk', 'reports/private.jks', 'release/source.zip'):
            with self.subTest(path=path), self.assertRaises(AssertionError):
                publisher.export_record_limit('store', path)
        with self.assertRaises(AssertionError):
            publisher.export_record_limit('launcher', 'release/unknown/app.apk')

    def load(self, *, content=b'{}', manifest_sha=None, branch='feat/putrtv-store', size=None, duplicate=False):
        sha = 'a' * 40
        status = {'status':'completed', 'conclusion':'success', 'repository':{'full_name':'ecojust/pureTV'},
                  'head_repository':{'full_name':'ecojust/pureTV'}, 'head_branch':branch, 'event':'push',
                  'path':'.github/workflows/putrtv-store.yml', 'head_sha':sha,
                  'html_url':'https://github.com/ecojust/pureTV/actions/runs/123'}
        record = {'path':'release/metadata.json', 'bytes':len(content) if size is None else size,
                  'sha256':hashlib.sha256(b'{}').hexdigest()}
        manifest = {'sourceSha':manifest_sha or sha, 'runId':'123', 'runUrl':status['html_url'],
                    'buildResult':'success', 'signResult':'success', 'files':[record, record] if duplicate else [record]}
        def git(*args):
            if args[0] == 'fetch': return b''
            if args[0] == 'rev-parse': return (sha + '\n').encode()
            if args[1].endswith('/export-metadata.json'): return json.dumps(manifest).encode()
            return content
        with patch.object(publisher, 'git', side_effect=git), patch.object(publisher.subprocess, 'check_output', return_value=json.dumps(status).encode()):
            return publisher.load_export('123', 'store')

    def test_exact_source_export_is_accepted(self):
        _, _, files = self.load()
        self.assertEqual(files, {'release/metadata.json':b'{}'})

    def test_rejects_hash_source_trust_size_and_duplicate_mismatches(self):
        for change in ({'content':b'[]'}, {'manifest_sha':'b' * 40}, {'branch':'untrusted'},
                       {'size':64001}, {'duplicate':True}):
            with self.subTest(change=change), self.assertRaises(AssertionError):
                self.load(**change)


class SourceArchiveTest(unittest.TestCase):
    def test_archive_includes_shared_and_only_settings_dependencies(self):
        settings = "include ':app'\ninclude ':jackal'\nproject(':jackal').projectDir = file('../../apps/jackal')\n"
        selected = ['LICENSE', 'resource/launcher/puretv/settings.gradle',
                    'resource/launcher/shared/src/main/java/com/ecojust/launcher/shared/HomePlacement.java',
                    'resource/launcher/shared/src/test/java/com/ecojust/launcher/shared/AddToHomeActivityTest.java',
                    'resource/apps/jackal/build.gradle', 'resource/apps/jackal/tools/preview-png.gradle',
                    'resource/apps/jackal/src/main/assets/scene-update-paths.json']
        removed = ['resource/launcher/puretv/resource.json', 'resource/launcher/puretv/pureTV-0.5.2.apk',
                   'resource/apps/jackal/docs/recording.mp4']
        calls = []
        def git(*args):
            calls.append(args)
            return settings.encode() if args[0] == 'show' else '\n'.join(selected + removed).encode()
        with tempfile.TemporaryDirectory() as directory, patch.object(publisher, 'git', side_effect=git), patch.object(publisher.subprocess, 'run') as archive:
            publisher.source_archive('a' * 40, 'puretv', Path(directory) / 'source.tar.gz')
        listing = calls[1]
        self.assertIn('resource/apps/jackal', listing)
        self.assertNotIn('resource/apps', listing)
        self.assertIn('resource/launcher/shared', listing)
        command = archive.call_args.args[0]
        self.assertEqual(command[command.index('--') + 1:], selected)


if __name__ == '__main__':
    unittest.main()

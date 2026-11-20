#!/usr/bin/env python3
"""Offline original-producer and ZIP boundaries; no network, build or upload."""
import copy
import hashlib
import importlib.util
from pathlib import Path
import stat
import struct
import tempfile
import unittest
import warnings
import zipfile

spec = importlib.util.spec_from_file_location('windows_reexport', Path(__file__).resolve().parents[3] / 'tools/windows-reexport.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
GAME = 'sugarplum-drop'
SOURCE = 'a' * 40
REPO = 'ecojust/pureTV'
REJECT = (AssertionError, ValueError, TypeError, KeyError, m.transfer.Rejected)


def fixture():
    """Synthetic metadata follows real Actions fields; it is not native QA."""
    request = {'run': 123, 'attempt': 2, 'source': SOURCE, 'games': [GAME]}
    repository = {'id': 456, 'full_name': REPO}
    run = {'id': 123, 'run_attempt': 2, 'head_sha': SOURCE, 'head_branch': 'build-source/synthetic',
           'repository': repository, 'head_repository': copy.deepcopy(repository),
           'path': '.github/workflows/joystick-catalog-windows.yml', 'event': 'workflow_dispatch',
           'status': 'completed', 'conclusion': 'failure'}
    job = {'id': 789, 'name': 'verify (' + GAME + ')', 'run_id': 123, 'run_attempt': 2,
           'head_sha': SOURCE, 'status': 'completed', 'conclusion': 'success',
           'started_at': '2026-11-19T09:00:00Z', 'completed_at': '2026-11-19T09:10:00Z',
           'steps': [
               {'name': 'Run actions/upload-artifact@v4', 'number': 5, 'status': 'completed', 'conclusion': 'success',
                'started_at': '2026-11-19T09:04:00Z', 'completed_at': '2026-11-19T09:05:00Z'},
               {'name': 'Run actions/upload-artifact@v4', 'number': 9, 'status': 'completed', 'conclusion': 'success',
                'started_at': '2026-11-19T09:07:00Z', 'completed_at': '2026-11-19T09:08:00Z'}]}
    artifacts = []
    for index, kind in enumerate(['evidence', 'packages']):
        artifacts.append({'id': 1001 + index, 'name': 'joystick-windows-' + kind + '-' + GAME,
                          'size_in_bytes': 128 + index, 'digest': 'sha256:' + str(index + 1) * 64,
                          'expired': False, 'created_at': '2026-11-19T09:0' + ('5' if index == 0 else '8') + ':00Z',
                          'expires_at': '2099-01-01T00:00:00Z',
                          'workflow_run': {'id': 123, 'head_sha': SOURCE, 'head_branch': run['head_branch'],
                                           'repository_id': 456, 'head_repository_id': 456}})
    registry = {'schemaVersion': 1, 'games': {GAME: {'packageName': 'com.ecojust.joystick.sugarplumdrop'}},
                'batches': {'sample': [GAME]}}
    return {'run': run, 'jobs': [job], 'artifacts': artifacts, 'request': request, 'registry': registry}


class ProducerTests(unittest.TestCase):
    def verify(self, value=None):
        return m.validate_selection(**(value or fixture()))

    def reject(self, change):
        value = fixture()
        change(value)
        with self.assertRaises(REJECT):
            self.verify(value)

    def test_explicit_successful_game_can_be_recovered_from_failed_overall_run(self):
        value = fixture(); before = copy.deepcopy(value)
        result = self.verify(value)
        self.assertEqual(result['originalRunConclusion'], 'failure')
        self.assertEqual(set(result['selected']), {GAME})
        for name, original in [('job', value['jobs'][0]), ('evidence', value['artifacts'][0]), ('packages', value['artifacts'][1])]:
            self.assertEqual(result['selected'][GAME][name], original)
        self.assertEqual(value, before, 'Original metadata must remain unchanged')

    def test_run_repository_source_attempt_and_workflow_must_match(self):
        for key, wrong in [('id', 124), ('run_attempt', 1), ('head_sha', 'b' * 40), ('status', 'in_progress'),
                           ('event', 'push'), ('path', '.github/workflows/other.yml')]:
            with self.subTest(key=key):
                self.reject(lambda v: v['run'].__setitem__(key, wrong))
        for field in ['repository', 'head_repository']:
            with self.subTest(field=field):
                self.reject(lambda v: v['run'][field].__setitem__('full_name', 'fork/pureTV'))
        self.reject(lambda v: v['run']['head_repository'].__setitem__('id', 457))

    def test_selected_games_are_explicit_unique_valid_and_registered(self):
        for games in [[], [GAME, GAME], ['missing'], ['../escape'], ['Sugarplum-drop']]:
            with self.subTest(games=games):
                self.reject(lambda v: v['request'].__setitem__('games', games))
        for version in [True, '1', 0]:
            with self.subTest(schemaVersion=version):
                self.reject(lambda v: v['registry'].__setitem__('schemaVersion', version))

    def test_selected_job_is_unique_exact_successful_original_producer(self):
        for key, wrong in [('name', 'verify (' + GAME + ', other)'), ('run_id', 124), ('run_attempt', 1),
                           ('head_sha', 'b' * 40), ('status', 'in_progress'), ('conclusion', 'failure')]:
            with self.subTest(key=key):
                self.reject(lambda v: v['jobs'][0].__setitem__(key, wrong))
        self.reject(lambda v: v['jobs'].append(copy.deepcopy(v['jobs'][0])))
        self.reject(lambda v: v['jobs'].clear())

    def test_other_failed_job_is_not_silently_selected(self):
        value = fixture()
        other = copy.deepcopy(value['jobs'][0]); other.update(id=790, name='verify (other-game)', conclusion='failure')
        value['jobs'].append(other)
        value['registry']['games']['other-game'] = {'packageName': 'com.ecojust.joystick.othergame'}
        self.assertEqual(set(self.verify(value)['selected']), {GAME})
        value['request']['games'].append('other-game')
        with self.assertRaises(REJECT): self.verify(value)

    def test_artifacts_are_unique_unexpired_and_bound_to_same_original_run(self):
        for index in [0, 1]:
            for key, wrong in [('name', 'unrelated'), ('expired', True), ('expires_at', '2000-01-01T00:00:00Z'),
                               ('digest', 'sha256:bad'), ('size_in_bytes', 0)]:
                with self.subTest(index=index, key=key):
                    self.reject(lambda v: v['artifacts'][index].__setitem__(key, wrong))
            for key, wrong in [('id', 124), ('head_sha', 'b' * 40), ('head_branch', 'wrong-branch'),
                               ('repository_id', 457), ('head_repository_id', 457)]:
                with self.subTest(index=index, link=key):
                    self.reject(lambda v: v['artifacts'][index]['workflow_run'].__setitem__(key, wrong))
            self.reject(lambda v: v['artifacts'].append(copy.deepcopy(v['artifacts'][index])))

    def test_both_exact_upload_steps_are_required_and_ordered(self):
        self.reject(lambda v: v['jobs'][0]['steps'].pop())
        self.reject(lambda v: v['jobs'][0]['steps'].append(copy.deepcopy(v['jobs'][0]['steps'][0])))
        self.reject(lambda v: v['jobs'][0]['steps'][1].__setitem__('number', 4))
        for index in [0, 1]:
            for key, wrong in [('status', 'in_progress'), ('conclusion', 'failure'), ('name', 'Different upload')]:
                with self.subTest(index=index, key=key):
                    self.reject(lambda v: v['jobs'][0]['steps'][index].__setitem__(key, wrong))

    def test_creation_is_bound_to_corresponding_upload_with_only_two_second_end_tolerance(self):
        value = fixture()
        value['artifacts'][0]['created_at'] = '2026-11-19T09:05:02Z'
        self.verify(value)
        for index, timestamp in [(0, '2026-11-19T09:03:59Z'), (0, '2026-11-19T09:05:03Z'),
                                 (1, '2026-11-19T09:06:59Z'), (1, '2026-11-19T09:08:03Z'),
                                 (0, '2026-11-19T09:08:00Z'), (1, '2026-11-19T09:05:00Z')]:
            with self.subTest(index=index, timestamp=timestamp):
                self.reject(lambda v: v['artifacts'][index].__setitem__('created_at', timestamp))
        self.reject(lambda v: v['jobs'][0].__setitem__('completed_at', '2026-11-19T09:07:59Z'))
        self.reject(lambda v: v['jobs'][0]['steps'][0].__setitem__('started_at', '2026-11-19T09:06:00Z'))
        self.reject(lambda v: v['jobs'][0]['steps'][0].__setitem__('started_at', '2026-11-19T08:59:59Z'))
        self.reject(lambda v: v['jobs'][0]['steps'][1].__setitem__('completed_at', '2026-11-19T09:10:01Z'))


class ZipTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); self.archive = self.root / 'original.zip'; self.dest = self.root / 'extracted'

    def make(self, entries=None, compression=zipfile.ZIP_STORED, link=False):
        entries = entries or [('evidence-manifest.json', b'{"source":"synthetic"}'), ('runtime-normal/report.json', b'original report bytes')]
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', UserWarning)
            with zipfile.ZipFile(self.archive, 'w', compression=compression) as archive:
                for i, (name, data) in enumerate(entries):
                    item = zipfile.ZipInfo(name); item.compress_type = compression; item.create_system = 3
                    item.external_attr = ((stat.S_IFLNK if link and i == 0 else stat.S_IFREG) | 0o644) << 16
                    archive.writestr(item, data)
        return self.archive

    def test_safe_nested_stored_and_deflated_bytes_and_original_zip_preserved(self):
        for compression in [zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED]:
            with self.subTest(compression=compression):
                self.make(compression=compression); original = self.archive.read_bytes()
                destination = self.root / ('extracted-' + str(compression))
                result = m.safe_extract(self.archive, destination)
                expected = {name: {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
                            for name, data in [('evidence-manifest.json', b'{"source":"synthetic"}'), ('runtime-normal/report.json', b'original report bytes')]}
                self.assertEqual(result, expected)
                self.assertEqual((destination / 'runtime-normal/report.json').read_bytes(), b'original report bytes')
                self.assertEqual(self.archive.read_bytes(), original)

    def test_existing_destination_is_never_overwritten(self):
        self.make(); self.dest.mkdir(); sentinel = self.dest / 'original.txt'; sentinel.write_bytes(b'keep')
        with self.assertRaises((AssertionError, FileExistsError)): m.safe_extract(self.archive, self.dest)
        self.assertEqual(sentinel.read_bytes(), b'keep')

    def test_unsafe_archive_paths_rejected_without_escape(self):
        for name in ['../escape', '/absolute', 'a/../escape', 'a\\escape', 'C:/escape', 'a%2fb',
                     'a//b', 'a/./b', 'é.txt', 'a\x01b']:
            with self.subTest(name=name):
                self.make([(name, b'bad')])
                destination = self.root / ('bad-' + str(len(list(self.root.iterdir()))))
                with self.assertRaises(REJECT): m.safe_extract(self.archive, destination)
        self.assertFalse((self.root.parent / 'escape').exists())

    def test_duplicate_case_alias_parent_alias_and_file_directory_collision_rejected(self):
        for names in [('a.txt', 'a.txt'), ('a.txt', 'A.txt'), ('Assets/a.bin', 'assets/b.bin'), ('a', 'a/b')]:
            with self.subTest(names=names):
                self.make([(name, b'bytes') for name in names])
                destination = self.root / ('alias-' + str(len(list(self.root.iterdir()))))
                with self.assertRaises(REJECT): m.safe_extract(self.archive, destination)

    def test_symlink_unsupported_compression_and_encrypted_entries_rejected(self):
        self.make(link=True)
        with self.assertRaises(REJECT): m.safe_extract(self.archive, self.root / 'symlink')
        self.make(compression=zipfile.ZIP_BZIP2)
        with self.assertRaises(REJECT): m.safe_extract(self.archive, self.root / 'bzip2')
        self.make(); data = bytearray(self.archive.read_bytes())
        for signature, offset in [(b'PK\x03\x04', 6), (b'PK\x01\x02', 8)]:
            start = 0
            while (start := data.find(signature, start)) >= 0:
                flags = struct.unpack_from('<H', data, start + offset)[0]
                struct.pack_into('<H', data, start + offset, flags | 1); start += 4
        self.archive.write_bytes(data)
        with self.assertRaises((AssertionError, RuntimeError)): m.safe_extract(self.archive, self.root / 'encrypted')

    def test_uncompressed_budget_and_actual_crc_are_verified(self):
        self.make([('a', b'12345'), ('b', b'67890')])
        with self.assertRaises(REJECT): m.safe_extract(self.archive, self.root / 'budget', max_total=9)
        data = self.archive.read_bytes(); self.archive.write_bytes(data.replace(b'12345', b'ABCDE', 1))
        with self.assertRaises((AssertionError, zipfile.BadZipFile)): m.safe_extract(self.archive, self.root / 'crc')

    def test_archive_member_count_is_bounded(self):
        self.make([(str(index), b'x') for index in range(20001)])
        with self.assertRaises(REJECT): m.safe_extract(self.archive, self.root / 'too-many')


class PackagePolicyTests(unittest.TestCase):
    def test_git_threshold_is_strict_and_large_files_only_reference_original_artifact(self):
        artifact = fixture()['artifacts'][1]
        packages = {
            'small.zip': {'bytes': 99_999_999, 'sha256': '3' * 64},
            'boundary.zip': {'bytes': 100_000_000, 'sha256': '4' * 64},
            'large.exe': {'bytes': 105_000_000, 'sha256': '5' * 64}}
        before = copy.deepcopy(packages)
        result = m.package_export_plan(packages, artifact)
        self.assertEqual(result['included'], {'small.zip': packages['small.zip']})
        self.assertEqual(set(result['references']), {'boundary.zip', 'large.exe'})
        for name, reference in result['references'].items():
            self.assertEqual(reference['bytes'], packages[name]['bytes'])
            self.assertEqual(reference['sha256'], packages[name]['sha256'])
            self.assertEqual(reference['artifactId'], artifact['id'])
            self.assertEqual(reference['artifactName'], artifact['name'])
            self.assertEqual(reference['artifactDigest'], artifact['digest'])
            self.assertEqual(reference['sourceRunId'], 123)
            self.assertEqual(reference['sourceCommit'], SOURCE)
            self.assertIs(reference['gitBytesIncluded'], False)
        self.assertEqual(packages, before)

    def test_small_packages_are_not_reported_as_omitted(self):
        packages = {'portable.zip': {'bytes': 42, 'sha256': 'c' * 64}}
        result = m.package_export_plan(packages, fixture()['artifacts'][1])
        self.assertEqual(result, {'included': packages, 'references': {}})
        for size in [True, 0, -1, 128_000_000, 128_000_001]:
            with self.subTest(size=size), self.assertRaises(REJECT):
                m.package_export_plan({'portable.zip': {'bytes': size, 'sha256': 'c' * 64}}, fixture()['artifacts'][1])
        largest = m.package_export_plan({'portable.zip': {'bytes': 127_999_999, 'sha256': 'c' * 64}}, fixture()['artifacts'][1])
        self.assertEqual(largest['included'], {})
        self.assertIs(largest['references']['portable.zip']['gitBytesIncluded'], False)


if __name__ == '__main__':
    unittest.main(verbosity=2)

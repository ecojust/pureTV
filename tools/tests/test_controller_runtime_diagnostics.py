"""Bounded AVD batches and evidence collection must not weaken or mask acceptance."""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'tools' / filename)
    value = importlib.util.module_from_spec(spec); spec.loader.exec_module(value)
    return value


batch = module('runtime_small_batches', 'controller-emulator-batch.py')
diagnostics = module('runtime_host_diagnostics', 'controller-runtime-diagnostics.py')


class BatchIsolation(unittest.TestCase):
    def test_every_signed_game_is_planned_once_in_at_most_three_game_batches(self):
        planned = []
        for name in batch.DEFAULT_BATCHES:
            group, slugs = batch.BATCHES[name]
            self.assertGreaterEqual(len(slugs), 2); self.assertLessEqual(len(slugs), 3)
            self.assertEqual(batch.selected_slugs(group, name), slugs)
            planned.extend(slugs)
        self.assertEqual(len(planned), 20)
        self.assertEqual(len(set(planned)), 20)
        self.assertEqual(set(planned), set(batch.release.ALL_SLUGS))

    def test_batch_cannot_borrow_another_signing_source_group(self):
        with self.assertRaisesRegex(AssertionError, 'exact artifact source group'):
            batch.selected_slugs('kit', 'worlds-2')

    def test_unknown_batch_cannot_create_unverified_work(self):
        with self.assertRaises(KeyError):
            batch.selected_slugs('kit', 'kit-unknown')

    def test_empty_dispatch_defaults_to_every_bounded_batch(self):
        plan = batch.runtime_plan('')
        self.assertEqual(plan['selectedBatches'], list(batch.DEFAULT_BATCHES))
        self.assertEqual(set(plan['plannedSlugs']), set(batch.release.ALL_SLUGS))
        self.assertTrue(plan['completeCatalogRequested'])

    def test_selected_batches_keep_full_games_and_exact_source_groups(self):
        plan = batch.runtime_plan('["kit-3","worlds-1"]')
        self.assertEqual(plan['selectedBatches'], ['worlds-1', 'kit-3'])
        self.assertEqual(plan['plannedSlugs'], ['coast-kart', 'cozy-island', 'glass-fold', 'tension-span', 'prism-relay'])
        self.assertEqual([(x['group'], x['batch']) for x in plan['matrix']['include']], [('worlds', 'worlds-1'), ('kit', 'kit-3')])
        self.assertFalse(plan['completeCatalogRequested'])
        self.assertFalse(plan['worlds2GraphicsExperiment']['selected'])

    def test_invalid_or_injected_selections_never_enter_the_matrix(self):
        for raw in ['[]', '{}', 'null', '"kit-3"', '[1]', '[true]', '["unknown"]', '["kit-3","kit-3"]', '["kit-3; echo bad"]']:
            with self.subTest(raw=raw), self.assertRaises((AssertionError, ValueError)):
                batch.runtime_plan(raw)

    def test_only_worlds_two_uses_the_documented_alternate_graphics_path(self):
        plan = batch.runtime_plan('')
        self.assertTrue(plan['worlds2GraphicsExperiment']['selected'])
        standard = '-no-window -memory 3072 -gpu swiftshader_indirect -noaudio -no-boot-anim -no-snapshot'
        for row in plan['matrix']['include']:
            self.assertEqual(row['emulatorOptions'], standard + (' -feature -Vulkan -verbose' if row['batch'] == 'worlds-2' else ''))
            self.assertEqual((row['apiLevel'], row['arch'], row['renderer']), (36, 'x86_64', 'swiftshader_indirect'))

    def test_home_scope_matches_the_game_and_observer_selection(self):
        plan = batch.runtime_plan(scope='home-12')
        self.assertEqual(len(plan['plannedSlugs']), 12)
        self.assertEqual(set(plan['plannedSlugs']), batch.release.HOME_GAMES)
        self.assertEqual(batch.release.scoped_games(batch.release.KIT_SLUGS, 'home-12'), ['neon-rush', 'tower-overlap'])
        self.assertEqual(len(batch.release.scoped_games(batch.release.SLUGS, 'home-12')), 10)
        self.assertNotIn('cozy-island', plan['plannedSlugs'])
        with self.assertRaisesRegex(AssertionError, 'outside the signed selection'):
            batch.runtime_plan('["worlds-1"]', scope='home-12')
        with self.assertRaisesRegex(AssertionError, 'Unknown controller release scope'):
            batch.runtime_plan(scope='unknown')

    def test_compact_tv_scope_signs_and_runs_only_the_seven_arcade_games(self):
        plan = batch.runtime_plan(scope='arcade-7')
        self.assertEqual(plan['selectedBatches'], ['arcade-1', 'arcade-2', 'arcade-3'])
        self.assertEqual(set(plan['plannedSlugs']), set(batch.release.GROUPS['arcade']))
        self.assertEqual(batch.release.scoped_games(batch.release.KIT_SLUGS, 'arcade-7'), [])
        with self.assertRaises(AssertionError):
            batch.runtime_plan('["retry-alien"]', scope='arcade-7')

    def test_room_recovery_scope_excludes_tank_from_signing_and_runtime(self):
        plan = batch.runtime_plan(scope='arcade-recovery-6')
        expected = set(batch.release.GROUPS['arcade']) - {'tank'}
        self.assertEqual(set(plan['plannedSlugs']), expected)
        self.assertEqual(set(batch.release.scoped_games(batch.release.SLUGS, 'arcade-recovery-6')), expected)
        self.assertEqual(batch.release.scoped_games(batch.release.KIT_SLUGS, 'arcade-recovery-6'), [])
        with self.assertRaises(AssertionError):
            batch.runtime_plan('["arcade-1"]', scope='arcade-recovery-6')

    def test_only_exact_requested_retry_aliases_exist(self):
        aliases = set(batch.BATCHES) - set(batch.DEFAULT_BATCHES) - set(batch.HOME_BATCHES)
        self.assertEqual(aliases, {'retry-used-car', 'retry-alien', 'retry-prism', 'retry-arcade-visual', 'retry-cozy', 'retry-super-mario', 'retry-jackal'})
        plan = batch.runtime_plan('["retry-used-car","retry-alien","retry-prism"]')
        self.assertEqual(plan['plannedSlugs'], ['used-car-racing', 'alien-shooter', 'prism-relay'])
        self.assertFalse(plan['completeCatalogRequested'])
        self.assertTrue(plan['usedCarStableImageComparison']['selected'])
        rows = plan['matrix']['include']
        self.assertEqual([(r['group'], r['apiLevel'], r['arch']) for r in rows],
                         [('worlds', 29, 'x86'), ('worlds', 36, 'x86_64'), ('kit', 36, 'x86_64')])
        self.assertIn('-feature -Vulkan -verbose', rows[0]['emulatorOptions'])
        self.assertNotIn('-Vulkan', rows[1]['emulatorOptions'])
        self.assertNotIn('-Vulkan', rows[2]['emulatorOptions'])

    def test_parent_and_retry_alias_cannot_test_or_claim_a_game_twice(self):
        for raw in ['["worlds-2","retry-used-car"]', '["worlds-2","retry-alien"]', '["kit-3","retry-prism"]', '["arcade-1","retry-arcade-visual"]', '["worlds-1","retry-cozy"]']:
            with self.subTest(raw=raw), self.assertRaisesRegex(AssertionError, 'must not repeat a game'):
                batch.runtime_plan(raw)

    def test_visual_retry_keeps_full_two_game_scope_on_exact_stable_image(self):
        plan = batch.runtime_plan('["retry-arcade-visual"]')
        self.assertEqual(plan['plannedSlugs'], ['tank', 'jackal'])
        self.assertTrue(plan['arcadeVisualStableImageComparison']['selected'])
        self.assertFalse(plan['completeCatalogRequested'])
        row = plan['matrix']['include'][0]
        self.assertEqual((row['group'], row['apiLevel'], row['arch']), ('arcade', 29, 'x86'))
        self.assertIn('-gpu swiftshader_indirect', row['emulatorOptions'])
        self.assertIn('-feature -Vulkan -verbose', row['emulatorOptions'])

    def test_only_used_car_changes_the_deprecated_renderer(self):
        plan = batch.runtime_plan('["retry-used-car","retry-alien","retry-prism","retry-arcade-visual"]')
        rows = {row['batch']: row for row in plan['matrix']['include']}
        used = rows['retry-used-car']; comparison = rows['retry-arcade-visual']
        self.assertEqual((used['apiLevel'], used['arch'], used['renderer']), (29, 'x86', 'swiftshader'))
        self.assertEqual(used['emulatorOptions'], comparison['emulatorOptions'].replace('-gpu swiftshader_indirect', '-gpu swiftshader'))
        for name in ['retry-alien', 'retry-prism', 'retry-arcade-visual']:
            self.assertEqual(rows[name]['renderer'], 'swiftshader_indirect')
            self.assertIn('-gpu swiftshader_indirect', rows[name]['emulatorOptions'])

    def test_only_used_car_pins_the_exact_official_old_host_build(self):
        for name in batch.BATCHES:
            row = batch.runtime_plan(json.dumps([name]))['matrix']['include'][0]
            if name == 'retry-used-car':
                self.assertEqual(row['emulatorBuild'], '13610412')
                archive = row['emulatorArchive']
                self.assertEqual(archive['version'], '35.6.11')
                self.assertEqual(archive['url'], 'https://dl.google.com/android/repository/emulator-linux_x64-13610412.zip')
                self.assertEqual(archive['sha256'], '2fe2b56fe93ce75e1d478a40162131381d911c355efeaedb54dd1e0d0897a5cf')
                self.assertEqual(archive['bytes'], 319086252)
                self.assertEqual((row['apiLevel'], row['arch'], row['renderer']), (29, 'x86', 'swiftshader'))
                self.assertIn('-feature -Vulkan -verbose', row['emulatorOptions'])
            else:
                self.assertEqual(row['emulatorBuild'], '')
                self.assertIsNone(row['emulatorArchive'])

    def test_exact_installed_host_version_is_required_for_used_car(self):
        output = 'Android emulator version 35.6.11.0 (build_id 13610412) (CL:N/A)\n'
        record = batch.verify_emulator_version(output, 'retry-used-car')
        self.assertEqual(record['rawVersionOutput'], output)
        self.assertTrue(record['exactBuildVerified'])
        for bad in ['', 'Android emulator version 37.2.13.0 (build_id 16740729)',
                    'Android emulator version 35.6.11.0 (build_id 13610413)',
                    'Android emulator version 35.6.12.0 (build_id 13610412)']:
            with self.subTest(output=bad), self.assertRaises(AssertionError):
                batch.verify_emulator_version(bad, 'retry-used-car')
        self.assertIsNone(batch.verify_emulator_version('another default version', 'retry-alien')['requestedArchive'])

    def test_version_stream_choice_does_not_hide_failure_or_reject_valid_version(self):
        output = 'Android emulator version 35.6.11.0 (build_id 13610412) (CL:N/A)\n'
        for stdout, stderr in [(output, ''), ('', output)]:
            result = {'exitCode': 0, 'stdout': stdout, 'stderr': stderr}
            self.assertTrue(batch.verify_emulator_process(result, 'retry-used-car')['exactBuildVerified'])
            result['exitCode'] = 1
            with self.assertRaisesRegex(AssertionError, 'exit successfully'):
                batch.verify_emulator_process(result, 'retry-used-car')

    def test_retry_selection_does_not_silently_include_completed_neighbors(self):
        self.assertEqual(batch.selected_slugs('worlds', 'retry-alien'), ['alien-shooter'])
        self.assertEqual(batch.selected_slugs('arcade', 'retry-super-mario'), ['super-mario'])
        self.assertEqual(batch.selected_slugs('kit', 'retry-prism'), ['prism-relay'])
        with self.assertRaisesRegex(AssertionError, 'exact artifact source group'):
            batch.selected_slugs('kit', 'retry-used-car')


class HostEvidence(unittest.TestCase):
    def test_small_emulator_process_is_retained_beyond_top_memory_rows(self):
        rows = [f'{i} 1 {10000-i} 1.0 worker' for i in range(1, 61)]
        rows.append('99 1 1 0.0 qemu-system-x86')
        result = diagnostics.process_rows('\n'.join(rows))
        self.assertEqual(result['totalProcesses'], 61)
        self.assertEqual(len(result['largestAndRelevantProcesses']), 41)
        self.assertEqual(result['largestAndRelevantProcesses'][-1]['pid'], 99)

    def test_command_failure_remains_evidence_instead_of_becoming_success(self):
        result = diagnostics.capture([sys.executable, '-c', 'import sys; print("kernel unavailable",file=sys.stderr);sys.exit(7)'])
        self.assertEqual(result['exitCode'], 7)
        self.assertIn('kernel unavailable', result['stderr'])

    def test_logcat_bytes_survive_an_exited_adb_client(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            collector = batch.ContinuousLogcat([sys.executable, '-c', 'print("last device log before loss");raise SystemExit(7)'], root)
            collector.process.wait(timeout=5)
            collector.close(); collector.close()
            self.assertIn('last device log before loss', (root / 'continuous-logcat.txt').read_text())
            result = json.loads((root / 'continuous-logcat-status.json').read_text())
            self.assertEqual(result['exitBeforeCollectorStop'], 7)
            self.assertEqual(result['finalExitCode'], 7)
            self.assertFalse(result['terminatedOnlyOwnedAdbClient'])


if __name__ == '__main__':
    unittest.main()

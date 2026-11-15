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
        for name, (group, slugs) in batch.BATCHES.items():
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
        self.assertEqual(plan['selectedBatches'], list(batch.BATCHES))
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

"""UI-only evidence must never be accepted as complete gameplay evidence."""
import copy
import importlib.util
from pathlib import Path
import sys
import unittest
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools'))
spec = importlib.util.spec_from_file_location('controller_status_batch', ROOT/'tools/controller-emulator-batch.py')
batch = importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)


class AcceptanceModeTests(unittest.TestCase):
    def test_existing_default_retains_complete_gameplay(self):
        plan = batch.runtime_plan('')
        self.assertEqual(plan['acceptanceMode'], 'complete')
        self.assertTrue(plan['fullGameplayAcceptance'])
        self.assertEqual(plan['driverFlags'], [])

    def test_status_only_still_selects_twenty_exact_games(self):
        plan = batch.runtime_plan('', 'client-status')
        self.assertEqual(set(plan['plannedSlugs']), set(batch.release.ALL_SLUGS))
        self.assertEqual(plan['driverFlags'], ['--status-only'])
        self.assertFalse(plan['fullGameplayAcceptance'])

    def test_unrecognized_mode_never_enters_shell_or_plan(self):
        for mode in ['', 'status', 'complete; true', None]:
            with self.subTest(mode=mode), self.assertRaises(AssertionError):
                batch.runtime_plan('', mode)

    def report(self):
        return {'mode':'android','status':'passed','scope':batch.ACCEPTANCE_SCOPES['client-status'],
                'modelWrites':False,'clockOverrides':False,'fullGameplayAcceptance':False,
                'statusAcceptanceEnvironment':'android-menu','slug':'tank','tests':[{'name':name,'status':'passed'} for name in [
                'menu layout and service address',
                'official hello and nine sync messages leave menu unchanged',
                'connected status displays the real SDK identity and controller icon',
                'two SDK identities display separate seats and update independently',
                'disconnect removes the ID and same-ID reconnect restores its seat',
                'same-sequence ACK for every original SDK status message']]}

    def test_valid_status_evidence_is_scoped(self):
        self.assertFalse(batch.verify_driver_acceptance(self.report(), 'client-status')['fullGameplayAcceptance'])

    def test_status_evidence_cannot_satisfy_complete_acceptance(self):
        with self.assertRaises(AssertionError):
            batch.verify_driver_acceptance(self.report(), 'complete')

    def test_missing_dual_identity_check_is_rejected(self):
        report = self.report();report['tests'] = [t for t in report['tests'] if not t['name'].startswith('two SDK')]
        with self.assertRaises(AssertionError):
            batch.verify_driver_acceptance(report, 'client-status')

    def test_failed_wrong_platform_or_mutating_reports_are_rejected(self):
        for key,value in [('status','failed'),('mode','browser'),('modelWrites',True),
                          ('clockOverrides',True),('fullGameplayAcceptance',True),
                          ('statusAcceptanceEnvironment','browser-menu-and-playing')]:
            report = copy.deepcopy(self.report());report[key] = value
            with self.subTest(key=key), self.assertRaises(AssertionError):
                batch.verify_driver_acceptance(report, 'client-status')

if __name__ == '__main__':
    unittest.main()

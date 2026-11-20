#!/usr/bin/env python3
import unittest
from observe_boot_services import observe_until_quiet

class BootServices(unittest.TestCase):
    def run_observation(self, state):
        seconds = [0]
        def advance(n):
            seconds[0] += n
        return observe_until_quiet(lambda: state(seconds[0]), lambda: seconds[0], advance)

    def test_provider_restart_extends_quiet_window_without_touching_settings(self):
        def state(t):
            return {'bootCompleted': '1', 'storeApks': '/product/store' if t < 70 else '/data/store',
                    'gmsApks': '/system/gms', 'fontProviderProcess': '501' if t < 70 else '701'}
        report = self.run_observation(state)
        self.assertEqual(report['status'], 'stable')
        self.assertEqual(report['samples'][-1]['elapsedSeconds'], 100)
        self.assertFalse(report['systemSettingsChanged'])

    def test_missing_provider_does_not_block_the_actual_apk_beyond_the_budget(self):
        report = self.run_observation(lambda _: {'bootCompleted': '1', 'fontProviderProcess': None})
        self.assertEqual(report['status'], 'bounded-observation-ended')
        self.assertEqual(report['samples'][-1]['elapsedSeconds'], 180)

if __name__ == '__main__':
    unittest.main()

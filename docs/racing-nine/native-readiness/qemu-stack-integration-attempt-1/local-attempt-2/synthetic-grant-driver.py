"""Test wiring with a mocked grant. NOT the real permission gate, never usable for an AVD."""
import hashlib
import importlib.util
import json
from pathlib import Path
import unittest

root = Path('/dev/shm/puretv-submit')
test = root / 'joystick-games/qa/android/test_qemu_permission.py'
spec = importlib.util.spec_from_file_location('synthetic_permission_tests', test)
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
output = Path('/dev/shm/racing-native-readiness/qemu-stack-integration-attempt-2/synthetic-grant')
output.mkdir()
module.PermissionELF.output = output
original = module.m.PreparedDebugger.__init__

def synthetic(self, *args, **kwargs):
    original(self, *args, **kwargs)
    self.prctl = lambda *values: 0

module.m.PreparedDebugger.__init__ = synthetic
result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(module.PermissionELF))
summary = {'syntheticGrant': True, 'realPR_SET_PTRACERExecuted': False, 'ambientLocalAttachPermissionOnly': True,
           'canAuthorizeAvd': False, 'nativeAcceptanceAllowed': False,
           'testsRun': result.testsRun, 'failures': len(result.failures), 'errors': len(result.errors), 'skipped': len(result.skipped),
           'testSha256': hashlib.sha256(test.read_bytes()).hexdigest(),
           'helperSha256': hashlib.sha256(Path(module.m.__file__).read_bytes()).hexdigest()}
(output / 'synthetic-result.json').write_text(json.dumps(summary, indent=2) + '\n')
raise SystemExit(0 if result.wasSuccessful() else 1)

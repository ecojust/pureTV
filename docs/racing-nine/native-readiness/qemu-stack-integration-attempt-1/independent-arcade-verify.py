#!/usr/bin/env python3
"""Read-only final source/evidence check; no test, debugger, AVD or workflow execution."""
import ast
import datetime
import hashlib
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent

def record(path):
    return {'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}

manifest = json.loads((OUT / 'inventory.json').read_text())
assert record(OUT / 'inventory.json')['sha256'] == '75641abb827a27fcc1c63d3104ed138e88466a1b20912b3c5a4e54de2da71fc5'
for name, expected in manifest['files'].items():
    path = ROOT / name
    assert path.is_file() and not path.is_symlink() and record(path) == expected, name
validation = json.loads((OUT / 'validation.json').read_text())
for name, expected in validation['sourceFiles'].items():
    assert record(ROOT / name) == expected
    assert (ROOT / name).read_bytes() == (OUT / 'local-attempt-2/executed-source' / name).read_bytes()
base = OUT / 'local-attempt-2'
for log, count in [('core-tests.log', 28), ('supervisor-tests.log', 22), ('integration-tests.log', 9), ('synthetic-grant.log', 10)]:
    text = (base / log).read_text()
    assert f'Ran {count} tests' in text and text.rstrip().endswith('OK') and 'skipped=' not in text
permission = json.loads((base / 'permission-gate/report.json').read_text())
assert permission['status'] == 'blocked' and permission['testsRun'] == 1 and permission['failures'] == 1 and permission['skipped'] == 0
first = json.loads((base / 'permission-gate/test_01_fatal/prepared-0/report.json').read_text())
assert first['grant']['status'] == 'rejected' and first['grant']['errno'] == 22
synthetic = json.loads((base / 'synthetic-grant/synthetic-result.json').read_text())
assert synthetic['testsRun'] == 10 and synthetic['failures'] == synthetic['errors'] == synthetic['skipped'] == 0
assert synthetic['realPR_SET_PTRACERExecuted'] is False and synthetic['canAuthorizeAvd'] is False
assert not (base / 'synthetic-grant/report.json').exists()
launch = json.loads((base / 'synthetic-grant/test_10_supervisor_original_wait/launch/report.json').read_text())
assert launch['returnCode'] == -11 and launch['intervention'] is None and launch['nativeAcceptanceAllowed'] is False
helper = ast.parse((ROOT / 'joystick-games/tools/android-qemu-stack.py').read_text())
for node in ast.walk(helper):
    if isinstance(node, ast.Call):
        name = node.func.attr if isinstance(node.func, ast.Attribute) else node.func.id if isinstance(node.func, ast.Name) else None
        assert name not in ['kill', 'killpg', 'terminate', 'system', 'eval', 'exec', 'read_memory'], name
result = {
    'status': 'no-remaining-static-blockers-for-root-reviewed-gated-ci-diagnostic',
    'reviewer': 'racing_review_arcade', 'reviewedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope': 'Final six-path QA implementation review plus unchanged local core-test source and original evidence; not actual CI permission or QEMU validation.',
    'inventory': record(OUT / 'inventory.json'), 'inventoryFilesVerified': len(manifest['files']),
    'sourceFilesVerified': validation['sourceFiles'], 'isolatedParentRequired': validation['isolatedParent'], 'overlayFiles': 6,
    'evidenceLogs': {n: record(base / n) for n in ['core-tests.log', 'supervisor-tests.log', 'integration-tests.log', 'synthetic-grant.log', 'permission-gate.log', 'actionlint.log']},
    'originalLocalResults': {'core': 28, 'supervisor': 22, 'syntheticIntegration': 9, 'skipped': 0,
        'syntheticGrantRealGdbWiring': {'cases': 10, 'realPR_SET_PTRACERExecuted': False, 'canAuthorizeAvd': False,
                                     'fixtureOriginalParentWait': -11, 'report': record(base / 'synthetic-grant/synthetic-result.json')},
        'actualProcessLocalPermission': {'status': 'blocked', 'errno': 22, 'casesRun': 1, 'casesNotRun': 9, 'skipped': 0,
                                        'report': record(base / 'permission-gate/report.json')}},
    'reviewedBoundaries': [
        {'area': 'Scope/default', 'finding': 'The new flag defaults false and requires exact original Pon source/run/export, existing supervision and v8 Vulkan-off flags. No emulator argument, APK, game model or clock is changed by this overlay.'},
        {'area': 'Permission', 'finding': 'Same-user GDB only. PR_SET_PTRACER receives the exact positive prepared GDB PID in the owned child before exec. Python and kernel task counts must both be one. No ANY, sudo, global ptrace setting or root bridge. Kernel allowance includes debugger descendants; actual TracerPid is still verified as the exact original GDB.'},
        {'area': 'PID ownership', 'finding': 'GDB stays unreaped through grant/exec. Receipt binds original child PID/start. Exact target and debugger PID/start/parent/UID/executable identities are checked before attach and before every frame read. Parent polls/waits are guarded while initial attach is unresolved.'},
        {'area': 'Owner transfer', 'finding': 'Session construction must succeed before adoption. The session owns the prepared MI process immediately after successful construction, so an exit before start cannot orphan the cleanup owner. Wrong-start, constructor rejection and exit-before/during-start cases are preserved.'},
        {'area': 'Data bounds', 'finding': 'At most 4 SIGSEGV events, 4 threads and 12 frames per event. Only sanitized frame address/function/module metadata; module paths resolve under controlled roots before hashing. No retained raw MI, arguments, locals, environment, arbitrary memory or requested core dump. Capture uses remaining deadline and reserves final-report space.'},
        {'area': 'Signals/cleanup', 'finding': 'Normal detach preserves signal delivery and original parent wait. No internal diagnostic error calls kill/terminate. Unknown attach remains blocked; target is not reaped until the original response is already conclusive or exact GDB actually exits. Quarantine explicitly does not continue reading late MI. External cancellation/original supervisor deadline control remains separate and restore reports incomplete cleanup.'},
        {'area': 'CI gate', 'finding': 'Before any AVD, CI must pass integration boundaries then all 10 actual same-permission ELF cases with zero skips. Gate checks helper/test/GDB bytes, GDB path, QA source/run/attempt and runner, and is verified again at prepare/launch. Local EINVAL cannot pass this gate; synthetic-grant output is not a usable gate report.'},
        {'area': 'Acceptance separation', 'finding': 'Diagnostic requests set runtimeAccepted=false and nativeAcceptanceAllowed=false in original export metadata even if ordinary game tests pass. Original game reports are retained unchanged; attachment is marked intervention, never proof of root cause or release acceptance.'},
    ],
    'remainingLimits': [
        'Actual PR_SET_PTRACER capability on the hosted CI runner is unverified. All ten unmocked same-permission cases must pass in that run before any QEMU/AVD starts.',
        'If GDB never responds or exits after an unresolved attachment, cleanup cannot be promised within the 300-second capture budget. The explicit outer workflow timeout remains a boundary; the source records this as incomplete, not successful detach.',
        'Root must create the exact six-file overlay on v8 parent 467670b and verify every other path remains unchanged. Separate closure review is owned by racing_review_karts.',
        'No real QEMU stack, Android gameplay or physical-device result has been produced by this work.'
    ],
    'reviewerSourceEdits': [], 'reviewerTestReruns': 0, 'reviewerDebuggerAttachments': 0,
    'workflowDispatches': 0, 'releaseWrites': 0, 'actualCiPermissionProven': False,
    'actualQemuProven': False, 'nativeAcceptanceAllowed': False,
    'checker': record(Path(__file__)),
}
(OUT / 'independent-arcade-review.json').write_text(json.dumps(result, indent=2) + '\n')
print('Verified 67 original files and 7 source records; static gated-CI review complete. Actual permission remains blocked/unverified; no execution or dispatch.')

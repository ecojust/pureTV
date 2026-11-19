#!/usr/bin/env python3
"""Independent read-only evidence binding, not a new GDB/ELF execution."""
import ast
import datetime
import hashlib
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
EVIDENCE = Path('/dev/shm/racing-review-karts/qemu-stack-tests-attempt-3')
def record(path): return {'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
original = json.loads((EVIDENCE / 'result.json').read_text())
assert original['status'] == 'passed' and original['tests'] == 28 and original['skipped'] == 0 and original['exitCode'] == 0
for item in original['files']:
    assert record(EVIDENCE / item['path']) == {key: item[key] for key in ['bytes', 'sha256']}
source = {'joystick-games/tools/android-qemu-stack.py': '91fb4cd86d5378e03f9a089663db213c45e1bb310bf73dbf23afa06e65481489',
          'joystick-games/qa/android/test_qemu_stack.py': '3fffbed20e5d15cde5478d777b2150b541784b4bb8202e2dbb080a1c9f0742a0'}
for name, sha in source.items():
    assert record(ROOT / name)['sha256'] == sha
    assert (ROOT / name).read_bytes() == (EVIDENCE / Path(name).name).read_bytes()
code = (EVIDENCE / 'android-qemu-stack.py').read_text(); tree = ast.parse(code)
for node in ast.walk(tree):
    if isinstance(node, ast.Call):
        name = node.func.attr if isinstance(node.func, ast.Attribute) else node.func.id if isinstance(node.func, ast.Name) else None
        assert name not in ['kill', 'killpg', 'terminate', 'system', 'eval', 'exec', 'read_memory'], name
report = {'status':'core-stage-no-blocker-integration-not-reviewed', 'reviewer':'racing_review_arcade',
          'reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'scope':'Static review of exact core helper and tests, plus original real ELF/MI evidence hashes. No test rerun or new target attachment.',
          'sourceFiles':{name:record(ROOT / name) for name in source},
          'originalExecution':{'path':str(EVIDENCE / 'result.json'), **record(EVIDENCE / 'result.json'), 'tests':28,'skipped':0,'exitCode':0,
                               'artifacts':original['files'],'originalGdbScope':'Local GDB13.1 only; current container has no readable Yama ptrace_scope file.'},
          'readOnlyChecker':record(Path(__file__)),
          'findings':[
              {'item':'Target/debugger identity', 'result':'Current parent, target PID/start/path/exeSHA/UID/TracerPid and actual GDB identity are checked after attach and immediately before every frame query.'},
              {'item':'Collection bounds', 'result':'4 SIGSEGV events x 4 threads x 12 frames; command deadlines use remaining window; 2MiB capture stream budget and separate bounded cleanup budget; only sanitized frame fields and module metadata are retained.'},
              {'item':'Module scope', 'result':'Mapped file path resolves to a regular file under allowed roots before hashing; symlink escape is covered by a negative case.'},
              {'item':'Signals', 'result':'Original local fatal and handled-then-fatal tests preserve parent -11, external TERM/INT preserve -15/-2, healthy direct detach returns 0, event-limit detach preserves pending fault. Initial attach-time SIGSEGV preservation is covered synthetically and is not called a real attach-time crash.'},
              {'item':'Uncertain handshake and cleanup', 'result':'Only the original attach token done/error, successful detach or actual debugger exit resolves attachment; unrelated detach error does not unlock reap. Unknown cleanup stays blocked, no kill/terminate method is present in the production helper.'},
              {'item':'Report budget', 'result':'Per-frame reserve and explicit minimal blocked-report fallback keep cleanup status writable. Partial fault events remain recorded.'},
              {'item':'Privilege', 'result':'use_sudo=True is rejected before creating output or a debugger process. No sudo execution or global ptrace/security change is present in this core.'},
          ],
          'previousDraftFindingsResolved':['module symlink escape','per-frame target/debugger identity','remaining capture deadline','unresolved attach result versus detach error','oversize report could obscure cleanup','initial real signal at attach could be omitted'],
          'notYetReviewed':['Prepared GDB before QEMU launch','Exact per-child PR_SET_PTRACER identity authorized by root','Single-threaded preexec setup','Supervisor and debugger no-reap handshake across normal/error/cancel paths','CI same-user/Yama permission gate and GDB version/hash linkage','Default-off workflow/hook and fixed original APK/argv/API/GPU isolation'],
          'integrationApproved':False,'workflowDispatches':0,'newNativeOrDebuggerExecution':False,'gameplayAcceptanceImplied':False}
(OUT/'review.json').write_text(json.dumps(report,indent=2)+'\n')
print('Exact two core sources and six original evidence files match; 28 original tests, zero skips. Core-only review, no integration authorization.')

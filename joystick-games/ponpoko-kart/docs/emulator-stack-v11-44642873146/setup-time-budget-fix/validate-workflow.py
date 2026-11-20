"""Exact one-line QA setup-budget change; no CI, package or permission execution."""
from pathlib import Path
import subprocess,hashlib,json,difflib
ROOT=Path(__file__).resolve().parents[5];OUT=Path(__file__).resolve().parent
SOURCE='73a3cdb8a41cc079fc06d62de382673b6d3e81c1'
NAME='.github/workflows/joystick-catalog-android-runtime.yml'
before=subprocess.check_output(['git','show',SOURCE+':'+NAME],cwd=ROOT)
after=(ROOT/NAME).read_bytes()
old=b'      - name: Install GDB only for the owned QEMU diagnostic\n        if: inputs.pon_capture_qemu_stack\n        timeout-minutes: 5\n'
new=old.replace(b'timeout-minutes: 5',b'timeout-minutes: 10')
assert before.count(old)==1 and after==before.replace(old,new)
assert hashlib.sha256(before).hexdigest()=='baee26d48a9eae33b3752ac406ad2bc8ce58c8699687f82cf6cb0aff8e4dff9e'
diff=''.join(difflib.unified_diff(before.decode().splitlines(True),after.decode().splitlines(True),fromfile=SOURCE+'/'+NAME,tofile='candidate/'+NAME))
(OUT/'workflow.diff').write_text(diff)
(OUT/'candidate-workflow.yml').write_bytes(after)
command=['/dev/shm/racing-native-readiness/actionlint-1.7.12',NAME]
p=subprocess.run(command,cwd=ROOT,capture_output=True,timeout=30)
(OUT/'actionlint.stdout.log').write_bytes(p.stdout);(OUT/'actionlint.stderr.log').write_bytes(p.stderr)
assert p.returncode==0 and p.stdout==b'' and p.stderr==b''
result={'parentSource':SOURCE,'onlyOverlayPath':NAME,'beforeSha256':hashlib.sha256(before).hexdigest(),'afterSha256':hashlib.sha256(after).hexdigest(),
        'change':'Only opted-in GDB dependency setup timeout-minutes 5 to 10; exact whole-file replacement verified',
        'command':command,'actionlintBinarySha256':hashlib.sha256(Path(command[0]).read_bytes()).hexdigest(),'exitcode':p.returncode,
        'unchanged':['default-off input','apt commands','same-user guard','GDB execution identity','10 actual permission gates','emulator argv','game/source/package identity','all other workflow lines'],
        'generic138Rerun':False,'integration9Rerun':False,'realPermission10Rerun':False,'ciPost':False,'newRuntimeAcceptance':False}
(OUT/'validation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))

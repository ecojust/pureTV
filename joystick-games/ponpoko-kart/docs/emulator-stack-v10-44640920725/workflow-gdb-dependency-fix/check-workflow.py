"""Check the actual added YAML block and execute its original log-copy/export code; no apt/GDB run."""
from pathlib import Path
import hashlib,json,shutil,subprocess,textwrap
ROOT=Path('/dev/shm/puretv-submit');OUT=Path(__file__).parent
NAME='.github/workflows/joystick-catalog-android-runtime.yml'
text=(ROOT/NAME).read_text();old=subprocess.check_output(['git','show','5f2dce57aac3b8ecda316deac1d1ba5f0ae352bd:'+NAME],cwd=ROOT).decode()
start=text.index('      - name: Install GDB only for the owned QEMU diagnostic\n')
end=text.index('      - name: Require actual same-user process-local GDB permission before any AVD\n',start)
block=text[start:end]
copy_line="          if (scratch/'qemu-debugger-setup.log').is_file():shutil.copyfile(scratch/'qemu-debugger-setup.log',out/'qemu-debugger-setup.log')\n"
assert text[:start]+text[end:]==old.replace("          if (scratch/'qemu-permission-gate.log').is_file():shutil.copyfile(scratch/'qemu-permission-gate.log',out/'qemu-permission-gate.log')\n", "          if (scratch/'qemu-permission-gate.log').is_file():shutil.copyfile(scratch/'qemu-permission-gate.log',out/'qemu-permission-gate.log')\n"+copy_line)
assert text.replace(block,'').replace(copy_line,'')==old
assert '        if: inputs.pon_capture_qemu_stack\n' in block and '        timeout-minutes: 5\n' in block
assert block.count('sudo ')==2 and 'sudo apt-get update\n' in block and 'sudo apt-get install -y --no-install-recommends gdb\n' in block
assert 'test "$(id -u)" -ne 0' in block and 'test -x /usr/bin/gdb' in block and '/usr/bin/gdb --version' in block
assert all(x not in block for x in ['sysctl','ptrace_scope','ulimit','sudo gdb','PR_SET_PTRACER'])
body=textwrap.dedent(block.split('        run: |\n',1)[1]);(OUT/'executed-setup-fragment.sh').write_text(body)
p=subprocess.run(['bash','-n'],input=body,text=True,capture_output=True);assert p.returncode==0
scratch=OUT/'log-fixture';scratch.mkdir();(scratch/'qemu-debugger-setup.log').write_text('Fixture setup log only; no installer/debugger executed.\n')
export=OUT/'export-fixture';out=export/'evidence/joystick-android-runtime-ponpoko-kart/ponpoko-kart';out.mkdir(parents=True)
scope={'scratch':scratch,'out':out,'shutil':shutil}
exec(compile(textwrap.dedent(copy_line),'<actual-preserve-setup-log>','exec'),scope)
assert (out/'qemu-debugger-setup.log').read_bytes()==(scratch/'qemu-debugger-setup.log').read_bytes()
begin=text.index('          files={}\n',text.index("          (out/'runtime-verification.json')"))
finish=text.index("          (out/'export-manifest.json')",begin)
source=textwrap.dedent(text[begin:finish]);(OUT/'executed-export-fragment.py').write_text(source)
scope={'out':export,'record':lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}}
exec(compile(source,'<actual-export-file-enumeration>','exec'),scope)
name='evidence/joystick-android-runtime-ponpoko-kart/ponpoko-kart/qemu-debugger-setup.log'
assert set(scope['files'])=={name} and scope['files'][name]==scope['record'](out/'qemu-debugger-setup.log')
audit=ROOT/'joystick-games/tools/android-runtime-copies.py'
assert audit.read_bytes()==subprocess.check_output(['git','show','5f2dce57aac3b8ecda316deac1d1ba5f0ae352bd:joystick-games/tools/android-runtime-copies.py'],cwd=ROOT)
before=json.loads((OUT/'source-before.json').read_text())
for name,item in before['files'].items():
 p=OUT/'source'/name;assert {'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}=={k:item[k]for k in ['bytes','sha256']}
result={'status':'passed','parent':'5f2dce57aac3b8ecda316deac1d1ba5f0ae352bd','onlyChangedPath':NAME,
        'workflowSha256':hashlib.sha256(text.encode()).hexdigest(),'addedDefaultOffStepOnly':True,'originalGateAndParametersByteIdentical':True,
        'sudoRestrictedToTwoAptCommands':True,'actualGdbInvocationNonRoot':True,'shellSyntaxPassed':True,
        'realLogCopyAndExportEnumerationPassed':True,'exportFiles':scope['files'],'archiveHelperUnchanged':True,
        'archiveScope':'Checks declared source/package files; does not reject additional regular diagnostic logs.',
        'uploadScope':'Existing runtime/ artifact root includes the preserved game log; no exclusion or extension allowlist added.',
        'isolatedInputHashesUnchanged':True,'aptExecuted':False,'gdbExecuted':False,'permissionGateExecuted':False,'newPost':False}
(OUT/'workflow-check.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))

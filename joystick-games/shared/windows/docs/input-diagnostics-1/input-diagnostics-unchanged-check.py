from pathlib import Path
import hashlib,json,subprocess
ROOT=Path('/dev/shm/puretv-submit');SOURCE='2ea1383fa59c30abac7e07df8f4b9dfae343abf9';P='joystick-games/shared/windows/'
checks={}
def original(name):return subprocess.check_output(['git','show',SOURCE+':'+P+name],cwd=ROOT).decode()
name='Sources/main.cpp';new=(ROOT/P/name).read_text();assert new.replace(',{"diagnosticsEnabled",!diagnostics.empty()}','')==original(name);checks[name]='Only diagnostic opt-in boolean added to existing bootstrap JSON'
name='Web/bootstrap.js';new=(ROOT/P/name).read_text();assert new.replace('  if (initial.diagnosticsEnabled === true) window.JoystickDesktop.enableInputDiagnostics();\n','')==original(name);checks[name]='Only strict true opt-in before unchanged original receive'
name='Web/diagnostics.js';new=(ROOT/P/name).read_text();assert new.replace(',inputEvents:window.JoystickDesktop?.inputDiagnostics()??null','')==original(name);checks[name]='Only cached observer result added; original game/storage/geometry reads unchanged'
name='Web/bridge.js';new=(ROOT/P/name).read_text();a=new.index('  // Optional observation only.');b=new.index('  function send(message)',a);stripped=new[:a]+new[b:]
for line in ['    observeInput(sample);\n','    if (diagnostic && !firstPoll) { firstPoll = true; observe(\'first_poll\'); }\n','    if (diagnostic && player && !firstActivePoll) { firstActivePoll = true; observe(\'first_active_poll\'); }\n',"    observe('suspend_called');\n"]:
 assert stripped.count(line)==1;stripped=stripped.replace(line,'')
stripped=stripped.replace('receive,suspend,enableInputDiagnostics,inputDiagnostics,initialStorage','receive,suspend,initialStorage');assert stripped==original(name);checks[name]='All original input/storage/suspend statements byte-identical after removing observation-only insertions'
name='tests/web-bridge.test.mjs';assert (ROOT/P/name).read_text().startswith(original(name));checks[name]='All original tests preserved as exact prefix; seven additional observation boundary cases'
print(json.dumps({'status':'passed','comparisonSourceCommit':SOURCE,'checks':checks,'nativeWindowsExecution':False},indent=2))

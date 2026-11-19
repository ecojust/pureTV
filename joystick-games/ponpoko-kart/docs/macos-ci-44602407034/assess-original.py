#!/usr/bin/env python3
"""Assess original package/evidence without replacing any batch report."""
import hashlib,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
plan=OUT/'original-plan-export/artifact/plan.json';registry=OUT/'original-plan-export/artifact/catalog-registry.json'
entry=OUT/'original-registry-entry.json';entry.write_text(json.dumps(json.loads(registry.read_text())['games']['ponpoko-kart'],indent=2)+'\n')
meta=Path('/dev/shm/racing-mac01-package-review/ponpoko-kart/build-manifest.json')
evidence=ROOT/'docs/racing-nine/native-readiness/ci-44602407034-attempt-1'
arm=evidence/'original-arm-export/artifact';intel=evidence/'original-intel-export/artifact'
tool=ROOT/'joystick-games/tools/macos-coverage.py';source='68d343d22c762c904eb83854d4ab9c4113a7c30f'
assert tool.read_bytes()==subprocess.check_output(['git','-C',str(ROOT),'show',source+':joystick-games/tools/macos-coverage.py'])
(OUT/'executed-macos-coverage.py').write_bytes(tool.read_bytes());(OUT/'original-build-manifest.json').write_bytes(meta.read_bytes());(OUT/'original-SHA256SUMS.txt').write_bytes(meta.with_name('SHA256SUMS.txt').read_bytes())
def originals():
 paths=[plan,registry,meta,*arm.rglob('*'),*intel.rglob('*')]
 return {str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths if p.is_file()}
before=originals();commands=[]
for scope in ['default','per-game']:
 output=OUT/(scope+'-coverage.json');assert not output.exists()
 argv=[sys.executable,str(tool),'--game','ponpoko-kart','--meta',str(meta),'--plan',str(plan),'--entry',str(entry),'--arm',str(arm),'--intel',str(intel),'--output',str(output)]
 if scope=='per-game':argv.append('--per-game')
 completed=subprocess.run(argv,capture_output=True,timeout=120)
 (OUT/(scope+'-stdout.log')).write_bytes(completed.stdout);(OUT/(scope+'-stderr.log')).write_bytes(completed.stderr)
 commands.append({'scope':scope,'command':argv,'returncode':completed.returncode,'output':output.name})
 assert completed.returncode==(1 if scope=='default' else 0),(scope,completed.stderr.decode(errors='replace'))
assert originals()==before,'Original input evidence was modified'
result={'assessmentSourceCommit':source,'commands':commands,'originalFilesHashedBeforeAndAfter':len(before),'originalEvidenceUnchanged':True,'defaultBatchFailedPreserved':True}
(OUT/'assessment-execution.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))

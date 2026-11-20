from pathlib import Path
import hashlib,json,os,subprocess
ROOT=Path('/dev/shm/puretv-submit')
OUT=ROOT/'joystick-games/shared/windows/docs/bind-fixture-address-2'
SCRATCH=Path('/dev/shm/windows-host-tmp/bind-observation-v7-772c')
VALID=Path(__file__).resolve().parent
SOURCE='772c99ae35583ad1594cd9fffcc6368aa4df7201'
OUT.mkdir(exist_ok=True)
def rec(p):
 data=p.read_bytes();return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def link(src,dst):
 assert src.is_file() and not src.is_symlink()
 dst.parent.mkdir(parents=True,exist_ok=True)
 if dst.exists():assert rec(src)==rec(dst)
 else:os.link(src,dst)
for name in ('validation.json','compile.log','tests.log','executed-controller-bind.test.cpp','previous-controller-bind.test.cpp','validate.py'):
 link(VALID/name,OUT/'local-validation'/name)
for name in ('bound-run-response.json','completed-run.json','original-export-ref.json','original-export-tree.json','small-report-verification.json','restore-small.py','watch.py','royale-build-cli.log','royale-build-cli-error.log','royale-build-direct.log','royale-build-direct-error.log','royale-build-direct-download-status.json','royale-build-completed-cli.log','royale-build-completed-cli-error.log'):
 link(SCRATCH/name,OUT/'original-v7'/name)
jobs=sorted(SCRATCH.glob('jobs-*.json'))[-1];link(jobs,OUT/'original-v7'/'completed-jobs.json')
for p in sorted((SCRATCH/'original-small-export').rglob('*')):
 if p.is_file():link(p,OUT/'original-v7'/'original-small-export'/p.relative_to(SCRATCH/'original-small-export'))
for name in ('microsoft-socket-reuse-exclusive.html','microsoft-socket-reuse-exclusive-source.json'):
 link(SCRATCH/name,OUT/'documentation'/name)
validation=json.loads((VALID/'validation.json').read_text())
summary=json.loads((SCRATCH/'small-report-verification.json').read_text())
assert summary['sourceCommit']==SOURCE and summary['immutableExportCommit']=='b498971a645158e9ae097b4b81a13234908399ed'
findings={'sourceRunId':44647675594,'sourceRunAttempt':1,'sourceCommit':SOURCE,'immutableExportCommit':summary['immutableExportCommit'],'nativeBuildOutcome':{'msvcCompilePassedForBothGames':True,'originalCTestPassed':['protocol','preferences','entry-url','diagnostic-log'],'newControllerBindCTest':'failed_at_first_bound_not_listening_case','actualFirstErrorInOriginalLog':None,'actualFallbackErrorInOriginalLog':None,'bootstrapRun':False,'gameplayRun':False,'packagesProduced':False},'fixtureDefect':'Original fixture required WSAEACCES for exclusive wildcard holder and exclusive wildcard contender; the Microsoft same-account Windows Server 2003+ matrix documents WSAEADDRINUSE for that tuple. The old merged assertion did not print the actual result, so the original run is not claimed to have observed 10048.','candidate':{'onlyChangedSource':'joystick-games/shared/windows/tests/controller-bind.test.cpp','productionBinderAndSocketOptionsUnchanged':True,'defaultProductionAddress':'0.0.0.0:63485','real10013FixtureUsesSpecificLoopbackCandidate':True,'wildcardCasesRequire10048':True,'loopbackCasesRequire10013':True,'boundOnlyAndListeningBothCovered':True,'stableConnectionsRequiredPerCase':3,'nativeCasesPending':True},'localValidation':validation,'limitations':['The documented fixture correction is not a new Windows pass.','Even a future loopback-specific 10013 pass does not claim the production wildcard bind reproduced 10013.','The precise reason the earlier Backroad production port 63485 was denied remains unknown.','No original failed report has been changed; no workflow was dispatched by this correction.']}
(OUT/'findings.json').write_text(json.dumps(findings,indent=2)+'\n')
(OUT/'README.md').write_text('''# Windows bind fixture address correction

Run `44647675594` / source `772c99ae35583ad1594cd9fffcc6368aa4df7201` compiled both hosts successfully. Both jobs passed the four existing CTest groups, then failed the new first `controller-bind` case. The original `build.log` and `ctest-last-test.log` are retained unchanged and bound to immutable export `b498971a645158e9ae097b4b81a13234908399ed`; neither bootstrap nor gameplay ran, and no installation package was produced.

The original test made both exclusive sockets bind wildcard addresses but required error 10013. Microsoft's archived same-user Windows Server 2003+ matrix specifies 10048 for that tuple, and 10013 when the second socket instead uses a specific interface. The old merged assertion omitted actual numeric results, so this finding does not retroactively label the original observed error as 10048.

Only `tests/controller-bind.test.cpp` changes. It retains wildcard/wildcard cases requiring 10048 and adds loopback-specific contenders requiring 10013, each with bound-only and listening holders. All four must make exactly one port-zero fallback and retain that endpoint across three real connections; the invalid-socket error still must fail without fallback. Actual options, addresses, errors and fallback endpoints are printed before the checks. Production binding, 63485 default, exclusive mode and the other four recently frozen source files are unchanged.

The local optimized, NDEBUG C++ build and seven portable policy cases passed. This Linux run does not execute Windows socket cases. The new Windows cases remain pending the next source-bound run; a specific-interface component test does not claim production wildcard 10013 has been reproduced. No game/action/lifecycle assertions or workflow budgets changed.
''')
link(Path(__file__),OUT/'executed-archive.py')
source=ROOT/'joystick-games/shared/windows/tests/controller-bind.test.cpp'
files={p.relative_to(ROOT).as_posix():rec(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name!='freeze.json'}
freeze={'schemaVersion':1,'pathBase':'repository-root','status':'candidate_frozen_windows_cases_pending','baselineSourceCommit':SOURCE,'sourceFiles':{source.relative_to(ROOT).as_posix():rec(source)},'files':files,'fileCount':len(files),'totalBytes':sum(x['bytes'] for x in files.values())}
(OUT/'freeze.json').write_text(json.dumps(freeze,indent=2)+'\n')
print(json.dumps({'freeze':str(OUT/'freeze.json'),**rec(OUT/'freeze.json'),'fileCount':len(files),'totalBytes':freeze['totalBytes'],'sourceFiles':freeze['sourceFiles']},indent=2))

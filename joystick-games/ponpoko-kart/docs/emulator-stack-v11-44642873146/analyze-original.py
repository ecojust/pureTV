"""Read-only exact-run/source analysis; distinguishes tool precheck from permission execution."""
from pathlib import Path
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
SOURCE='73a3cdb8a41cc079fc06d62de382673b6d3e81c1'
summaries=[json.loads(p.read_text()) for p in sorted((OUT/'monitor').glob('*-summary.json'))]
final=summaries[-1];assert final['run']==44642873146 and final['source']==SOURCE and final['runAttempt']==1
assert final['status']=='completed' and final['conclusion']=='failure'
runtime=next(j for j in final['jobs'] if j['id']==135978816370)
steps={s[0]:s[2] for s in runtime['steps']}
assert steps['Check generic input and read-only observation contracts']=='success'
assert steps['Bind original signed packages to their frozen source and current QA checkout']=='success'
assert steps['Install GDB only for the owned QEMU diagnostic']=='failure'
assert steps['Require actual same-user process-local GDB permission before any AVD']=='skipped'
assert steps['Run normal and occupied-port QA independently against unchanged signed bytes']=='skipped'
assert next(j for j in final['jobs'] if j['name']=='export')['conclusion']=='success'
original=OUT/'original-export';manifest=json.loads((original/'export-manifest.json').read_text())
assert manifest['qaRunId']=='44642873146' and manifest['qaRunAttempt']=='1' and manifest['qaSourceSha']==SOURCE
assert manifest['runtimeAccepted'] is False and manifest['nativeAcceptanceAllowed'] is False
tree=json.loads((OUT/'original-git-tree.json').read_text());blobs={x['path']:x for x in tree['tree'] if x['type']=='blob'}
assert not any('/qemu-permission-gate/' in name or name.endswith(('qemu-stack-integration-tests.log','qemu-permission-gate.log')) for name in blobs)
recovery=json.loads((OUT/'recovery-validation.json').read_text())
for name,item in recovery['records'].items():
 data=(original/name).read_bytes();assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256']
 assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==blobs[name]['sha']
source=next(original.rglob('executed-source.json'));decl=json.loads(source.read_text());assert decl['qaSourceSha']==SOURCE
for name,item in decl['files'].items():
 data=(source.parent/'executed-source'/name).read_bytes();assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256']
 assert data==subprocess.check_output(['git','show',SOURCE+':'+name],cwd=ROOT)
counts=[]
for name in ['qa-contracts.log','artifact-contracts.log','reuse-contracts.log','environment-diagnostics-tests.log','install-confirmation-tests.log','emulator-supervisor-tests.log']:
 text=(source.parent/name).read_text();match=re.search(r'Ran (\d+) tests? in ',text);assert match and '\nOK\n' in text and 'skipped=' not in text;counts.append(int(match[1]))
assert counts==[53,16,15,14,18,22]
binding=json.loads(next(original.rglob('input-verification.json')).read_text())
assert binding['status']=='passed' and binding['qaSourceSha']==SOURCE
assert binding['artifactSourceSha']=='8f283c73f52f857777306eafc88f710262367834' and binding['artifactRunId']=='44597115244'
assert binding['games'][0]['package']['sha256']=='a1c9a0f6de56fd5ec87e25d4a6b5be541c9a04686e76b31484d99cc890b86e22'
archive=json.loads((original/'archive-verification.json').read_text());assert archive['status']=='passed' and archive['errors']==[]
log=(OUT/'runtime-job-complete.log').read_text()
assert "##[error]The action 'Install GDB only for the owned QEMU diagnostic' has timed out after 5 minutes." in log
setup=next(original.rglob('qemu-debugger-setup.log'))
setup_data=setup.read_bytes(); setup_text=setup_data.decode()
assert '+ test 1001 -ne 0' in setup_text
assert '+ command -v gdb\n+ true\n+ sudo apt-get update' in setup_text
assert 'Fetched 13.3 MB in 5min 0s (44.2 kB/s)' in setup_text
assert '+ sudo apt-get install -y --no-install-recommends gdb' in setup_text
assert '0 upgraded, 5 newly installed, 0 to remove and 50 not upgraded.' in setup_text
assert 'Need to get 4614 kB of archives.' in setup_text
assert '+ /usr/bin/gdb --version' not in setup_text and '+ sha256sum /usr/bin/gdb' not in setup_text
assert '/qemu-permission-gate/' not in '\n'.join(blobs)
runtime_check=json.loads((original/'runtime-verification.json').read_text())
assert runtime_check['status']=='failed' and runtime_check['nativeAcceptanceAllowed'] is False
assert runtime_check['checks']==[] and 'ponpoko-kart-outcomes.json' in runtime_check['errors'][0]['error']
value={'runId':44642873146,'attempt':1,'qaSource':SOURCE,'runtimeConclusion':'failure',
       'failedPhase':'GDB dependency installation exceeded the original 5 minute step limit after apt update consumed 5 minutes',
       'genericPreflightCounts':counts,'genericPreflightPassed':sum(counts),'originalSignedInputBinding':'passed',
       'integrationCasesExecuted':0,'actualPermissionCasesExecuted':0,'actualPR_SET_PTRACERTestExecuted':False,'qemuStarted':False,'avdStarted':False,
       'originalInstallLog':{'path':str(setup.relative_to(OUT)),'bytes':len(setup_data),'sha256':hashlib.sha256(setup_data).hexdigest(),
                            'userId':1001,'initialCommandVFoundGdb':False,'updateCompleted':True,'updateBytesDescription':'13.3 MB','updateDurationDescription':'5min 0s',
                            'installCommandStarted':True,'installationCompleted':False,'gdbVersionOrExecutableHashRecorded':False},
       'observedTiming':{'stepStartedAt':'2026-11-20T00:07:57Z','stepCompletedAt':'2026-11-20T00:13:10Z',
                         'updateResultAt':'2026-11-20T00:13:07.7722638Z','installCommandAt':'2026-11-20T00:13:08.6983460Z','runnerTimeoutAt':'2026-11-20T00:13:10.2126529Z'},
       'failureScope':'Tool setup timeout, not PR_SET_PTRACER denial, GDB attach failure or a new QEMU crash; the permission suite and AVD were skipped.',
       'networkObservation':'The original apt log records several Ign entries for security.ubuntu.com indexes and later successful Get entries. The underlying transport cause is not established.',
       'immutableExport':'e716953031dce3f348a3763afab95cba04ed1245','exportConclusion':'success','archiveIntegrity':'passed',
       'runtimeVerification':'failed because the skipped AVD produced no outcomes report; original failure is preserved',
       'diagnosticIntervenedFieldMeaning':'The export records the explicitly requested diagnostic experiment; this attempt never attached GDB or launched QEMU.',
       'recoveredSmallFiles':len(recovery['records']),'recoveredSmallBytes':sum(x['bytes'] for x in recovery['records'].values()),
       'executedSourceFilesIndependentlyBoundToGit':len(decl['files']),'originalArchiveDeclaredArtifactSourceCopiesVerified':208,
       'originalReportsModified':False,'largePackageOrVideoDownloaded':False,'newPost':False,'nativeAcceptanceAllowed':False}
(OUT/'findings.json').write_text(json.dumps(value,indent=2)+'\n');print(json.dumps(value,indent=2))

"""Read-only exact-run/source analysis; distinguishes tool precheck from permission execution."""
from pathlib import Path
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
SOURCE='5f2dce57aac3b8ecda316deac1d1ba5f0ae352bd'
summaries=[json.loads(p.read_text()) for p in sorted((OUT/'monitor').glob('*-summary.json'))]
final=summaries[-1];assert final['run']==44640920725 and final['source']==SOURCE and final['runAttempt']==1
assert final['status']=='completed' and final['conclusion']=='failure'
runtime=next(j for j in final['jobs'] if j['id']==135972071894)
steps={s[0]:s[2] for s in runtime['steps']}
assert steps['Check generic input and read-only observation contracts']=='success'
assert steps['Bind original signed packages to their frozen source and current QA checkout']=='success'
assert steps['Require actual same-user process-local GDB permission before any AVD']=='failure'
assert steps['Run normal and occupied-port QA independently against unchanged signed bytes']=='skipped'
assert next(j for j in final['jobs'] if j['name']=='export')['conclusion']=='success'
original=OUT/'original-export';manifest=json.loads((original/'export-manifest.json').read_text())
assert manifest['qaRunId']=='44640920725' and manifest['qaRunAttempt']=='1' and manifest['qaSourceSha']==SOURCE
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
log=(OUT/'monitor/runtime-job-complete.log').read_text();assert 'test -x /usr/bin/gdb' in log and 'command -v cc >/dev/null' in log
assert 'Require actual same-user process-local GDB permission before any AVD' in log and '##[error]Process completed with exit code 1.' in log
value={'runId':44640920725,'attempt':1,'qaSource':SOURCE,'runtimeConclusion':'failure','failedPhase':'silent tool-availability prechecks before any Python gate tests',
       'genericPreflightCounts':counts,'genericPreflightPassed':sum(counts),'originalSignedInputBinding':'passed',
       'integrationCasesExecuted':0,'actualPermissionCasesExecuted':0,'actualPR_SET_PTRACERTestExecuted':False,'qemuStarted':False,'avdStarted':False,
       'observedPrechecks':['test -x /usr/bin/gdb','command -v cc >/dev/null'],
       'compilerEvidence':'The same job successfully ran the supervisor test class whose setUpClass compiles the real ELF with cc.',
       'inference':'Ensure the missing/non-executable diagnostic GDB dependency. The shell did not record which silent precheck returned 1 or stat the exact path; no actual PR permission failure is claimed.',
       'originalRunnerImage':'ubuntu-24.04 / 20261116.133.1',
       'runnerImageInventoryLookup':{'ref':'ubuntu24/20261116.133','path':'images/ubuntu/Ubuntu2404-Readme.md','httpStatus':404,'conclusion':'The precise referenced inventory could not be retrieved; not evidence of package presence/absence.'},
       'immutableExport':'68d7b449de35c51a0a1999d9b0925b069b798b25','exportConclusion':'success','archiveIntegrity':'passed',
       'recoveredSmallFiles':len(recovery['records']),'recoveredSmallBytes':sum(x['bytes'] for x in recovery['records'].values()),
       'executedSourceFilesIndependentlyBoundToGit':len(decl['files']),'originalArchiveDeclaredArtifactSourceCopiesVerified':208,
       'originalReportsModified':False,'largePackageOrVideoDownloaded':False,'newPost':False,'nativeAcceptanceAllowed':False}
(OUT/'findings.json').write_text(json.dumps(value,indent=2)+'\n');print(json.dumps(value,indent=2))

"""Bind the original failed preflight/export and the test-only replay; no original report edits."""
from pathlib import Path
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
SOURCE='c22b297146547e5503f8dc9b0bfa9163518f6673'
run=json.loads((OUT/'pon-v9-run-final.json').read_text())
assert run['id']==44639605971 and run['head_sha']==SOURCE and run['run_attempt']==1 and run['conclusion']=='failure'
jobs=json.loads((OUT/'pon-v9-jobs-second.json').read_text())['jobs']
runtime=next(j for j in jobs if j['id']==135967558603)
assert runtime['conclusion']=='failure'
steps={s['name']:s for s in runtime['steps']}
assert steps['Check generic input and read-only observation contracts']['conclusion']=='failure'
for name in ['Bind original signed packages to their frozen source and current QA checkout',
             'Require actual same-user process-local GDB permission before any AVD',
             'Run normal and occupied-port QA independently against unchanged signed bytes']:
    assert steps[name]['conclusion']=='skipped'
original=OUT/'original-export'
manifest=json.loads((original/'export-manifest.json').read_text())
assert manifest['qaSourceSha']==SOURCE and manifest['qaRunId']=='44639605971' and manifest['qaRunAttempt']=='1'
assert manifest['runtimeAccepted'] is False and manifest['nativeAcceptanceAllowed'] is False
recovery=json.loads((OUT/'recovery-validation.json').read_text())
tree=json.loads((OUT/'original-git-tree.json').read_text())
blobs={x['path']:x for x in tree['tree'] if x['type']=='blob'}
assert set(blobs)==set(recovery['records']) and not recovery['excluded']
for name,record in recovery['records'].items():
    data=(original/name).read_bytes()
    assert len(data)==record['bytes'] and hashlib.sha256(data).hexdigest()==record['sha256']
    assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==blobs[name]['sha']
declarations=list(original.rglob('executed-source.json'));assert len(declarations)==1
declaration=json.loads(declarations[0].read_text());assert declaration['qaSourceSha']==SOURCE
for name,record in declaration['files'].items():
    raw=(declarations[0].parent/'executed-source'/name).read_bytes()
    assert len(raw)==record['bytes'] and hashlib.sha256(raw).hexdigest()==record['sha256']
    assert raw==subprocess.check_output(['git','show',SOURCE+':'+name],cwd=ROOT)
archive=json.loads((original/'archive-verification.json').read_text())
assert archive['status']=='failed' and archive['errors']==['ponpoko-kart: missing mandatory input-verification.json']
assert archive['jobs'][0]['executedSourceCopiesVerified']==43 and archive['jobs'][0]['verifiedInputsPresent'] is False
oldlog=(OUT/'job-log/runtime-job-complete.log').read_text()
assert 'ERROR: test_stack_flag_is_default_off_exact_scope_and_never_changes_argv' in oldlog
assert 'owned_qemu_stack.Rejected: Missing bounded permission gate' in oldlog
replay=json.loads((OUT/'fixture-fix/result.json').read_text())
assert replay['parent']==SOURCE and replay['allSixPassed'] and replay['originalFailureReproduced']
assert replay['changedPaths']==['joystick-games/qa/android/test_emulator_supervisor.py']
counts=[]
for record in replay['checks']:
    data=(OUT/'fixture-fix'/record['log']).read_bytes()
    assert record['returnCode']==0 and hashlib.sha256(data).hexdigest()==record['sha256']
    text=data.decode();match=re.search(r'Ran (\d+) tests? in ',text);assert match and '\nOK\n' in text and 'skipped=' not in text
    counts.append(int(match[1]))
assert counts==[53,16,15,14,18,22]
value={'runId':44639605971,'runAttempt':1,'qaSource':SOURCE,'runtimeJobId':135967558603,
       'runtimeConclusion':'failure','failedPhase':'generic QA preflight','actualPermissionGateExecuted':False,
       'qemuStarted':False,'avdStarted':False,'gameplayExecuted':False,'qemuCrashOrPermissionFailureImplied':False,
       'originalError':'owned_qemu_stack.Rejected: Missing bounded permission gate',
       'cause':'Test expected the missing gate but omitted the actual helper exception type; local absence of RUNNER_TEMP had earlier raised an accepted KeyError before reaching the gate.',
       'immutableExport':'6d8567969e05a97fca87d61c6759280408d542e9',
       'exportPreservationStep':'success','exportOverallJob':'failure','allExportBlobsRecovered':len(blobs),
       'exportBytes':sum(r['bytes'] for r in recovery['records'].values()),'executedSourceFilesBoundToGit':len(declaration['files']),
       'exportFinalRejection':'Missing input-verification.json because the prior failed preflight caused the Bind step to be skipped; no missing executed-source copies.',
       'exportChanged':False,'originalReportsChanged':False,
       'fix':{'path':replay['changedPaths'][0],'sha256':replay['candidateSha256'],
              'controlledRunnerTemp':True,'preciseActualRejectedType':True,'onlyOneTestMethodChanged':True,
              'helperWorkflowParametersUnchanged':True,'isolatedParent':SOURCE,'isolatedFiles':len(replay['files']),
              'allOtherInputHashesUnchanged':True,'testCounts':counts,'total':sum(counts),'skipped':0},
       'newPost':False,'actualCiRerun':False,'nativeAcceptanceAllowed':False}
(OUT/'findings.json').write_text(json.dumps(value,indent=2)+'\n')
print(json.dumps(value,indent=2))

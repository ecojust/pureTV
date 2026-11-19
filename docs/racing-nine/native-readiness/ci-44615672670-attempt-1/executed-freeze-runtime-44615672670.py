from pathlib import Path
import json,hashlib,subprocess,statistics
r=Path('/dev/shm/puretv-submit');d=r/'docs/racing-nine/native-readiness/ci-44615672670-attempt-1';base=d/'original-arm-export/artifact';v=json.loads((d/'readonly-arm-export-verification.json').read_text());ident=json.loads((d/'identity.json').read_text());qa=ident['workflowSourceCommit'];source=ident['sourceCommit'];batch=json.loads((base/'batch-report.json').read_text());assert batch['sourceCommit']==source and batch['qaSourceCommit']==qa and batch['status']=='passed';reports=[];hashes={};shots=0

def rec(p):return {'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
for p in sorted(base.glob('*/*/report.json')):
 if p.parent.name not in ['native','occupied-port','rosetta']:continue
 j=json.loads(p.read_text());assert j['qaSourceCommit']==qa and j['artifactSourceCommit']==source and j['qaRunId']==44615672670 and j['qaRunAttempt']==1;assert j['status']=='passed' and len(j['tests'])==9 and all(t['status']=='passed' for t in j['tests'])
 for name,value in j['sourceHashes'].items():
  if name not in hashes:
   data=subprocess.check_output(['git','show',qa+':'+name],cwd=r);assert hashlib.sha256(data).hexdigest()==value;hashes[name]=value
  assert hashes[name]==value
 ss={}
 for s in j['screenshots']:
  q=p.parent/s['path'];assert rec(q)=={k:s[k] for k in ['bytes','sha256']};ss[s['path']]=rec(q);shots+=1
 taps=j.get('menuTapObservations',[]);values=[x['observedWireHeldMs'] for x in taps];assert all(x['status']=='passed' and x['stableFreshSamples']>=2 for x in taps)
 reports.append({'game':j['game'],'mode':p.parent.name,'status':j['status'],'tests':[(x['name'],x['status'])for x in j['tests']],'sourceReport':{'path':p.relative_to(r).as_posix(),**rec(p)},'architecture':j['nativeProcessArchitecture'],'binarySha256':j['binarySha256'],'screenshots':ss,'menuTapCount':len(taps),'requestedTapMs':16 if taps else None,'actualWireHoldMs':{'minimum':min(values),'median':statistics.median(values),'maximum':max(values)} if values else None,'storageRestart':{k:j.get('storageRestart',{}).get(k) for k in ['status','newOriginVerified','initialHydrationEqual']}})
assert len(reports)==9
result={'sourceRunId':44615672670,'qaSourceCommit':qa,'packageSourceCommit':source,'immutableExportCommit':v['exportCommit'],'originalArmFiles':v['fileCount'],'originalArmBytes':v['totalBytes'],'originalArmBatchStatus':'passed','reports':reports,'exactQaGitSourceHashes':hashes,'originalScreenshotCountVerified':shots,'originalReportsModified':False,'sameRunIntelCapabilityStatus':'failed_before_probe_due_to_truncated_job_name','existingIntelCoverageClassification':'blocked','scope':'Nine original ARM-native/occupied-port/Rosetta reports each passed all nine checks. Intel/game-failure cause is not inferred. Source/preview hashes are verified; root owns actual Backroad/Night visual review and delivery policy.'};(d/'arm-findings.json').write_text(json.dumps(result,indent=2)+'\n');(d/'executed-freeze-runtime-44615672670.py').write_bytes(Path(__file__).read_bytes())
# Preserve the exact API object used by the pre-export replay outside evolving
# monitor directories; the original replay record remains unchanged.
replay=json.loads((d/'capability-job-identity-replay.json').read_text());api=r/replay['originalJobsFile'];assert rec(api)['sha256']==replay['originalJobsSha256'];(d/'original-job-identity-observation.json').write_bytes(api.read_bytes())
exclude={'monitor','runtime-checkpoint-inventory.json','arm-checkpoint-inventory.json','intel-checkpoint-inventory.json'};files={}
for p in sorted(d.rglob('*')):
 if not p.is_file() or any(x in exclude for x in p.relative_to(d).parts):continue
 assert not p.is_symlink();files[p.relative_to(r).as_posix()]=rec(p)
manifest={'status':'ready_for_root_checkpoint','originalArmFiles':v['fileCount'],'originalIntelFiles':json.loads((d/'readonly-intel-export-verification.json').read_text())['fileCount'],'fileCount':len(files),'totalBytes':sum(x['bytes'] for x in files.values()),'files':files,'monitorDirectoryExcluded':True,'completeOriginalReportsAndFilesPreserved':True,'originalResultsUnchanged':True};(d/'runtime-checkpoint-inventory.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'files':len(files),'bytes':manifest['totalBytes'],'reports':len(reports),'shots':shots,'sourceHashes':len(hashes)}))

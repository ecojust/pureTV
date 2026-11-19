from pathlib import Path
import json,hashlib,subprocess
root=Path('/dev/shm/puretv-submit');out=root/'docs/racing-nine/native-readiness/ci-44617064631-attempt-1';base=out/'original-arm-export/artifact';qa='dc49ea1db63aa373f9408b9142725293a9885573';package='b7b7af12f1eb61f777d89edad7368a69a14bb9e3';hashes={};reports=[];shots=[]
def rec(p):return {'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
for p in sorted(base.glob('*/*/report.json')):
 if p.parent.name not in ['native','occupied-port','rosetta']:continue
 j=json.loads(p.read_text());assert j['qaSourceCommit']==qa and j['artifactSourceCommit']==package and j['qaRunId']==44617064631 and j['qaRunAttempt']==1
 for name,value in j['sourceHashes'].items():
  if name not in hashes:hashes[name]=hashlib.sha256(subprocess.check_output(['git','show',qa+':'+name],cwd=root)).hexdigest()
  assert hashes[name]==value
 for sh in j['screenshots']:
  q=p.parent/sh['path'];assert rec(q)=={k:sh[k]for k in ['bytes','sha256']};shots.append({'path':q.relative_to(root).as_posix(),**rec(q)})
 s=j.get('lastState') or {};g=s.get('game') or {};error=j.get('error','');reports.append({'game':j['game'],'mode':p.parent.name,'originalStatus':j['status'],'tests':[{'name':x['name'],'status':x['status']}for x in j['tests']],'sourceReport':{'path':p.relative_to(root).as_posix(),**rec(p)},'failurePhase':j.get('failurePhase'),'errorLeadingTrace':error.split('timed out:')[0]+'timed out' if 'timed out:'in error else error,'terminalGame':{k:g.get(k)for k in ['renderer','webglVersion','stage','frames','errors','gameplay']},'binarySha256':j['binarySha256']})
assert len(reports)==9 and sum(r['originalStatus']=='passed' for r in reports)==6
v=json.loads((out/'readonly-arm-export-verification.json').read_text());assert v['fileCount']==648 and not v['partial'];iv=json.loads((out/'readonly-intel-export-verification.json').read_text());assert iv['fileCount']==437
for kind,verification in [('arm',v),('intel',iv)]:
 for name,expected in verification['files'].items():
  p=out/f'original-{kind}-export'/name;assert not p.is_symlink();data=p.read_bytes();assert rec(p)=={k:expected[k]for k in ['bytes','sha256']};assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==expected['gitBlobSha1']
summary={'originalRun':44617064631,'qaSourceCommit':qa,'packageSourceCommit':package,'immutableArmExport':v['exportCommit'],'immutableIntelExport':iv['exportCommit'],'reports':reports,'originalScreenshotsRehashed':shots,'exactQaSourceHashesVerifiedAgainstGit':hashes,'originalReportsModified':False,'nativeRerun':False,'summary':'Original b7 packages: Turbo and Kart Rush pass all nine checks in native/occupied-port/Rosetta; old Kart Royale fails Start race and wait original countdown in each mode. This is distinct from the later 6c package and successful run44615880581. Intel observations are independently recorded in intel-findings.json; Kart Rush before probe could not call GitHub API.','coverageEligibilityAssessed':False};p=out/'arm-findings.json';assert not p.exists();p.write_text(json.dumps(summary,indent=2)+'\n');(out/'executed-arm-capture.py').write_bytes(Path('/dev/shm/racing-native-readiness/capture-readonly-partial.py').read_bytes());(out/'executed-freeze-b-v2.py').write_bytes(Path(__file__).read_bytes())
files={};exclude={'monitor','runtime-checkpoint-inventory.json'}
for p in sorted(out.rglob('*')):
 if not p.is_file() or any(x in exclude for x in p.relative_to(out).parts):continue
 assert not p.is_symlink() and p.stat().st_size<100_000_000;files[p.relative_to(root).as_posix()]=rec(p)
manifest={'status':'ready_for_root_checkpoint','originalRun':44617064631,'qaSourceCommit':qa,'packageSourceCommit':package,'originalArmFiles':648,'originalIntelFiles':437,'fileCount':len(files),'totalBytes':sum(r['bytes']for r in files.values()),'files':files,'originalResultsUnchanged':True,'monitorExcluded':True,'nativeRerun':False};p=out/'runtime-checkpoint-inventory.json';assert not p.exists();p.write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'path':p.relative_to(root).as_posix(),'manifestBytes':p.stat().st_size,'manifestSha256':rec(p)['sha256'],'files':len(files),'totalBytes':manifest['totalBytes'],'reports':len(reports),'screenshots':len(shots),'sourceHashes':len(hashes)}))

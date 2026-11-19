from pathlib import Path
import json,hashlib,subprocess
root=Path('/dev/shm/puretv-submit');out=root/'docs/racing-nine/native-readiness/ci-44617064631-attempt-1';base=out/'original-intel-export/artifact';qa='dc49ea1db63aa373f9408b9142725293a9885573';package='b7b7af12f1eb61f777d89edad7368a69a14bb9e3';hashes={};reports=[]
def rec(p):return {'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
for p in sorted(base.glob('*/native/report.json')):
 j=json.loads(p.read_text());assert j['qaRunId']==44617064631 and j['qaRunAttempt']==1 and j['qaSourceCommit']==qa and j['artifactSourceCommit']==package;s=j.get('lastState') or {};g=s.get('game');r={'game':j['game'],'status':j['status'],'failurePhase':j.get('failurePhase'),'report':rec(p),'errorBeginning':j.get('error','')[:1800],'lastGame':{k:g.get(k) for k in ['renderer','webglVersion','frames','stage','errors','focused']} if isinstance(g,dict) else None,'focused':s.get('document',{}).get('focused'),'binarySha256':j['binarySha256'],'capability':[]}
 for name,value in j['sourceHashes'].items():
  if name not in hashes:hashes[name]=hashlib.sha256(subprocess.check_output(['git','show',qa+':'+name],cwd=root)).hexdigest()
  assert hashes[name]==value
 for phase in ['before','after']:
  cp=base/j['game']/'capability'/phase/'report.json';c=json.loads(cp.read_text());assert c['qaSourceCommit']==qa and c['runId']==44617064631 and c['runAttempt']==1
  for name,value in c['sourceHashes'].items():
   if name not in hashes:hashes[name]=hashlib.sha256(subprocess.check_output(['git','show',qa+':'+name],cwd=root)).hexdigest()
   assert hashes[name]==value
  o={'phase':phase,'status':c['status'],'report':rec(cp),'samples':c.get('probe',{}).get('samples'),'error':c.get('error'),'jobId':c.get('jobId'),'runnerName':c.get('runnerName')}
  if c['status']=='failed':
   command=json.loads((cp.parent/'original-jobs-command.json').read_text());o['originalJobsCommand']=command;o['originalStderrFile']=rec(cp.parent/'original-jobs-stderr.log');assert command['stderr']==(cp.parent/'original-jobs-stderr.log').read_text();o['probeWasNotExecuted']=not (cp.parent/'probe.json').exists()
  r['capability'].append(o)
 reports.append(r)
assert len(reports)==3
result={'originalRun':44617064631,'qaSourceCommit':qa,'packageSourceCommit':package,'immutableIntelExport':'1cd91a6e0b9fbbda789935c5aaa88255bf50f3b1','reports':reports,'exactQaSourceHashesVerifiedAgainstGit':hashes,'scope':'Original Intel observations only, no full coverage assessment. Kart Rush lacks a successful before probe because the original jobs API request could not connect; no probe is borrowed from another game/run. Existing original failed statuses are unchanged.','originalReportsModified':False,'nativeRerun':False};p=out/'intel-findings.json';assert not p.exists();p.write_text(json.dumps(result,indent=2)+'\n');(out/'executed-summarize-b-v2-intel.py').write_bytes(Path(__file__).read_bytes());raw=Path('/dev/shm/racing-native-readiness/b-v2-preserve-failure.log').read_bytes();(out/'preserve-failure-original.log').write_bytes(raw);(out/'preserve-failure-findings.json').write_text(json.dumps({'originalRun':44617064631,'originalJobId':135900843195,'originalLog':rec(out/'preserve-failure-original.log'),'failure':'Original immutable runtime source reader rejects diagnostics/.dat.nosync2856.Qf5P4M in Intel Turbo native evidence. A later bounded read-only exporter recovers original bytes without rerunning or changing game status.','method':'gh run view --repo ecojust/pureTV --job 135900843195 --log','originalReportsModified':False},indent=2)+'\n');print(json.dumps({'reports':len(reports),'sourceHashes':len(hashes),**rec(p)}))

from pathlib import Path
import json,hashlib,subprocess
root=Path('/dev/shm/puretv-submit');out=root/'docs/racing-nine/native-readiness/ci-44617061184-attempt-1';base=out/'original-preserved-runtime/evidence';qa='e7ba7d87faee02316200b3dc5dd36ab04cee493b'
def rec(p):return {'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
source_hashes={};shots=[];probes=[]
for p in sorted(base.glob('*/*/*/report.json')):
 if p.parent.name not in ['native','occupied-port','rosetta']:continue
 j=json.loads(p.read_text())
 for r in j['screenshots']:
  q=p.parent/r['path'];assert rec(q)=={k:r[k] for k in ['bytes','sha256']};shots.append({'path':q.relative_to(root).as_posix(),**rec(q)})
for p in sorted(base.glob('*/*/capability/*/report.json')):
 j=json.loads(p.read_text());assert j['qaSourceCommit']==qa and j['runId']==44617061184 and j['runAttempt']==1 and j['status']=='observed'
 for name,value in j['sourceHashes'].items():
  actual=hashlib.sha256(subprocess.check_output(['git','show',qa+':'+name],cwd=root)).hexdigest();assert actual==value;source_hashes[name]=value
 samples=j['probe']['samples'];assert len(samples)==3
 probes.append({'path':p.relative_to(root).as_posix(),**rec(p),'status':j['status'],'game':j['game'],'phase':j['phase'],'jobId':j['jobId'],'runnerName':j['runnerName'],'probeArchitecture':j['probe']['processArchitecture'],'contextLostSamples':[s['contextLost'] for s in samples],'sourceHashes':j['sourceHashes']})
proof={'originalRun':44617061184,'qaSourceCommit':qa,'originalScreenshotsVerified':shots,'originalProbeReports':probes,'exactProbeSourcesVerifiedAgainstGit':source_hashes,'scope':'Hashes and recorded probe observations only. Does not replace original failed game tests or assess delivery eligibility.','actualImagesViewedInThisCheck':False};(out/'original-preview-probe-verification.json').write_text(json.dumps(proof,indent=2)+'\n');(out/'executed-freeze-a-v2.py').write_bytes(Path(__file__).read_bytes())
files={};exclude={'monitor','runtime-checkpoint-inventory.json'}
for p in sorted(out.rglob('*')):
 if not p.is_file() or any(x in exclude for x in p.relative_to(out).parts):continue
 assert not p.is_symlink() and p.stat().st_size<100_000_000;files[p.relative_to(root).as_posix()]=rec(p)
v=json.loads((out/'preserved-runtime-verification.json').read_text());assert not v['partial'] and v['fileCount']==1215
manifest={'status':'ready_for_root_checkpoint','sourceRunId':44617061184,'sourceRunAttempt':1,'sourceCommit':'68d343d22c762c904eb83854d4ab9c4113a7c30f','qaSourceCommit':qa,'immutablePreservedExport':v['immutableExportCommit'],'originalFiles':v['fileCount'],'originalTotalBytes':v['totalBytes'],'fileCount':len(files),'totalBytes':sum(r['bytes'] for r in files.values()),'files':files,'monitorExcluded':True,'originalResultsUnchanged':True,'nightAndPonArmThreeModesAllPassed':True,'backroadNativeRestartOriginalFailedPreserved':True,'nativeRerun':False};p=out/'runtime-checkpoint-inventory.json';assert not p.exists();p.write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'manifest':p.relative_to(root).as_posix(),**rec(p),'files':len(files),'bytes':manifest['totalBytes'],'screenshots':len(shots),'probes':len(probes)}))

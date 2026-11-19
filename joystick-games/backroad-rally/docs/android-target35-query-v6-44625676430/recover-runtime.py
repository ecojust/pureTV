import concurrent.futures,hashlib,json,pathlib,shutil,urllib.request
SCRATCH=pathlib.Path('/dev/shm/racing-review-driving');OUT=pathlib.Path('/dev/shm/puretv-submit/joystick-games/backroad-rally/docs/android-target35-query-v6-44625676430');tree=json.loads((SCRATCH/'backroad-target35-v6-evidence-tree.json').read_text());SHA='5f16d7a757f1c54a07b4cef521018b00b2c921d7';assert tree['sha']==SHA and not tree['truncated'];items=[x for x in tree['tree'] if x['type']=='blob'];assert len(items)==61 and sum(x['size'] for x in items)==6898376
for x in items:assert x['mode']=='100644' and '..' not in pathlib.PurePosixPath(x['path']).parts and not pathlib.PurePosixPath(x['path']).is_absolute()
def get(x):
 p=OUT/'original-runtime-export'/x['path'];p.parent.mkdir(parents=True,exist_ok=True)
 b=p.read_bytes() if p.exists() else urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+SHA+'/'+x['path'],timeout=45).read(x['size']+1)
 assert len(b)==x['size'] and hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==x['sha'];p.write_bytes(b);return {'path':x['path'],'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'gitBlob':x['sha']}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:records=list(pool.map(get,items))
m=json.loads((OUT/'original-runtime-export/export-manifest.json').read_text());assert m['sourceRunId']==44625676430 and m['sourceRunAttempt']==1 and m['sourceCommit']=='4b6cf0b8cba288eae66bcae2ef2784acc279a695' and m['game']=='backroad-rally' and not m['gamesRerun']
for r in records:
 if r['path']!='export-manifest.json':assert {k:r[k] for k in ['bytes','sha256']}==m['files'][r['path']]
shutil.copyfile(SCRATCH/'backroad-target35-v6-evidence-tree.json',OUT/'original-runtime-export-tree.json');shutil.copyfile(__file__,OUT/'recover-runtime.py');(OUT/'runtime-recovery-validation.json').write_text(json.dumps({'status':'passed','sourceRun':44625676430,'sourceCommit':m['sourceCommit'],'exportCommit':SHA,'readonlyExportRun':44627746931,'records':records,'bytes':sum(r['bytes'] for r in records)},indent=2)+'\n');print('verified',len(records))

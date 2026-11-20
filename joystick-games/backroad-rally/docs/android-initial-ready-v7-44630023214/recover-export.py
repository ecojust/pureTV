import concurrent.futures,hashlib,json,pathlib,shutil,urllib.request
OUT=pathlib.Path(__file__).resolve().parent;SHA='1c0e351dae33304090294b042627192bb8c06622'
tree=json.loads(pathlib.Path('/dev/shm/racing-review-driving/backroad-initial-ready-v7-export-tree.json').read_text());assert tree['sha']==SHA and not tree['truncated'];all_items=[x for x in tree['tree'] if x['type']=='blob'];items=[x for x in all_items if '/verified-inputs/artifact-source/' not in x['path'] and '/verified-inputs/payload/' not in x['path']]
assert len(all_items)==1034 and sum(x['size'] for x in all_items)==256387392
for x in all_items:assert x['mode']=='100644' and '..' not in pathlib.PurePosixPath(x['path']).parts and not pathlib.PurePosixPath(x['path']).is_absolute()
assert sum(x['size'] for x in items)<40_000_000 and shutil.disk_usage(OUT).free>sum(x['size'] for x in items)+15_000_000
by_name={x['path']:x for x in all_items}
def get(x):
 p=OUT/'original-export'/x['path'];p.parent.mkdir(parents=True,exist_ok=True)
 b=p.read_bytes() if p.exists() else urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+SHA+'/'+x['path'],timeout=45).read(x['size']+1)
 assert len(b)==x['size'] and hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==x['sha'];p.write_bytes(b);return {'path':x['path'],'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'gitBlob':x['sha']}
get(by_name['export-manifest.json']);m=json.loads((OUT/'original-export/export-manifest.json').read_text());assert m['qaRunId']=='44630023214' and m['qaRunAttempt']=='1' and m['qaSourceSha']=='382de3792628050773abec8821920348503f72ce';assert m['artifactSourceSha']=='4b6cf0b8cba288eae66bcae2ef2784acc279a695' and m['artifactRunId']=='44625676430' and m['artifactId']=='14579726223' and m['runtimeAccepted'] is True;assert set(m['files'])==set(by_name)-{'export-manifest.json'}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:records=list(pool.map(get,items))
for r in records:
 if r['path']!='export-manifest.json':assert {k:r[k] for k in ['bytes','sha256']}==m['files'][r['path']]
shutil.copyfile('/dev/shm/racing-review-driving/backroad-initial-ready-v7-export-tree.json',OUT/'original-export-tree.json');(OUT/'recovery-validation.json').write_text(json.dumps({'status':'passed','qaRun':44630023214,'qaSource':m['qaSourceSha'],'exportCommit':SHA,'records':records,'bytes':sum(r['bytes'] for r in records),'omittedOriginalSourceAndPayloadCopies':len(all_items)-len(records),'omissionReason':'Already independently audited original package/source/assets; omit repeated original-source and payload copies only. All original runtime reports, images, video, actual executed QA copies and receipts retained.'},indent=2)+'\n');print('verified',len(records),sum(r['bytes'] for r in records))

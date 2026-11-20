from pathlib import Path
import hashlib,json,os,shutil
ROOT=Path(__file__).parent
OUT=Path('/dev/shm/puretv-submit/joystick-games/backroad-rally/docs/android-graphics-diagnostic-44642922231')
run_id=44642922231
source='0415846f3b3e3fc11f79e08d25050affdf750435'
def read(p):return json.loads(p.read_bytes())
def link(source,dest):
 data=source.read_bytes();dest.parent.mkdir(parents=True,exist_ok=True)
 if dest.exists():assert dest.read_bytes()==data
 else:os.link(source,dest)
verification=read(ROOT/'original-small-export-verification.json')
assert verification['runId']==run_id and verification['sourceSha']==source
runs=sorted(ROOT.glob('*-run.json'))
run=read(runs[-1]);assert run['id']==run_id and run['head_sha']==source and run['run_attempt']==1 and run['status']=='completed'
stamp=runs[-1].name.removesuffix('-run.json')
OUT.mkdir(exist_ok=True)
for kind in ['run','jobs','artifacts']:link(ROOT/(stamp+'-'+kind+'.json'),OUT/('final-'+kind+'.json'))
for name in ['export-ref.json','export-commit.json','export-tree.json','original-small-export-verification.json','watch.py','recover.py','archive.py','timeline.jsonl','dispatch-markers-inventory.json','original-diagnostic-job.log','original-diagnostic-job-log-stderr.txt','original-diagnostic-job-log-request.json','analyze.py']:
 link(ROOT/name,OUT/name)
for dirname in ['original-small-export','dispatch-markers']:
 for p in sorted((ROOT/dirname).rglob('*')):
  if p.is_file():link(p,OUT/p.relative_to(ROOT))
print(json.dumps({'archive':str(OUT),'sourceSha':source,'exportCommit':verification['exportCommit'],'originalEvidenceFiles':verification['files'],'newDispatchPerformed':False}))

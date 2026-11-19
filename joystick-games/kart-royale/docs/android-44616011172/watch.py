import datetime,json,subprocess,time
from pathlib import Path
base=Path(__file__).resolve().parent
for n in range(40):
 time.sleep(55)
 stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
 try:
  rraw=subprocess.check_output(['/usr/bin/gh','api','repos/ecojust/pureTV/actions/runs/44616011172'],timeout=25);jraw=subprocess.check_output(['/usr/bin/gh','api','repos/ecojust/pureTV/actions/runs/44616011172/jobs'],timeout=25)
  (base/('run-'+stamp+'.json')).write_bytes(rraw);(base/('jobs-'+stamp+'.json')).write_bytes(jraw);r=json.loads(rraw);j=json.loads(jraw)
  assert r['id']==44616011172 and r['run_attempt']==1 and r['head_sha']=='6c7cb4fdb99dce236b634c842326bae6aed5f232'
  item={'at':stamp,'status':r['status'],'conclusion':r['conclusion'],'jobs':[{'id':x['id'],'name':x['name'],'status':x['status'],'conclusion':x['conclusion'],'active':[(s['name'],s['status'],s['conclusion']) for s in x['steps'] if s['status']=='in_progress' or s['conclusion']=='failure']} for x in j['jobs']]};print(json.dumps(item),flush=True)
  if r['status']=='completed':(base/'completed.json').write_text(json.dumps(item,indent=2)+'\n');break
 except Exception as error:
  print(json.dumps({'at':stamp,'readError':type(error).__name__}),flush=True)
else:print('Read-only monitoring bound reached; no run mutation performed.',flush=True)

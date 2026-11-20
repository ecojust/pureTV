import datetime,hashlib,json,subprocess,time
from pathlib import Path
root=Path('/dev/shm/puretv-submit');run=44630011092;sha='467670b4e43189dc8fc4786a5c6b3a14b6f9b2bd';out=root/f'joystick-games/ponpoko-kart/docs/emulator-vulkan-v8-{run}';out.mkdir(exist_ok=True);monitor=out/'monitor';monitor.mkdir(exist_ok=True)
for source,destination in [('/dev/shm/pon-android-vulkan-v8-dispatch.json','dispatch-request.json'),('/dev/shm/pon-android-vulkan-v8-dispatch-result.json','dispatch-result.json')]:
 data=Path(source).read_bytes();p=out/destination;assert not p.exists() or p.read_bytes()==data;p.write_bytes(data)
identity={'originalRunId':run,'runAttempt':1,'qaSource':sha,'qaParent':'a79611725f1f3c75816cff229b7883cf9e14c54b','ref':'build-source/racing-pon-android-vulkan-v8','artifactSource':'8f283c73f52f857777306eafc88f710262367834','artifactRun':44597115244,'artifactExport':'4249f5c0ec3053a1dec652a7880a040e1bb143f0','onlyEmulatorArgumentDelta':['-feature','-Vulkan'],'postCountByThisMonitor':0};(out/'identity.json').write_text(json.dumps(identity,indent=2)+'\n')
def get(endpoint):
 p=subprocess.run(['gh','api',endpoint],capture_output=True,text=True,timeout=35)
 if p.returncode:raise RuntimeError('GET failed rc '+str(p.returncode)+' stderrSHA '+hashlib.sha256(p.stderr.encode()).hexdigest())
 return p.stdout,json.loads(p.stdout)
previous=None;sequence=0
while True:
 try:
  raw,r=get(f'repos/ecojust/pureTV/actions/runs/{run}');assert r['id']==run and r['head_sha']==sha and r['head_branch']==identity['ref'] and r['run_attempt']==1 and r['event']=='workflow_dispatch' and r['path']=='.github/workflows/joystick-catalog-android-runtime.yml'
  jraw,j=get(f'repos/ecojust/pureTV/actions/runs/{run}/attempts/1/jobs?per_page=100');assert len(j['jobs'])==j['total_count'];state={'status':r['status'],'conclusion':r['conclusion'],'jobs':[{'id':x['id'],'name':x['name'],'status':x['status'],'conclusion':x['conclusion'],'activeSteps':[s['name'] for s in x['steps'] if s['status']=='in_progress']}for x in j['jobs']]}
  if state!=previous:
   sequence+=1;prefix=f'{sequence:03d}';(monitor/(prefix+'-run.json')).write_text(raw);(monitor/(prefix+'-jobs.json')).write_text(jraw);(monitor/(prefix+'-summary.json')).write_text(json.dumps({'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),**state},indent=2)+'\n');print(json.dumps(state),flush=True);previous=state
  if r['status']=='completed':
   (out/'original-final-run.json').write_text(raw);(out/'original-final-jobs.json').write_text(jraw);araw,a=get(f'repos/ecojust/pureTV/actions/runs/{run}/artifacts?per_page=100');(out/'original-artifacts.json').write_text(araw);break
 except Exception as e:
  print(json.dumps({'readOnlyMonitorError':str(e),'at':datetime.datetime.now(datetime.timezone.utc).isoformat()}),flush=True)
 time.sleep(30)

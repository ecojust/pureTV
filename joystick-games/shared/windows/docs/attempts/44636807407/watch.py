import datetime,json,os,pathlib,subprocess,time
OUT=pathlib.Path(__file__).resolve().parent
RUN=44636807407;SOURCE='d750c0c68c430503be06d18fe5b76af825c72e58'
ENV={**os.environ,'TMPDIR':'/dev/shm/windows-host-tmp','XDG_CACHE_HOME':'/dev/shm/windows-host-tmp/gh-cli-cache','PYTHONDONTWRITEBYTECODE':'1'}
last=None
for attempt in range(90):
 stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
 response=subprocess.run(['gh','api',f'repos/ecojust/pureTV/actions/runs/{RUN}/attempts/1/jobs?per_page=100'],env=ENV,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 (OUT/f'jobs-{stamp}.json').write_bytes(response.stdout)
 if response.returncode:
  (OUT/f'jobs-{stamp}-error.txt').write_bytes(response.stderr)
  print(json.dumps({'time':stamp,'status':'api_failed','exit':response.returncode,'error':response.stderr.decode(errors='replace')[:500]}),flush=True)
  if b'HTTP 401' in response.stderr:break
 else:
  payload=json.loads(response.stdout);jobs=payload['jobs'];assert payload['total_count']==len(jobs)
  for j in jobs:assert j['run_id']==RUN and j['head_sha']==SOURCE and j.get('run_attempt',1)==1
  status=[{'id':j['id'],'name':j['name'],'status':j['status'],'conclusion':j['conclusion'],'currentSteps':[s['name'] for s in j['steps'] if s['status']=='in_progress'],'failedSteps':[s['name'] for s in j['steps'] if s['conclusion']=='failure']} for j in jobs]
  if status!=last:print(json.dumps({'time':stamp,'jobs':status}),flush=True);last=status
  if jobs and all(j['status']=='completed' for j in jobs) and any(j['name']=='export' for j in jobs):
   result=subprocess.run(['gh','api',f'repos/ecojust/pureTV/actions/runs/{RUN}'],env=ENV,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
   (OUT/'completed-run.json').write_bytes(result.stdout);(OUT/'completed-run-error.txt').write_bytes(result.stderr)
   if not result.returncode:
    run=json.loads(result.stdout);assert run['id']==RUN and run['head_sha']==SOURCE and run['run_attempt']==1
    if run['status']=='completed':print(json.dumps({'finished':True,'conclusion':run['conclusion'],'run':RUN}),flush=True);break
 time.sleep(55)

from pathlib import Path
import subprocess,json,datetime,time,concurrent.futures
OUT=Path(__file__).parent
RUN=44640574808; SOURCE='6d91b690e4b21bb7af578b7eec4dbfe3eea4ccbd'
BASE=f'repos/ecojust/pureTV/actions/runs/{RUN}'
last=None
for poll in range(120):
    stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    def get(item):
        name,url=item
        p=subprocess.run(['gh','api',url],capture_output=True,timeout=30)
        (OUT/(stamp+'-'+name+'.json')).write_bytes(p.stdout)
        if p.returncode:
            (OUT/(stamp+'-'+name+'-error.txt')).write_bytes(p.stderr)
            raise RuntimeError('API '+name+' exit '+str(p.returncode))
        return name,json.loads(p.stdout)
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            values=dict(pool.map(get,[('run',BASE),('jobs',BASE+'/attempts/1/jobs?per_page=100')]))
        run=values['run']; assert run['id']==RUN and run['head_sha']==SOURCE and run['run_attempt']==1
        assert run['head_branch']=='build-source/backroad-original-graphics-v1' and run['path']=='.github/workflows/joystick-backroad-graphics-diagnostic.yml'
        jobs=[{'id':j['id'],'name':j['name'],'status':j['status'],'conclusion':j['conclusion'],
               'activeStep':next((s['name'] for s in j.get('steps',[]) if s['status']=='in_progress'),None),
               'failedSteps':[s['name'] for s in j.get('steps',[]) if s['conclusion']=='failure']} for j in values['jobs']['jobs']]
        summary={'runStatus':run['status'],'runConclusion':run['conclusion'],'jobs':jobs}
        if summary!=last:
            print(json.dumps({'at':stamp,**summary}),flush=True)
            _,artifacts=get(('artifacts',BASE+'/artifacts?per_page=100'))
            print(json.dumps({'artifacts':[{k:a.get(k) for k in ['id','name','size_in_bytes','digest','expired']} for a in artifacts['artifacts']]}),flush=True)
            with (OUT/'timeline.jsonl').open('a') as f:f.write(json.dumps({'at':stamp,**summary})+'\n')
            last=summary
        if run['status']=='completed':break
    except Exception as error:
        print(json.dumps({'at':stamp,'observationErrorType':type(error).__name__,'message':str(error)[:180]}),flush=True)
    time.sleep(30)
else:print(json.dumps({'status':'monitor-budget-ended','noWorkflowActionTaken':True}),flush=True)

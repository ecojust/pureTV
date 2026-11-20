"""Read-only exact-run monitor. No dispatch, artifact GET or source execution."""
from pathlib import Path
import json,subprocess,time
OUT=Path(__file__).parent
RUN=44640920725
SOURCE='5f2dce57aac3b8ecda316deac1d1ba5f0ae352bd'
last=None;sequence=0;started=time.monotonic()
while time.monotonic()-started<3600:
    sequence+=1;raw={}
    try:
        for key,suffix in [('run',''),('jobs','/attempts/1/jobs')]:
            p=subprocess.run(['gh','api',f'repos/ecojust/pureTV/actions/runs/{RUN}'+suffix],capture_output=True,timeout=25)
            if p.returncode:raise RuntimeError(key+' API exit '+str(p.returncode))
            raw[key]=p.stdout
        run=json.loads(raw['run']);jobs=json.loads(raw['jobs'])['jobs']
        assert run['id']==RUN and run['head_sha']==SOURCE and run['head_branch']=='build-source/pon-android-qemu-stack-v10'
        assert run['run_attempt']==1 and run['path']=='.github/workflows/joystick-catalog-android-runtime.yml'
        summary={'run':RUN,'source':SOURCE,'runAttempt':1,'status':run['status'],'conclusion':run['conclusion'],
                 'jobs':[{'id':j['id'],'name':j['name'],'status':j['status'],'conclusion':j['conclusion'],
                          'steps':[[s['name'],s['status'],s['conclusion']]for s in j['steps']]}for j in jobs]}
        stable=json.dumps(summary,sort_keys=True)
        if stable!=last:
            for key,data in raw.items():(OUT/f'{sequence:03d}-{key}.json').write_bytes(data)
            (OUT/f'{sequence:03d}-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
            print(json.dumps(summary),flush=True);last=stable
        if run['status']=='completed':break
    except Exception as error:
        record={'iteration':sequence,'type':type(error).__name__,'message':str(error),'readOnly':True}
        (OUT/f'{sequence:03d}-error.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record),flush=True)
    time.sleep(30)

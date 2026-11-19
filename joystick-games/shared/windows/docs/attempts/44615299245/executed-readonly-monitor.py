import datetime,json,os,pathlib,re,subprocess,time
root=pathlib.Path('/dev/shm/puretv-submit');folder=root/'joystick-games/shared/windows/docs/attempts/44615299245';source='6c7cb4fdb99dce236b634c842326bae6aed5f232';previous=None
def clean(data):return re.sub(r'(https?://[^\s?]+)\?[^\s]+',r'\1?[REDACTED]',data.decode(errors='replace'))
for attempt in range(50):
 stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ');r=subprocess.run(['gh','run','view','44615299245','--repo','ecojust/pureTV','--json','status,conclusion,headSha,event,jobs,url'],capture_output=True,timeout=35)
 if r.returncode:
  failure={'returncode':r.returncode,'error':clean(r.stderr)};(folder/('monitor-'+stamp+'-failure.json')).write_text(json.dumps(failure,indent=2)+'\n');print(json.dumps(failure),flush=True);break
 v=json.loads(r.stdout);assert v['headSha']==source and v['event']=='workflow_dispatch';(folder/('monitor-'+stamp+'.json')).write_bytes(r.stdout)
 status={'status':v['status'],'conclusion':v['conclusion'],'jobs':[{'id':j['databaseId'],'name':j['name'],'status':j['status'],'conclusion':j['conclusion']} for j in v['jobs']]}
 if status!=previous:print(json.dumps(status),flush=True);previous=status
 if v['status']=='completed':
  for j in v['jobs']:
   if j['conclusion']!='failure':continue
   prefix='job-'+str(j['databaseId']);log=subprocess.run(['gh','run','view','44615299245','--repo','ecojust/pureTV','--job',str(j['databaseId']),'--log-failed'],capture_output=True,timeout=90)
   summary={'job':j,'returncode':log.returncode,'originalLogDownloaded':log.returncode==0,'stdoutBytes':len(log.stdout),'stderr':clean(log.stderr)}
   if log.returncode==0:(folder/(prefix+'-original-failed.log')).write_bytes(log.stdout)
   (folder/(prefix+'-log-read.json')).write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps({'job':j['name'],'id':j['databaseId'],'logReturncode':log.returncode,'bytes':len(log.stdout),'stderr':summary['stderr']}),flush=True)
  break
 time.sleep(45)
else:print('Bounded monitor ended after 50 observations; original workflow not cancelled',flush=True)

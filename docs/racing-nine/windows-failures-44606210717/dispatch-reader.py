import json,pathlib,subprocess,datetime,time,sys,re
base=pathlib.Path('/dev/shm/puretv-submit/docs/racing-nine/windows-failures-44606210717/requests');game=sys.argv[1]
assert game in ['backroad-rally','ponpoko-kart','penguintrack','last-track','dirt-crown','turbo-kart-rush','kart-royale']
record=base/(game+'-dispatch.json');assert not record.exists(),'A prior dispatch record exists: inspect it, never blindly re-submit'
source='c5ad63e8c6a0ccfada5f763d1d26afa27f45002e';ref='build-source/racing-windows-eight-v1';workflow='joystick-catalog-windows-evidence.yml'
endpoint='repos/ecojust/pureTV/actions/workflows/'+workflow
listendpoint=endpoint+'/runs?branch='+ref+'&event=workflow_dispatch&per_page=100'
def api(path):return json.loads(subprocess.check_output(['gh','api',path],timeout=25))
before=api(listendpoint);seen={r['id'] for r in before['workflow_runs']}
payload={'ref':ref,'inputs':{'source_run':'44606210717','source_sha':source,'source_attempt':'1','game':game}};request=base/(game+'-request.json');request.write_text(json.dumps(payload,indent=2)+'\n')
r={'game':game,'requestedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceRun':44606210717,'sourceSha':source,'sourceAttempt':1,'readerWorkflow':workflow,'readerRef':ref,'requestFile':request.name,'previousReaderRunIds':sorted(seen),'status':'post-about-to-be-issued','productionRebuildRequested':False}
def save():record.write_text(json.dumps(r,indent=2)+'\n')
save()
try:
 process=subprocess.run(['gh','api','--method','POST',endpoint+'/dispatches','--input',str(request)],capture_output=True,text=True,timeout=30)
 r['postReturnCode']=process.returncode;r['postResponse']=process.stdout;r['postError']=re.sub(r'https?://[^\s?]+\?\S+','[signed URL query redacted]',process.stderr);r['status']='accepted-awaiting-run-identity' if process.returncode==0 else 'response-failed-do-not-retry-without-readback';save()
except Exception as e:r['status']='post-result-unknown';r['errorType']=type(e).__name__;save();raise
for _ in range(20):
 current=api(listendpoint);new=[x for x in current['workflow_runs'] if x['id'] not in seen and x['head_sha']==source and x['head_branch']==ref]
 if new:
  assert len(new)==1,'Ambiguous new run; inspect without reposting'
  r.update(status='accepted-and-run-identified',readerRunId=new[0]['id'],readerRunStatus=new[0]['status'],readerRunUrl=new[0]['html_url']);save();print(json.dumps(r));break
 time.sleep(1)
else:print(json.dumps(r));raise SystemExit(2)

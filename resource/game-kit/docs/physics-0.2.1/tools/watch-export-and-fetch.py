#!/usr/bin/env python3
"""Recover only failed export jobs after successful sign jobs become API-visible."""
import argparse,concurrent.futures,datetime,hashlib,json,os,subprocess,time,zipfile
from pathlib import Path
REPO=Path('/workspace/pureTV'); BASE=Path('/workspace/scratch/physics-021')
RUNFILE=BASE/'signing-runs.json'; VERIFYFILE=BASE/'signed-assets-verification.json'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--allow-export-retry', action='store_true', help='Permit export-only retry of the known stale-jobs-API failure after visible sign success')
args=parser.parse_args()
SOURCE=json.loads((BASE/'frozen/frozen-verification.json').read_text())['sourceSha']
JDK=Path('/workspace/scratch/game-polish-toolchain/jdk-17.0.21+9'); TOOLS=Path('/workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0')
ENV=dict(os.environ,JAVA_HOME=str(JDK),PATH=str(JDK/'bin')+os.pathsep+os.environ['PATH'])
state=json.loads(RUNFILE.read_text());assert set(state['runs'])=={'tension-span','prism-relay'} and state['sourceSha']==SOURCE
logs=BASE/'signing-logs';logs.mkdir(exist_ok=True)
initial=BASE/'signing-runs-attempt1.json'
if not initial.exists():initial.write_text(json.dumps(state,indent=2)+'\n')
prior=json.loads(VERIFYFILE.read_text()) if VERIFYFILE.exists() else {}
if VERIFYFILE.exists():
 snapshot=BASE/('signed-assets-verification-before-restart-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%f')+'.json')
 snapshot.write_bytes(VERIFYFILE.read_bytes())
results={'sourceSha':SOURCE,'games':prior.get('games',{}),'initialAttemptFailures':prior.get('initialAttemptFailures',prior.get('failures',{})),'failures':{}}

def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def save():
 RUNFILE.write_text(json.dumps(state,indent=2)+'\n');VERIFYFILE.write_text(json.dumps(results,indent=2)+'\n')
def api(path):
 separator='&' if '?' in path else '?'
 return json.loads(subprocess.check_output(['gh','api','-H','Cache-Control: no-cache','repos/ecojust/pureTV/'+path+separator+'physics021_poll='+str(time.time_ns())],cwd=REPO,text=True))
def info(pair):
 slug,row=pair;rid=row['runId']
 return slug,api(f'actions/runs/{rid}'),api(f'actions/runs/{rid}/jobs?filter=all&per_page=100')
def capture_failure(slug,rid,attempt):
 target=logs/f'{slug}-attempt{attempt}-failed.log'
 if target.exists() and target.stat().st_size:return str(target)
 proc=subprocess.run(['gh','run','view',str(rid),'--attempt',str(attempt),'--log-failed'],cwd=REPO,text=True,capture_output=True)
 if proc.returncode==0 and proc.stdout:
  target.write_text(proc.stdout)
  return str(target)
 (logs/f'{slug}-attempt{attempt}-log-unavailable.txt').write_text(proc.stderr)
 return None

def fetch(slug,row):
 target=BASE/'signed'/slug;log=logs/f'{slug}-fetch.log'
 args=['python3',str(REPO/'resource/game-kit/fetch-signed.py'),'--run-id',str(row['runId']),'--slug',slug,'--source-sha',SOURCE,'--build-tools',str(TOOLS),'--output',str(target)]
 with log.open('w') as f:p=subprocess.run(args,cwd=REPO,env=ENV,stdout=f,stderr=subprocess.STDOUT)
 if p.returncode:return slug,None,{'stage':'fetch','returncode':p.returncode,'log':str(log)}
 record=json.loads((target/'fetch-verification.json').read_text());receipt=json.loads((target/'signing-receipt.json').read_text())
 apk=target/record['apk'];data=apk.read_bytes();assert hashlib.sha256(data).hexdigest()==record['sha256'] and len(data)==record['bytes']
 frozen=BASE/'frozen'/slug/'assets'
 local={p.relative_to(frozen).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in frozen.rglob('*') if p.is_file()}
 with zipfile.ZipFile(apk) as z:actual={name[7:]:hashlib.sha256(z.read(name)).hexdigest() for name in z.namelist() if name.startswith('assets/') and not name.endswith('/')}
 assert actual==local,(slug,'Signed assets differ from frozen tested asset set')
 result={'slug':slug,'runId':row['runId'],'sourceSha':SOURCE,'signedApk':str(apk),'bytes':len(data),'sha256':record['sha256'],'assetCount':len(actual),'assetHashes':actual,'signedAssetsMatchFrozen':True,'certificateSha256':receipt['certificateSha256'],'fetchVerification':str(target/'fetch-verification.json'),'signingReceipt':str(target/'signing-receipt.json'),'exportRetries':row.get('exportRetries',[])}
 (target/'signed-assets-verification.json').write_text(json.dumps(result,indent=2)+'\n');return slug,result,None

last={};deadline=time.monotonic()+3600
while time.monotonic()<deadline:
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:checked=list(pool.map(info,state['runs'].items()))
 ready=[]
 for slug,run,jobs_body in checked:
  row=state['runs'][slug];rid=row['runId'];jobs=jobs_body['jobs']
  row.update({'status':run['status'],'conclusion':run['conclusion'],'runAttempt':run['run_attempt'],'jobs':[{'id':j['id'],'name':j['name'],'status':j['status'],'conclusion':j['conclusion']} for j in jobs]})
  key=(row['status'],row['conclusion'],row['runAttempt'],tuple((j['id'],j['status'],j['conclusion']) for j in row['jobs']))
  if last.get(slug)!=key:print(json.dumps({'slug':slug,'runId':rid,'status':row['status'],'conclusion':row['conclusion'],'attempt':row['runAttempt'],'jobs':row['jobs']}),flush=True);last[slug]=key
  if slug in results['games'] or slug in results['failures']:continue
  failed_signs=[j for j in jobs if j['name']=='sign' and j['status']=='completed' and j['conclusion'] not in ('success','skipped')]
  if run['status']=='completed' and run['conclusion']=='failure' and failed_signs:
   failurelog=capture_failure(slug,rid,run['run_attempt']);results['failures'][slug]={'stage':'sign-failed','log':failurelog,'attempt':run['run_attempt']};continue
  signs=[j for j in jobs if j['name']=='sign' and j['status']=='completed' and j['conclusion']=='success']
  exports=sorted((j for j in jobs if j['name']=='export'),key=lambda j:j['id'])
  latest=exports[-1] if exports else None
  if signs and latest and latest['status']=='completed' and latest['conclusion']=='success' and run['status']=='completed' and run['conclusion']=='success':ready.append((slug,row));continue
  if run['status']=='completed' and run['conclusion']=='failure' and not args.allow_export_retry:
   failurelog=capture_failure(slug,rid,run['run_attempt']);results['failures'][slug]={'stage':'workflow-review-required','log':failurelog,'attempt':run['run_attempt']};continue
  if latest and latest['status']=='completed' and latest['conclusion']=='failure':
   first_error=results['initialAttemptFailures'].setdefault(slug,{'stage':'workflow','runId':rid,'exportJobId':latest['id'],'reason':'Export could not observe successful sign job via eventually consistent jobs API'})
   if run['status']=='completed' and run['run_attempt']==1:
    failedlog=capture_failure(slug,rid,1)
    if failedlog:first_error['log']=failedlog
   if args.allow_export_retry and signs and run['status']=='completed' and run['conclusion']=='failure' and not any(r['requestState']=='accepted' for r in row.get('exportRetries',[])):
    failedlog=capture_failure(slug,rid,1)
    if not failedlog:
     print(json.dumps({'waitingForOriginalFailureLog':slug}),flush=True);continue
    raw=Path(failedlog).read_text()
    if 'This run has no successful signing job' not in raw:
     results['failures'][slug]={'stage':'unexpected-original-failure','log':failedlog};continue
    row.setdefault('exportRetries',[]).append({'requestedAt':now(),'originalExportJobId':latest['id'],'visibleSuccessfulSignJobIds':[j['id'] for j in signs],'failureLog':failedlog,'kind':'export-only','requestState':'pending'});save()
    proc=subprocess.run(['gh','run','rerun','--job',str(latest['id'])],cwd=REPO,text=True,capture_output=True)
    retrylog=logs/f"{slug}-export-retry-request-{len(row['exportRetries'])}.log";retrylog.write_text(proc.stdout+proc.stderr)
    row['exportRetries'][-1].update({'requestState':'accepted' if proc.returncode==0 else 'failed','returncode':proc.returncode,'requestLog':str(retrylog)})
    if proc.returncode:results['failures'][slug]={'stage':'retry-request','log':str(retrylog)}
    print(json.dumps({'exportRetry':slug,'runId':rid,'exportJobId':latest['id'],'accepted':proc.returncode==0}),flush=True);save()
   elif row.get('exportRetries') and run['run_attempt']>=2 and run['status']=='completed' and run['conclusion']=='failure' and latest['id']!=row['exportRetries'][0]['originalExportJobId']:
    failurelog=capture_failure(slug,rid,run['run_attempt']);results['failures'][slug]={'stage':'export-retry','log':failurelog,'attempt':run['run_attempt']}
 save()
 if ready:
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
   pending={pool.submit(fetch,*pair):pair[0] for pair in ready}
   for future in concurrent.futures.as_completed(pending):
    slug=pending[future]
    try:
     slug,result,error=future.result()
     if error:results['failures'][slug]=error;print(json.dumps({'fetchFailure':slug,**error}),flush=True)
     else:results['games'][slug]=result;print(json.dumps({'verified':slug,'bytes':result['bytes'],'assetCount':result['assetCount'],'apk':result['signedApk']}),flush=True)
    except Exception as error:results['failures'][slug]={'stage':'signed-assets','error':str(error)};print(json.dumps({'verificationFailure':slug,'error':str(error)}),flush=True)
    save()
 if len(results['games'])+len(results['failures'])==2:
  results['completedAt']=now();save();print(json.dumps({'verifiedGames':len(results['games']),'failedGames':len(results['failures'])}),flush=True);raise SystemExit(1 if results['failures'] else 0)
 time.sleep(20)
raise SystemExit('Timeout; status and evidence retained')

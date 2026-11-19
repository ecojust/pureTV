from pathlib import Path
import subprocess,os,json,hashlib,types,copy,datetime
r=Path('/dev/shm/puretv-submit');out=r/'docs/racing-nine/native-readiness/runtime-short-job-name';out.mkdir(exist_ok=False);tmp=Path('/dev/shm/racing-native-readiness/runtime-short-job-name');tmp.mkdir(exist_ok=False);path='.github/workflows/joystick-catalog-macos-runtime.yml'
def git(*a,env=None,data=None):return subprocess.check_output(['git',*a],cwd=r,env=env,input=data)
def txt(*a,**kw):return git(*a,**kw).decode().strip()
def sha(b):return hashlib.sha256(b).hexdigest()
head=txt('rev-parse','HEAD');idx=r/txt('rev-parse','--git-path','index');indexsha=sha(idx.read_bytes());original=git('show','c19a4c43e5bed83bf3187869655944bc0fc4c32a:'+path);needle=b'  verify:\n    needs: plan\n';assert original.count(needle)==1;changed=original.replace(needle,b'  verify:\n    name: verify (${{ matrix.batch }}, ${{ matrix.runner }})\n    needs: plan\n');assert (r/path).read_bytes()==original;assert git('show',head+':'+path)==original
(out/'original-runtime-workflow.yml').write_bytes(original);(out/'fixed-runtime-workflow.yml').write_bytes(changed);rows=[];replays=[]
for tag,parent,oldrun,batch,package in [('01','c19a4c43e5bed83bf3187869655944bc0fc4c32a',44615672670,'racing-01','68d343d22c762c904eb83854d4ab9c4113a7c30f'),('03','3768b3c81a26e525bca94e289b139396e0328fee',44615678373,'racing-03','b7b7af12f1eb61f777d89edad7368a69a14bb9e3')]:
 assert git('show',parent+':'+path)==original
 jobsfile=sorted((r/f'docs/racing-nine/native-readiness/ci-{oldrun}-attempt-1/monitor').glob('*-jobs.json'))[-1];jobs=json.loads(jobsfile.read_text())['jobs'];helper=git('show',parent+':joystick-games/tools/macos-capability.py');m=types.ModuleType('frozen');m.__file__=str(tmp/'original-helper.py');exec(compile(helper,m.__file__,'exec'),m.__dict__)
 modified=copy.deepcopy(jobs)
 for job in modified:
  if job['name'].startswith('verify'):job['name']='verify ('+batch+', '+job['labels'][0]+')'
 for job in modified:
  if job['name'].startswith('verify'):
   result=m.select_job(modified,oldrun,1,parent,job['runner_name'],job['labels'][0],batch);assert result['id']==job['id'];replays.append({'originalRun':oldrun,'jobId':job['id'],'newName':job['name'],'onlyModifiedField':'name','frozenHelperSha256':sha(helper),'originalApiFile':str(jobsfile.relative_to(r)),'originalApiSha256':sha(jobsfile.read_bytes()),'strictIdentityCheck':'passed'})
 ref='refs/heads/build-source/racing-macos-'+tag+'-runtime-qa-v2';assert subprocess.run(['git','show-ref','--verify','--quiet',ref],cwd=r).returncode==1
 env=dict(os.environ,GIT_INDEX_FILE=str(tmp/(tag+'.index')));git('read-tree',parent,env=env);blob=txt('hash-object','-w','--stdin',data=changed);git('update-index','--add','--cacheinfo','100644',blob,path,env=env);tree=txt('write-tree','--missing-ok',env=env);assert txt('diff','--name-only',parent,tree)==path;commit=txt('commit-tree',tree,'-p',parent,'-m','Give reused macOS QA jobs exact bounded identity names',env=env);git('update-ref',ref,commit,'0'*40)
 rows.append({'ref':ref,'commit':commit,'parent':parent,'changedPath':path,'blob':blob,'bytes':len(changed),'sha256':sha(changed),'oldRuntimeRun':oldrun,'inputs':{'source_run':str(44608415225 if tag=='01' else 44605303936),'source_sha':package,'source_attempt':'1','batches':batch}})
assert len(replays)==4 and txt('rev-parse','HEAD')==head and sha(idx.read_bytes())==indexsha
(r/path).write_bytes(changed)
record={'baseHead':head,'rootHeadAndIndexUnchanged':True,'onlyWorkingTreeChange':path,'replays':replays,'branches':rows,'sourceScriptSha256':sha(Path(__file__).read_bytes())};(out/'creation.json').write_text(json.dumps(record,indent=2)+'\n');(out/'executed-script.py').write_bytes(Path(__file__).read_bytes())
proc=subprocess.run(['git','push','origin',*[x['ref']+':'+x['ref'] for x in rows]],cwd=r,capture_output=True);(out/'push-stdout.log').write_bytes(proc.stdout);(out/'push-stderr.log').write_bytes(proc.stderr);assert proc.returncode==0,proc.stderr.decode()
for row in rows:
 label=row['inputs']['batches'];request={'ref':row['ref'].removeprefix('refs/heads/'),'inputs':row['inputs']};p=out/(label+'-dispatch-request.json');p.write_text(json.dumps(request,indent=2)+'\n');proc=subprocess.run(['gh','api','--method','POST','repos/ecojust/pureTV/actions/workflows/joystick-catalog-macos-runtime.yml/dispatches','--input',str(p),'-i'],cwd=r,capture_output=True);response={'returncode':proc.returncode,'stdout':proc.stdout.decode(),'stderr':proc.stderr.decode(),'postedExactlyOnce':True};(out/(label+'-dispatch-response.json')).write_text(json.dumps(response,indent=2)+'\n');print(json.dumps({'batch':label,'commit':row['commit'],'ref':row['ref'],'returncode':proc.returncode,'http':[x for x in proc.stdout.decode().splitlines() if x.startswith('HTTP/')]}),flush=True)
for row in rows:
 branch=row['ref'].removeprefix('refs/heads/');proc=subprocess.run(['gh','api','repos/ecojust/pureTV/actions/workflows/joystick-catalog-macos-runtime.yml/runs?branch='+branch+'&per_page=10'],cwd=r,capture_output=True);(out/(row['inputs']['batches']+'-runs-response.json')).write_bytes(proc.stdout if proc.returncode==0 else json.dumps({'returncode':proc.returncode,'stderr':proc.stderr.decode()}).encode());
 if proc.returncode==0:
  hits=[v for v in json.loads(proc.stdout)['workflow_runs'] if v['head_sha']==row['commit']];print(json.dumps({'batch':row['inputs']['batches'],'runs':[{k:v[k] for k in ['id','head_sha','status','conclusion']}for v in hits]}),flush=True)

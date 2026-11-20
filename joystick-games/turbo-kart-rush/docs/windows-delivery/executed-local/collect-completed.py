from pathlib import Path
import concurrent.futures,datetime,hashlib,importlib.util,json,os,subprocess
base=Path(__file__).resolve().parent;root=Path('/dev/shm/puretv-submit');runid=44621752383;source='039d210cfa4cc65f59adf0859a777f3591853a70';reader='701da5bdd3ff860fba02640225852a7573ea96fa'
assert (base/'completed.json').exists(),'Original run not complete; no reads or requests prepared'
completed=json.loads((base/'completed.json').read_text());assert completed['status']=='completed'
run=json.loads((base/('run-'+completed['at']+'.json')).read_text());jobs=json.loads((base/('jobs-'+completed['at']+'.json')).read_text())['jobs'];assert run['id']==runid and run['head_sha']==source and run['run_attempt']==1
p=base/'original-artifacts.json'
raw=subprocess.check_output(['/usr/bin/gh','api',f'repos/ecojust/pureTV/actions/runs/{runid}/artifacts?per_page=100'],timeout=40);p.write_bytes(raw);arts=json.loads(raw);assert arts['total_count']==len(arts['artifacts'])
original_games=['backroad-rally','ponpoko-kart','kart-royale','turbo-kart-rush'];selected=[];failed=[]
for game in original_games:
 found=[j for j in jobs if j['name']==f'verify ({game})'];assert len(found)==1;j=found[0];assert j['status']=='completed' and j['head_sha']==source and j['run_attempt']==1
 if j['conclusion']=='success':selected.append(game)
 else:failed.append({'game':game,'jobId':j['id'],'conclusion':j['conclusion'],'failedSteps':[s['name'] for s in j['steps'] if s['conclusion']=='failure']})
assert selected
code=base/'frozen-reader/joystick-games/tools';code.mkdir(parents=True,exist_ok=True);hashes={}
for name in ['windows-reexport.py','windows-export.py','artifact-draft-transfer.py']:
 data=subprocess.check_output(['git','show',reader+':joystick-games/tools/'+name],cwd=root);(code/name).write_bytes(data);hashes[name]=hashlib.sha256(data).hexdigest()
spec=importlib.util.spec_from_file_location('fixed_windows_original_reader',code/'windows-reexport.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
registry_raw=subprocess.check_output(['git','show',source+':joystick-games/catalog-registry.json'],cwd=root);(base/'original-registry.json').write_bytes(registry_raw)
request={'run':runid,'attempt':1,'source':source,'games':selected};selection=m.validate_selection(run,jobs,arts['artifacts'],request,json.loads(registry_raw));(base/'success-only-selection.json').write_text(json.dumps(selection,indent=2)+'\n')
proposal={'status':'prepared_not_dispatched','workflow':'.github/workflows/joystick-catalog-windows-reexport.yml','frozenReaderCommit':reader,'readerSources':hashes,'proposedUniqueRef':'build-source/racing-windows-four-v3-readonly-export','refCreated':False,'productionRun':runid,'productionAttempt':1,'productionSource':source,'originalRunConclusion':run['conclusion'],'selectedOnlyOriginalSuccessfulGames':selected,'excludedOriginalFailures':failed,'payload':{'ref':'build-source/racing-windows-four-v3-readonly-export','inputs':{'source_run':str(runid),'source_attempt':'1','source_sha':source,'games':json.dumps(selected,separators=(',',':'))}},'validation':'Locally executed exact frozen reader validate_selection against original API run/jobs/artifacts and fixed source registry; no artifact ZIP downloaded, no workflow dispatched','originalRunSnapshot':f'run-{completed["at"]}.json','originalJobsSnapshot':f'jobs-{completed["at"]}.json','originalArtifactsSha256':hashlib.sha256(raw).hexdigest()}
(base/'readonly-reexport-request.json').write_text(json.dumps(proposal,indent=2)+'\n');print(json.dumps({'prepared':True,'selected':selected,'excluded':failed}),flush=True)
failed_requests=[]
for item in failed:
 matches=[a for a in arts['artifacts'] if a['name']=='joystick-windows-evidence-'+item['game']];assert len(matches)==1 and matches[0]['expired'] is False
 failed_requests.append({'game':item['game'],'originalJobId':item['jobId'],'originalConclusion':item['conclusion'],'originalArtifact':matches[0],'workflow':'.github/workflows/joystick-catalog-windows-evidence.yml','payload':{'ref':proposal['proposedUniqueRef'],'inputs':{'source_run':str(runid),'source_attempt':'1','source_sha':source,'game':item['game']}}})
(base/'readonly-failure-evidence-requests.json').write_text(json.dumps({'status':'prepared_not_dispatched','frozenReaderCommit':reader,'purpose':'Only preserve original failed evidence; no package build or gameplay rerun','requests':failed_requests},indent=2)+'\n')
env=dict(os.environ,TMPDIR='/dev/shm/racing-review-arcade/tmp',XDG_CACHE_HOME='/dev/shm/racing-review-arcade/tmp/gh-cache');logs=[]
def fetch(j):
 name=j['name'].replace('verify (','').replace(')','');path=base/(name+'-original-job.log');command=['/usr/bin/gh','run','view',str(runid),'--repo','ecojust/pureTV','--job',str(j['id']),'--log']
 p=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=120,env=env);path.write_bytes(p.stdout);(base/(name+'-original-job.stderr')).write_bytes(p.stderr)
 return {'jobId':j['id'],'jobName':j['name'],'command':command,'exitCode':p.returncode,'log':{'path':path.name,'bytes':len(p.stdout),'sha256':hashlib.sha256(p.stdout).hexdigest()},'stderrPath':name+'-original-job.stderr','format':'gh run view CLI original job log; not claimed byte-identical to raw API zip'}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 for item in pool.map(fetch,[j for j in jobs if j['name'].startswith('verify (') or j['name']=='export']):logs.append(item);print(json.dumps(item),flush=True)
(base/'original-job-log-recovery.json').write_text(json.dumps({'run':runid,'attempt':1,'source':source,'jobs':logs},indent=2)+'\n')

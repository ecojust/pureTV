import argparse,datetime,hashlib,importlib.util,json,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('run',type=int);a=p.parse_args()
root=Path('/dev/shm/puretv-submit');out=root/'docs/racing-nine/native-readiness'/f'ci-{a.run}-attempt-1';verification=json.loads((out/'readonly-intel-export-verification.json').read_text());base=out/'original-intel-export/artifact';source=verification['sourceCommit'];allhashes={};records=[]
frozen=out/'executed-original-macos-coverage.py';frozen.write_bytes(subprocess.check_output(['git','show',source+':joystick-games/tools/macos-coverage.py'],cwd=root));spec=importlib.util.spec_from_file_location('coverage',frozen);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def source_hashes(values):
 for name,value in values.items():
  actual=hashlib.sha256(subprocess.check_output(['git','show',source+':'+name],cwd=root)).hexdigest();assert actual==value
  if name in allhashes:assert allhashes[name]==value
  allhashes[name]=value
for q in sorted(base.glob('*/native/report.json')):
 report=json.loads(q.read_text());game=q.parent.parent.name;assert report['game']==game and report['qaSourceCommit']==source and report['artifactSourceCommit']==source and report['qaRunId']==a.run and report['qaRunAttempt']==1;source_hashes(report['sourceHashes']);state=report['lastState'];observed=state.get('game');caps=[]
 for phase in ('before','after'):
  d=base/game/'capability'/phase;r=json.loads((d/'report.json').read_text());mod.native_intel(r['host']);assert r['game']==game and r['phase']==phase and r['sourceCommit']==r['qaSourceCommit']==source and r['runId']==a.run and r['runAttempt']==1
  assert r['package']['binarySha256']==report['binarySha256'] and r['probe']==json.loads((d/'probe.json').read_text())
  assert r['runnerName']==report['runnerName'];job=r['job'];assert job['id']==r['jobId'] and job['run_id']==a.run and job['head_sha']==source and job['runner_name']==r['runnerName'] and job['run_attempt']==1
  rawjobs=json.loads((d/'original-jobs-stdout.log').read_text());assert job in rawjobs['jobs']
  for key,obs in r['host']['sysctlObservations'].items():
   assert (d/(key+'-stdout.log')).read_text()==obs['stdout'] and (d/(key+'-stderr.log')).read_text()==obs['stderr'] and json.loads((d/(key+'-command.json')).read_text())['returncode']==obs['returncode']
  for name,record in r['executedSources'].items():assert {'bytes':(d/name).stat().st_size,'sha256':sha(d/name)}==record
  source_hashes(r['sourceHashes']);assert r['status']=='observed' and r['probeExitCode']==0 and len(r['probe']['samples'])==3
  if phase=='before':assert mod.timestamp(r['finishedAt'])<=mod.timestamp(report['startedAt'])
  else:assert mod.timestamp(r['startedAt'])>=mod.timestamp(report['finishedAt'])
  caps.append({'phase':phase,'status':r['status'],'jobId':r['jobId'],'runnerName':r['runnerName'],'hostIdentityRecomputedFromRawSysctl':True,'packageBinarySha256MatchesGameReport':True,'samples':r['probe']['samples'],'originalReportSha256':sha(d/'report.json')})
 assert caps[0]['jobId']==caps[1]['jobId'] and caps[0]['runnerName']==caps[1]['runnerName']
 bounded=None
 try:mod.failed_initialization(report,game,None);boundary='initialization_shape_only_accepted_without_full_package_or_coverage_assessment'
 except (AssertionError,KeyError,TypeError) as ex:boundary='blocked_by_initialization_boundary';bounded=str(ex) or type(ex).__name__
 summary={k:observed.get(k) for k in ('game','renderer','webglVersion','frames','stage','errors','paused','audioState','focused') if k in observed} if isinstance(observed,dict) else None
 records.append({'game':game,'originalStatus':report['status'],'failurePhase':report.get('failurePhase'),'nativeProcessAlive':report.get('nativeProcessAlive'),'lastStateFresh':report.get('lastStateFresh'),'nativeProcessArchitecture':report.get('nativeProcessArchitecture'),'originalTests':report['tests'],'lastGameSummary':summary,'originalReportSha256':sha(q),'originalErrorLastLine':report['error'].strip().splitlines()[-1][:1000],'capabilityObservations':caps,'initializationBoundaryCheckOnly':boundary,'boundaryException':bounded,'fullCoverageAssessed':False,'gameFailureCauseProven':False})
result={'sourceRunId':a.run,'sourceRunAttempt':1,'sourceCommit':source,'immutableExportCommit':verification['exportCommit'],'originalFileCount':verification['fileCount'],'originalTotalBytes':verification['totalBytes'],'originalSourceHashesVerifiedAgainstGit':allhashes,'reports':records,'originalReportsModified':False,'gamesRerun':False,'limitations':['Independent WebGL2 probes do not establish actual game root cause or verify WebGL1.','Package manifests and complete ARM gameplay reports still required for a full per-game assessment.','This records the original-source initialization boundary only; no package manifest is supplied and no new coverage eligibility is assigned.']}
(out/'intel-findings.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
paths=list((out/'original-intel-export').rglob('*'))+[out/'identity.json',out/'readonly-intel-export-request-1.json',out/'readonly-intel-export-response-1.json',out/'readonly-intel-export-request-2.json',out/'readonly-intel-export-response-2.json',out/'readonly-intel-export-failure-1.json',out/'readonly-intel-export-failure-1.log',out/'executed-original-macos-coverage.py',out/'readonly-intel-export-verification.json',out/'intel-findings.json'];files={str(x.relative_to(root)):{'bytes':x.stat().st_size,'sha256':sha(x)} for x in paths if x.is_file()}
assert all(v['bytes']<100_000_000 for v in files.values())
(out/'intel-checkpoint-inventory.json').write_text(json.dumps({'status':'ready_for_root_checkpoint','fileCount':len(files),'totalBytes':sum(v['bytes'] for v in files.values()),'files':files},indent=2)+'\n')
print(json.dumps({'run':a.run,'sourceHashes':len(allhashes),'originalFiles':verification['fileCount'],'checkpointFiles':len(files),'checkpointBytes':sum(v['bytes'] for v in files.values()),'games':[{k:r[k] for k in ['game','originalStatus','failurePhase','initializationBoundaryCheckOnly']} for r in records]}))

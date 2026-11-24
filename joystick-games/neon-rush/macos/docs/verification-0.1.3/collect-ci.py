import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path('/dev/shm/neon-macos-ci/43724380197')
REPO=Path('/dev/shm/puretv-neon-macos')
RUN='43724380197'
SOURCE='cc04129f0369c1e9f9262ab798b353f276f1dc3b'
def call(args):return subprocess.check_output(args,cwd=REPO)
raw_run=call(['gh','run','view',RUN,'--repo','ecojust/pureTV','--json','headSha,status,conclusion,url,jobs'])
run=json.loads(raw_run)
assert run['headSha']==SOURCE and run['status']=='completed'
(ROOT/'ci-run.json').write_bytes(raw_run)
raw_meta=call(['gh','api','repos/ecojust/pureTV/actions/runs/'+RUN])
(ROOT/'ci-run-metadata.json').write_bytes(raw_meta)
meta=json.loads(raw_meta)
raw_log=call(['gh','run','view',RUN,'--repo','ecojust/pureTV','--log'])
(ROOT/'ci-workflow.log').write_bytes(raw_log)
counts={}
for line in raw_log.decode().splitlines():
 parts=line.split('\t',2)
 if len(parts)!=3:continue
 job,step,text=parts
 key=job+'/'+step
 match=re.search(r'(?:#|ℹ) (tests|pass|fail|cancelled|skipped|todo) (\d+)(?:$|\s)',text)
 if match:counts.setdefault(key,{})[match[1]]=int(match[2])
 swift=re.search(r'(\d+) controller protocol tests passed',text)
 if swift:counts.setdefault(key,{})['swiftPassed']=int(swift[1])
summary={'runId':int(RUN),'sourceCommit':SOURCE,'status':run['status'],'conclusion':run['conclusion'],'attempt':meta['run_attempt'],'jobs':[{'name':job['name'],'conclusion':job['conclusion']} for job in run['jobs']],'counts':counts,'rawFiles':{path.name:{'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()} for path in [ROOT/'ci-run.json',ROOT/'ci-run-metadata.json',ROOT/'ci-workflow.log']}}
(ROOT/'ci-audit.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,ensure_ascii=False,indent=2))

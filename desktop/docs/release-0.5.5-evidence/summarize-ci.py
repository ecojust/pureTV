#!/usr/bin/env python3
"""Summarize the retrieved raw job logs without treating ignored or skipped steps as tests."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent
run=json.loads((ROOT/'run-final.json').read_text())
assert run['headSha']=='45df495dd5605fee3761654b1648793957c9f56b'
STEPS=('Test subnet comparison','Test read-only TV compatibility probe','Test ADB core','Test Platform Tools installer','Verify official Platform Tools download and offline reuse','Verify Tencent mirror download and ADB','Test desktop UI','Test SVG normalization','Verify MCP against the running desktop','Verify actual client update installation','Verify macOS DMG, bundle signature and installed startup')
result={'runId':42452344249,'sourceCommit':run['headSha'],'status':run['status'],'conclusion':run['conclusion'],'platforms':{},'physicalTvTested':False,'physicalPhoneTested':False}
pattern=re.compile(r'test result: (\w+)\. (\d+) passed; (\d+) failed; (\d+) ignored; (\d+) measured; (\d+) filtered out;')
for job in run['jobs']:
    if job['name']=='Publish desktop release':continue
    name=job['name'];entry={'jobId':job['databaseId'],'conclusion':job['conclusion'],'steps':{step['name']:{'status':step['status'],'conclusion':step['conclusion']} for step in job['steps'] if step['name'] in STEPS}}
    raw=ROOT/(name+'.log')
    if not raw.exists():
        log = subprocess.run(['gh','run','view','42452344249','--repo','ecojust/pureTV','--job',str(job['databaseId']),'--log'],capture_output=True,cwd='/workspace/pureTV')
        if log.returncode == 0:
            raw.write_bytes(log.stdout)
        else:
            entry['logError'] = re.sub(r'https?://\S+','[URL omitted]',log.stderr.decode(errors='replace'))[:700]
    if raw.exists():
        data=raw.read_bytes();entry.update(logRetrieved=True,logBytes=len(data),logSha256=hashlib.sha256(data).hexdigest())
        excerpts={step:[] for step in STEPS}
        for line in data.decode(errors='replace').splitlines():
            fields=line.split('\t',2)
            if len(fields)!=3 or fields[1] not in STEPS:continue
            step,text=fields[1:]
            match=pattern.search(text)
            if match:
                values=match.groups();entry['steps'][step].setdefault('rustResults',[]).append({'result':values[0],**dict(zip(('passed','failed','ignored','measured','filteredOut'),map(int,values[1:])))})
            if step=='Test desktop UI' and re.search(r'PASS \d+:',text):
                entry['steps'][step]['passedScenarios']=entry['steps'][step].get('passedScenarios',0)+1
            if step=='Verify MCP against the running desktop' and re.search(r'PASS MCP:',text):
                entry['steps'][step]['passedMcpChecks']=entry['steps'][step].get('passedMcpChecks',0)+1
                if '(expected failure)' in text:
                    entry['steps'][step]['expectedFailureMcpChecks']=entry['steps'][step].get('expectedFailureMcpChecks',0)+1
            node=re.search(r'ℹ (tests|pass|fail|cancelled|skipped|todo) (\d+)',text)
            if node:entry['steps'][step].setdefault('nodeSummary',{})[node[1]]=int(node[2])
            python=re.search(r'Ran (\d+) tests in',text)
            if python:entry['steps'][step]['pythonTests']=int(python[1])
            useful=re.search(r'test result:|test market::|PASS \d+:|PASS MCP:|PASS:|All .*passed|tests? passed|tests? failed|Ran \d+ tests|# (tests|pass|fail|skipped)|ℹ (tests|pass|fail|cancelled|skipped|todo) |(?:^|\s)OK$|FAILED|Verified actual|Verified baseline|Verified .*signature|Installed copy|DMG install/startup checks',text)
            if useful:
                excerpts[step].append(re.sub(r'https?://[^\s"<>]+\?[^\s"<>]+','[URL with query omitted]',line))
        extracted='\n\n'.join('## '+step+'\n'+'\n'.join(lines) for step,lines in excerpts.items() if lines)+'\n'
        excerpt=ROOT/(name+'-excerpts.log');excerpt.write_text(extracted)
        entry['excerptSha256']=hashlib.sha256(excerpt.read_bytes()).hexdigest()
    else:
        entry['logRetrieved']=False
        previous=ROOT/(name+'-summary.json')
        if previous.exists():entry['logError']=json.loads(previous.read_text()).get('logError','Unavailable')
    result['platforms'][name]=entry
(ROOT/'final-summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))

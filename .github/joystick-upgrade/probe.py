import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.request

import concurrent.futures

base = Path(os.environ["RUNNER_TEMP"])
work = Path(__file__).parent
sources = json.loads((work / "sources.json").read_text())
certificate = Path("tools/puretv-release-certificate-v2.sha256").read_text().strip().split()[0].lower()
tools = Path(os.environ["ANDROID_HOME"]) / "build-tools" / "34.0.0"
out = base / "upgrade-evidence"
out.mkdir(exist_ok=True)
inventory = base / "upgrade-inputs.json"

def command(*args, timeout=120):
    return subprocess.check_output(list(map(str, args)), stderr=subprocess.STDOUT, timeout=timeout, text=True).strip()

def record(path):
    return {"sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "bytes": path.stat().st_size}

def get_old(file, url):
    for attempt in range(3):
        try:
            if '/releases/download/' in url:
                tag, name = url.rsplit('/', 2)[-2:]
                command('gh', 'release', 'download', tag, '--repo', 'ecojust/pureTV', '--pattern', name, '--output', file, '--clobber')
            else:
                with urllib.request.urlopen(url, timeout=60) as response:
                    file.write_bytes(response.read())
            break
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt+1)

def identity(path):
    badging = command(tools / 'aapt', 'dump', 'badging', path)
    line = next(row for row in badging.splitlines() if row.startswith('package:'))
    name = re.search(r"name='([^']+)'", line).group(1)
    code = int(re.search(r"versionCode='(\d+)'", line).group(1))
    version = re.search(r"versionName='([^']+)'", line).group(1)
    signed = command(tools / 'apksigner', 'verify', '--verbose', '--print-certs', path)
    digests = re.findall(r'^Signer #\d+ certificate SHA-256 digest: ([a-f0-9]{64})$', signed, re.M)
    assert digests == [certificate], (path, digests)
    return dict(**record(path), package=name, versionCode=code, versionName=version, certificateSha256=certificate)

def inputs(run):
    def api(path):
        return json.loads(command('gh', 'api', 'repos/ecojust/pureTV/'+path))
    run_id = str(run['runId'])
    origin = api('actions/runs/'+run_id)
    artifact = api('actions/artifacts/'+str(run['artifactId']))
    assert origin['head_sha'] == artifact['workflow_run']['head_sha'] == run['sourceSha']
    assert origin['run_attempt']==1 and origin['head_repository']['full_name']=='ecojust/pureTV'
    assert artifact['name']=='joystick-android-signed' and not artifact['expired']
    assert str(artifact['workflow_run']['id'])==run_id
    assert artifact['digest']=='sha256:'+run['archiveSha256'] and artifact['size_in_bytes']==run['archiveBytes']
    assert any(job['name']=='sign' and job['conclusion']=='success' for job in api('actions/runs/'+run_id+'/jobs?per_page=80')['jobs'])
    rows = []
    for game in run['games']:
        slug = game['game']
        signed = base/'signed-upgrades'/run_id/'packages'/slug
        receipt = json.loads((signed/'signing-receipt.json').read_bytes())
        new = signed/(slug+'-'+receipt['versionName']+'.apk')
        old = base/(slug+'-previous.apk')
        get_old(old, game['previousUrl'])
        before, after = identity(old), identity(new)
        assert receipt['signatureVerified'] and str(receipt['runId'])==run_id and receipt['sourceSha']==run['sourceSha']
        assert before['versionName']==game['previousVersion'] and before['versionCode']==game['previousCode']
        assert before['sha256']==game['previousSha256'] and before['bytes']==game['previousBytes']
        assert after['package']==before['package']==game['packageName']==receipt['packageName']
        assert after['versionCode']==receipt['versionCode']>before['versionCode'] and after['versionName']==receipt['versionName']
        assert after['sha256']==receipt['sha256'] and after['bytes']==receipt['bytes']
        rows.append(dict(game=slug,package=after['package'],oldPath=str(old),newPath=str(new),previous=before,candidate=after,previousUrl=game['previousUrl'],buildRunId=run_id,artifactId=run['artifactId'],source=run['sourceSha']))
    return rows

def installed(pkg):
    listing = command('adb','shell','cmd','package','list','packages','-U',pkg)
    uid = int(re.search(r'^package:'+re.escape(pkg)+r' uid:(\d+)$',listing,re.M).group(1))
    detail=command('adb','shell','dumpsys','package',pkg)
    first=re.search(r'^\s*firstInstallTime=(.+)$',detail,re.M).group(1).strip()
    last=re.search(r'^\s*lastUpdateTime=(.+)$',detail,re.M).group(1).strip()
    code=int(re.search(r'^\s*versionCode=(\d+)',detail,re.M).group(1))
    name=re.search(r'^\s*versionName=(.+)$',detail,re.M).group(1).strip()
    return dict(uid=uid,firstInstallTime=first,lastUpdateTime=last,versionCode=code,versionName=name)

def device(rows):
    report={'androidApi':command('adb','shell','getprop','ro.build.version.sdk'),'image':command('adb','shell','getprop','ro.build.fingerprint'),'physicalDevice':False,'games':{}}
    assert len(rows)==len({r['package'] for r in rows})==1 and rows[0]['game']=='emberbrood'
    for row in rows:
        pkg=row['package']; slug=row['game']
        item=report['games'][slug]={k:v for k,v in row.items() if k not in ['oldPath','newPath']}
        try:
            assert 'package:'+pkg not in command('adb','shell','cmd','package','list','packages',pkg)
            item['previousInstall']=command('adb','install',row['oldPath'])
            assert 'Success' in item['previousInstall']
            before=item['installedBefore']=installed(pkg)
            assert before['versionCode']==row['previous']['versionCode']
            item['upgradeInstall']=command('adb','install','-r',row['newPath'])
            assert 'Success' in item['upgradeInstall']
            after=item['installedAfter']=installed(pkg)
            assert after['versionCode']==row['candidate']['versionCode'] and after['versionName']==row['candidate']['versionName']
            assert before['uid']==after['uid'] and before['firstInstallTime']==after['firstInstallTime']
            item['status']='passed'
        except Exception as exc:
            item['status']='failed';item['error']=repr(exc)
            if isinstance(exc,subprocess.CalledProcessError):item['output']=exc.output[-4000:]
        print(slug,item['status'],flush=True)
        (out/'upgrade-report.json').write_text(json.dumps(report,indent=2)+'\n')
    assert all(x['status']=='passed' for x in report['games'].values()), 'An Android package replacement failed'

if sys.argv[1]=='prepare':
    with concurrent.futures.ThreadPoolExecutor(4) as pool:
        rows=[r for batch in pool.map(inputs,sources) for r in batch]
    inventory.write_text(json.dumps(rows,indent=2)+'\n')
    (out/'verified-signatures.json').write_text(json.dumps([{k:v for k,v in r.items() if k not in ['oldPath','newPath']} for r in rows],indent=2)+'\n')
else:
    assert sys.argv[1]=='exercise'
    device(json.loads(inventory.read_bytes()))

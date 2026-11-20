import importlib.util,json,hashlib,datetime
from pathlib import Path
b=Path('/dev/shm/puretv-submit/joystick-games/night-racer/docs/android-delivery/original-export/evidence/joystick-android-runtime-night-racer/night-racer')
p=b/'executed-source/joystick-games/tools/android-runtime-artifact.py';spec=importlib.util.spec_from_file_location('night_original_reader',p);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
origin=b/'verified-inputs/original-actions-artifact-origin.json';value=json.loads(origin.read_text());result=module.validate_origin(value,['night-racer']);assert result==value['producerVerification']
out={'status':'passed','method':'Locally replay original frozen QA pure producer-identity validator on unchanged original run/jobs/artifact metadata; no network or package/native execution','originSha256':hashlib.sha256(origin.read_bytes()).hexdigest(),'validatorSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'producerVerification':result,'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
Path('/dev/shm/racing-review-arcade/night-44618869289/producer-origin-recheck.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'status':'passed','job':result['jobId'],'buildJobs':result['buildJobs']}))

from pathlib import Path
import json,hashlib,subprocess
repo=Path('/dev/shm/puretv-joystick-games');out=Path('/dev/shm/joystick-android-ci-followup/verifier-source-dfae2fb-minimal');export=Path('/dev/shm/joystick-android-ci-followup/adventure01-original-export');commit='dfae2fb0979314424ef3e4f2c7cb7cfcac91885d'
assert not out.exists();out.mkdir();subprocess.run(['git','init','-q',str(out)],check=True);(out/'.git/objects/info/alternates').write_text(str(repo/'.git/objects')+'\n');subprocess.run(['git','update-ref','refs/heads/master',commit],cwd=out,check=True)
inputs={}
for slug in ['glup','emberbrood']:
 receipt=json.loads((export/'packages'/slug/'signing-receipt.json').read_text());obs=json.loads((export/'observers'/slug/'observer-signing-receipt.json').read_text());inputs.update(receipt['sourceInputs']);inputs.update(obs['sourceFiles'])
for rel in ['puretv-joystick/joystick_sdk.py']:
 data=subprocess.check_output(['git','show',commit+':'+rel],cwd=repo);inputs[rel]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
for rel,expected in inputs.items():
 data=subprocess.check_output(['git','show',commit+':'+rel],cwd=repo);assert expected=={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()};p=out/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
record={'sourceSha':commit,'inputs':inputs,'scope':'Exact build source inventory plus Observer and SDK only, shared immutable Git objects; no unrelated historical docs/videos checked out.'};(out.parent/'adventure01-minimal-source-materialization.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({'materializedFiles':len(inputs),'bytes':sum(v['bytes'] for v in inputs.values())}))

import hashlib,json,subprocess
from pathlib import Path
repo=Path('/dev/shm/puretv-submit');out=Path(__file__).parent;commit='ea7854ca06ed53967aed00fe160034185f2906b3'
names=['joystick-games/backroad-rally/src/upstream/src/data.ts','joystick-games/backroad-rally/src/upstream/src/menu/nav.ts','joystick-games/backroad-rally/src/upstream/src/menu/data.ts','joystick-games/backroad-rally/src/upstream/src/menu/menuPage.ts','joystick-games/backroad-rally/src/upstream/src/main.ts','joystick-games/backroad-rally/src/upstream/src/puretv.ts','joystick-games/backroad-rally/src/upstream/src/puretv-observation.ts','joystick-games/backroad-rally/dist/data/menu.json','joystick-games/backroad-rally/build.mjs','joystick-games/shared/macos/Sources/LocalAssetServer.swift','joystick-games/shared/macos/Sources/main.swift']
rows={}
for name in names:
 b=subprocess.check_output(['git','show',commit+':'+name],cwd=repo);p=out/'frozen'/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);rows[name]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'gitBlob':hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()}
(out/'source-bindings.json').write_text(json.dumps({'sourceSha':commit,'files':rows},indent=2)+'\n')

#!/usr/bin/env python3
"""Compile the real legacy hosts and shared controller with Android API 35; no device claims."""
import argparse,hashlib,json,os,subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--repo',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--toolchain',type=Path,required=True);a=p.parse_args()
slugs=['alien-shooter','used-car-racing','cozy-island','coast-kart','super-mario','bomb-jack','adventure-island','tetris','jewel','jackal','tank']
a.output.mkdir(parents=True,exist_ok=True)
android=a.toolchain/'android-sdk/platforms/android-35/android.jar';jdk=a.toolchain/'jdk-17.0.21+9/bin/javac'
common=[*(a.repo/'resource/game-kit/android/src/main/java/com/ecojust/gamekit').glob('WifiController*.java'),*(a.repo/'resource/game-kit/legacy-controller-native/src/main/java').rglob('*.java')]
script=Path(__file__);(a.output/'executed-compile-hosts.py').write_bytes(script.read_bytes())
def check(slug):
 root=a.repo/'resource/apps'/slug;out=a.output/slug;out.mkdir(exist_ok=True);(out/'gen').mkdir(exist_ok=True);(out/'classes').mkdir(exist_ok=True)
 sources=[*common,*sorted((root/'src/main/java').rglob('*.java'))]
 commands=[[str(a.toolchain/'android-sdk/build-tools/34.0.0/aapt'),'package','-f','-m','-J',str(out/'gen'),'-M',str(root/'src/main/AndroidManifest.xml'),'-S',str(root/'src/main/res'),'-I',str(android)], [str(jdk),'-J-Djava.io.tmpdir='+str(a.output),'-encoding','UTF-8','-source','17','-target','17','-classpath',str(android)+':'+str(a.toolchain/'core-3.5.3.jar'),'-d',str(out/'classes')]]
 results=[]
 for index,command in enumerate(commands):
  if index:command += [str(f) for f in [*sources,*(out/'gen').rglob('*.java')]]
  result=subprocess.run(command,capture_output=True,text=True,env={**os.environ,'TMPDIR':str(a.output)})
  (out/('step-'+str(index)+'.txt')).write_text(result.stdout+result.stderr);results.append({'command':command,'returncode':result.returncode})
  if result.returncode:break
 return {'slug':slug,'passed':all(x['returncode']==0 for x in results),'steps':results,'sourceHashes':{str(f.relative_to(a.repo)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sources}}
with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(check,slugs))
report={'method':'Real Android resource symbol generation and javac compilation; no execution or hardware validation','passed':all(r['passed'] for r in results),'results':results}
(a.output/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':report['passed'],'games':[{k:r[k] for k in ('slug','passed')} for r in results]}));raise SystemExit(0 if report['passed'] else 1)

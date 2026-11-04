#!/usr/bin/env python3
"""Check signed APK once and bind it to an existing verified video without re-decoding."""
import argparse,hashlib,json,os,pathlib,subprocess
p=argparse.ArgumentParser();p.add_argument('--game',required=True);p.add_argument('--recording',default='recording-01');p.add_argument('--output',type=pathlib.Path);a=p.parse_args()
repo=pathlib.Path('/workspace/pureTV');root=pathlib.Path('/workspace/scratch/physics-021');qa=root/'final-qa'/a.game;qa.mkdir(exist_ok=True,parents=True)
output=a.output or qa/'artifacts.json'
assert not output.resolve().is_relative_to(repo), 'Artifact summary output must stay outside the repository'
apkpath=root/'signed'/a.game/(a.game+'-0.2.1.apk');apkreport=qa/'signed-apk-verification.json'
def read(p):return json.loads(p.read_text())
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
if apkreport.exists():assert read(apkreport)['apk']['sha256']==digest(apkpath)
else:
 env={**os.environ,'JAVA_HOME':'/workspace/scratch/game-polish-toolchain/jdk-17.0.21+9'}
 args=['python3',str(repo/'resource/game-kit/qa/verify-artifacts.py'),'--apk',str(apkpath),'--assets',str(root/'frozen'/a.game/'assets'),'--build-tools','/workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0','--package',read(repo/'resource/apps'/a.game/'game.json')['packageName'],'--output',str(apkreport)]
 subprocess.run(args,env=env,check=True,stdout=subprocess.DEVNULL)
video_report=qa/a.recording/'video-validation.json';video=qa/a.recording/'gameplay.mp4';v=read(video_report);apk=read(apkreport)
assert digest(video)==v['video']['sha256'] and video.stat().st_size==v['video']['bytes']<10_000_000
assert all(v['checks'].get(k) for k in ['videoSize','videoFormat','videoFullDecode'])
out={**apk,'kind':'combined-original-artifact-checks','checks':{**apk['checks'],**v['checks']},'video':v['video'],'originalReports':[{'file':str(f.relative_to(qa)),'sha256':digest(f)} for f in [apkreport,video_report]],'note':'Signed APK newly checked; unchanged recording reuses its original complete decode report.'}
raw=json.dumps(out,ensure_ascii=False,indent=2)+'\n'
if output.exists():assert output.read_text()==raw, 'Existing artifact summary differs; preserve it and pass --output with a fresh path'
else:output.parent.mkdir(parents=True,exist_ok=True);output.write_text(raw)
print(json.dumps({'game':a.game,'artifactChecks':out['checks'],'output':str(output)}))

#!/usr/bin/env python3
"""Build an unsigned, read-only instrumentation APK for one published game. No keys."""
import argparse,hashlib,json,re,subprocess,zipfile
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
p=argparse.ArgumentParser();p.add_argument('--game',required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--sdk',type=Path,required=True);p.add_argument('--jdk',type=Path,required=True);a=p.parse_args()
assert re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*',a.game)
game=ROOT/'resource/apps'/a.game
meta=game/'game.json'
if meta.exists(): package=json.loads(meta.read_text())['packageName']
else:
 meta=game/'build.gradle';package=re.search(r"applicationId\s+['\"]([^'\"]+)",meta.read_text())[1]
assert re.fullmatch(r'com\.ecojust\.[a-z0-9]+',package)
out=a.output.resolve();out.mkdir(parents=True,exist_ok=True);assert not list(out.iterdir()),'Use empty output directory'
source=HERE/'src/com/ecojust/controllerqa/Observer.java';android=a.sdk/'platforms/android-35/android.jar';bt=a.sdk/'build-tools/34.0.0';classes=out/'classes';classes.mkdir();dex=out/'dex';dex.mkdir()
application='com.ecojust.controllerqa.'+a.game.replace('-','');component=application+'/com.ecojust.controllerqa.Observer'
manifest=out/'AndroidManifest.xml';manifest.write_text(f'''<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="{application}" android:versionCode="1" android:versionName="1.0"><uses-sdk android:minSdkVersion="26" android:targetSdkVersion="35"/><uses-permission android:name="android.permission.INTERNET"/><application android:label="pureTV read-only QA observer" android:hasCode="true" android:testOnly="true"/><instrumentation android:name="com.ecojust.controllerqa.Observer" android:targetPackage="{package}" android:functionalTest="true" android:handleProfiling="false"/></manifest>''')
def run(*cmd):subprocess.run([str(v) for v in cmd],check=True)
run(a.jdk/'bin/javac','-source','8','-target','8','-bootclasspath',android,'-d',classes,source)
run(bt/'d8','--min-api','26','--lib',android,'--output',dex,*sorted(classes.rglob('*.class')))
apk=out/f'observer-{a.game}-unsigned.apk';run(bt/'aapt2','link','--manifest',manifest,'-I',android,'-o',apk)
with zipfile.ZipFile(apk,'a',compression=zipfile.ZIP_DEFLATED) as z:
 for f in dex.glob('*.dex'):z.write(f,f.name)
def info(p):return {'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
receipt={'game':a.game,'targetPackage':package,'observerPackage':application,'packageName':application,'instrumentationRunner':'com.ecojust.controllerqa.Observer','component':component,'diagnosticPort':63486,'readonlyEndpoints':['/status','/snapshot'],'modelWrites':False,'signed':False,'apk':apk.name,'apkIdentity':info(apk),'sourceFiles':{str(x.relative_to(ROOT)):info(x) for x in [source,Path(__file__),meta]},'classFiles':{str(x.relative_to(classes)):info(x) for x in sorted(classes.rglob('*.class'))}}
(out/'observer-build.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2))

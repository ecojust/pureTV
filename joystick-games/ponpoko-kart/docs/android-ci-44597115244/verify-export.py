#!/usr/bin/env python3
"""Read-only audit of the exact exported run; no build, install, rerun or signing."""
import argparse,datetime,hashlib,importlib.util,json,os,re,shutil,subprocess,sys,zipfile
from pathlib import Path
SOURCE='8f283c73f52f857777306eafc88f710262367834';RUN=44597115244;GAME='ponpoko-kart';REPO=Path('/dev/shm/puretv-submit');DOCS=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
def record(p):return {'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}
def load(p):return json.loads(p.read_text())
def main():
 p=argparse.ArgumentParser();p.add_argument('--directory',type=Path,required=True);p.add_argument('--export-commit',required=True);a=p.parse_args();root=a.directory.resolve();assert re.fullmatch('[a-f0-9]{40}',a.export_commit)
 manifest=load(root/'export-manifest.json');assert manifest['sourceSha']==SOURCE and str(manifest['runId'])==str(RUN) and str(manifest['runAttempt'])=='1' and manifest['games']==[GAME]
 for name,want in manifest['files'].items():
  path=Path(name);assert not path.is_absolute() and '..' not in path.parts and '\\' not in name
  f=root/path;assert f.is_file() and not f.is_symlink();assert record(f)==want,name
 receipt=load(root/'packages'/GAME/'signing-receipt.json');assert receipt['sourceSha']==SOURCE and str(receipt['runId'])==str(RUN)
 frozen=root/'artifact-source';sources=receipt['sourceInputs'];queries=[]
 for name,want in sources.items():assert record(frozen/name)==want,name;queries.append(SOURCE+':'+name)
 raw=subprocess.check_output(['git','cat-file','--batch'],cwd=REPO,input=('\n'.join(queries)+'\n').encode());offset=0
 for name,want in sources.items():
  end=raw.index(b'\n',offset);header=raw[offset:end].split();assert len(header)==3 and header[1]==b'blob',name;size=int(header[2]);b=raw[end+1:end+1+size];assert {'bytes':size,'sha256':sha(b)}==want,name;offset=end+1+size+1
 assert offset==len(raw)
 spec=importlib.util.spec_from_file_location('frozen_android_build',frozen/'joystick-games/tools/android-build.py');build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build);expected=build.payload(GAME)
 apk=root/'packages'/GAME/f'{GAME}-{receipt["versionName"]}.apk';assert record(apk)=={k:receipt[k] for k in ['bytes','sha256']}
 with zipfile.ZipFile(apk) as z:
  assert z.testzip() is None and len(z.namelist())==len(set(z.namelist()));actual={n[7:]:z.read(n) for n in z.namelist() if n.startswith('assets/') and not n.endswith('/')}
 assert actual==expected,'APK assets differ from exact frozen source'
 tools=Path('/workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0');jdk=Path('/workspace/scratch/game-polish-toolchain/jdk-17.0.21+9');env={**os.environ,'JAVA_HOME':str(jdk),'PATH':str(jdk/'bin')+os.pathsep+os.environ['PATH']}
 verify=subprocess.run([str(tools/'apksigner'),'verify','--verbose','--print-certs',str(apk)],capture_output=True,text=True,env=env);assert verify.returncode==0,verify.stderr;cert=re.search(r'Signer #1 certificate SHA-256 digest: (\S+)',verify.stdout)[1].lower();pin=subprocess.check_output(['git','show',SOURCE+':tools/puretv-release-certificate-v2.sha256'],cwd=REPO,text=True).strip();assert cert==pin==receipt['certificateSha256']
 badging=subprocess.check_output([str(tools/'aapt'),'dump','badging',str(apk)],text=True,env=env);identity=re.search(r"package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'",badging);assert identity and identity[1]==receipt['packageName'] and int(identity[2])==receipt['versionCode'] and identity[3]==receipt['versionName']
 (DOCS/'apksigner-verification.txt').write_text(verify.stdout+verify.stderr);(DOCS/'apk-badging.txt').write_text(badging)
 runtime=[];reports=root/'reports'
 for f in sorted(reports.glob('joystick-android-report-runtime-ponpoko-kart/**/report.json')):
  d=load(f);runtime.append({'path':f.relative_to(root).as_posix(),'status':d.get('status'),'game':d.get('game'),'sourceCommit':d.get('sourceCommit'),'modelWrites':d.get('modelWrites'),'clockOverrides':d.get('clockOverrides'),'defaultPortOccupiedFixture':d.get('defaultPortOccupiedFixture'),'errors':d.get('errors'),'checks':d.get('checks')})
 # Original reports, executed QA sources and receipts remain byte-for-byte. APKs stay scratch-only.
 evidence=DOCS/'original-evidence';assert not evidence.exists(),'Never overwrite a prior export audit';evidence.mkdir()
 for base in ['reports','packages','observers']:
  for f in sorted((root/base).rglob('*')):
   if f.is_file() and f.suffix.lower()!='.apk':target=evidence/f.relative_to(root);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(f,target)
 for name in ['export-manifest.json','runtime-verification.json']:shutil.copyfile(root/name,evidence/name)
 report={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceSha':SOURCE,'runId':RUN,'runAttempt':1,'exportCommit':a.export_commit,'exportedFilesVerified':len(manifest['files']),'sourceFilesComparedToGit':len(sources),'apk':{k:receipt[k] for k in ['packageName','versionName','versionCode','bytes','sha256','certificateSha256']},'apkLocalPath':str(apk),'apkKeptInScratchOnly':True,'assetCount':len(expected),'allAssetsEqualExactFrozenSource':True,'certificateIndependentlyVerified':True,'exportInstallPackagesValidated':manifest['installPackagesValidated'],'runtimeResult':manifest['runtimeResult'],'runtimeReports':runtime,'runtimeVerification':load(root/'runtime-verification.json'),'physicalTvTested':False,'physicalEsp32Tested':False,'scriptSha256':sha(Path(__file__).read_bytes())};(DOCS/'independent-verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['exportedFilesVerified','sourceFilesComparedToGit','apk','assetCount','exportInstallPackagesValidated','runtimeResult']}))
if __name__=='__main__':main()

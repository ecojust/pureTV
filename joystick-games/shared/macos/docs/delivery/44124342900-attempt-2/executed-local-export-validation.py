#!/usr/bin/env python3
import argparse,hashlib,importlib.util,json,struct,subprocess,zipfile
from pathlib import Path
REPO=Path('/dev/shm/puretv-joystick-games')
SOURCE='8d6475980ce2312df8839a38dd724794eb59b83b'
QA='09a656e35b30a81e9662791d774a4b60bc5d6445'
QA_SOURCES={'cf-transport-ship':QA,'qq-speed':'6da4d967d41fb0b365b563777d6ada9e8c079fe2'}
p=argparse.ArgumentParser();p.add_argument('export',type=Path);args=p.parse_args();root=args.export.resolve()
def sha(data):return hashlib.sha256(data).hexdigest()
def original(commit,name):return subprocess.check_output(['git','-C',str(REPO),'show',commit+':'+name])
def check(item,data,label):assert len(data)==item['bytes'] and sha(data)==item['sha256'],label
manifest=json.loads((root/'export-manifest.json').read_text());assert manifest['artifactSourceCommit']==SOURCE and manifest['workflowSourceCommit']==QA and manifest['qaSourceCommits']==QA_SOURCES and manifest['artifactRunId']==44115155028 and manifest['installPackagesValidated'] is True
for name,item in manifest['files'].items():
 path=root/name;assert path.is_relative_to(root) and not path.is_symlink();check(item,path.read_bytes(),name)
actual={p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file() and '.git' not in p.relative_to(root).parts and p.name!='export-manifest.json'};assert actual==set(manifest['files'])
spec=importlib.util.spec_from_file_location('qa',REPO/'joystick-games/tools/macos-verify.py');qa=importlib.util.module_from_spec(spec);spec.loader.exec_module(qa)
assert sha(original(QA,'joystick-games/tools/macos-verify.py'))==sha((REPO/'joystick-games/tools/macos-verify.py').read_bytes())
summary={}
for game in ['cf-transport-ship','qq-speed']:
 expected_qa=QA_SOURCES[game]
 package=root/'packages'/('joystick-macos-package-'+game);meta=json.loads((package/'build-manifest.json').read_text());assert meta['sourceCommit']==SOURCE and meta['game']==game and meta['committedInputsVerified'] is True
 for name,item in meta['inputFiles'].items():check(item,original(SOURCE,name),'frozen input '+name)
 for name,item in meta['packages'].items():check(item,(package/name).read_bytes(),'package '+name)
 binary_files=[n for n in meta['appFiles'] if n.startswith('Contents/MacOS/')];assert len(binary_files)==1;binary_path=binary_files[0];binary_sha=meta['appFiles'][binary_path]['sha256']
 with zipfile.ZipFile(next(package/n for n in meta['packages'] if n.endswith('.zip'))) as archive:
  for name,item in meta['appFiles'].items():check(item,archive.read(meta['appName']+'/'+name),'zip app '+name)
  binary=archive.read(meta['appName']+'/'+binary_path);magic,count=struct.unpack('>II',binary[:8]);assert magic==0xcafebabe and count==2
  assert {struct.unpack('>I',binary[8+i*20:12+i*20])[0] for i in range(count)}=={0x100000c,0x1000007}
 evidence={}
 for platform in ['macos-latest','macos-15-intel']:
  folder=root/'evidence'/('joystick-macos-qa-'+game+'-'+platform);package_check=json.loads((folder/'package-verification.json').read_text());assert package_check['status']=='passed' and package_check['artifactSourceCommit']==SOURCE and package_check['qaSourceCommit']==expected_qa and package_check['artifactRunId']==44115155028
  for mode in (['native','occupied-port','rosetta'] if platform=='macos-latest' else ['native']):
   here=folder/mode;report=json.loads((here/'report.json').read_text());assert report['qaSourceCommit']==expected_qa and report['artifactSourceCommit']==SOURCE and report['binarySha256']==binary_sha
   assert report['status']=='passed' or (platform=='macos-15-intel' and report['status']=='limited_graphics')
   classification=qa.initialization(report['initialization']['observedGame'],report.get('webglProbe'));assert classification==report['initialization']['classification']
   assert classification=='ready' if report['status']=='passed' else classification in ['webgl_unavailable','webgl_incomplete']
   assert report['nativeProcessArchitecture']==('x86_64' if platform=='macos-15-intel' or mode=='rosetta' else 'arm64')
   assert all(test['status']=='passed' for test in report['tests'])
   sent=[(r['connection'],r['message']['seq']) for r in report['wire'] if r['direction']=='sdk-to-game'];acks=[(r['connection'],r['message']['seq']) for r in report['wire'] if r['direction']=='game-to-sdk' and r['message'].get('type')=='ack'];assert len(sent)==len(set(sent))==len(acks)==len(set(acks)) and set(sent)==set(acks)
   assert sha((here/'executed-macos-verify.py').read_bytes())==sha(original(expected_qa,'joystick-games/tools/macos-verify.py'))
   assert sha((here/'executed-webgl-probe.swift').read_bytes())==sha(original(expected_qa,'joystick-games/shared/macos/tools/webgl-probe.swift'))
   for screenshot in report['screenshots']:check(screenshot,(here/screenshot['path']).read_bytes(),'screenshot '+screenshot['path'])
   evidence[platform+'/'+mode]={'status':report['status'],'classification':classification,'architecture':report['nativeProcessArchitecture'],'messages':len(sent),'screenshots':len(report['screenshots'])}
 summary[game]={'packages':meta['packages'],'inputsVerified':len(meta['inputFiles']),'appFilesVerified':len(meta['appFiles']),'evidence':evidence}
print(json.dumps(summary,ensure_ascii=False,indent=2))
(root.parent/'local-export-validation.json').write_text(json.dumps({'artifactSourceCommit':SOURCE,'qaSourceCommits':QA_SOURCES,'status':'passed-byte-and-report-validation','visualInspectionRequiredSeparately':True,'games':summary},ensure_ascii=False,indent=2)+'\n')

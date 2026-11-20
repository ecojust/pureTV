import hashlib,importlib.util,json,plistlib,stat,struct,subprocess,zipfile
from pathlib import Path,PurePosixPath
run=44605769518;source='ed27d8e4cd5fadc037dac718afb958f1727f63fe';root=Path('/dev/shm/puretv-submit');base=Path('/dev/shm/racing-native-readiness')/f'macos-{run}-export';out=root/'docs/racing-nine/native-readiness'/f'ci-{run}-attempt-1'
def rec(data):return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
manifest=json.loads((base/'export-manifest.json').read_text());plan=json.loads((base/'provenance/plan.json').read_text());registry=json.loads((base/'provenance/catalog-registry.json').read_text());published=json.loads((base/'coverage-report.json').read_text());assert manifest['sourceCommit']==plan['sourceCommit']==source and manifest['runId']==plan['runId']==run
spec=importlib.util.spec_from_file_location('frozencoverage',base/'provenance/executed-macos-coverage.py');coverage=importlib.util.module_from_spec(spec);spec.loader.exec_module(coverage);assert rec((base/'provenance/executed-macos-coverage.py').read_bytes())==plan['inputFiles']['joystick-games/tools/macos-coverage.py']
inputs=dict(plan['inputFiles']);result={};metas={}
for game in plan['games']:
 folder=base/'packages/joystick-catalog-macos-packages-racing-02'/game;meta=json.loads((folder/'build-manifest.json').read_text());metas[game]=meta
 for name,record in meta['inputFiles'].items():
  if name in inputs:assert inputs[name]==record
  inputs[name]=record
 assert meta['sourceCommit']==source and meta['committedInputsVerified'] is True
 value=coverage.assess_game(game,meta,plan,registry['games'][game],base/'evidence/joystick-catalog-macos-qa-racing-02-macos-latest',base/'evidence/joystick-catalog-macos-qa-racing-02-macos-15-intel');assert value==published['games'][game]==manifest['verificationCoverage'][game]
 for filename,record in meta['packages'].items():assert rec((folder/filename).read_bytes())==record
 appfiles={};prefix=meta['appName']+'/'
 with zipfile.ZipFile(next(folder.glob('*.zip'))) as z:
  names=set()
  for info in z.infolist():
   assert info.filename not in names;names.add(info.filename)
   assert info.filename.startswith(prefix) and '..' not in PurePosixPath(info.filename).parts
   assert not stat.S_ISLNK(info.external_attr>>16)
   if not info.is_dir():appfiles[info.filename[len(prefix):]]=rec(z.read(info))
  assert appfiles==meta['appFiles']
  info=plistlib.loads(z.read(prefix+'Contents/Info.plist'));assert info['CFBundleIdentifier']==meta['bundleIdentifier']
  exe=z.read(prefix+'Contents/MacOS/'+info['CFBundleExecutable']);magic,count=struct.unpack('>II',exe[:8]);assert magic==0xcafebabe;architectures=[]
  for index in range(count):
   cputype,subtype,offset,size,alignment=struct.unpack('>IIIII',exe[8+index*20:28+index*20]);assert offset+size<=len(exe);architectures.append({0x1000007:'x86_64',0x100000c:'arm64'}[cputype])
  assert set(architectures)=={'arm64','x86_64'}
  web={k.removeprefix('Contents/Resources/Web/'):v for k,v in appfiles.items() if k.startswith('Contents/Resources/Web/')};assert web==meta['webFiles']
  for name,record in web.items():
   gamepath='joystick-games/'+game+'/dist/'+name
   if gamepath in inputs:assert inputs[gamepath]==record
 result[game]={'packages':meta['packages'],'universalArchitecturesParsedFromActualMachO':architectures,'actualZipAppFilesVerified':len(appfiles),'actualZipWebFilesVerified':len(web),'coverageRecomputedUsingOriginalExecutedSource':True,'overallGameplayVerification':value['overallGameplayVerification'],'deliveryEligibility':value['deliveryEligibility'],'actualCodesignAndDmgValidation':'Original macOS package-check reports; Linux did not rerun codesign or mount DMG','binarySha256':rec(exe)['sha256']}
proc=subprocess.Popen(['git','cat-file','--batch'],cwd=root,stdin=subprocess.PIPE,stdout=subprocess.PIPE)
try:
 for name,expected in inputs.items():
  assert '\n' not in name;proc.stdin.write((source+':'+name+'\n').encode());proc.stdin.flush();head=proc.stdout.readline().decode().split();assert len(head)==3 and head[1]=='blob',name;size=int(head[2]);data=proc.stdout.read(size);assert proc.stdout.read(1)==b'\n';assert rec(data)==expected,name
finally:proc.stdin.close();proc.wait()
result={'runId':run,'runAttempt':1,'sourceCommit':source,'exportCommit':'df1b33d5a8c2c107396f654818600b93d68bb112','uniqueSourceInputFilesVerifiedAgainstFrozenGit':len(inputs),'allOriginalExportBytesVerified':True,'games':result,'originalReportsModified':False,'nativeGamesRerun':False,'visualReviewPerformedByThisScript':False,'physicalControllerTested':False,'appleNotarized':False}
(out/'production-export-audit.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))

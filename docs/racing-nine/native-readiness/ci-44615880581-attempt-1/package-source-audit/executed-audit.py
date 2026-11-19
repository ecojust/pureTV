from pathlib import Path,PurePosixPath
import hashlib,importlib.util,json,os,plistlib,stat,struct,subprocess,zipfile
r=Path('/dev/shm/puretv-submit');source='6c7cb4fdb99dce236b634c842326bae6aed5f232';games=['turbo-kart-rush','kart-royale'];packages=Path('/dev/shm/root-mac03-v3-transfer/packages');out=r/'docs/racing-nine/native-readiness/ci-44615880581-attempt-1/package-source-audit';out.mkdir(exist_ok=False);view=Path('/dev/shm/racing-native-readiness/mac03-v3-git-path-view');view.mkdir(exist_ok=False)
def rec(data):return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def file_rec(p):
 assert p.is_file() and not p.is_symlink();h=hashlib.sha256();size=0
 with p.open('rb') as f:
  while part:=f.read(65536):h.update(part);size+=len(part)
 return {'bytes':size,'sha256':h.hexdigest()}
def rel_safe(n):
 p=PurePosixPath(n);assert n and not p.is_absolute() and str(p)==n and not any(v in ['.','..',''] for v in n.split('/')) and '\\' not in n;return p
raw=subprocess.check_output(['git','ls-tree','-rz','--full-tree',source],cwd=r);tree={}
for entry in raw.split(b'\0'):
 if not entry:continue
 meta,name=entry.split(b'\t',1);mode,kind,blob=meta.decode().split();tree[name.decode()]={'mode':mode,'kind':kind,'blob':blob}
process=subprocess.Popen(['git','cat-file','--batch'],cwd=r,env=dict(os.environ,GIT_NO_LAZY_FETCH='1'),stdin=subprocess.PIPE,stdout=subprocess.PIPE);git_records={}
def blob_bytes(name):
 obj=tree[name];assert obj['kind']=='blob' and obj['mode'] in ['100644','100755'],name
 process.stdin.write((obj['blob']+'\n').encode());process.stdin.flush();header=process.stdout.readline().decode().split();assert len(header)==3 and header[0]==obj['blob'] and header[1]=='blob',('Missing exact requested Git blob',name,header)
 data=process.stdout.read(int(header[2]));assert len(data)==int(header[2]) and process.stdout.read(1)==b'\n';assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==obj['blob'];return data
# A path-only view reproduces every candidate directory and file at the original
# Git tree. The frozen builder performs collection unchanged; its byte-reading
# callback reads and hashes those exact Git blobs, never placeholder contents.
for name,obj in tree.items():
 relevant=(name.startswith('joystick-games/shared/') or any(name.startswith('joystick-games/'+g+'/') for g in games) or (name.startswith('joystick-games/tools/macos-') and '/' not in name[len('joystick-games/tools/'):]) or name.startswith('joystick-games/tools/fixtures/audio/') or name in ['joystick-games/tools/asset-policy.py','joystick-games/tools/qa-plan.py','joystick-games/catalog-registry.json','puretv-joystick/joystick_sdk.py','.github/workflows/joystick-games-macos.yml'] or name.startswith('.github/workflows/joystick-catalog-macos'))
 if relevant and obj['kind']=='blob':
  rel_safe(name);p=view/name;p.parent.mkdir(parents=True,exist_ok=True)
  if obj['mode']=='120000':p.symlink_to('/__unused_original_git_symlink__')
  else:p.touch()
for name in ['joystick-games/tools/macos-build.py','joystick-games/tools/asset-policy.py','joystick-games/catalog-registry.json']:
 data=blob_bytes(name);(view/name).write_bytes(data);p=out/'executed-source'/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
spec=importlib.util.spec_from_file_location('original_mac_builder',view/'joystick-games/tools/macos-build.py');builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
def exact_git_record(p):
 name=p.relative_to(view).as_posix();assert name in tree
 if name not in git_records:git_records[name]=rec(blob_bytes(name))
 return git_records[name]
builder.regular_input=exact_git_record
records=[]
try:
 for game in games:
  folder=packages/game;meta_path=folder/'build-manifest.json';meta=json.loads(meta_path.read_text());assert meta['sourceCommit']==source and meta['game']==game and meta['committedInputsVerified'] is True
  original_inputs=builder.inputs(view/'joystick-games'/game);assert original_inputs==meta['inputFiles'],'Complete original input inventory differs for '+game
  gmeta=json.loads(blob_bytes('joystick-games/'+game+'/game.json'));registry=json.loads(blob_bytes('joystick-games/catalog-registry.json'))['games'][game];name,exe,initials=builder.game_identity(game,gmeta);assert meta['appName']==name+'.app' and meta['bundleIdentifier']==gmeta['packageName']==registry['packageName']
  pkg={n:file_rec(folder/n) for n in meta['packages']};assert pkg==meta['packages'];assert (folder/'SHA256SUMS.txt').read_text()==''.join(v['sha256']+'  '+n+'\n' for n,v in sorted(pkg.items()))
  (out/(game+'-original-build-manifest.json')).hardlink_to(meta_path)
  zipname=next(n for n in pkg if n.endswith('.zip'));prefix=meta['appName']+'/';actual={};seen=set()
  with zipfile.ZipFile(folder/zipname) as z:
   for item in z.infolist():
    rel_safe(item.filename.rstrip('/'));assert item.filename.startswith(prefix) and item.filename not in seen and not stat.S_ISLNK(item.external_attr>>16) and not item.flag_bits&1;seen.add(item.filename)
    if item.is_dir():continue
    h=hashlib.sha256();size=0
    with z.open(item) as f:
     while part:=f.read(65536):h.update(part);size+=len(part)
    assert size==item.file_size;actual[item.filename[len(prefix):]]={'bytes':size,'sha256':h.hexdigest()}
   assert actual==meta['appFiles'];web={n[len('Contents/Resources/Web/'):]:v for n,v in actual.items() if n.startswith('Contents/Resources/Web/')};assert web==meta['webFiles']
   for n,expected in web.items():
    if n=='bridge.js':assert expected==rec(blob_bytes('joystick-games/shared/macos/Web/bridge.js'))
    elif n=='game-config.json':assert z.read(prefix+'Contents/Resources/Web/'+n)==(json.dumps(gmeta,ensure_ascii=False)+'\n').encode()
    else:assert expected==original_inputs['joystick-games/'+game+'/dist/'+n]
   dist={n[len('joystick-games/'+game+'/dist/'):] for n in original_inputs if n.startswith('joystick-games/'+game+'/dist/')};assert set(web)==dist|{'bridge.js','game-config.json'}
   info=plistlib.loads(z.read(prefix+'Contents/Info.plist'));assert info['CFBundleIdentifier']==meta['bundleIdentifier'] and info['CFBundleExecutable']==exe and info['CFBundleShortVersionString']==gmeta['version'] and info['CFBundleVersion']==str(gmeta['versionCode']) and info['LSMinimumSystemVersion']=='11.0';assert info.get('PureTVStorageKeys')==builder.storage_keys(game,gmeta) and info.get('PureTVAssetPolicy')==gmeta.get('assetPolicy')
   binary=z.read(prefix+'Contents/MacOS/'+exe);magic,count=struct.unpack('>II',binary[:8]);assert magic==0xcafebabe and count==2;archs=[];spans=[]
   for i in range(count):
    cpu,subtype,offset,size,alignment=struct.unpack('>IIIII',binary[8+20*i:28+20*i]);assert offset>=8+20*count and offset+size<=len(binary) and alignment<=30 and offset%(1<<alignment)==0
    thin_magic,thin_cpu=struct.unpack('<II',binary[offset:offset+8]);assert thin_magic==0xfeedfacf and thin_cpu==cpu;archs.append({0x1000007:'x86_64',0x100000c:'arm64'}[cpu]);spans.append((offset,offset+size))
   assert set(archs)=={'arm64','x86_64'} and max(spans[0][0],spans[1][0])>=min(spans[0][1],spans[1][1])
   oldreport=r/f'docs/racing-nine/native-readiness/ci-44615880581-attempt-1/original-arm-export/artifact/{game}/native/report.json';old=json.loads(oldreport.read_text());assert old['artifactSourceCommit']==source and old['binarySha256']==rec(binary)['sha256'] and old['status']=='passed'
  records.append({'game':game,'sourceCommit':source,'originalRun':44615880581,'originalBuildManifest':{'path':str(meta_path),**file_rec(meta_path)},'packages':{n:{'path':str(folder/n),**v} for n,v in pkg.items()},'completeInputInventoryRebuiltByOriginalBuilder':True,'inputFiles':len(original_inputs),'inputBytes':sum(v['bytes'] for v in original_inputs.values()),'originalInputRecords':original_inputs,'zipAppFiles':len(actual),'zipWebFiles':len(web),'exactOriginalDistFiles':len(dist),'machOArchitectures':archs,'actualBinarySha256':rec(binary)['sha256'],'originalPassedNativeReportBinaryMatched':True,'originalPassedNativeReport':{'path':str(oldreport.relative_to(r)),**file_rec(oldreport)},'storageKeyCount':len(info.get('PureTVStorageKeys',[])),'packageFilesModifiedOrCopied':False,'deliveryEligibility':'not_assessed_here_root_owns_delivery_decision','appleCodeSignatureReverifiedOnLinux':False,'dmgMountedOnLinux':False})
finally:process.stdin.close();process.wait()
result={'sourceCommit':source,'originalRun':44615880581,'scope':'Exact original frozen builder inputs() executed against a path-only view of the original Git tree; only regular_input is replaced by an authoritative exact-Git-blob byte/hash reader. No production code/package or original result changed. ZIP complete paths and all app/web bytes, exact original dist closure and both actual Mach-O slices are verified. This is not native gameplay, codesign or DMG mount verification.','uniqueGitBlobInputsVerified':len(git_records),'games':records,'newNativeRuntimePassed':True};(out/'audit.json').write_text(json.dumps(result,indent=2)+'\n');(out/'executed-audit.py').write_bytes(Path(__file__).read_bytes());files={p.relative_to(r).as_posix():file_rec(p) for p in out.rglob('*') if p.is_file()};(out.parent/'package-source-audit-manifest.json').write_text(json.dumps({'fileCount':len(files),'totalBytes':sum(v['bytes'] for v in files.values()),'files':files},indent=2)+'\n');print(json.dumps({'uniqueSources':len(git_records),'games':[{k:g[k] for k in ['game','inputFiles','zipAppFiles','zipWebFiles','exactOriginalDistFiles','machOArchitectures','storageKeyCount','deliveryEligibility']}for g in records],'evidenceFiles':len(files),'evidenceBytes':sum(v['bytes'] for v in files.values())},indent=2))

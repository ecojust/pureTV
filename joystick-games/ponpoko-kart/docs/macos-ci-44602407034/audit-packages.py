#!/usr/bin/env python3
"""Read exact original packages and frozen inputs; never rebuild/sign/install."""
import hashlib,importlib.util,json,plistlib,stat,struct,subprocess,zipfile
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
SOURCE='ea7854ca06ed53967aed00fe160034185f2906b3';GAME='ponpoko-kart';PREFIX='joystick-games/'+GAME+'/'
PACKAGES=Path('/dev/shm/racing-mac01-package-review')/GAME;FROZEN=Path('/dev/shm/racing-review-rally/pon-mac-frozen-ea7854ca')
assert not FROZEN.is_symlink();FROZEN.mkdir(exist_ok=True)
def rec(data):return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
meta=json.loads((PACKAGES/'build-manifest.json').read_text());assert meta['sourceCommit']==SOURCE and meta['game']==GAME and meta['committedInputsVerified'] is True
entries={}
for row in subprocess.check_output(['git','-C',str(ROOT),'ls-tree','-rz',SOURCE]).split(b'\0'):
 if not row:continue
 head,path=row.split(b'\t',1);mode,kind,oid=head.decode().split();entries[path.decode()]={'mode':mode,'kind':kind,'oid':oid}
def selected(name):
 parts=PurePosixPath(name).parts
 if '__pycache__' in parts:return False
 if name.startswith('joystick-games/shared/') and len(parts)>3:return parts[2]!='android'
 if name.startswith(PREFIX):
  local=name[len(PREFIX):].split('/')
  return (len(local)==1 and local[0]!='node_modules') or local[0] in ['src','dist','tests','test','qa']
 if name.startswith('joystick-games/tools/fixtures/audio/'):return True
 if name.startswith('joystick-games/tools/macos-') and len(parts)==3:return True
 if name.startswith('.github/workflows/joystick-catalog-macos') and name.endswith('.yml') and len(parts)==3:return True
 return name in ['.github/workflows/joystick-games-macos.yml','joystick-games/tools/asset-policy.py','joystick-games/catalog-registry.json','joystick-games/tools/qa-plan.py','puretv-joystick/joystick_sdk.py']
names=sorted(name for name in entries if selected(name))
assert set(names)==set(meta['inputFiles']),'Frozen Git input inventory differs from original manifest'
raw=subprocess.check_output(['git','-C',str(ROOT),'cat-file','--batch'],input=''.join(SOURCE+':'+name+'\n' for name in names).encode())
offset=0;records={}
for name in names:
 end=raw.index(b'\n',offset);oid,kind,size=raw[offset:end].decode().split();size=int(size);offset=end+1;data=raw[offset:offset+size];offset+=size
 assert raw[offset:offset+1]==b'\n';offset+=1
 assert kind=='blob' and entries[name]['kind']=='blob' and entries[name]['mode'] in ['100644','100755']
 assert oid==entries[name]['oid']==hashlib.sha1(b'blob '+str(size).encode()+b'\0'+data).hexdigest() and rec(data)==meta['inputFiles'][name]
 target=FROZEN/name;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists():assert target.is_file() and not target.is_symlink() and target.read_bytes()==data
 else:target.write_bytes(data)
 records[name]={**rec(data),'gitBlob':oid}
assert offset==len(raw)
spec=importlib.util.spec_from_file_location('original_macos_builder',FROZEN/'joystick-games/tools/macos-build.py');builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
assert builder.inputs(FROZEN/'joystick-games'/GAME)==meta['inputFiles'],'Actual frozen builder inventory differs'
# This Linux audit retains the original macOS codesign/lipo/DMG-install evidence;
# it does not simulate those commands or claim a new native installation.
package_records={}
for name,expected in meta['packages'].items():
 data=(PACKAGES/name).read_bytes();assert rec(data)==expected;package_records[name]=rec(data)
assert (PACKAGES/'SHA256SUMS.txt').read_text()==''.join(record['sha256']+'  '+name+'\n' for name,record in sorted(meta['packages'].items()))
zip_path=next(PACKAGES/name for name in meta['packages'] if name.endswith('.zip'));app=meta['appName']+'/'
actual={};raw_files={};seen=set();auxiliary=[]
with zipfile.ZipFile(zip_path) as z:
 for item in z.infolist():
  name=item.filename;p=PurePosixPath(name)
  assert not name.startswith('/') and '..' not in p.parts and '\\' not in name and name not in seen and not item.flag_bits&1;seen.add(name)
  mode=item.external_attr>>16;assert not stat.S_ISLNK(mode)
  if item.is_dir():continue
  assert name.startswith(app),'Unexpected ZIP file: '+name
  relative=name[len(app):];assert relative and relative==PurePosixPath(relative).as_posix()
  data=z.read(item);actual[relative]=rec(data);raw_files[relative]=data
assert actual==meta['appFiles'],'Complete ZIP app file set differs'
info=plistlib.loads(raw_files['Contents/Info.plist'])
assert info['CFBundleIdentifier']==meta['bundleIdentifier'] and info['CFBundleVersion']==meta['buildVersion'] and info['CFBundleShortVersionString']==meta['version'] and info['CFBundleName']+'.app'==meta['appName']
binary=raw_files['Contents/MacOS/'+info['CFBundleExecutable']];magic,count=struct.unpack('>II',binary[:8]);assert magic==0xcafebabe and count==2
architectures=[struct.unpack('>IIIII',binary[8+i*20:28+i*20])[0] for i in range(count)];assert set(architectures)=={0x01000007,0x0100000c}
web={name[len('Contents/Resources/Web/'):]:record for name,record in actual.items() if name.startswith('Contents/Resources/Web/')};assert web==meta['webFiles']
for name,expected in meta['inputFiles'].items():
 if name.startswith(PREFIX+'dist/'):
  assert web[name[len(PREFIX+'dist/'):]]==expected
assert web['bridge.js']==meta['inputFiles']['joystick-games/shared/macos/Web/bridge.js']
config=json.loads(raw_files['Contents/Resources/Web/game-config.json']);assert config['id']==GAME and config['packageName']==meta['bundleIdentifier']
result={'sourceCommit':SOURCE,'packageRecords':package_records,'sha256SumsExact':True,'frozenInputCount':len(records),'frozenInputBytes':sum(v['bytes'] for v in records.values()),'frozenGitInventoryExact':True,'actualFrozenBuilderInputsExact':True,'completeZipAppFileSetVerified':True,'zipAppFiles':actual,'zipBinaryArchitectures':['arm64','x86_64'],'webFilesExact':True,'newDmgMountOrCodeSigningVerificationPerformed':False,'originalMacNativePackageEvidenceRequired':True,'originalPackageBytesChanged':False}
(OUT/'package-audit.json').write_text(json.dumps(result,indent=2)+'\n');(OUT/'frozen-input-verification.json').write_text(json.dumps({'sourceCommit':SOURCE,'files':records},indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='zipAppFiles'}))

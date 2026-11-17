"""Shared read-only gates for two configured Game Kit patch releases."""
import hashlib,json,pathlib,re,struct,subprocess,zipfile
from win_audit import audit as audit_recorded_wins

def require(ok,message):
 if not ok:raise ValueError(message)
def read(path):return json.loads(path.read_text())
def sha(raw):return hashlib.sha256(raw).hexdigest()
def digest(path):
 with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()
def safe(base,rel):
 p=base/rel;require(p.resolve().is_relative_to(base.resolve()),'Path leaves expected directory: '+str(rel));return p

def config(path,slug,require_source=True):
 c=read(path);require(slug in c['games'],'Unknown configured game');require(c['version']=='0.2.1' and c['previousVersion']=='0.2.0','Unexpected patch versions');require(c['levelCount']==6 and c['newLevels']==0,'Patch must preserve six levels without counting new levels')
 c={**c,'repo':pathlib.Path(c['repo']).resolve(),'root':pathlib.Path(c['root']).resolve(),'slug':slug,'game':c['games'][slug]}
 if require_source:require(re.fullmatch('[a-f0-9]{40}',c.get('sourceCommit') or '') is not None,'Fill exact frozen sourceCommit in release-config.json first')
 require(re.fullmatch('[a-f0-9]{40}',c['previousReleaseCommit']) is not None,'Previous release Git commit is required');return c

def gitbytes(c,commit,rel):return subprocess.check_output(['git','show',commit+':'+rel],cwd=c['repo'])
def metadata(c):return json.loads(gitbytes(c,c['sourceCommit'],f"resource/apps/{c['slug']}/game.json"))
def same_assets(row,assets,label):require(row.get('sourceAssetHashes',row.get('assets'))==assets,label+' asset hashes differ')
def physical_false(row,label):require(row.get('physicalTvTested') is False and row.get('physicalPhoneTested') is False,label+' must preserve false physical device flags')
def write_report(path,result,repo):
 require(not path.resolve().is_relative_to(repo),'Audit report must stay outside repository');raw=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
 if path.exists():require(path.read_text()==raw,'Existing report differs; choose a fresh path')
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(raw)

def verify_original_artifacts(art,qa,file_check=None):
 """Bind a combined summary to its two unchanged standard verifier reports."""
 if art.get('kind')!='combined-original-artifact-checks':
  require(not art.get('originalReports'),'Unrecognized original artifact report format');return []
 originals=art.get('originalReports');require(isinstance(originals,list) and len(originals)==2,'Combined artifacts require two original reports')
 seen_files=set();seen_objects=set()
 groups={'apk':['apkSize','apkManifest','apkSignature','apkZipIntegrity','apkAssetsMatch'],'video':['videoSize','videoFormat','videoFullDecode']}
 for item in originals:
  require(item['file'] not in seen_files,'Duplicate original artifact report');seen_files.add(item['file']);path=safe(qa,item['file'])
  if file_check:file_check(path,item['sha256'])
  else:require(path.is_file() and not path.is_symlink() and digest(path)==item['sha256'],'Original artifact report changed')
  original=read(path);kinds=[key for key in groups if key in original];require(len(kinds)==1,'Expected one APK report and one video report');kind=kinds[0];require(kind not in seen_objects,'Duplicate original artifact object');seen_objects.add(kind)
  require(original[kind]==art[kind],'Combined artifact object differs from its original '+kind+' report')
  require(all(original['checks'].get(key) is True and art['checks'].get(key) is True for key in groups[kind]),'Original '+kind+' verification is incomplete')
 require(seen_objects=={'apk','video'},'Both original APK and fully decoded video reports are required');return originals

def audit_inputs(c,browser_name='browser-01',shared_name='shared-01',recording_name='recording-01',artifacts=None,visual=None):
 slug=c['slug'];source=c['sourceCommit'];qa=c['root']/'final-qa'/slug;frozen=c['root']/c['frozenDirectory']/slug;signed=c['root']/'signed'/slug;app=c['repo']/'resource/apps'/slug
 paths={'browser':safe(qa,browser_name)/'report.json','shared':safe(qa,shared_name)/'report.json','recording':safe(qa,recording_name)/'recording.json','visual':visual or qa/'root-visual-review.json','build':frozen/'build/build-receipt.json','signing':signed/'signing-receipt.json','fetch':signed/'fetch-verification.json','artifacts':artifacts}
 require(artifacts is not None,'Provide completed APK+video artifact verification report');rows={k:read(p) for k,p in paths.items()};build=rows['build'];sign=rows['signing'];fetch=rows['fetch'];assets=build['assets'];meta=metadata(c);apk=safe(signed,sign['file']);pin=(c['repo']/'tools/puretv-release-certificate-v2.sha256').read_text().strip()
 require(meta['id']==slug and meta['version']==c['version'] and meta['versionCode']==c['game']['versionCode'],'Frozen game metadata differs from configured patch')
 for key in ['packageName','version','versionCode']:require(sign[key]==meta[key]==build[key],'Build/sign metadata differs: '+key)
 require(sign['sourceSha']==fetch['sourceSha']==source and sign['slug']==slug,'Signing source/game differs');require(sign['signatureVerified'] and sign['sourceAssetsMatchApk'] and fetch['signatureVerified'] and fetch['sourceIdentityVerified'] and fetch['assetsMatchSigningReceipt'],'Unverified signing/fetch')
 require(sign['certificateSha256']==fetch['certificateSha256']==pin,'Wrong release certificate');require(sign['sha256']==fetch['sha256']==digest(apk),'Signed APK hash differs');require(sign['bytes']==fetch['bytes']==apk.stat().st_size and 0<apk.stat().st_size<10_000_000,'Signed APK size invalid')
 require(sign['file']==fetch['apk'] and str(sign['workflowRun'])==str(fetch['runId']),'Signing/fetch file or workflow differs')
 with zipfile.ZipFile(apk) as z:
  require(z.testzip() is None and len(z.namelist())==len(set(z.namelist())),'APK ZIP integrity failed');actual={n[7:]:sha(z.read(n)) for n in z.namelist() if n.startswith('assets/') and not n.endswith('/')};bundled=json.loads(z.read('assets/game-config.json'))
 require(actual==assets==sign['assetsSha256'] and sign['checkedAssets']==len(actual),'Signed APK assets differ from build');require(bundled==meta,'Bundled game config differs from frozen source')
 require({f.relative_to(frozen/'assets').as_posix():digest(f) for f in (frozen/'assets').rglob('*') if f.is_file()}==actual,'Frozen extracted asset set differs')
 source_dirs=[f'resource/apps/{slug}/src/main/assets','resource/game-kit/web'];source_files={}
 for directory in source_dirs:
  names=subprocess.check_output(['git','ls-tree','-r','--name-only',source,'--',directory],cwd=c['repo'],text=True).splitlines()
  for rel in names:
   name=pathlib.PurePosixPath(rel).name;require(name not in source_files,'Duplicate game/shared asset name');source_files[name]=rel
 require(set(actual)-{'game-config.json','assets-index.json'}==set(source_files),'Frozen source APK asset set differs')
 for name,rel in source_files.items():require(sha(gitbytes(c,source,rel))==actual[name]==digest(c['repo']/rel),'Frozen/current source differs from APK: '+rel)
 icon_rel=f'resource/apps/{slug}/icon.xml';icon_hash=sha(gitbytes(c,source,icon_rel));require(build['gameIconSha256']==sign['nativeSourceSha256'][icon_rel]==icon_hash==digest(c['repo']/icon_rel),'Android icon source differs from frozen build/signing receipt')
 logo_rel=f'resource/apps/{slug}/logo.svg';require(sha(gitbytes(c,source,logo_rel))==digest(c['repo']/logo_rel),'Current catalog SVG differs from frozen source')
 browser=rows['browser'];shared=rows['shared'];record=rows['recording'];visualrow=rows['visual'];art=rows['artifacts'];video=paths['recording'].parent/'gameplay.mp4'
 for label,row in [('browser',browser),('shared',shared),('recording',record)]:same_assets(row,actual,label)
 require(browser.get('passed') is True and shared.get('sharedRegressionPassed') is True,'Selected browser/shared attempt has not passed')
 for label,row in [('browser',browser),('shared',shared)]:
  tests=row.get('tests',row.get('checks'));require(tests and all(t.get('passed') is True for t in tests),label+' has failed/empty tests')
 require(record.get('kind')=='normal-runtime-browser-play' and not record.get('errors') and not record.get('consoleErrors'),'Recording is not clean normal runtime play');wins=audit_recorded_wins(slug,record)
 require(record['videoSha256']==digest(video) and record['videoBytes']==video.stat().st_size and 0<video.stat().st_size<10_000_000,'Video size/hash differs')
 original_artifacts=verify_original_artifacts(art,qa)
 checks=['apkSize','apkManifest','apkSignature','apkZipIntegrity','apkAssetsMatch','videoSize','videoFormat','videoFullDecode'];require(all(art['checks'].get(k) is True for k in checks),'Missing artifact checks');require(art['apk']['sha256']==digest(apk) and art['video']['sha256']==digest(video),'Artifact report belongs to other files');require(art['apk']['signerSha256']==[pin] and art['apk']['package']==meta['packageName'] and art['apk']['versionName']==c['version'] and int(art['apk']['versionCode'])==meta['versionCode'],'Artifact identity differs')
 for label,row in [('browser',browser),('shared',shared['environment']),('recording',record),('visual',visualrow)]:physical_false(row,label)
 require(visualrow.get('accepted') is True and visualrow.get('sourceCommit')==source and visualrow.get('encodedFrames'),'Missing final visual acceptance');reviewed={};sizes=set()
 for category in ['screenshots','encodedFrames']:
  for item in visualrow[category]:
   path=safe(qa,item['file']);require(digest(path)==item['sha256'],'Reviewed image changed');reviewed[item['file']]=item['sha256']
   if category=='screenshots':
    raw=path.read_bytes();require(raw[:8]==b'\x89PNG\r\n\x1a\n','Expected PNG viewport screenshot');sizes.add(struct.unpack('>II',raw[16:24]))
 require({(960,540),(1280,720)}<=sizes,'Both viewport screenshots required');require(visualrow.get('cover') in reviewed,'Cover is not a reviewed image')
 require(record['recorderSourceSha256']==sha(gitbytes(c,source,'resource/game-kit/qa/record.mjs')),'Recorder source differs from frozen source')
 for name,value in record.get('recorderHelperSourceSha256',{}).items():require(value==sha(gitbytes(c,source,'resource/game-kit/qa/'+name)),'Recorder helper differs')
 testsource=c['game'].get('testSourceCommit') or source;provenance=[]
 for path in sorted(set(qa.glob('execution-provenance*.json'))|set(qa.rglob('source-hashes.json'))):
  row=read(path);commit=row.get('sourceCommit',row.get('sourceSha'));files=row.get('executionScriptHashes',row.get('files'))
  if not commit or not files:continue
  require(commit in {source,testsource},'Unexpected execution source commit');pairs={r['path']:r['sha256'] for r in files} if isinstance(files,list) else files
  for rel,value in pairs.items():
   require(value==sha(gitbytes(c,commit,rel)),'Execution source hash differs from Git: '+rel)
   archived=path.parent/rel
   if archived.exists():require(digest(archived)==value,'Archived execution script changed')
  provenance.append({'file':path.relative_to(qa).as_posix(),'sha256':digest(path),'sourceCommit':commit})
 require(provenance,'Missing execution provenance/source-hashes archive')
 for path in (app/'tests').rglob('*'):
  if path.is_file():require(digest(path)==sha(gitbytes(c,testsource,path.relative_to(c['repo']).as_posix())),'Current test differs from declared test commit')
 result={'passed':True,'slug':slug,'version':c['version'],'sourceSha':source,'previousReleaseCommit':c['previousReleaseCommit'],'levelCount':6,'newLevels':0,'apkSha256':digest(apk),'videoSha256':digest(video),'recordedWonLevelsZeroBased':wins['recordedWonLevelsZeroBased'],'recordedGoalAudit':wins,'assetsChecked':len(actual),'testSourceCommit':testsource,'executionProvenance':provenance,'selectedAttempts':{'browser':browser_name,'shared':shared_name,'recording':recording_name},'evidenceInputHashes':{k:digest(p) for k,p in paths.items()},'artifactOriginalReports':original_artifacts,'coverSha256':reviewed[visualrow['cover']],'physicalTvTested':False,'physicalPhoneTested':False,'note':'Read-only consistency gate over completed raw evidence. Does not replace model tests, actual artifact tooling or visual review.'}
 return result,{'paths':paths,'rows':rows,'qa':qa,'app':app,'release':app/'docs/releases'/c['version'],'apk':apk,'video':video,'cover':qa/visualrow['cover'],'assets':actual,'metadata':meta}

def archives(c):
 v=c['previousVersion'];base='resource/apps/'+c['slug']+'/'
 pairs=[(base+'resource.json',f'docs/resource-{v}.json'),(base+'docs/verification.json',f'docs/verification-{v}.json'),(base+'docs/signing-receipt.json',f'docs/signing-receipt-{v}.json'),(base+'thumb.png',f'docs/preview-{v}.png'),('docs/previews/en/app-'+c['slug']+'.png',f'docs/preview-en-catalog-{v}.png')]

 if c['game'].get('archivePriorLogo'):pairs.append((base+'logo.svg',f'docs/logo-{v}.svg'))
 return pairs

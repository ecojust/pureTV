#!/usr/bin/env python3
"""Read-only final consistency audit of both published physics patch releases.
Run after both per-game commits. Does not run the full catalog, browser or decoder.
"""
import argparse,datetime,json,pathlib,re,struct,subprocess,sys,zipfile
from urllib.parse import urlsplit,unquote
from release_lib import config,read,require,digest,sha,safe,gitbytes,archives,physical_false,verify_original_artifacts
from win_audit import audit as audit_recorded_wins
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--config',type=pathlib.Path,default=pathlib.Path(__file__).with_name('release-config.json'));p.add_argument('--output',required=True,type=pathlib.Path);a=p.parse_args();rawconfig=read(a.config);first=config(a.config,next(iter(rawconfig['games'])));repo=first['repo'];require(not a.output.resolve().is_relative_to(repo) and not a.output.exists(),'Use a fresh report path outside the repository')
tracked=set(subprocess.check_output(['git','ls-files','-z'],cwd=repo).decode().split('\0'));progress=read(repo/'resource/game-kit/progress.json');english=read(repo/'tools/resource-index.en.json');pin=(repo/'tools/puretv-release-certificate-v2.sha256').read_text().strip();result={'kind':'two-game-physics-patch-final-consistency','startedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'repositoryHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'sourceCommit':first['sourceCommit'],'version':first['version'],'checks':{},'errors':[],'physicalTvTested':False,'physicalPhoneTested':False,'limitations':['No new browser or physical-device execution. Actual APK tooling and full video decode are retained digest-bound reports.','Full resource_catalog and README index idempotence are checked separately.']}
def file_check(path,value=None):
 require(path.is_file() and not path.is_symlink() and path.relative_to(repo).as_posix() in tracked,'Missing/untracked file '+str(path))
 if value:require(digest(path)==value,'Digest differs '+str(path))
def audit_game(slug):
 c=config(a.config,slug);app=repo/'resource/apps'/slug;release=app/'docs/releases'/c['version'];qa=release/'final-qa';info=read(app/'resource.json');v=read(app/'docs/verification.json');entry=next(x for x in progress['games'] if x['id']==slug);meta=read(app/'game.json');source=c['sourceCommit'];version=c['version'];oldver=c['previousVersion']
 require(info['version']==entry['version']==v['version']==meta['version']==version and info['versionCode']==meta['versionCode']==c['game']['versionCode'],'Patch version/code differs');require(info['sourceCommit']==entry['sourceCommit']==v['sourceCommit']==source,'Published source differs');require(v['passed'] is True and entry['status']=='verified','Publication is not verified');require(entry.get('previousReleases') and entry['previousReleases'][-1]['version']==oldver,'Progress lost previous release')
 require(v['levelCount']==info['verification']['levelCount']==6 and v['newLevels']==info['verification']['newLevels']==0,'Patch changes level count')
 rows={}
 for label,row in v['evidence'].items():path=safe(app,row['file']);file_check(path,row['sha256']);rows[label]=read(path)
 for row in v['modelEvidence']:file_check(safe(app,row['file']),row['sha256'])
 require(v['modelEvidence'],'Missing new model evidence');sign=rows['signing'];fetch=rows['fetch'];build=rows['build'];record=rows['recording'];art=rows['artifacts'];visual=rows['visual'];audit=rows['publicationAudit']
 require(sign['sourceSha']==fetch['sourceSha']==source and sign['slug']==slug and sign['signatureVerified'] and fetch['signatureVerified'] and fetch['sourceIdentityVerified'],'Signing identity/verification differs');require(sign['certificateSha256']==info['certificateSha256']==fetch['certificateSha256']==pin,'Release certificate differs')
 apk=safe(app,info['apk']);file_check(apk);require(digest(apk)==info['sha256']==entry['apkSha256']==sign['sha256']==fetch['sha256']==art['apk']['sha256']==audit['apkSha256'],'Published APK hash differs');require(0<apk.stat().st_size<10_000_000 and apk.stat().st_size==info['apkBytes']==entry['apkBytes']==sign['bytes'],'APK size differs')
 with zipfile.ZipFile(apk) as z:
  require(z.testzip() is None and len(z.namelist())==len(set(z.namelist())),'APK ZIP integrity failed');assets={n[7:]:sha(z.read(n)) for n in z.namelist() if n.startswith('assets/') and not n.endswith('/')};bundled=json.loads(z.read('assets/game-config.json'))
 require(assets==build['assets']==sign['assetsSha256']==v['sourceAssetHashes'],'Production asset hashes differ');require(bundled==meta==json.loads(gitbytes(c,source,f'resource/apps/{slug}/game.json')),'Bundled game metadata differs from frozen source')
 for directory in [f'resource/apps/{slug}/src/main/assets','resource/game-kit/web']:
  for rel in subprocess.check_output(['git','ls-tree','-r','--name-only',source,'--',directory],cwd=repo,text=True).splitlines():require(sha(gitbytes(c,source,rel))==assets[pathlib.PurePosixPath(rel).name]==digest(repo/rel),'Source asset differs '+rel)
 icon_rel=f'resource/apps/{slug}/icon.xml';require(build['gameIconSha256']==sign['nativeSourceSha256'][icon_rel]==sha(gitbytes(c,source,icon_rel))==digest(repo/icon_rel),'Android icon source differs')
 logo_rel=f'resource/apps/{slug}/logo.svg';require(digest(repo/logo_rel)==sha(gitbytes(c,source,logo_rel)),'Catalog SVG differs from frozen source')
 for label in ['browser','shared','recording']:
  row=rows[label];require(row.get('sourceAssetHashes',row.get('assets'))==assets,label+' raw asset provenance differs');require(audit['evidenceInputHashes'][label]==digest(app/v['evidence'][label]['file']),label+' copied raw report differs from audited input')
 require(rows['browser']['passed'] is True and rows['shared']['sharedRegressionPassed'] is True,'Browser/shared failure');goals=audit_recorded_wins(slug,record);require(goals['recordedWonLevelsZeroBased']==list(range(6))==audit['recordedWonLevelsZeroBased'],'Six model goals not verified')
 video=safe(app,info['gameplayVideo']);file_check(video);require(digest(video)==record['videoSha256']==entry['videoSha256']==art['video']['sha256']==audit['videoSha256'],'Video hash differs');require(0<video.stat().st_size<10_000_000 and video.stat().st_size==record['videoBytes']==entry['videoBytes'],'Video size differs');require((app/info['gameplayMetadata']).read_bytes()==(app/v['evidence']['recording']['file']).read_bytes(),'Recording metadata was modified')
 originals=verify_original_artifacts(art,qa,file_check);require(originals==audit.get('artifactOriginalReports',originals),'Copied original artifact references differ from audited inputs')
 required=['apkSize','apkManifest','apkSignature','apkZipIntegrity','apkAssetsMatch','videoSize','videoFormat','videoFullDecode'];require(all(art['checks'].get(k) is True for k in required),'Missing artifact validation');require(art['apk']['signerSha256']==[pin] and art['apk']['package']==meta['packageName'] and art['apk']['versionName']==version and int(art['apk']['versionCode'])==meta['versionCode'],'Artifact package/version differs')
 testsource=c['game'].get('testSourceCommit') or source;execution=v.get('testExecution',{});proofs=audit.get('executionProvenance')
 require(execution.get('sourceCommit')==audit.get('testSourceCommit')==testsource,'Published test source differs');require(proofs and execution.get('provenance')==proofs,'Published execution provenance differs from audited inputs')
 for proof in proofs:
  path=safe(qa,proof['file']);file_check(path,proof['sha256']);manifest=read(path);commit=manifest.get('sourceCommit',manifest.get('sourceSha'));files=manifest.get('executionScriptHashes',manifest.get('files'))
  require(commit==proof['sourceCommit'] and commit in {source,testsource} and files,'Copied execution manifest has wrong source or empty files');pairs={row['path']:row['sha256'] for row in files} if isinstance(files,list) else files
  for rel,value in pairs.items():
   require(value==sha(gitbytes(c,commit,rel)),'Copied execution hash differs from Git '+rel);archived=path.parent/rel
   if archived.exists():file_check(archived,value)
 for path in (app/'tests').rglob('*'):
  if path.is_file():require(digest(path)==sha(gitbytes(c,testsource,path.relative_to(repo).as_posix())),'Current test differs from audited test source '+str(path))
 require(record.get('recorderSourceSha256')==sha(gitbytes(c,source,'resource/game-kit/qa/record.mjs')),'Copied recorder source differs')
 for name,value in record.get('recorderHelperSourceSha256',{}).items():require(value==sha(gitbytes(c,source,'resource/game-kit/qa/'+name)),'Copied recorder helper differs')
 for label,obj in [('resource',info['verification']),('verification',v['hardware']),('browser',rows['browser']),('shared',rows['shared']['environment']),('recording',record),('visual',visual)]:physical_false(obj,label)
 require(visual['accepted'] is True and visual['sourceCommit']==source and visual.get('encodedFrames'),'Missing current visual review');reviewed={};sizes=set()
 for kind in ['screenshots','encodedFrames']:
  for row in visual[kind]:
   path=safe(qa,row['file']);file_check(path,row['sha256']);reviewed[row['file']]=row['sha256']
   if kind=='screenshots':sizes.add(struct.unpack('>II',path.read_bytes()[16:24]))
 require({(960,540),(1280,720)}<=sizes and visual['cover'] in reviewed,'Visual viewports/cover incomplete');file_check(app/info['cover'],reviewed[visual['cover']]);file_check(repo/english['apps/'+slug]['cover'],reviewed[visual['cover']]);require(english['apps/'+slug]['name']==c['game']['nameEn'] and english['apps/'+slug]['description']==c['game']['descriptionEn'] and info['description']==c['game']['descriptionZh'],'Catalog translation/description differs')
 for oldpath,newpath in archives(c):file_check(app/newpath,sha(gitbytes(c,c['previousReleaseCommit'],oldpath)))
 baseline=json.loads(gitbytes(c,c['previousReleaseCommit'],f'resource/apps/{slug}/resource.json'));require(baseline['version']==oldver,'Unexpected baseline release');require(info['previousReleases'][:-1]==baseline.get('previousReleases',[]) and info['previousReleases'][-1]['version']==oldver,'Older release history was overwritten')
 base=f'resource/apps/{slug}/';oldfiles=subprocess.check_output(['git','ls-tree','-r','--name-only',c['previousReleaseCommit'],'--',base],cwd=repo,text=True).splitlines();preserved=0
 for rel in oldfiles:
  part=rel[len(base):];immutable=part.endswith(('.apk','.thumb.png')) or part.startswith('docs/releases/'+oldver+'/') or (part.startswith('docs/') and pathlib.PurePosixPath(part).suffix in {'.json','.png','.mp4'} and part not in {'docs/verification.json','docs/signing-receipt.json'})
  if immutable:file_check(repo/rel,sha(gitbytes(c,c['previousReleaseCommit'],rel)));preserved+=1
 require((release/'signing-receipt.json').read_bytes()==(app/'docs/signing-receipt.json').read_bytes(),'Current signing receipt differs');require(int(entry['signingRun'])==int(sign['workflowRun'])==int(fetch['runId']) and info['buildRun'].endswith('/'+str(sign['workflowRun'])),'Workflow identity differs')
 checks={}
 for line in (app/'SHA256SUMS.txt').read_text().splitlines():
  match=re.fullmatch(r'([a-f0-9]{64})  (.+)',line);require(match is not None,'Malformed checksum line');value,path=match.groups();require(path not in checks,'Duplicate checksum path');checks[path]=value;file_check(safe(app,path),value)
 allfiles={x.relative_to(app).as_posix() for x in app.rglob('*') if x.is_file() and x.name!='SHA256SUMS.txt'};require(set(checks)==allfiles,'Checksum does not cover every release file');file_check(app/'SHA256SUMS.txt')
 text=(app/'README.md').read_text();links=[]
 for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)',text):
  url=urlsplit(target.strip('<>'))
  if url.scheme or url.netloc or not url.path:continue
  path=(app/unquote(url.path)).resolve();require(path.is_relative_to(repo) and path.exists(),'Missing README local link '+target);links.append(url.path)
 require(all(x in links for x in [info['apk'],info['gameplayVideo'],'docs/verification.json',baseline['apk'],f'docs/verification-{oldver}.json']),'README omits current or old release links')
 return {'passed':True,'sourceCommit':source,'version':version,'levelCount':6,'newLevels':0,'assetsMatched':len(assets),'apkBytes':apk.stat().st_size,'videoBytes':video.stat().st_size,'checksummedFiles':len(checks),'oldEvidenceFilesPreserved':preserved,'previousReleaseCommit':c['previousReleaseCommit']}
for slug in rawconfig['games']:
 try:result['checks'][slug]=audit_game(slug)
 except Exception as error:result['checks'][slug]={'passed':False,'error':str(error)};result['errors'].append({'game':slug,'error':str(error)})
if progress['completed']!=100 or progress['target']!=100 or len(progress['games'])!=100:result['errors'].append({'check':'progress','error':'Completed/target/game count changed'})
result['passed']=not result['errors'];result['auditScriptSha256']=digest(pathlib.Path(__file__));result['finishedAtUtc']=datetime.datetime.now(datetime.timezone.utc).isoformat();a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':result['passed'],'errors':result['errors'],'output':str(a.output)},ensure_ascii=False,indent=2));sys.exit(0 if result['passed'] else 1)

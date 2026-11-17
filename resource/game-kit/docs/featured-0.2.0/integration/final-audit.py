#!/usr/bin/env python3
"""Read-only final integration audit; run only after all eight release commits exist.
Writes one new report outside the repository. No browser, network, APK execution,
index generation, signing, checkout or repository mutation is performed.
"""
import argparse, datetime, functools, hashlib, json, pathlib, re, struct, subprocess, sys, zipfile
from urllib.parse import unquote, urlsplit
from win_audit import audit as audit_recorded_wins
SOURCE='40a9c83627463151ef4685a5286e20e9fadd145d'
GAMES=['glass-fold','prism-relay','tension-span','conveyor-window','packing-sculptor','tower-overlap','torch-bridge','twenty-four']
REVISIONS={'glass-fold':'45615e103cdf4baea9cdb134bdeb0705c841319c','torch-bridge':'457b2069172f8b0cda3fa428ce008e61b8fcdb5f','twenty-four':'457b2069172f8b0cda3fa428ce008e61b8fcdb5f'}
def need(ok,message):
 if not ok:raise ValueError(message)
def read(path):return json.loads(path.read_text())
def sha(raw):return hashlib.sha256(raw).hexdigest()
def digest(path):
 with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()
def safe(base,relative):
 p=base/relative;need(p.resolve().is_relative_to(base.resolve()),'Escaping relative path: '+str(relative));return p

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--repo',type=pathlib.Path,default=pathlib.Path('/workspace/pureTV'));parser.add_argument('--output',required=True,type=pathlib.Path);args=parser.parse_args()
 repo=args.repo.resolve();output=args.output.resolve();need(not output.is_relative_to(repo),'Audit output must be outside the repository');need(not output.exists(),'Preserve previous reports: choose a fresh output path')
 def git(*args):return subprocess.check_output(['git',*args],cwd=repo)
 @functools.lru_cache(None)
 def gitbytes(commit,rel):return git('show',commit+':'+rel)
 def oldhash(rel):return sha(gitbytes(SOURCE,rel))
 tracked=set(git('ls-files','-z').decode().split('\0'));tracked.discard('')
 def tracked_file(path):
  need(path.is_file() and not path.is_symlink(),'Missing/irregular file: '+str(path));need(path.relative_to(repo).as_posix() in tracked,'Untracked file: '+str(path))
 def checked(path,expected):tracked_file(path);need(digest(path)==expected,'Digest mismatch: '+str(path))
 def evidence(app,row):
  p=safe(app,row['file']);checked(p,row['sha256']);return p
 report={'kind':'featured-games-final-integration-audit','startedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'repositoryHead':git('rev-parse','HEAD').decode().strip(),'productionSourceSha':SOURCE,'checks':{},'errors':[], 'physicalTvTested':False,'physicalPhoneTested':False,'limitations':['Read-only consistency audit of retained evidence; it does not repeat browser gameplay, actual signature tooling or full video decode.','The official full resource_catalog verification and README generator idempotence are performed separately by the root workflow.']}
 def check(label,fn):
  try:report['checks'][label]={'passed':True,**fn()}
  except Exception as exc:report['checks'][label]={'passed':False,'error':str(exc)};report['errors'].append({'check':label,'error':str(exc)})
 progress=read(repo/'resource/game-kit/progress.json');progress_by={g['id']:g for g in progress['games']};english=read(repo/'tools/resource-index.en.json');cert=(repo/'tools/puretv-release-certificate-v2.sha256').read_text().strip();common=repo/'resource/game-kit/docs/featured-0.2.0'
 common_signed=read(common/'signed-assets-verification.json')
 def check_common():
  manifest=read(common/'archive-manifest.json');need(manifest['productionSourceSha']==SOURCE,'Common production source differs');need(len(manifest['files'])==47,'Common archive must preserve all 47 original files');seen=set();total=0
  for row in manifest['files']:
   need(row['path'] not in seen,'Duplicate common archive entry');seen.add(row['path']);p=safe(common,row['path']);checked(p,row['sha256']);need(p.stat().st_size==row['bytes'] and row['copiedWithoutModification'] is True,'Common archive size/original flag differs');total+=row['bytes']
  need(common_signed['sourceSha']==SOURCE and set(common_signed['games'])==set(GAMES),'Common signed catalog identity differs')
  batch=read(common/'batch-receipt.json');frozen=read(common/'frozen-verification.json');need(batch['sourceSha']==frozen['sourceSha']==SOURCE and frozen['gameCount']==8 and frozen['frozenSourceFilesMatchedGit']==56,'Frozen verification summary differs')
  for slug in GAMES:
   s=common_signed['games'][slug];need(s['sourceSha']==SOURCE and s['signedAssetsMatchFrozen'] is True and s['assetCount']==12,'Common signed assets failed: '+slug)
   for name in ['signing-receipt.json','fetch-verification.json']:need(read(common/'signed'/slug/name)['sourceSha']==SOURCE,'Common per-game signing source differs')
  return {'archivedOriginalFiles':len(seen),'archivedOriginalBytes':total,'frozenSourceFiles':56,'signedGames':8}
 check('commonSigningArchive',check_common)
 def test_provenance(slug,app,qa,verification,record):
  expected=REVISIONS.get(slug,SOURCE);count=0;manifests=[]
  candidates=set(qa.glob('execution-provenance*.json'))|set(qa.rglob('source-hashes.json'))|set(qa.rglob('*test-source-check.json'))
  for path in sorted(candidates):
   doc=read(path);commit=doc.get('sourceCommit',doc.get('sourceSha'));files=doc.get('executionScriptHashes',doc.get('files'))
   if not files or not commit:continue
   need(commit==SOURCE,'Unexpected baseline test source '+str(path));pairs={r['path']:r['sha256'] for r in files} if isinstance(files,list) else files
   for rel,value in pairs.items():
    need(sha(gitbytes(commit,rel))==value,'Test provenance differs from Git: '+rel)
    archived=path.parent/rel
    if archived.exists():checked(archived,value)
    count+=1
   manifests.append(path.relative_to(app).as_posix())
  revisions=list(qa.glob('test-source-revision-*/revision.json'))
  if slug in REVISIONS:
   need(revisions,'Missing test-only revision record: '+slug);matching=[]
   adopted_attempt=pathlib.Path(verification['evidence']['recording']['file']).parent.name
   for path in revisions:
    doc=read(path);revision_commit=doc.get('testSourceCommit');need(revision_commit,'Revision omits test source commit: '+str(path))
    need(doc.get('frozenProductionCommit',doc.get('productionSourceSha'))==SOURCE,'Revision changed production source')
    for flag in ['productionAssetsChanged','productionChanged']:
     if flag in doc:need(doc[flag] is False,'Revision changes packaged assets: '+str(path)+' '+flag)
    if 'productionAssets' in doc.get('unchanged',{}):need(doc['unchanged']['productionAssets'] is True,'Revision does not preserve production assets')
    hashes=doc.get('archivedFileHashes',doc.get('archiveHashes',{}));need(hashes,'Revision file hashes missing')
    for rel,value in hashes.items():checked(safe(path.parent,rel),value)
    automation=safe(path.parent,doc.get('actualAutomationSource','automation.mjs'));need(digest(automation)==sha(gitbytes(revision_commit,f'resource/apps/{slug}/tests/automation.mjs')),'Revised automation does not match its declared commit')
    if revision_commit!=expected:continue
    matching.append(path)
    if 'recordingAttempt' in doc:need(doc['recordingAttempt']==adopted_attempt,'Latest revision recording attempt is not the adopted recording')
    if 'actualRunTestSourceCommits' in doc:need(doc['actualRunTestSourceCommits'].get(adopted_attempt)==expected,'Adopted recording uses a different declared test commit')
    if 'actualRecipe' in doc:
     recipe_path=safe(path.parent,doc['actualRecipe']);recipe=read(recipe_path);need(digest(recipe_path)==sha(gitbytes(revision_commit,f'resource/apps/{slug}/tests/recipe.json')),'Archived actual recipe differs from declared test commit')
     if 'durationSeconds' in recipe and 'requestedSeconds' in record:need(recipe['durationSeconds']==record['requestedSeconds'],'Recording duration differs from its declared actual recipe')
   need(matching,'Expected revision source missing: '+slug)
   declared=verification.get('testExecution',{}).get('revisions',[]);need(any(row['details'].get('testSourceCommit')==expected for row in declared),'Current verification omits actual test revision')
   need({(app/row['file']).resolve() for row in declared}=={path.resolve() for path in revisions},'Current verification omits an archived revision')
   for row in declared:
    original=evidence(app,row);need(read(original)==row['details'],'Embedded revision details differ from original report')
  else:need(not revisions,'Unexpected revised automation source for '+slug)
  need(manifests or revisions,'No archived execution provenance: '+slug)
  for file in (app/'tests').rglob('*'):
   if file.is_file():need(digest(file)==sha(gitbytes(expected,file.relative_to(repo).as_posix())),'Current test file differs from declared test commit: '+str(file))
  need(record.get('recorderSourceSha256')==oldhash('resource/game-kit/qa/record.mjs'),'Recorder source not frozen version')
  for name,value in record.get('recorderHelperSourceSha256',{}).items():need(value==oldhash('resource/game-kit/qa/'+name),'Recorder dependency mismatch')
  return {'sourceCommit':expected,'baselineHashEntries':count,'baselineManifests':manifests,'revisionRecords':len(revisions)}
 def game(slug):
  app=repo/'resource/apps'/slug;release=app/'docs/releases/0.2.0';qa=release/'final-qa';info=read(app/'resource.json');v=read(app/'docs/verification.json');entry=progress_by[slug];meta=read(app/'game.json')
  need(info['version']==meta['version']==entry['version']==v['version']=='0.2.0','Current release version differs');need(info['sourceCommit']==entry['sourceCommit']==v['sourceCommit']==SOURCE,'Current release source differs');need(info['versionCode']==meta['versionCode']==(3 if slug=='prism-relay' else 2),'Version code differs')
  need(entry['status']=='verified' and v['passed'] is True and v['levelCount']==6 and v['newLevels']==3,'Current verification incomplete')
  for row in v['evidence'].values():evidence(app,row)
  reports={key:read(evidence(app,row)) for key,row in v['evidence'].items()};build=reports['build'];sign=reports['signing'];fetch=reports['fetch'];art=reports['artifacts'];browser=reports['browser'];shared=reports['shared'];record=reports['recording'];visual=reports['visual'];assets=build['assets']
  for row in v['modelEvidence']:evidence(app,row)
  need(v['modelEvidence'],'Missing model evidence')
  need(sign['sourceSha']==fetch['sourceSha']==SOURCE and sign['slug']==slug and sign['version']=='0.2.0','Signing source/identity differs');need(sign['signatureVerified'] and fetch['signatureVerified'] and fetch['sourceIdentityVerified'] and fetch['assetsMatchSigningReceipt'],'Signing/fetch not verified');need(sign['certificateSha256']==fetch['certificateSha256']==info['certificateSha256']==cert,'Certificate differs')
  need(sign['file']==fetch['apk']==info['apk']==entry['apk'],'APK paths differ');apk=safe(app,info['apk']);tracked_file(apk);apkhash=digest(apk);need(apkhash==sign['sha256']==fetch['sha256']==info['sha256']==entry['apkSha256']==art['apk']['sha256'],'APK digests differ');need(0<apk.stat().st_size<10_000_000 and apk.stat().st_size==sign['bytes']==fetch['bytes']==info['apkBytes']==entry['apkBytes'],'APK sizes differ')
  with zipfile.ZipFile(apk) as z:
   need(z.testzip() is None and len(z.namelist())==len(set(z.namelist())),'Corrupt/duplicate APK ZIP');actual={n[7:]:sha(z.read(n)) for n in z.namelist() if n.startswith('assets/') and not n.endswith('/')};config=json.loads(z.read('assets/game-config.json'))
  need(len(actual)==12 and actual==assets==sign['assetsSha256']==v['sourceAssetHashes']==common_signed['games'][slug]['assetHashes'],'Production/build/signing asset hashes differ')
  for name,value in actual.items():
   if name in ['assets-index.json','game-config.json']:continue
   sourcepath=f'resource/apps/{slug}/src/main/assets/{name}' if name in ['game-model.js','game.js','game-theme.css'] else 'resource/game-kit/web/'+name
   need(oldhash(sourcepath)==value==digest(repo/sourcepath),'Frozen/current source differs from APK: '+sourcepath)
  for key in ['id','packageName','version','versionCode']:need(config[key]==meta[key],'Bundled game config differs: '+key)
  for label,obj in [('browser',browser),('shared',shared),('recording',record)]:need(obj.get('sourceAssetHashes',obj.get('assets'))==actual,label+' raw evidence assets differ')
  need(browser['passed'] is True and shared['sharedRegressionPassed'] is True,'Final browser check failed')
  for label,obj in [('browser',browser),('shared',shared)]:
   tests=obj.get('tests',obj.get('checks'));need(tests and all(t['passed'] for t in tests),label+' has failed/empty tests')
  need(v['sharedBrowserChecksPassed']==len(shared['tests']) and v['supplementaryBrowserChecksPassed']==len(browser.get('tests',browser.get('checks'))),'Browser counts differ from raw reports')
  goals=audit_recorded_wins(slug,record);need(goals['recordedWonLevelsZeroBased']==v['actualGameplay']['recordedWonLevelsZeroBased']==list(range(6)),'Recorded goals differ')
  need(record['kind']=='normal-runtime-browser-play' and not record.get('errors') and not record.get('consoleErrors'),'Recording has runtime errors')
  video=safe(app,info['gameplayVideo']);tracked_file(video);videohash=digest(video);need(info['gameplayVideo']==entry['video'] and videohash==record['videoSha256']==entry['videoSha256']==art['video']['sha256'],'Video digests differ');need(0<video.stat().st_size<10_000_000 and video.stat().st_size==record['videoBytes']==entry['videoBytes'],'Video sizes differ')
  metadata=safe(app,info['gameplayMetadata']);need(metadata.read_bytes()==evidence(app,v['evidence']['recording']).read_bytes(),'Published recording metadata differs from raw manifest')
  required=['apkSize','apkManifest','apkSignature','apkZipIntegrity','apkAssetsMatch','videoSize','videoFormat','videoFullDecode'];need(all(art['checks'].get(k) is True for k in required),'Required artifact check missing');need(art['apk']['signerSha256']==[cert] and art['apk']['package']==info['packageName'],'Artifact identity differs')
  need(info['buildRun'].endswith('/'+str(sign['workflowRun'])) and int(entry['signingRun'])==int(sign['workflowRun'])==int(fetch['runId']),'Signing run differs')
  for obj in [info['verification'],v['hardware'],browser,shared['environment'],record,visual]:need(obj.get('physicalTvTested') is False and obj.get('physicalPhoneTested') is False,'Missing/incorrect physical device flags')
  need(visual['accepted'] is True and visual['sourceCommit']==SOURCE and visual.get('encodedFrames'),'Missing final image/video visual review');sizes=set();reviewed={}
  for key in ['screenshots','encodedFrames']:
   for row in visual[key]:
    path=safe(qa,row['file']);checked(path,row['sha256']);reviewed[row['file']]=row['sha256']
    if key=='screenshots':
     raw=path.read_bytes();need(raw[:8]==b'\x89PNG\r\n\x1a\n','Expected PNG viewport screenshot');sizes.add(struct.unpack('>II',raw[16:24]))
  need({(960,540),(1280,720)}<=sizes,'Both final viewport screenshots required');need(visual['cover'] in reviewed,'Cover was not reviewed');cover=safe(app,info['cover']);en=english['apps/'+slug];checked(cover,reviewed[visual['cover']]);checked(repo/en['cover'],digest(cover));need(en.get('coverLocale')=='zh-CN','Chinese interface preview is mislabelled')
  oldversion='0.1.1' if slug=='prism-relay' else '0.1.0';oldbase='resource/apps/'+slug+'/';oldinfo=json.loads(gitbytes(SOURCE,oldbase+'resource.json'));need(oldinfo['version']==oldversion,'Unexpected baseline old release')
  archives={'resource.json':'docs/resource-'+oldversion+'.json','docs/verification.json':'docs/verification-'+oldversion+'.json','docs/signing-receipt.json':'docs/signing-receipt-'+oldversion+'.json','thumb.png':'docs/preview-'+oldversion+'.png'}
  for old,new in archives.items():checked(app/new,oldhash(oldbase+old))
  checked(app/('docs/preview-en-catalog-'+oldversion+'.png'),oldhash('docs/previews/en/app-'+slug+'.png'))
  for old in [oldinfo['apk'],oldinfo['gameplayVideo'],oldinfo['gameplayMetadata']]:checked(app/old,oldhash(oldbase+old))
  need(any(x['version']==oldversion for x in info['previousReleases']) and any(x['version']==oldversion for x in entry['previousReleases']),'Previous release history lost')
  for name in ['signing-receipt.json','fetch-verification.json']:need((release/name).read_bytes()==(common/'signed'/slug/name).read_bytes(),'Per-game/common signing evidence differs')
  provenance=test_provenance(slug,app,qa,v,record)
  checksumfile=app/'SHA256SUMS.txt';tracked_file(checksumfile);declared={}
  for line in checksumfile.read_text().splitlines():
   match=re.fullmatch(r'([a-f0-9]{64})  (.+)',line);need(match is not None,'Malformed checksum line');value,rel=match.groups();need(rel not in declared,'Duplicate checksum '+rel);declared[rel]=value;checked(safe(app,rel),value)
  current={x.relative_to(app).as_posix() for x in app.rglob('*') if x.is_file() and x!=checksumfile};need(set(declared)==current,'Checksum coverage differs: missing='+str(sorted(current-set(declared)))+' extra='+str(sorted(set(declared)-current)))
  readme=(app/'README.md').read_text();links=[]
  for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)',readme):
   target=target.strip('<>');parsed=urlsplit(target)
   if parsed.scheme or parsed.netloc or not parsed.path:continue
   file=(app/unquote(parsed.path)).resolve();need(file.is_relative_to(repo) and file.exists(),'Broken README local link '+target);links.append(parsed.path)
  need(info['apk'] in links and info['gameplayVideo'] in links and 'docs/verification.json' in links,'Current README lacks new download/verification links')
  return {'version':'0.2.0','levelsWon':6,'apkBytes':apk.stat().st_size,'videoBytes':video.stat().st_size,'assetsMatched':len(actual),'checksumFiles':len(declared),'oldEvidenceArchivedFiles':8,'readmeLocalLinks':len(links),'testProvenance':provenance,'actualEvidenceAttempts':{k:pathlib.Path(v['evidence'][k]['file']).parent.name for k in ['browser','shared','recording']}}
 for slug in GAMES:check(slug,lambda slug=slug:game(slug))
 def galleries():
  featured=read(repo/'tools/readme-featured-games.json');need(set(featured)=={'apps/'+s for s in GAMES} and len(featured)==8,'Featured selection differs');need(progress['completed']==progress['target']==100 and len(progress['games'])==100 and len(progress_by)==100,'Completed hundred-game count changed')
  order=read(repo/'tools/resource-order.json');hundred={'apps/'+s for s in progress_by};allgames=set(order['game']);legacy=allgames-hundred;need(len(legacy)==11 and len(allgames)==111,'Legacy/full game catalog differs');summaries={}
  for filename,isroot in [('README.md',True),('README.en.md',True),('resource/README.md',False)]:
   path=repo/filename;tracked_file(path);text=path.read_text();body=text.split('<!-- resource-index:start -->',1)[1].split('<!-- resource-index:end -->',1)[0] if isroot else text;tables=re.findall(r'<table>\s*(.*?)\s*</table>',body,re.S);need(len(tables)==3,'Expected three gallery tables: '+filename);counts={}
   for group,table in zip(['launcher','media','game'],tables):
    expected=list(reversed(order[group]));expected=[x for x in expected if not(isroot and group=='game') or x not in hundred or x in featured]
    actual=re.findall(r'href="(?:resource/)?((?:apps|launcher)/[^/]+)/"',table);need(actual==expected,'Gallery order/membership differs: '+filename+' '+group)
    for row in re.findall(r'<tr>\s*(.*?)\s*</tr>',table,re.S):
     cells=re.findall(r'<td\b[^>]*>.*?</td>',row,re.S);need(len(cells)==4 and all('width="25%"' in c for c in cells),'Gallery is not four columns: '+filename)
     for cell in cells:
      if '<a ' in cell:need(re.search(r'<img\b[^>]*><br>[^<]+</a>',cell) is not None,'Cell must show image above name: '+filename)
    counts[group]=len(actual)
   need(counts=={'launcher':10,'media':4,'game':19 if isroot else 111},'Gallery totals differ')
   for src in re.findall(r'<img[^>]*src="([^"]+)"',body):need((path.parent/src).is_file(),'Gallery preview is missing '+src)
   for count in counts.values():need(re.search(r'### [^\n]*(?:（'+str(count)+r'）| \('+str(count)+r'\))',body) is not None,'Category heading count missing')
   summaries[filename]=counts
  return {'featuredNewGames':8,'legacyGames':11,'fullGameCatalog':111,'galleries':summaries}
 check('readmeGalleries',galleries)
 report['passed']=not report['errors'];report['finishedAtUtc']=datetime.datetime.now(datetime.timezone.utc).isoformat();report['auditScriptSha256']=digest(pathlib.Path(__file__));report['winAuditScriptSha256']=digest(pathlib.Path(__file__).with_name('win_audit.py'));output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':report['passed'],'checks':len(report['checks']),'errors':report['errors'],'output':str(output)},ensure_ascii=False,indent=2));return 0 if report['passed'] else 1
if __name__=='__main__':sys.exit(main())

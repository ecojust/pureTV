#!/usr/bin/env python3
"""After both patch publications, verify 61 common originals and six untouched games.
Read-only; uses existing Git blob identities and manifest SHA256, no browser/decoder.
"""
import argparse,datetime,hashlib,json,pathlib,subprocess,sys
from release_lib import config,read,require,digest,safe,gitbytes
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--config',type=pathlib.Path,default=pathlib.Path(__file__).with_name('release-config.json'));p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args();cfg=read(a.config);c=config(a.config,next(iter(cfg['games'])));repo=c['repo'];baseline=c['previousReleaseCommit'];source=c['sourceCommit'];patched=set(cfg['games'])
require(not a.output.resolve().is_relative_to(repo) and not a.output.exists(),'Use a fresh output path outside the repository')
# Do not create a final-looking report before both resource publications exist.
for slug in patched:
 info=read(repo/'resource/apps'/slug/'resource.json');require(info['version']==c['version'] and info['sourceCommit']==source,'Both patch releases must be published before this batch audit')
tracked=set(subprocess.check_output(['git','ls-files','-z'],cwd=repo).decode().split('\0'));report={'kind':'physics-patch-common-and-unchanged-games-consistency','sourceCommit':source,'baselineCommit':baseline,'startedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'repositoryHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'checks':{},'errors':[],'physicalTvTested':False,'physicalPhoneTested':False,'scope':'No new execution tests. Checks retained original evidence hashes, unchanged Git blobs and unchanged catalog/progress entries.'}
def tracked_file(path):require(path.is_file() and not path.is_symlink() and path.relative_to(repo).as_posix() in tracked,'Missing/untracked file '+str(path))
def check(label,fn):
 try:report['checks'][label]={'passed':True,**fn()}
 except Exception as error:report['checks'][label]={'passed':False,'error':str(error)};report['errors'].append({'check':label,'error':str(error)})
def common_originals():
 common=repo/'resource/game-kit/docs/physics-0.2.1';manifest=read(common/'archive-manifest.json');require(manifest['sourceCommit']==source and len(manifest['files'])==61,'Expected 61 original files from the frozen patch source');seen=set();total=0
 for row in manifest['files']:
  require(row['file'] not in seen,'Duplicate common original');seen.add(row['file']);path=safe(common,row['file']);tracked_file(path);require(path.stat().st_size==row['bytes'] and digest(path)==row['sha256'] and row['copiedWithoutModification'] is True,'Common original digest/size differs '+row['file']);total+=row['bytes']
 for slug in patched:
  published=repo/'resource/apps'/slug/'docs/releases'/c['version']
  for filename in ['signing-receipt.json','fetch-verification.json']:require((common/'signed'/slug/filename).read_bytes()==(published/filename).read_bytes(),'Common/published signed receipt differs')
 return {'originalFiles':61,'originalBytes':total,'manifestSha256':digest(common/'archive-manifest.json')}
check('commonOriginals',common_originals)
featured=read(repo/'tools/readme-featured-games.json');unmodified=sorted(set(x.split('/')[1] for x in featured)-patched);require(len(unmodified)==6,'Expected six other featured games')
def git_blob(path):
 size=path.stat().st_size;h=hashlib.sha1();h.update(b'blob '+str(size).encode()+b'\0')
 with path.open('rb') as stream:
  for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def unchanged_game(slug):
 prefix='resource/apps/'+slug;raw=subprocess.check_output(['git','ls-tree','-r','-z',baseline,'--',prefix],cwd=repo);expected={}
 for row in raw.split(b'\0'):
  if not row:continue
  fields,name=row.split(b'\t',1);mode,kind,oid=fields.decode().split();require(kind=='blob','Unexpected baseline tree entry');expected[name.decode()]=oid
 current={f.relative_to(repo).as_posix() for f in (repo/prefix).rglob('*') if f.is_file()};require(current==set(expected),'Other game file set changed: '+slug)
 for rel,oid in expected.items():path=repo/rel;tracked_file(path);require(git_blob(path)==oid,'Other game content changed '+rel)
 preview=repo/f'docs/previews/en/app-{slug}.png';tracked_file(preview);require(preview.read_bytes()==gitbytes(c,baseline,preview.relative_to(repo).as_posix()),'Other game English preview changed')
 return {'filesByteIdenticalToGitBaseline':len(expected),'englishPreviewUnchanged':True,'identityMethod':'Git SHA1 blob identity, including byte length and full file content'}
for slug in unmodified:check(slug,lambda slug=slug:unchanged_game(slug))
def shared_entries():
 progress=read(repo/'resource/game-kit/progress.json');oldprogress=json.loads(gitbytes(c,baseline,'resource/game-kit/progress.json'));require(progress['completed']==oldprogress['completed']==100 and progress['target']==oldprogress['target']==100,'Completed/target count changed');current={x['id']:x for x in progress['games']};old={x['id']:x for x in oldprogress['games']};require(set(current)==set(old) and len(current)==100,'Game ID set changed')
 for slug in set(old)-patched:require(current[slug]==old[slug],'Unpatched progress entry changed '+slug)
 english=read(repo/'tools/resource-index.en.json');oldenglish=json.loads(gitbytes(c,baseline,'tools/resource-index.en.json'));require(set(english)==set(oldenglish),'Catalog entry set changed')
 for key in set(oldenglish)-{'apps/'+slug for slug in patched}:require(english[key]==oldenglish[key],'Unpatched English catalog entry changed '+key)
 for rel in ['tools/readme-featured-games.json','tools/resource-order.json']:require((repo/rel).read_bytes()==gitbytes(c,baseline,rel),'Featured selection/creation order changed')
 return {'unpatchedProgressEntriesUnchanged':len(old)-len(patched),'unpatchedEnglishEntriesUnchanged':len(oldenglish)-len(patched),'featuredGames':len(featured),'completedCount':100}
check('unpatchedProgressAndCatalog',shared_entries)
report['passed']=not report['errors'];report['finishedAtUtc']=datetime.datetime.now(datetime.timezone.utc).isoformat();report['usedScriptHashes']={name:digest(pathlib.Path(__file__).with_name(name)) for name in ['batch-consistency.py','release_lib.py','win_audit.py']};a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':report['passed'],'errors':report['errors'],'output':str(a.output)},ensure_ascii=False,indent=2));sys.exit(0 if report['passed'] else 1)

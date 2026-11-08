from pathlib import Path
import json,csv,collections,re,hashlib,urllib.parse,datetime,subprocess
root=Path('/workspace/pureTV');scratch=Path('/workspace/scratch/tvapp-oversized-20261108');base=root/'fork';plan=base/'planning'
run=subprocess.run(['python3','tools/update-tvapp-oversized.py','--check'],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,check=True)
(scratch/'independent-generator-check.log').write_bytes(run.stdout)
doc=json.loads((plan/'oversized.json').read_text());source=json.loads((base/'upstream/tree.json').read_text());expected={x['path']:x for x in source['tree'] if x['type']=='blob' and x['path'].lower().endswith('.apk') and x.get('size',0)>10_000_000};files=doc['files'];by={f['path']:f for f in files}
assert len(by)==len(files)==205 and set(by)==set(expected)
for path,record in by.items():
 assert record['bytes']==expected[path]['size'] and record['upstreamGitBlobSha']==expected[path]['sha']
 assert record['downloaded'] is False and record['apkMetadataVerified'] is False and record['hintsBasis']=='upstream-filename-only'
 assert record['packageName'] is None and record['minSdk'] is None and record['signatureSha256'] is None
 for key in ['sourceUrl','downloadUrl']:assert urllib.parse.unquote(record[key]).endswith('/'+doc['source']['commit']+'/'+path)
blobs=collections.defaultdict(list)
for p,r in expected.items():blobs[r['sha']].append(p)
assert len(blobs)==199
for path,record in by.items():assert sorted(record['sameBlobPaths'])==sorted(set(blobs[record['upstreamGitBlobSha']])-{path})
assert doc['statistics']['totalBytesIncludingDuplicatePaths']==sum(x['size'] for x in expected.values())==8711445311
assert len([g for g in blobs.values() if len(g)>1])==6
csvrows=list(csv.DictReader((plan/'oversized.csv').open()));assert len(csvrows)==205 and {r['path'] for r in csvrows}==set(by)
for row in csvrows:
 f=by[row['path']]
 for key,value in row.items():assert value==(' | '.join(f[key]) if isinstance(f[key],list) else str(f[key])),(f['path'],key)
applications=doc['applications'];assert len(applications)==84
for app in applications:
 listed=[f for f in files if f['appId']==app['id']]
 assert set(app['paths'])=={f['path'] for f in listed}
 assert app['apkCount']==len(listed) and app['uniqueBlobCount']==len({f['upstreamGitBlobSha'] for f in listed})
 assert app['minBytes']==min(f['bytes'] for f in listed) and app['maxBytes']==max(f['bytes'] for f in listed)
 assert app['groupingBasis']=='upstream-names-and-descriptions-not-verified-package-identity' and app['developmentStatus']=='未开始'
for c in doc['statistics']['categories']:
 assert c['families']==sum(a['category']==c['id'] for a in applications) and c['apkPaths']==sum(f['category']==c['id'] for f in files)
mdfiles=[base/'OVERSIZED.md',plan/'oversized-apks.md',plan/'replication-notes.md',base/'README.md',base/'MAINTENANCE.md',root/'README.md',root/'README.en.md'];local=0;anchors=0
for file in mdfiles:
 text=file.read_text()
 for target in re.findall(r'\]\(([^\n)]+)\)',text):
  url=urllib.parse.urlsplit(target)
  if url.scheme or target.startswith('//'):continue
  path=(file.parent/urllib.parse.unquote(url.path)).resolve() if url.path else file
  assert path.exists(),(file,target);local+=1
  if url.fragment and path.suffix=='.md' and file in mdfiles[:3] and re.fullmatch('[a-z0-9-]+',url.fragment):
   heading_ids=[re.sub(r'[^\w\- ]','',h.lower()).replace(' ','-') for h in re.findall(r'^#{1,6}\s+(.+)$',path.read_text(),re.M)]
   assert url.fragment in heading_ids,(file,target);anchors+=1
for file in mdfiles[:2]:
 text=file.read_text();assert not re.search(r'^\|[^\n]+\|\n\n\|',text,re.M)
 for line in text.splitlines():
  if line.startswith('|'):assert len(re.split(r'(?<!\\)\|',line)) in (5,7),(file,line[:100])
package_text=(plan/'oversized-apks.md').read_text()
for f in files:assert package_text.count(']('+f['sourceUrl']+')')==1,f['path']
validation=json.loads((plan/'validation.json').read_text())
for name,sha in validation['outputs'].items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==sha
# Regression cases from visual data review: system requirements are not application versions;
# a parent directory named 电视直播 is not a filename/device hint for mobile APKs.
a=by['影视/好好看/好好看TV版1.2.1-Android6.0以上.apk']
assert a['versionHints']==['1.2.1'] and any('Android6.0' in s for s in a['systemHints'])
b=by['电视直播/酷9直播/酷9lite空壳_1.7.6.8（兼容安卓4.3-6）.apk']
assert b['versionHints']==['1.7.6.8'] and any('安卓4.3-6' in s for s in b['systemHints'])
c=by['电视直播/SimpleLive/手机版1.12.8/SimpleLive-v1.12.8-手机版32位.apk']
assert '电视' not in c['variantHints'] and '手机' in c['variantHints'] and '32位' in c['variantHints']
report={'status':'passed','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'oversize_media_plan','files':205,'distinctGitBlobs':199,'duplicateGroups':6,'referenceFamilies':84,'totalBytes':8711445311,'csvJsonRowsCompared':205,'markdownSourceLinksCompared':205,'checkedLocalLinks':local,'checkedPlanningAnchors':anchors,'filenameOnlyAndUnverifiedMetadata':True,'systemVersionSeparatedFromAppVersion':True,'parentDirectoryNotUsedAsDeviceHint':True,'sourceAndPlanningSeparated':True,'downloadedApks':False,'generatorCheck':'independent-generator-check.log','generatorSha256':hashlib.sha256((root/'tools/update-tvapp-oversized.py').read_bytes()).hexdigest(),'reviewScriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'observations':[]}
(scratch/'independent-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))

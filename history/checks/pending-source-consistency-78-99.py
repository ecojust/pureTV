#!/usr/bin/env python3
"""Saved read-only audit code from two executed inline Python invocations.

The first block used the then-current development queue for candidate paths;
the second independently confirmed every mapping against the authoritative
publication queue. These blocks are preserved together without rerunning them
while archiving. Executing this file later prints two JSON records and writes
no files. It does not run browsers, game tests, builds or signature verifiers.
"""
import json,subprocess,hashlib,zipfile
from pathlib import Path
root=Path('/workspace/pureTV');manifest=json.load(open(root/'history/game-delivery-state.json'));exclude={94,97,98,100};games=[g for g in manifest['queue'] if 78<=g['number']<=100 and g['number'] not in exclude]
sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*args):return subprocess.run(['git','-C',str(root),*args],capture_output=True)
def blob(commit,path):
 r=git('show',commit+':'+path);return r.stdout if r.returncode==0 else None
shared=['controller.css','controller.html','controller.js','renderer.js','runtime.js','tv.css','tv.html'];native_checked=0;test_count=0;asset_count=0;errors=[];results=[]
start=git('rev-parse','HEAD').stdout.decode().strip()
for g in games:
 n=g['number'];slug=g['id'];app=Path('resource/apps')/slug;scratch=Path(g['scratch']);receipt_path=scratch/'signed/signing-receipt.json';rec=json.load(open(receipt_path));fetch=json.load(open(scratch/'signed/fetch-verification.json'));commit=rec['sourceSha'];bad=[]
 def ck(label,a,b):
  if type(a)!=type(b) or a!=b:bad.append({'field':label,'actual':a,'expected':b})
 if g.get('sourceCommit'):ck('history.sourceCommit',g['sourceCommit'],commit)
 if g.get('signingRun'):ck('history.signingRun',str(g['signingRun']),str(rec['workflowRun']))
 ck('receipt.slug',rec['slug'],slug)
 apk=scratch/'signed'/rec['file'];data=apk.read_bytes();ck('apk.bytes',len(data),rec['bytes']);ck('apk.sha256',sha(data),rec['sha256']);ck('apk.sizeUnder10MB',len(data)<10000000,True)
 for key in ['signatureVerified','sourceAssetsMatchApk','localBuildMatchesCi']:ck('receipt.'+key,rec.get(key),True)
 ck('receipt.certificate',rec['certificateSha256'],'eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23')
 for a,b in [('sourceSha','sourceSha'),('sha256','sha256'),('bytes','bytes'),('certificateSha256','certificateSha256')]:ck('fetch.'+a,fetch[a],rec[b])
 ck('fetch.receiptSha256',fetch['receiptSha256'],sha(receipt_path.read_bytes()));ck('fetch.runId',str(fetch['runId']),str(rec['workflowRun']))
 for key in ['signatureVerified','zipalignVerified','crcVerified','sourceIdentityVerified','assetsMatchSigningReceipt']:ck('fetch.'+key,fetch.get(key),True)
 with zipfile.ZipFile(apk) as z:
  assets={name[7:]:z.read(name) for name in z.namelist() if name.startswith('assets/') and not name.endswith('/')}
  ck('zipCRC',z.testzip(),None)
 asset_count+=len(assets);ck('receipt.assetsSha256',{name:sha(v) for name,v in assets.items()},rec['assetsSha256']);ck('fetch.assetCount',fetch['assetCount'],len(assets))
 extracted=scratch/g['assets'];extracted_files={str(x.relative_to(extracted)):sha(x.read_bytes()) for x in extracted.rglob('*') if x.is_file()};ck('qaExtractedAllAssets',extracted_files,{name:sha(v) for name,v in assets.items()})
 for name in shared+['game-model.js','game.js']:
  p=str(Path('resource/game-kit/web')/name) if name in shared else str(app/'src/main/assets'/name)
  frozen=blob(commit,p);ck('frozenSource.'+name,sha(frozen) if frozen is not None else None,sha(assets[name]));ck('currentSource.'+name,sha((root/p).read_bytes()),sha(assets[name]))
 frozen_cfg=json.loads(blob(commit,str(app/'game.json')));current_cfg=json.load(open(root/app/'game.json'));apk_cfg=json.loads(assets['game-config.json']);ck('config.frozen',apk_cfg,frozen_cfg);ck('config.current',apk_cfg,current_cfg)
 for key in ['packageName','version']:ck('config.receipt.'+key,apk_cfg[key],rec[key])
 for p,h in rec['nativeSourceSha256'].items():
  frozen=blob(commit,p);current=root/p;ck('nativeFrozen.'+p,sha(frozen) if frozen is not None else None,h);ck('nativeCurrent.'+p,sha(current.read_bytes()) if current.is_file() else None,h);native_checked+=1
 frozen_names=set(git('ls-tree','-r','--name-only',commit,'--',str(app/'tests')).stdout.decode().splitlines());current_names={str(x.relative_to(root)) for x in (root/app/'tests').rglob('*') if x.is_file()};test_diffs=[]
 for p in sorted(frozen_names|current_names):
  frozen=blob(commit,p) if p in frozen_names else None;current=(root/p).read_bytes() if p in current_names else None;test_count+=1
  if frozen!=current:test_diffs.append({'file':p,'status':'added' if frozen is None else 'deleted' if current is None else 'modified','frozenSha256':sha(frozen) if frozen else None,'currentSha256':sha(current) if current else None})
 shared_tests=[]
 for p in ['resource/game-kit/qa/common.mjs','resource/game-kit/qa/check.mjs','resource/game-kit/qa/record.mjs']:
  frozen=blob(commit,p);current=(root/p).read_bytes() if (root/p).is_file() else None
  if frozen!=current:shared_tests.append({'file':p,'frozenSha256':sha(frozen) if frozen else None,'currentSha256':sha(current) if current else None})
 docs_names=set(git('ls-tree','-r','--name-only',commit,'--',str(app/'docs')).stdout.decode().splitlines());current_docs={str(x.relative_to(root)) for x in (root/app/'docs').rglob('*') if x.is_file()};docs_changed=[]
 for p in sorted(docs_names|current_docs):
  frozen=blob(commit,p) if p in docs_names else None;current=(root/p).read_bytes() if p in current_docs else None
  if frozen!=current:docs_changed.append({'file':p,'status':'added' if frozen is None else 'deleted' if current is None else 'modified'})
 result={'number':n,'id':slug,'sourceCommit':commit,'signingRun':rec['workflowRun'],'historyHasFrozenSource':bool(g.get('sourceCommit')),'assets':str(extracted),'assetCount':len(assets),'apkSha256':rec['sha256'],'testsFiles':len(frozen_names|current_names),'testDifferences':test_diffs,'sharedQADifferences':shared_tests,'docsDifferences':docs_changed,'errors':bad};results.append(result);errors.extend({'number':n,**x} for x in bad)
print(json.dumps({'scope':{'numbers':[g['number'] for g in games],'excluded':sorted(exclude),'developmentHead':start,'endingHead':git('rev-parse','HEAD').stdout.decode().strip(),'readonly':True,'browserOrModelTestsOrSignatureRerun':False},'summary':{'games':len(games),'assetsCompared':asset_count,'nativeSourceHashesCompared':native_checked,'testFilesCompared':test_count,'errorCount':len(errors),'testDifferenceCount':sum(len(x['testDifferences']) for x in results),'sharedQADifferenceCount':sum(len(x['sharedQADifferences']) for x in results)},'games':results},ensure_ascii=False,indent=2))

# Second executed invocation: authoritative publication-queue confirmation.
pub=json.load(open('/workspace/pureTV-publish/history/game-delivery-state.json'));dev=json.load(open('/workspace/pureTV/history/game-delivery-state.json'));dm={g['number']:g for g in dev['queue']};results=[]
for g in pub['queue']:
 if 78<=g['number']<=100 and g['number'] not in {94,97,98,100}:
  receipt=json.load(open(Path(g['scratch'])/'signed/signing-receipt.json'));results.append({'number':g['number'],'queueSourceMatchesReceipt':g.get('sourceCommit')==receipt['sourceSha'],'queueRunMatchesReceipt':str(g.get('signingRun'))==str(receipt['workflowRun']),'sameAssetsLocationAsAudited':(g['scratch'],g['assets'])==(dm[g['number']]['scratch'],dm[g['number']]['assets'])})
print(json.dumps({'published':pub.get('published'),'mappingChecks':results,'scopeCount':len(results),'allMappingChecksPass':all(all(v for k,v in x.items() if k!='number') for x in results)},ensure_ascii=False,indent=2))

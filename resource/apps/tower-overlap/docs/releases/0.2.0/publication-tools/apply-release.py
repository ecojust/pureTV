#!/usr/bin/env python3
"""Apply one locally verified release; never commits or pushes."""
import argparse,copy,hashlib,json,pathlib,shutil,subprocess
p=argparse.ArgumentParser();p.add_argument('--game',required=True);p.add_argument('--artifacts',type=pathlib.Path,required=True);p.add_argument('--browser',default='browser-01');p.add_argument('--shared',default='shared-01');p.add_argument('--recording',default='recording-01');a=p.parse_args()
repo=pathlib.Path('/workspace/pureTV');root=pathlib.Path('/workspace/scratch/game-polish');slug=a.game;app=repo/'resource/apps'/slug;qa=root/'final-qa'/slug;signed=root/'signed'/slug;frozen=root/'frozen-01'/slug
def read(p):return json.loads(p.read_text())
def write(p,s):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n')
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def copy_exact(src,dst):
 dst.parent.mkdir(parents=True,exist_ok=True)
 if dst.exists():assert src.read_bytes()==dst.read_bytes(),f'Existing evidence differs: {dst}'
 else:shutil.copyfile(src,dst)
proposal=read(root/'publication-review/proposals.json')['games'][slug]
auditpath=qa/'publication-audit.json'
subprocess.run(['python3',str(root/'publication-review/audit.py'),'--game',slug,'--artifacts',str(a.artifacts),'--browser',str(qa/a.browser/'report.json'),'--shared',str(qa/a.shared/'report.json'),'--recording',str(qa/a.recording/'recording.json'),'--output',str(auditpath)],check=True)
audit=read(auditpath);assert audit['passed'];source=audit['sourceSha']
old=read(app/'resource.json');assert old['version']==proposal['oldVersion']
receipt=read(signed/'signing-receipt.json');fetch=read(signed/'fetch-verification.json');build=read(frozen/'build/build-receipt.json');browser=read(qa/a.browser/'report.json');shared=read(qa/a.shared/'report.json');record=read(qa/a.recording/'recording.json');visual=read(qa/'root-visual-review.json')
assert visual.get('cover') and visual.get('encodedFrames')
cover=qa/visual['cover'];assert cover.is_file()
for src,dst in proposal['archiveBeforeOverwrite'].items():copy_exact(app/src,app/dst)
release=app/'docs/releases/0.2.0';outqa=release/'final-qa'
for file in sorted(qa.rglob('*')):
 if not file.is_file():continue
 rel=file.relative_to(qa)
 if 'frames' in rel.parts or file.name=='gameplay.mp4':continue
 copy_exact(file,outqa/rel)
copy_exact(frozen/'build/build-receipt.json',release/'build-receipt.json')
copy_exact(signed/'fetch-verification.json',release/'fetch-verification.json')
copy_exact(signed/'signing-receipt.json',release/'signing-receipt.json')
copy_exact(a.artifacts,release/'artifacts.json')
for name in ['audit.py','win_audit.py','apply-release.py']:copy_exact(root/'publication-review'/name,release/'publication-tools'/name)
for file in (root/'signing-logs').glob(slug+'*'): 
 if file.is_file():copy_exact(file,release/'signing-attempts'/file.name)
copy_exact(signed/receipt['file'],app/receipt['file'])
copy_exact(qa/a.recording/'gameplay.mp4',app/'docs/gameplay-0.2.0.mp4')
copy_exact(qa/a.recording/'recording.json',app/'docs/gameplay-0.2.0.json')
shutil.copyfile(signed/'signing-receipt.json',app/'docs/signing-receipt.json')
shutil.copyfile(cover,app/'thumb.png');shutil.copyfile(cover,repo/proposal['coverDestination'])
rawpaths={label:path for label,path in [('browser',outqa/a.browser/'report.json'),('shared',outqa/a.shared/'report.json'),('recording',outqa/a.recording/'recording.json'),('visual',outqa/'root-visual-review.json'),('publicationAudit',outqa/'publication-audit.json'),('build',release/'build-receipt.json'),('signing',release/'signing-receipt.json'),('fetch',release/'fetch-verification.json'),('artifacts',release/'artifacts.json')]}
verification={'version':'0.2.0','sourceCommit':source,'levelCount':6,'newLevels':3,'passed':True,'evidence':{k:{'file':str(v.relative_to(app)),'sha256':digest(v)} for k,v in rawpaths.items()},'sourceAssetHashes':build['assets'],'modelEvidence':[{'file':str(f.relative_to(app)),'sha256':digest(f)} for f in sorted((release/'model').rglob('*')) if f.is_file()],'sharedBrowserChecksPassed':len(shared['tests']),'supplementaryBrowserChecksPassed':len(browser.get('tests',browser.get('checks',[]))),'actualGameplay':audit,'visualReviewCompleted':True,'recordingStorage':{'video':'docs/gameplay-0.2.0.mp4','metadata':'docs/gameplay-0.2.0.json','note':'Raw recording manifest retained unchanged. Full transient JPEG frame sequence is not copied; reviewed decoded frames and complete H.264 video are retained.'},'hardware':{'physicalTvTested':False,'physicalPhoneTested':False,'note':'Ordinary keyboard input in Chromium with software rendering; not physical Android/TV/phone execution or device FPS.'},'release':{'sourceSha':source,'signerCommit':receipt['signerCommit'],'signingRun':int(receipt['workflowRun']),'bytes':receipt['bytes'],'sha256':receipt['sha256'],'certificateSha256':receipt['certificateSha256'],'localBuildMatchesCi':receipt['localBuildMatchesCi'],'artifactChecks':read(a.artifacts)['checks']}}
write(app/'docs/verification.json',verification)
info=copy.deepcopy(old);prior=info.pop('previousReleases',[]);historical={k:v for k,v in old.items() if k!='previousReleases'};historical['metadata']='docs/resource-'+old['version']+'.json';historical['verificationReport']='docs/verification-'+old['version']+'.json';historical['cover']='docs/preview-'+old['version']+'.png';prior.append(historical)
info.update(version='0.2.0',versionCode=receipt['versionCode'],apk=receipt['file'],apkBytes=receipt['bytes'],sha256=receipt['sha256'],certificateSha256=receipt['certificateSha256'],sourceCommit=source,buildRun='https://github.com/ecojust/pureTV/actions/runs/'+str(receipt['workflowRun']),description=proposal['descriptionZh'],coverSource=proposal['coverSourceNote'],gameplayVideo='docs/gameplay-0.2.0.mp4',gameplayMetadata='docs/gameplay-0.2.0.json',previousReleases=prior,verification={'sourceAssetsMatchApk':True,'checkedSourceAssetFiles':len(build['assets']),'signatureVerified':True,'levelCount':6,'newLevels':3,'allSixLevelsWonWithNormalInput':True,'modelEvidence':'docs/releases/0.2.0/model','sharedBrowserChecksPassed':len(shared['tests']),'supplementaryBrowserChecksPassed':verification['supplementaryBrowserChecksPassed'],'fullReport':'docs/verification.json','physicalTvTested':False,'physicalPhoneTested':False})
write(app/'resource.json',info)
progresspath=repo/'resource/game-kit/progress.json';progress=read(progresspath);entry=next(e for e in progress['games'] if e['id']==slug);prior=entry.pop('previousReleases',[]);oldentry=copy.deepcopy(entry);oldentry['checks']='docs/verification-'+oldentry['version']+'.json';prior.append(oldentry);entry.update(version='0.2.0',apk=receipt['file'],apkBytes=receipt['bytes'],apkSha256=receipt['sha256'],video='docs/gameplay-0.2.0.mp4',videoBytes=record['videoBytes'],videoSha256=record['videoSha256'],sourceCommit=source,signingRun=int(receipt['workflowRun']),checks='docs/verification.json',status='verified',previousReleases=prior);write(progresspath,progress)
englishpath=repo/'tools/resource-index.en.json';english=read(englishpath);english['apps/'+slug]['description']=proposal['descriptionEn'];write(englishpath,english)
shutil.copyfile(root/'publication-review/readme-proposals'/slug/'README.md',app/'README.md')
checksums=[]
for file in sorted(app.rglob('*')):
 if file.is_file() and file.name!='SHA256SUMS.txt':checksums.append(digest(file)+'  '+str(file.relative_to(app)))
(app/'SHA256SUMS.txt').write_text('\n'.join(checksums)+'\n')
print(json.dumps({'applied':slug,'version':'0.2.0','apkBytes':receipt['bytes'],'videoBytes':record['videoBytes'],'evidenceFiles':len(checksums)},ensure_ascii=False))

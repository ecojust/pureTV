import hashlib,json,struct,subprocess,zipfile
from pathlib import Path,PurePosixPath
root=Path('/dev/shm/puretv-submit');game=root/'joystick-games/kart-rush';base=root/'joystick-games/shared/windows/docs/attempts/44610944515';evidence=base/'unique-original-files/joystick-windows-evidence-kart-rush';sha=lambda b:hashlib.sha256(b).hexdigest();record=lambda p:{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}
release=json.loads((game/'windows-release.json').read_text());build=json.loads((evidence/'build-manifest.json').read_text());package=json.loads((evidence/'package-verification.json').read_text());manifest=json.loads((evidence/'evidence-manifest.json').read_text());idx=json.loads((base/'local-verification-index.json').read_text());source='c5ad63e8c6a0ccfada5f763d1d26afa27f45002e'
assert release['sourceCommit']==build['sourceCommit']==package['sourceCommit']==manifest['sourceCommit']==idx['sourceCommit']==source
assert manifest['runId']==release['buildRunId']=='44606210717' and manifest['runAttempt']=='1';assert manifest['jobStatusAtCollection']=='success';assert idx['readerRunId']==44610944515 and idx['immutableExportCommit']==release['exportCommit']=='86a2367b8e814942b1782f1e08316f8ef7af3b5a';assert release['originalRunConclusion']=='failure' and release['selectedOriginalVerifyJobConclusion']=='success'
for name,expected in release['packages'].items():assert record(game/name)==expected==build['packages'][name]==package['packages'][name]
for name,expected in manifest['files'].items():
 p=root/idx['resolvedLocalFiles']['joystick-windows-evidence-kart-rush/'+name]['path'];assert record(p)==expected
for name,expected in build['inputFiles'].items():
 b=subprocess.check_output(['git','show',source+':'+name],cwd=root);assert {'bytes':len(b),'sha256':sha(b)}==expected
with zipfile.ZipFile(game/'KartRush-0.1.0-windows-x64.zip') as z:
 assert z.testzip() is None and len(z.namelist())==len(set(z.namelist()));prefix='KartRush-0.1.0-windows-x64/';files={}
 for name in z.namelist():
  assert name.startswith(prefix);relative=name[len(prefix):];p=PurePosixPath(relative);assert not p.is_absolute() and '..' not in p.parts and '\\' not in relative
  if not name.endswith('/'):files[relative]=z.read(name)
 assert {k:{'bytes':len(b),'sha256':sha(b)} for k,b in files.items()}==build['appFiles']
 binary=files['PureTVGame.exe'];offset=struct.unpack_from('<I',binary,0x3c)[0];assert binary[:2]==b'MZ' and binary[offset:offset+4]==b'PE\0\0' and struct.unpack_from('<H',binary,offset+4)[0]==0x8664;assert sha(binary)==package['binarySha256']
 dist={p.relative_to(game/'dist').as_posix():p.read_bytes() for p in (game/'dist').rglob('*') if p.is_file()};assert all(files['Web/'+n]==b for n,b in dist.items());assert {n[4:] for n in files if n.startswith('Web/')}-set(dist)=={'bridge.js','diagnostics.js'}
 for n in ['bridge.js','diagnostics.js']:assert files['Web/'+n]==subprocess.check_output(['git','show',source+':joystick-games/shared/windows/Web/'+n],cwd=root)
result={'scope':'Independent read-only original package/report/source verification and actual visual review; no rebuild, no native rerun, no network download.','status':'passed','sourceCommit':source,'originalRunId':44606210717,'originalRunConclusion':'failure','selectedOriginalJobConclusion':'success','reexportRunId':44610944515,'exportCommit':release['exportCommit'],'packageHashes':release['packages'],'originalEvidenceFilesReverified':len(manifest['files']),'frozenSourceInputsReverified':len(build['inputFiles']),'portableAppFilesVerified':len(files),'currentDistFilesVerified':len(dist),'peMachine':'AMD64','binarySha256':sha(binary),'modes':[],'physicalControllerTested':False,'newNativeTestsRun':False,'authenticodeSigned':False}
for mode in ['normal','occupied']:
 r=json.loads((evidence/('runtime-'+mode)/'report.json').read_text());assert r['status']=='passed' and r['qaSourceCommit']==source and r['binarySha256']==sha(binary);assert len(r['tests'])==10 and all(x['status']=='passed' for x in r['tests']);assert r['storageRestart']['required'] and r['storageRestart']['actualStoredKeys']==['kartrush.profile','kartrush.sitOut']
 row={'mode':mode,'checks':[(x['name'],x['status']) for x in r['tests']],'report':record(evidence/('runtime-'+mode)/'report.json'),'images':[]}
 for name in ['connected-menu.png','playing.png','paused.png','minimum-window.png']:
  p=evidence/('runtime-'+mode)/'diagnostics'/name;row['images'].append({'path':str(p.relative_to(root)),**record(p),'dimensions':list(struct.unpack('>II',p.read_bytes()[16:24])),'visuallyReviewed':True})
 row['findings']=['Name keyboard and focused input/confirm affordance are visible; complete wrapped controller ID does not overlap the menu.','Actual race image shows kart, track, minimap, lap/place/time/rearview HUD and speed '+('42' if mode=='normal' else '47')+' km/h; compact ID card stays clear of driving view and HUD.','Pause image clearly focuses Resume; Restart, Menu, help and settings remain visible and unobstructed.','Minimum 960x540 image is captured before controller connection; it retains the name keyboard, instructions and disconnected host panel without overlap. It does not show a connected ID.'];result['modes'].append(row)
Path('/dev/shm/racing-review-arcade/kartrush-windows-independent-review.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['status','originalEvidenceFilesReverified','frozenSourceInputsReverified','portableAppFilesVerified','currentDistFilesVerified']}))

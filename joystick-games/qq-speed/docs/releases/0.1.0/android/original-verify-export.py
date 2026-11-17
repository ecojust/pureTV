from pathlib import Path
import sys,json,hashlib,subprocess,zipfile
ROOT=Path('/dev/shm/puretv-joystick-games');BASE=Path(__file__).parent;EXPORT=BASE/'export'
SOURCE='d30e1ce26abbf27d07d149b708c6a491abb105b3';RUN='44110295680'
sys.path.insert(0,str(ROOT/'tools'));from resource_catalog import apk_info
TOOLS=Path('/workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0')
def sha(data):return hashlib.sha256(data).hexdigest()
def fileinfo(p):return {'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}
def frozen(name):return subprocess.check_output(['git','show',SOURCE+':'+name],cwd=ROOT)
def content(p):
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None and len(z.namelist())==len(set(z.namelist()))
  assert all(not n.startswith('/') and '..' not in Path(n).parts for n in z.namelist())
  return {n:sha(z.read(n)) for n in z.namelist() if not n.endswith('/') and not n.startswith('META-INF/')}
def checkinputs(values):
 for name,value in values.items():
  assert not Path(name).is_absolute() and '..' not in Path(name).parts
  data=frozen(name);assert value=={'bytes':len(data),'sha256':sha(data)},name
pin=frozen('tools/puretv-release-certificate-v2.sha256').decode().strip()
manifest=json.loads((EXPORT/'export-manifest.json').read_text());assert manifest['sourceSha']==SOURCE and str(manifest['runId'])==RUN
actual={p.relative_to(EXPORT).as_posix():fileinfo(p) for p in EXPORT.rglob('*') if p.is_file() and '.git' not in p.relative_to(EXPORT).parts and p.name!='export-manifest.json'}
assert actual==manifest['files'],'Export differs from manifest'
results=[]
for slug in ['cf-transport-ship','qq-speed']:
 folder=EXPORT/'packages'/slug;r=json.loads((folder/'signing-receipt.json').read_text());assert r['sourceSha']==SOURCE and str(r['runId'])==RUN and r['signatureVerified'] is True
 meta=json.loads(frozen('joystick-games/'+slug+'/game.json'));apk=folder/(slug+'-'+meta['version']+'.apk');info=apk_info(apk,TOOLS)
 assert all(r[k]==v for k,v in info.items());assert info['certificateSha256']==pin
 assert info['packageName']==meta['packageName'] and info['versionCode']==meta['versionCode'] and info['versionName']==meta['version']
 assert 0<info['bytes']<10000000
 checkinputs(r['sourceInputs']);assert content(apk)==r['contentSha256']
 expected={}
 for name in r['sourceInputs']:
  prefix='joystick-games/'+slug+'/dist/'
  if name.startswith(prefix):
   filename=name[len(prefix):];assert '/' not in filename;expected[filename]=frozen(name)
 for name in ['controller.html','controller.js','controller.css']:expected[name]=frozen('resource/game-kit/web/'+name)
 expected['game-config.json']=(json.dumps(meta,ensure_ascii=False,separators=(',',':'))+'\n').encode()
 expected['assets-index.json']=(json.dumps(sorted(expected),separators=(',',':'))+'\n').encode()
 with zipfile.ZipFile(apk) as z:assets={n[7:]:z.read(n) for n in z.namelist() if n.startswith('assets/')}
 assert assets==expected
 assert r['assets']=={k:{'bytes':len(v),'sha256':sha(v)} for k,v in assets.items()}
 local=BASE/'local-frozen'/slug/'unsigned.apk';unsignedEqual=sha(local.read_bytes())==r['unsignedSha256'];payloadEqual=content(local)==content(apk)
 assert unsignedEqual and payloadEqual,'Frozen local and CI compilation differs: '+slug
 observerDir=EXPORT/'observers'/slug;observer=json.loads((observerDir/'observer-signing-receipt.json').read_text());assert observer['sourceSha']==SOURCE and str(observer['runId'])==RUN
 assert observer['signed'] is True and observer['testArtifactOnly'] is True and observer['modelWrites'] is False and observer['targetPackage']==meta['packageName']
 assert observer['apk']==Path(observer['apk']).name
 identity=apk_info(observerDir/observer['apk'],TOOLS);assert identity==observer['apkIdentity'] and identity['certificateSha256']==pin
 checkinputs(observer['sourceFiles'])
 results.append({'game':slug,'apkIdentity':info,'frozenSourceInputsVerified':len(r['sourceInputs']),'payloadAssetsVerified':len(assets),'localFrozenUnsignedMatchesCi':unsignedEqual,'localUnsignedContentMatchesSignedPackage':payloadEqual,'observerIdentity':identity,'observerIsTestOnly':True})
report={'status':'passed','sourceSha':SOURCE,'runId':RUN,'exportCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=EXPORT,text=True).strip(),'exportManifestSha256':sha((EXPORT/'export-manifest.json').read_bytes()),'exportFilesVerified':len(actual),'workflowBuildResult':manifest['buildResult'],'workflowSignResult':manifest['signResult'],'workflowRuntimeResult':manifest['runtimeResult'],'games':results,'physicalTvTested':False,'physicalEsp32Tested':False,'runtimeVisualReviewSeparate':True,'verifierSha256':sha(Path(__file__).read_bytes())}
(BASE/'package-verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))

import argparse,copy,hashlib,importlib.util,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path('/workspace/pureTV');sys.path.insert(0,str(ROOT/'tools'))
from tvapp_selection import load_overrides,select_overrides
spec=importlib.util.spec_from_file_location('tvapp_import',ROOT/'tools/import-tvapp.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
entries=load_overrides(ROOT/'fork/upstream/selection-overrides.json','08ec332c0a25e9ae97fb73d3b3e40784dab65fc3')
selected=['jasmine-music','taozhi-classroom','qixing-opera'];checks=[]
def checked(name,fn):
 fn();checks.append({'name':name,'passed':True})
def eq(a,b):assert a==b,(a,b)
def rejects(ids):
 try:select_overrides(entries,ids)
 except ValueError:return
 raise AssertionError('Expected invalid selection to fail')
checked('registered_five',lambda:eq(len(entries),5))
checked('default_selects_all_registered',lambda:eq(select_overrides(entries),entries))
checked('three_selected_exactly',lambda:eq([e['id'] for e in select_overrides(entries,selected)],selected))
checked('old_two_not_in_new_batch',lambda:eq(set(e['id'] for e in select_overrides(entries,selected)) & {'ergeduoduo','baby-fun-learning'},set()))
checked('unknown_id_rejected',lambda:rejects(['qixing-education']))
checked('duplicate_id_rejected',lambda:rejects(['jasmine-music','jasmine-music']))
old=json.loads(subprocess.check_output(['git','show','HEAD:fork/upstream/selection-overrides.json'],cwd=ROOT,text=True))
checked('original_two_entries_unchanged',lambda:eq(entries[:2],old['entries']))
# A selected-only flag without incremental mode must fail before any network access.
with tempfile.TemporaryDirectory(prefix='tvapp-selection-') as temporary:
 tmp=Path(temporary)
 for name,command in [('fetch_requires_incremental',[sys.executable,str(ROOT/'tools/fetch-tvapp-apks.py'),'--inventory',str(ROOT/'fork/upstream/candidates-raw.json'),'--output',str(tmp/'fetch'),'--build-tools','/missing','--java-home','/missing','--only-id','jasmine-music']),('import_requires_incremental',[sys.executable,str(ROOT/'tools/import-tvapp.py'),'--only-id','jasmine-music'])]:
  result=subprocess.run(command,capture_output=True,text=True)
  checked(name,lambda result=result:(eq(result.returncode,2),eq('--only-id requires --overrides-only' in result.stderr,True)))
 # Mismatched merged metadata fails before the incoming APK reading/moving stage.
 audit=tmp/'audit';audit.mkdir()
 records=[{'sourcePath':e['path'],'bytes':e['size'],'blobSha1':e['sha']} for e in select_overrides(entries,selected)]
 records[0]['blobSha1']='0'*40
 (audit/'summary.json').write_text(json.dumps({'revision':'08ec332c0a25e9ae97fb73d3b3e40784dab65fc3','records':records}))
 catalog=ROOT/'fork/catalog.json';before=hashlib.sha256(catalog.read_bytes()).hexdigest()
 args=argparse.Namespace(output=ROOT/'fork',inventory=ROOT/'fork/upstream',audit=audit,apks=tmp/'apks-not-created',batch_output=tmp/'batch.json',overrides_only=True,only_id=selected,move=True)
 try:module.arrange(args)
 except AssertionError as e:
  checked('mismatched_merged_snapshot_rejected',lambda:eq(str(e),'Merged catalog must cover every original small APK and registered override exactly'))
 else:raise AssertionError('Expected mismatched metadata to fail')
 checked('failure_preserves_catalog',lambda:eq(hashlib.sha256(catalog.read_bytes()).hexdigest(),before))
 checked('failure_does_not_create_incoming_apps',lambda:eq([(ROOT/'fork'/e['category']/e['id']).exists() for e in select_overrides(entries,selected)],[False]*3))
 checked('failure_does_not_create_assets_batch',lambda:eq((tmp/'batch.json').exists(),False))
report={'status':'passed','count':len(checks),'checks':checks,'apkDownloaded':False,'apkCopied':False,'productionCatalogChanged':False}
Path(__file__).with_suffix('.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))

import hashlib,importlib.util,json,pathlib
ROOT=pathlib.Path('/dev/shm/puretv-submit');OUT=pathlib.Path(__file__).resolve().parent;EXPORT=OUT/'original-export';tool=ROOT/'joystick-games/tools/backroad-android-release-upload.py'
spec=importlib.util.spec_from_file_location('readonly_release_validation',tool);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class LocalBoundReader:
 def __init__(self):
  self.commit='1c0e351dae33304090294b042627192bb8c06622';self.manifest=json.loads((EXPORT/'export-manifest.json').read_text());self.tree={x['path']:x for x in json.loads((OUT/'original-export-tree.json').read_text())['tree'] if x['type']=='blob'};self.records={}
 def read(self,name):
  b=(EXPORT/name).read_bytes();r=mod.record(b);assert r==self.manifest['files'][name];assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==self.tree[name]['sha'];self.records[name]=r;return b
 def json(self,name):return mod.json_bytes(self.read(name))
reader=LocalBoundReader();mod.validate_qa_run(json.loads((OUT/'original-run.json').read_text()));mod.validate_qa_jobs([json.loads((OUT/f'original-{name}-job.json').read_text()) for name in ['select','runtime','export']]);result=mod.validate_qa_export(reader)
(OUT/'helper-report-compatibility.json').write_text(json.dumps({'status':'schema_compatible_but_visual_delivery_blocked','helperSha256':hashlib.sha256(tool.read_bytes()).hexdigest(),'onlyPureValidationFunctionsInvoked':True,'apiRequests':False,'packageDownloaded':False,'uploadInvoked':False,'visualFinding':'Both actual playing screenshots show HUD and controller card but no car or track. This automated schema result is not publication approval.','validation':result},indent=2)+'\n');print('schema passed',[(x['mode'],x['testsPassed'],x['planStepsPassed'],x['acceptedSdkMessages']) for x in result['modes']])

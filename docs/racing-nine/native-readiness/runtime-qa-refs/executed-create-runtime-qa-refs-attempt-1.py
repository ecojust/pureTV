from pathlib import Path
import os,subprocess,json,hashlib,datetime,types
root=Path('/dev/shm/puretv-submit');scratch=Path('/dev/shm/racing-native-readiness/runtime-qa-refs');scratch.mkdir(exist_ok=True)
out=root/'docs/racing-nine/native-readiness/runtime-qa-refs';out.mkdir(exist_ok=True)
def git(*args,env=None,input=None):return subprocess.check_output(['git',*args],cwd=root,env=env,input=input)
def text(*args,**kwargs):return git(*args,**kwargs).decode().strip()
def sha(data):return hashlib.sha256(data).hexdigest()
source=text('rev-parse','8451c93');index=root/text('rev-parse','--git-path','index');before={'head':text('rev-parse','HEAD'),'headRef':text('symbolic-ref','HEAD'),'indexSha256':sha(index.read_bytes())}
reuse=types.ModuleType('frozen_reuse');reuse.__file__=str(root/'joystick-games/tools/macos-catalog-reuse.py');exec(compile(git('show',source+':joystick-games/tools/macos-catalog-reuse.py'),reuse.__file__,'exec'),reuse.__dict__)
common=['joystick-games/tools/macos-verify.py','joystick-games/tools/qa-plan.py','joystick-games/shared/macos/tests/native-observation.test.py','joystick-games/shared/macos/tests/catalog-tools.test.py']
a=common+['joystick-games/backroad-rally/qa-plan.json','joystick-games/night-racer/qa-plan.json','joystick-games/tools/macos-coverage.py','joystick-games/shared/macos/tests/coverage.test.py']+['joystick-games/shared/macos/tests/fixtures/'+x for x in ['constructor-observations-provenance.json','pon-inactive-renderer-44602407034.json','royale-boot-failed-44605303936.json']]
b=common+['joystick-games/turbo-kart-rush/qa-plan.json']
result={'overlaySourceCommit':source,'rootStateBefore':before,'scope':'Local QA-only refs created via separate GIT_INDEX_FILE/read-tree/commit-tree; no checkout, default index write, push, dispatch or production mutation.','branches':[]}
for label,base,ref,paths,run,batch in [('A','68d343d22c762c904eb83854d4ab9c4113a7c30f','refs/heads/build-source/racing-macos-01-runtime-qa-v1',a,44608415225,'racing-01'),('B','b7b7af12f1eb61f777d89edad7368a69a14bb9e3','refs/heads/build-source/racing-macos-03-runtime-qa-v1',b,44605303936,'racing-03')]:
 assert subprocess.run(['git','show-ref','--verify','--quiet',ref],cwd=root).returncode==1,'Ref already exists; do not replace'
 env=dict(os.environ,GIT_INDEX_FILE=str(scratch/(label+'.index')));assert not Path(env['GIT_INDEX_FILE']).exists();git('read-tree',base,env=env)
 registry=json.loads(git('show',base+':joystick-games/catalog-registry.json'))['games'];records={}
 for p in paths:
  assert reuse.qa_only(p,registry),p
  mode,kind,blob,path=git('ls-tree',source,'--',p).decode().strip().split(None,3);assert kind=='blob' and path==p and mode=='100644'
  data=git('cat-file','blob',blob);git('update-index','--add','--cacheinfo',mode,blob,p,env=env)
  records[p]={'gitBlobSha1':blob,'bytes':len(data),'sha256':sha(data),'mode':mode,'qaOnly':True}
 tree=text('write-tree',env=env)
 changed=git('diff','--name-only','-z',base,tree).decode().strip('\0').split('\0');assert set(changed)==set(paths),(changed,paths)
 assert all(reuse.qa_only(p,registry) for p in changed)
 commit=text('commit-tree',tree,'-p',base,'-m',f'Apply frozen QA observers to original {batch} packages',env=env)
 assert text('rev-parse',commit+'^')==base and text('rev-parse',commit+'^{tree}')==tree
 git('update-ref',ref,commit,'0'*40)
 diff=git('diff','--raw','--full-index',base,commit,'--');(out/(label+'-actual-diff.txt')).write_bytes(diff)
 result['branches'].append({'label':label,'parentSourceCommit':base,'commit':commit,'tree':tree,'localRef':ref,'requestedOverlays':records,'actualChangedPaths':changed,'allChangesQaOnly':True,'productionTreeUnchanged':True,'runtimeWorkflow':'.github/workflows/joystick-catalog-macos-runtime.yml','inputs':{'source_run':str(run),'source_sha':base,'source_attempt':'1','batches':batch},'runtimeScope':'Original complete batch; no single-game selector','refCreatedLocally':True,'pushed':False,'dispatched':False})
after={'head':text('rev-parse','HEAD'),'headRef':text('symbolic-ref','HEAD'),'indexSha256':sha(index.read_bytes())};result['rootStateAfter']=after;result['rootHeadAndDefaultIndexUnchanged']=before==after;assert before==after,'Concurrent root HEAD/default index changed; investigate, never reset'
(out/'executed-create-runtime-qa-refs.py').write_bytes(Path(__file__).read_bytes());result['scriptSha256']=sha(Path(__file__).read_bytes());(out/'creation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'overlaySource':source,'rootUnchanged':before==after,'branches':[{k:b[k] for k in ['label','commit','parentSourceCommit','localRef','actualChangedPaths']} for b in result['branches']]},indent=2))

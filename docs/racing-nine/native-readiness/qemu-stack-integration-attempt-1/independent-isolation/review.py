from pathlib import Path,PurePosixPath
import os,subprocess,json,hashlib,re,ast,fnmatch
R=Path('/dev/shm/puretv-submit');S=Path(__file__).parent;P='467670b4e43189dc8fc4786a5c6b3a14b6f9b2bd';E={**os.environ,'GIT_NO_LAZY_FETCH':'1','GIT_TERMINAL_PROMPT':'0'}
def git(*args):return subprocess.check_output(['git',*args],cwd=R,env=E)
def h(b):return hashlib.sha256(b).hexdigest()
def old(path):return git('show',P+':'+path)
plan=json.loads(Path('/dev/shm/racing-native-readiness/qemu-stack-integration-attempt-2/overlay-plan.json').read_text());assert plan['parent']==P
paths=[x['path'] for x in plan['overlay']];assert len(paths)==len(set(paths))==6
roots=['.github/workflows/joystick-catalog-android-runtime.yml','joystick-games/qa/android','joystick-games/tools','puretv-joystick/joystick_sdk.py','tools/resource_catalog.py','resource/game-kit/build.py','resource/game-kit/src/main/java','joystick-games/catalog-registry.json','joystick-games/ponpoko-kart/qa-plan.json','joystick-games/backroad-rally/game.json']
raw=git('ls-tree','-r','-z',P,'--',*roots);parent={}
for rec in raw.split(b'\0'):
 if not rec:continue
 meta,path=rec.decode().split('\t');mode,typ,blob=meta.split();parent[path]={'mode':mode,'type':typ,'blob':blob}
view=dict(parent);sources={};over=[]
for item in plan['overlay']:
 path=item['path'];b=(R/path).read_bytes();assert len(b)==item['bytes'] and h(b)==item['sha256'],('source changed',path)
 p=S/'overlay'/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);sources[path]=b
 exists=path in parent;assert exists==item['parentExists']
 if exists:assert h(old(path))==item['parentSha256']
 view[path]={'mode':parent[path]['mode'] if exists else '100644','type':'blob','overlaySha256':h(b)};over.append(item)
def data(path):
 if path not in sources:sources[path]=old(path)
 return sources[path]
workflow=data(paths[0]).decode();previous=old(paths[0]).decode()
# Workflow literal Python scripts, including every preflight and run/export entrypoint.
called=sorted(set(re.findall(r'python3(?: -B)? (joystick-games/[\w./-]+\.py)',workflow)))
for p in called:assert p in view and view[p]['type']=='blob',p;ast.parse(data(p),filename=p)
qaexports={p for p in view if p.startswith('joystick-games/qa/android/') and (p.endswith('.py') or p.endswith('.java') or (p.startswith('joystick-games/qa/android/fixtures/') and p.count('/')==4 and p.endswith('.json')))}
toolexports={p for p in view if p.startswith('joystick-games/tools/android-') and p.count('/')==2 and p.endswith('.py')}
fixtureexports={p for p in view if p.startswith('joystick-games/tools/fixtures/android-runtime-artifact/') and p.count('/')==4 and p.endswith('.json')}
explicit={'joystick-games/tools/artifact-draft-transfer.py','joystick-games/tools/asset-policy.py','puretv-joystick/joystick_sdk.py','tools/resource_catalog.py','.github/workflows/joystick-catalog-android-runtime.yml','joystick-games/catalog-registry.json','joystick-games/tools/qa-plan.py','joystick-games/ponpoko-kart/qa-plan.json'}
assert explicit<=view.keys()
exports=sorted(qaexports|toolexports|fixtureexports|explicit)
assert set(paths)<=set(exports);assert 'joystick-games/qa/android/test_qemu_stack.py' not in view
# All new local imports/reads are helper/supervisor/test/workflow paths within these six overlays.
newdeps={
 'joystick-games/tools/android-emulator-supervisor.py':['joystick-games/tools/android-qemu-stack.py','joystick-games/qa/android/test_qemu_permission.py'],
 'joystick-games/tools/android-qemu-stack.py':[],
 'joystick-games/qa/android/test_emulator_supervisor.py':['joystick-games/tools/android-emulator-supervisor.py','.github/workflows/joystick-catalog-android-runtime.yml'],
 'joystick-games/qa/android/test_qemu_permission.py':['joystick-games/tools/android-qemu-stack.py','joystick-games/tools/android-emulator-supervisor.py'],
 'joystick-games/qa/android/test_qemu_stack_integration.py':['joystick-games/tools/android-qemu-stack.py']}
for p,deps in newdeps.items():
 ast.parse(data(p),filename=p)
 for dep in deps:assert dep in view and dep in exports
preserve=['joystick-games/qa/android/run.py','joystick-games/qa/android/test_runner.py','joystick-games/ponpoko-kart/qa-plan.json','puretv-joystick/joystick_sdk.py','joystick-games/qa/android/src/com/ecojust/controllerqa/Observer.java','joystick-games/tools/android-catalog.py','joystick-games/tools/android-runtime-inputs.py','joystick-games/tools/android-runtime-copies.py','joystick-games/tools/android-environment-diagnostics.py','joystick-games/qa/android/install_failure.py','joystick-games/qa/android/install_confirmation.py']
unchanged=[]
for p in preserve:
 assert p in parent and p not in paths
 b=old(p);unchanged.append({'path':p,'gitBlob':parent[p]['blob'],'bytes':len(b),'sha256':h(b),'candidateOrigin':'sole parent, no overlay'})
# Explicit check that Back readiness and Night/new main runner are not imported by this recipe.
parent_runner=old(preserve[0]);live_runner=(R/preserve[0]).read_bytes()
assert parent_runner!=live_runner
# The native environment options and default game SDK command must remain exact v8 lines.
keys=['emulator-build:','api-level:','target: android-tv','arch: x86_64','profile:','avd-name:','force-avd-creation:','disable-animations:','emulator-options:']
options=[]
for key in keys:
 a=[x.strip() for x in previous.splitlines() if x.strip().startswith(key)];b=[x.strip() for x in workflow.splitlines() if x.strip().startswith(key)];assert a==b and len(a)==1,(key,a,b);options+=a
for value in ['8f283c73f52f857777306eafc88f710262367834','44597115244','4249f5c0ec3053a1dec652a7880a040e1bb143f0']:
 assert value in previous and value in workflow
# Parent source trees retained by construction; this is a recipe, not a Git tree/commit creation.
trees=[]
for p in ['resource/game-kit','joystick-games/shared','joystick-games/ponpoko-kart/src','joystick-games/ponpoko-kart/dist']:
 assert not any(x.startswith(p+'/') or x==p for x in paths)
 line=git('ls-tree',P,'--',p).decode().strip();assert line;trees.append({'path':p,'parentTreeEntry':line,'candidateUnchanged':True})
supervisor='joystick-games/tools/android-emulator-supervisor.py'
pa=ast.parse(old(supervisor));ca=ast.parse(data(supervisor));ast_checks={}
for name in ['disable_vulkan','enabled','expected_arguments']:
 a=next(x for x in pa.body if isinstance(x,ast.FunctionDef) and x.name==name)
 b=next(x for x in ca.body if isinstance(x,ast.FunctionDef) and x.name==name)
 ast_checks[name]=ast.dump(a,include_attributes=False)==ast.dump(b,include_attributes=False);assert ast_checks[name]
def args_node(tree):
 return next(x for x in tree.body if isinstance(x,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='EXPECTED_ARGS' for t in x.targets))
assert ast.dump(args_node(pa),include_attributes=False)==ast.dump(args_node(ca),include_attributes=False)
original_arguments=ast.literal_eval(args_node(pa).value)+['-feature','-Vulkan']
result={'status':'passed-static-isolated-closure','parent':P,'scope':'Static six-file candidate overlay only; no Git tree/ref/commit/native process/CI created. Existing tests were not rerun. Actual PR_SET_PTRACER local EINVAL remains blocked and CI mandatory real gate must pass before AVD.','overlay':over,'workflowPythonEntrypoints':called,'newLocalDependencies':newdeps,'executedSourceExportPaths':exports,'allSixOverlayFilesExported':True,'oldCoreTestNotRequiredOrIncluded':True,'preservedParentFiles':unchanged,'preservedParentTrees':trees,'unchangedNativeEnvironmentLines':options,'unchangedSupervisorFunctionsAst':ast_checks,'unchangedExactSupervisedVulkanArguments':original_arguments,'liveMainRunnerExcluded':{'liveSha256':h(live_runner),'parentSha256':h(parent_runner),'reason':'Only exact parent run.py is used; no later Back readiness or unrelated QA imports.'},'commandsNotRun':['git write-tree','git commit-tree','git update-ref','workflow dispatch','native emulator launch','original APK rebuild/sign'],'sourceHashesStableAtEnd':all(h((R/x['path']).read_bytes())==x['sha256'] for x in over)}
assert result['sourceHashesStableAtEnd'];(S/'review.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':result['status'],'overlay':len(over),'workflowEntrypoints':len(called),'exportPaths':len(exports),'preservedFiles':len(unchanged),'reviewSha256':h((S/'review.json').read_bytes())}))

import importlib.util,json,subprocess,hashlib,os,datetime,traceback
from pathlib import Path
root=Path('/dev/shm/puretv-submit');out=Path('/dev/shm/racing-review-karts/native-input-preflight');frozen='8f283c73f52f857777306eafc88f710262367834'
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
def module(name,file):
 s=importlib.util.spec_from_file_location(name,root/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
mods={'android':module('android_build_audit','joystick-games/tools/android-build.py'),'macos':module('macos_build_audit','joystick-games/tools/macos-build.py'),'windows':module('windows_inputs_audit','joystick-games/tools/windows-inputs.py')}
registry=json.loads((root/'joystick-games/catalog-registry.json').read_text());games=sum([registry['batches'][x] for x in ['racing-01','racing-02','racing-03']],[])
tracked=set(subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0'))
def tree(commit):
 rows=subprocess.check_output(['git','ls-tree','-r','-z',commit],cwd=root).split(b'\0');result={}
 for row in rows:
  if not row:continue
  info,name=row.split(b'\t',1);mode,kind,sha=info.decode().split();result[name.decode()]={'mode':mode,'type':kind,'sha':sha}
 return result
frozen_tree=tree(frozen);head_tree=tree(head);report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'frozenSource':frozen,'reviewHead':head,'nice':os.getpriority(os.PRIO_PROCESS,0),'method':'Invoke existing native source-selection functions read-only, without package builds or unit tests. Compare actual game source/dist files with git index and frozen trees.','games':[]}
for game in games:
 base=root/'joystick-games'/game;entry={'game':game,'selectors':{}};paths=[];caches=[];symlinks=[]
 for name in ('src','dist'):
  for directory,dirs,files in os.walk(base/name,followlinks=False):
   for part in list(dirs):
    p=Path(directory)/part
    if part in {'node_modules','__pycache__','.cache','.git'}:caches.append(str(p.relative_to(root)))
    if p.is_symlink():symlinks.append(str(p.relative_to(root)));dirs.remove(part)
   paths.extend(Path(directory)/n for n in files)
 entry['sourceCacheDirectories']=caches;entry['sourceSymlinks']=symlinks
 required=['game.json','package.json','package-lock.json','build.mjs','qa-plan.json','NOTICE.md']
 entry['missingRequired']=[n for n in required if not (base/n).is_file()]
 for platform,mod in mods.items():
  try:
   selected=mod.sources(game) if platform=='android' else mod.inputs(base) if platform=='macos' else mod.file_records(mod.select(game))
   missing_index=sorted(set(selected)-tracked);missing_head=sorted(set(selected)-set(head_tree));missing_frozen=sorted(set(selected)-set(frozen_tree))
   entry['selectors'][platform]={'status':'selected','files':len(selected),'notInIndex':missing_index,'notInHead':missing_head,'notInFrozen':missing_frozen}
  except Exception as error:entry['selectors'][platform]={'status':'failed','error':str(error),'exceptionType':type(error).__name__}
 actual={p.relative_to(root).as_posix():p for p in paths if p.is_file() and not p.is_symlink()};dist={n:p for n,p in actual.items() if n.startswith('joystick-games/'+game+'/dist/')}
 untracked=sorted(set(actual)-tracked)
 ignored=subprocess.run(['git','check-ignore','--stdin'],cwd=root,input='\n'.join(untracked)+'\n',text=True,capture_output=True).stdout.splitlines() if untracked else []
 changed_frozen=[];changed_head=[]
 for n,p in actual.items():
  data=p.read_bytes();blob=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
  if n in frozen_tree and blob!=frozen_tree[n]['sha']:changed_frozen.append(n)
  if n in head_tree and blob!=head_tree[n]['sha']:changed_head.append(n)
 entry.update(actualSourceAndDistFiles=len(actual),actualDistFiles=len(dist),actualDistBytes=sum(p.stat().st_size for p in dist.values()),sourceOrDistNotInIndex=untracked,ignoredSourceOrDist=ignored,changedVersusFrozen=changed_frozen,changedVersusHead=changed_head,trackedSourceOrDistMissingLocally=sorted(n for n in tracked if n.startswith(('joystick-games/'+game+'/src/','joystick-games/'+game+'/dist/')) and not (root/n).exists()))
 report['games'].append(entry);(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'game':game,'selectors':{k:v['status']+(': '+v.get('error','')) for k,v in entry['selectors'].items()},'missingRequired':entry['missingRequired'],'caches':caches,'symlinks':symlinks,'untrackedGameFiles':len(untracked),'ignoredGameFiles':len(ignored),'changedVsFrozen':len(changed_frozen),'changedVsHead':len(changed_head)}),flush=True)
report['headAfter']=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip();report['finishedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')

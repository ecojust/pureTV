from pathlib import Path
import ast,copy,difflib,hashlib,json,subprocess
R=Path('/dev/shm/puretv-submit');S=Path(__file__).parent;C=S/'candidate'
BASE='6c7cb4fdb99dce236b634c842326bae6aed5f232';TAP='f3e1e9f6634e35d1c9ae0cfbf1f8a51d42de7965';WIN='039d210cfa4cc65f59adf0859a777f3591853a70'
def blob(n,c=BASE):return subprocess.check_output(['git','show',c+':'+n],cwd=R)
def sig(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def tree(s):return ast.parse(s)
def dump(x):return ast.dump(x,include_attributes=False)
def klass(t,n):return next(x for x in t.body if isinstance(x,ast.ClassDef) and x.name==n)
def funcs(c):return {x.name:x for x in c.body if isinstance(x,ast.FunctionDef)}
paths=['joystick-games/kart-royale/qa-plan.json','joystick-games/qa/android/run.py','joystick-games/qa/android/test_runner.py']
old=tree(blob(paths[1]));new=tree((C/paths[1]).read_bytes());tap=tree(blob(paths[1],TAP));of=funcs(klass(old,'Acceptance'));nf=funcs(klass(new,'Acceptance'));tf=funcs(klass(tap,'Acceptance'))
added=set(nf)-set(of);assert added=={'menu_player','menu_released','menu_wire_pair','catalog_menu_tap'}
for n in set(of)-{'catalog_scenarios'}:assert dump(of[n])==dump(nf[n]),n
ob=of['catalog_scenarios'];nb=copy.deepcopy(nf['catalog_scenarios']);loop=next(x for x in nb.body if isinstance(x,ast.For));branch=loop.body[2];assert isinstance(branch,ast.If) and ast.unparse(branch.test)=="step.get('menuTap') is True";loop.body.pop(2);assert dump(ob)==dump(nb)
for n in added-{'catalog_menu_tap'}:assert dump(nf[n])==dump(tf[n])
reference=copy.deepcopy(tf['catalog_menu_tap'])
class StrictOnly(ast.NodeTransformer):
 def visit_Assign(self,node):
  if len(node.targets)==1 and isinstance(node.targets[0],ast.Name):
   if node.targets[0].id=='basis':node.value=ast.Constant(None)
   elif node.targets[0].id=='fresh':node.value=ast.parse('self.frame_advanced(state, before)',mode='eval').body
  return self.generic_visit(node)
reference=StrictOnly().visit(reference);assert dump(reference)==dump(nf['catalog_menu_tap'])
# Remove only our four helpers and dispatch: the complete old runner AST remains.
recovered=copy.deepcopy(new);rc=klass(recovered,'Acceptance');rc.body=[n for n in rc.body if not isinstance(n,ast.FunctionDef) or n.name not in added];i=next(i for i,n in enumerate(rc.body) if isinstance(n,ast.FunctionDef) and n.name=='catalog_scenarios');rc.body[i]=nb;assert dump(old)==dump(recovered)
ot=tree(blob(paths[2]));nt=tree((C/paths[2]).read_bytes());newclass=klass(nt,'MenuTapContracts');nt.body.remove(newclass);assert dump(ot)==dump(nt)
oldtests=sum(isinstance(f,ast.FunctionDef) and f.name.startswith('test_') for n in ot.body if isinstance(n,ast.ClassDef) for f in n.body);newtests=sum(isinstance(n,ast.FunctionDef) and n.name.startswith('test_') for n in newclass.body);assert (oldtests,newtests)==(44,10)
op=json.loads(blob(paths[0]));np=json.loads((C/paths[0]).read_text());changes=[]
for i,(a,b) in enumerate(zip(op['steps'],np['steps'])):
 if a==b:continue
 assert i in range(2,8);assert b['menuTap'] is True;assert b['expect'][:-1]==a['expect'];extra=b['expect'][-1];assert extra['path']=='gameplay.focus' and extra['op']=='eq'
 fixed=copy.deepcopy(b);del fixed['menuTap'];fixed['expect'].pop();assert fixed==a;changes.append({'index':i,'name':b['name'],'focus':extra['value'],'timeoutSeconds':b['timeoutSeconds'],'holdMs':b['holdMs']})
assert len(changes)==6;unpatched=copy.deepcopy(np);unpatched['steps']=op['steps'];assert op==unpatched
assert not any('windowsStartupWait' in s for s in np['steps']);assert all(s.get('timeoutSeconds')==60 for s in np['steps'])
receipt=json.loads((R/'joystick-games/kart-royale/docs/android-package-audit-44616011172/original-small-export/packages/kart-royale/signing-receipt.json').read_text());frozen={}
for n,v in receipt['sourceInputs'].items():
 assert sig(blob(n))==v
 if n!=paths[0]:assert sig((C/n).read_bytes())==v
 frozen[n]=v
inventory=json.loads((S/'original-file-inventory.json').read_text());changed=[]
for n,v in inventory.items():
 assert sig(blob(n))==v
 if sig((C/n).read_bytes())!=v:changed.append(n)
assert set(changed)==set(paths)
fixture=json.loads((R/'joystick-games/kart-royale/tests/fixtures/menu-focus-original-failures.json').read_text());samples=[]
reports={m:json.loads((R/f'joystick-games/kart-royale/docs/menu-plan-windows-44621752383/original-{m}-report.json').read_text()) for m in ['normal','occupied']}
# Recursively locate exact original gameplay objects, retaining report SHA identity.
def contains(v,needle):
 if v==needle:return True
 if isinstance(v,dict):return any(contains(x,needle) for x in v.values())
 if isinstance(v,list):return any(contains(x,needle) for x in v)
 return False
for row in fixture['cases']:
 p=R/f"joystick-games/kart-royale/docs/menu-plan-windows-44621752383/original-{row['mode']}-report.json";assert sig(p.read_bytes())==row['originalReport'];assert contains(reports[row['mode']],row['snapshot'])
 samples.append({'mode':row['mode'],'name':row['name'],'originalReport':row['originalReport'],'gameplay':{k:row['snapshot']['gameplay'][k] for k in ['menu','focus']}})
# Match the embedded selected fields to the verified original reports exactly.
method=funcs(newclass)['test_all_twelve_original_windows_stale_focus_samples_fail_new_plan'];assignment=next(n for n in method.body if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id=='cases');assert json.loads(assignment.value.args[0].value)==samples
same_menu={}
for n in ['src/src/ui/ControlsMenu.ts','src/src/ui/Menus.ts','src/src/input/ControlPrefs.ts']:
 p='joystick-games/kart-royale/'+n
 try:a=blob(p);b=blob(p,WIN)
 except subprocess.CalledProcessError:continue
 assert a==b,p;same_menu[p]=sig(a)
assert len(same_menu)>=2
forbidden=['NIGHT_LOW','menu_reload_basis','install_confirmation','windowsStartupWait']
assert not any(x in (C/paths[1]).read_text() for x in forbidden)
summary={'status':'passed-candidate-static-boundaries','originalSource':BASE,'genericTapSource':TAP,'overlay':{n:sig((C/n).read_bytes()) for n in paths},'originalSupportFiles':len(inventory),'exactlyThreeChangedFiles':True,'originalSignedSourceInputs':len(frozen),'protectedOriginalInputsUnchanged':len(frozen)-1,'allowedSourceInputChange':paths[0],'oldRunnerCompleteAstUnchangedExceptFourHelpersAndDispatch':True,'threeHelpersExactF3Ast':True,'catalogMenuTapExactF3AstExceptRemovalOfReloadException':True,'oldTestSuiteCompleteAstUnchanged':True,'oldTests':oldtests,'newTests':newtests,'allTwentyOriginalTimeoutsRemain60Seconds':True,'changes':changes,'originalLegacyMenuTapFlags':sum(s.get('menuTap') is True for s in op['steps']),'candidateMenuTapFlags':sum(s.get('menuTap') is True for s in np['steps']),'originalRunnerDidNotImplementMenuTap':not any(n in of for n in added),'verifiedOriginalWindowsSamples':samples,'menuSourceIdenticalBetweenOriginalAndroidAndFailureWindows':same_menu,'runtimeWorkflowUnchanged':sig((C/'.github/workflows/joystick-catalog-android-runtime.yml').read_bytes()),'noNativeExecution':True,'vulkanDecisionSeparate':True}
(S/'static-boundaries.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n');(S/'candidate-three-files.json').write_text(json.dumps(summary['overlay'],indent=2)+'\n');(S/'source.diff').write_text(''.join(''.join(difflib.unified_diff(blob(n).decode().splitlines(True),(C/n).read_text().splitlines(True),fromfile=BASE+'/'+n,tofile='candidate/'+n)) for n in paths));print(json.dumps({k:summary[k] for k in ['status','originalSupportFiles','originalSignedSourceInputs','oldTests','newTests']}))

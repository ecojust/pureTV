"""Synthetic integration of the actual shared menuTap and Windows fresh override.
No game process, renderer, network server, package or CI run is executed.
"""
import copy,hashlib,importlib.util,json,pathlib
ROOT=pathlib.Path('/dev/shm/puretv-submit')
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
fixture=load('actual_menu_unit_fixture',ROOT/'joystick-games/shared/macos/tests/native-observation.test.py')
windows=load('actual_windows_verifier',ROOT/'joystick-games/tools/windows-verify.py')
def prepared():
 t=fixture.MenuTap('test_release_precedes_observation_and_two_post_reload_polls_are_required');t.setUp()
 c=object.__new__(windows.WindowsCheck);c.__dict__.update(t.check.__dict__);c.renderers=['webgl2'];t.check=c
 original=t.state
 def state(timestamp,polls,focus='target',count=1,epoch=1,stage='menu',phase='menu'):
  s=original(timestamp,polls,focus,count);s.update(ready=True,documentEpoch=epoch,document={'epoch':epoch});s['game'].update(stage=stage,paused=False,renderer='webgl2',webglVersion=2,frames=polls);s['game']['gameplay']['phase']=phase;return s
 t.state=state;t.before=state(10,100,'before',count=0);return t
cases=[]
t=prepared();t.states=[t.state(11,101),t.state(12,102),t.state(13,103)];result=t.invoke();assert result['stableFreshSamples']==2;cases.append({'case':'same document, actual shared helper with Windows override','status':'passed','nativeExecuted':False})
t=prepared();t.step['expect']=[{'path':'stage','op':'eq','value':'playing'},{'path':'gameplay.phase','op':'eq','value':'running'}];t.step['timeoutSeconds']=1
t.states=[t.state(11,2,epoch=2,stage='playing',phase='warmup'),t.state(12,3,epoch=2,stage='playing',phase='countdown'),t.state(13,4,epoch=2,stage='playing',phase='running'),t.state(14,5,epoch=2,stage='playing',phase='running'),t.state(15,6,epoch=2,stage='playing',phase='running')]
result=t.invoke();record=t.check.report['menuTapObservations'][0];assert t.reads==5 and result['stableFreshSamples']==2;assert [s['qualified'] for s in record['samples']]==[False,False,True,True,True];cases.append({'case':'new query document resets polls and waits through real-plan warmup/countdown predicates','status':'passed','readSamples':t.reads,'nativeExecuted':False})
for name,mutate in [('old DOM mislabeled with new native epoch',lambda s:s['document'].update(epoch=1)),('different owner',lambda s:s['input']['players'][0].update(controllerId='other')),('extra key counted',lambda s:s['input']['players'][0]['buttonCounters'].update(A=1))]:
 t=prepared();t.states=[t.state(11,2,epoch=2),t.state(12,3,epoch=2),t.state(13,4,epoch=2)]
 for s in t.states:mutate(s)
 try:t.invoke();raise RuntimeError('Incorrect acceptance: '+name)
 except AssertionError as error:assert 'two fresh game frames' in str(error)
 assert t.check.report['menuTapObservations'][0]['status']=='failed';cases.append({'case':name,'status':'correctly_rejected','nativeExecuted':False})
t=prepared();t.states=[t.state(11,2,epoch=2),t.state(12,3,epoch=2)]
try:t.invoke();raise RuntimeError('One new poll was accepted')
except AssertionError as error:assert 'two fresh game frames' in str(error)
cases.append({'case':'one new poll after a post-reload baseline','status':'correctly_rejected','nativeExecuted':False})
paths=['joystick-games/tools/macos-verify.py','joystick-games/tools/windows-verify.py','joystick-games/tools/qa-plan.py','joystick-games/shared/macos/tests/native-observation.test.py']
print(json.dumps({'status':'passed','scope':'Synthetic shared-helper/Windows-epoch integration only','cases':cases,'files':{name:{'bytes':(ROOT/name).stat().st_size,'sha256':hashlib.sha256((ROOT/name).read_bytes()).hexdigest()} for name in paths}},indent=2))

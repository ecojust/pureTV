#!/usr/bin/env python3
"""Reject stale native diagnostics even if their cached values look correct."""
import copy,importlib.util,json,socket,tempfile,threading,time,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('macverify',Path(__file__).resolve().parents[3]/'tools/macos-verify.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class Observation(unittest.TestCase):
 def test_blocker_reuses_port_after_a_closed_connection(self):
  listener=module.port_blocker(0);port=listener.getsockname()[1]
  client=socket.create_connection(('127.0.0.1',port));peer,_=listener.accept()
  try:
   peer.shutdown(socket.SHUT_WR);self.assertEqual(client.recv(1),b'')
   client.close();self.assertEqual(peer.recv(1),b'')
  finally:client.close();peer.close();listener.close()
  blocker=module.port_blocker(port)
  try:
   self.assertEqual(blocker.getsockname()[1],port)
   # Darwin exposes this boolean socket option as a nonzero bit (4); Linux
   # returns 1. The real close/rebind check above verifies its behavior.
   self.assertNotEqual(blocker.getsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR),0)
   if hasattr(socket,'SO_REUSEPORT'):self.assertEqual(blocker.getsockopt(socket.SOL_SOCKET,socket.SO_REUSEPORT),0)
  finally:blocker.close()
 def test_blocker_never_shares_an_active_listener(self):
  listener=module.port_blocker(0)
  try:
   with self.assertRaises(OSError):module.port_blocker(listener.getsockname()[1])
   listener.settimeout(2)
   client=socket.create_connection(('127.0.0.1',listener.getsockname()[1]));peer,_=listener.accept()
   client.close();peer.close()
  finally:listener.close()
 def test_a_new_diagnostic_is_not_a_new_game_frame(self):
  check=object.__new__(module.Check)
  before={'timestamp':10,'game':{'controller':{'pollCount':40}}}
  same_frame={'timestamp':11,'game':{'controller':{'pollCount':40}}}
  stale_file={'timestamp':10,'game':{'controller':{'pollCount':41}}}
  consumed={'timestamp':11,'game':{'controller':{'pollCount':41}}}
  self.assertFalse(check.fresh(same_frame,before,True));self.assertFalse(check.fresh(stale_file,before,True));self.assertTrue(check.fresh(consumed,before,True))
  # Background native transport checks remain meaningful while RAF is stopped.
  self.assertTrue(check.fresh(same_frame,before,False))
 def test_cf_waits_for_renderer_and_consumed_frame(self):
  state={'game':'cf-transport-ship','stage':'loading','ready':False,'controller':{'pollCount':1}}
  self.assertEqual(module.initialization(state),'pending')
  state.update(stage='menu',webglVersion='WebGL 2.0 (WebKit)')
  self.assertEqual(module.initialization(state),'pending')
  state['ready']=True;state['controller']['pollCount']=0
  self.assertEqual(module.initialization(state),'pending')
  state['controller']['pollCount']=1
  self.assertEqual(module.initialization(state),'ready')
 def test_qq_waits_for_map_and_actual_render(self):
  state={'game':'qq-speed','stage':'menu','loading':True,'webglVersion':'WebGL 2.0 (WebKit)','controller':{'pollCount':1},'render':{'calls':1,'triangles':300}}
  self.assertEqual(module.initialization(state),'pending')
  state['loading']=False;state['render']['calls']=0
  self.assertEqual(module.initialization(state),'pending')
  state['render']['calls']=1
  self.assertEqual(module.initialization(state),'ready')
 def test_only_exact_graphics_error_is_limited(self):
  prefix='无法启动 3D 游戏：需要支持 WebGL 2 的系统 WebView。'
  for message in ['Error creating WebGL context.',prefix+' Error creating WebGL context.']:
   self.assertEqual(module.initialization({'stage':'error','webglError':True,'message':message}),'webgl_unavailable')
  for message in ['',prefix+' ReferenceError: undefined is not an object','WebGL material undefined','Failed to load texture']:
   self.assertEqual(module.initialization({'stage':'error','webglError':True,'message':message}),'initialization_error')
 def test_precision_failure_requires_independent_repeated_observation(self):
  game={'stage':'error','error':"null is not an object (evaluating 'r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision')"}
  self.assertEqual(module.initialization(game),'initialization_error')
  probe={'status':'complete','webgl2ContextCreated':True,'samples':[{'vertexHighFloat':None} for _ in range(3)]}
  self.assertEqual(module.initialization(game,probe),'webgl_incomplete')
  for bad in [{'status':'timeout'},dict(probe,samples=probe['samples'][:2]),dict(probe,samples=[{'vertexHighFloat':{'precision':23}}]*3),dict(probe,samples=[{'vertexHighFloat':None,'error':'script broke'}]*3)]:
   self.assertEqual(module.initialization(game,bad),'initialization_error')
  self.assertEqual(module.initialization({'stage':'error','message':'TypeError: failed'},probe),'initialization_error')
 def test_cf_start_accepts_actual_pause_with_cleared_semantic_cache(self):
  fixture=json.loads((Path(__file__).parent/'fixtures/cf-start-pause-44120745068.json').read_text());before=fixture['before'];after=fixture['after'];check=object.__new__(module.Check)
  self.assertFalse(after['game']['controller']['buttons']['START'])
  self.assertTrue(check.start_transition_observed(after,before,check.paused))
  mutations=[('timestamp',before['timestamp']),('pollCount',before['game']['controller']['pollCount']),('session','different-session'),('controllerId','different-controller'),('count',before['input']['players'][0]['buttonCounters']['START']),('held',False),('paused',False)]
  for field,value in mutations:
   bad=copy.deepcopy(after)
   if field=='timestamp':bad['timestamp']=value
   elif field=='pollCount':bad['game']['controller']['pollCount']=value
   elif field in ['session','controllerId']:bad['input']['players'][0][field]=value
   elif field=='count':bad['input']['players'][0]['buttonCounters']['START']=value
   elif field=='held':bad['input']['players'][0]['buttons']['START']=value
   else:bad['game']['stage']='playing';bad['game']['paused']=False
   with self.subTest(field=field):self.assertFalse(check.start_transition_observed(bad,before,check.paused))
 def test_real_sdk_barrier_drains_delayed_replies_before_disconnect(self):
  sdk_spec=importlib.util.spec_from_file_location('unchanged_sdk',module.SDK);sdk=importlib.util.module_from_spec(sdk_spec);sdk_spec.loader.exec_module(sdk)
  server=socket.socket();server.bind(('127.0.0.1',0));server.listen(1);errors=[]
  def receiver():
   peer,_=server.accept()
   try:
    with peer.makefile('rb') as stream:
     for line in stream:
      message=json.loads(line);time.sleep(.005);peer.sendall((json.dumps({'type':'ack','seq':message['seq']})+'\n').encode())
   except Exception as error:errors.append(str(error))
   finally:peer.close()
  worker=threading.Thread(target=receiver,daemon=True);worker.start()
  report={'wire':[],'observerErrors':[],'observerConnectionEnds':[]};proxy=module.Observer(server.getsockname(),report);client=sdk.JoystickClient('127.0.0.1',proxy.port)
  check=object.__new__(module.Check);check.client=client;check.proxy=proxy;check.report=report
  try:
   client.connect()
   for key in module.KEYS:client.button(key,'tap',duration=100)
   client.button('A','down')
   with client.lock:
    barrier=check.ping_ack();client.disconnect()
   sent={(r['connection'],r['message']['seq']) for r in report['wire'] if r['direction']=='sdk-to-game'}
   acks={(r['connection'],r['message']['seq']) for r in report['wire'] if r['direction']=='game-to-sdk'}
   self.assertEqual(sent,acks);self.assertIn((1,barrier),acks);self.assertEqual(len(sent),21)
  finally:client.disconnect();proxy.close();server.close();worker.join(timeout=3)
  self.assertFalse(errors)
 def test_ack_requires_observed_ping_on_same_connection(self):
  old={'connection':1,'direction':'game-to-sdk','message':{'type':'ack','seq':31}}
  sent={'connection':2,'direction':'sdk-to-game','message':{'type':'ping','seq':31}}
  ack={'connection':2,'direction':'game-to-sdk','message':{'type':'ack','seq':31}}
  self.assertFalse(module.acknowledged_ping([old],31))
  self.assertFalse(module.acknowledged_ping([old,sent],31))
  self.assertFalse(module.acknowledged_ping([ack],31))
  self.assertTrue(module.acknowledged_ping([old,sent,ack],31))
class ScreenshotObservation(unittest.TestCase):
 def setUp(self):
  temporary=tempfile.TemporaryDirectory();self.addCleanup(temporary.cleanup)
  self.check=object.__new__(module.Check);self.check.out=Path(temporary.name);self.check.diag=self.check.out/'diagnostics';self.check.diag.mkdir()
  self.check.report={'screenshots':[]};self.check.app=SimpleNamespace(poll=lambda:None)
  self.clock=0.;self.callback=lambda:None;self.png=b'\x89PNG\r\n\x1a\n'+b'fixture pixels'*100
  self.state={'timestamp':10,'ready':True,'active':True,'processArchitecture':'arm64','game':{'renderer':'webgl2','frames':12,'paused':True,'controller':{'pollCount':20}}}
  (self.check.diag/'state.json').write_text(json.dumps(self.state))
 def sleep(self,seconds):self.clock+=seconds;self.callback()
 def capture(self,name='reconnected.png'):
  with patch.object(module.time,'monotonic',side_effect=lambda:self.clock),patch.object(module.time,'sleep',side_effect=self.sleep):self.check.screenshot(name)
 def journal(self,name='reconnected'):return [json.loads(line) for line in (self.check.out/('screenshot-'+name+'.log')).read_text().splitlines()]
 def test_late_png_uses_one_request_and_preserves_callback_unknown(self):
  request=self.check.diag/'screenshot-request.txt';output=self.check.diag/'reconnected.png';seen=[]
  def advance():
   if self.clock>=2 and request.exists():seen.append(request.read_text());request.unlink()
   if self.clock>=25 and not output.exists():output.write_bytes(self.png)
  self.callback=advance;self.capture();attempt=self.check.report['screenshotObservations'][0]
  self.assertEqual(seen,['reconnected.png']);self.assertEqual(attempt['requestsWritten'],1)
  self.assertEqual(attempt['status'],'captured');self.assertGreater(attempt['elapsedSeconds'],20);self.assertLess(attempt['elapsedSeconds'],60)
  self.assertFalse(attempt['nativeCallbackObserved']);self.assertFalse(attempt['hostCallbackReportingAvailable'])
  self.assertIn('request_consumed',[row['event'] for row in self.journal()]);self.assertEqual(self.check.report['screenshots'][0]['sha256'],module.hashlib.sha256(self.png).hexdigest())
 def test_missing_or_small_png_still_fails_at_bounded_deadline(self):
  def advance():
   if self.clock>=2:(self.check.diag/'reconnected.png').write_bytes(b'\x89PNG\r\n\x1a\n')
  self.callback=advance
  with self.assertRaisesRegex(AssertionError,'after 60 seconds'):self.capture()
  self.assertLessEqual(self.clock,61.7);self.assertEqual(self.check.report['screenshots'],[])
  attempt=self.check.report['screenshotObservations'][0];self.assertEqual(attempt['status'],'failed');self.assertEqual(attempt['requestsWritten'],1)
  self.assertLessEqual(len(self.journal()),65)
 def test_preexisting_image_or_pending_request_cannot_satisfy_capture(self):
  output=self.check.diag/'reconnected.png';output.write_bytes(self.png)
  with self.assertRaisesRegex(AssertionError,'Pre-existing'):self.capture()
  self.assertEqual(self.check.report['screenshotObservations'][0]['requestsWritten'],0);output.unlink()
  (self.check.diag/'screenshot-request.txt').write_text('old.png')
  with self.assertRaisesRegex(AssertionError,'Previous screenshot request'):self.capture('another.png')
  self.assertEqual((self.check.diag/'screenshot-request.txt').read_text(),'old.png');self.assertEqual(self.check.report['screenshots'],[])
 def test_symlinked_output_is_rejected_without_reading_target(self):
  target=self.check.out/'original.png';target.write_bytes(self.png);output=self.check.diag/'reconnected.png'
  def advance():
   if self.clock>=2 and not output.is_symlink():output.symlink_to(target)
  self.callback=advance
  with self.assertRaisesRegex(AssertionError,'Symlinked screenshot'):self.capture()
  self.assertEqual(target.read_bytes(),self.png);self.assertEqual(self.check.report['screenshots'],[])
 def test_non_png_and_nonregular_outputs_fail(self):
  output=self.check.diag/'reconnected.png'
  self.callback=lambda:output.write_bytes(b'not a PNG'*200) if self.clock>=2 else None
  with self.assertRaisesRegex(AssertionError,'Invalid native PNG'):self.capture()
  output.unlink();(self.check.diag/'screenshot-request.txt').unlink();self.clock=0
  self.callback=lambda:output.mkdir(exist_ok=True) if self.clock>=2 else None
  with self.assertRaisesRegex(AssertionError,'Nonregular screenshot'):self.capture()
  self.assertEqual(self.check.report['screenshots'],[])
 def test_process_exit_preserves_failure_and_exit_status(self):
  self.check.app=SimpleNamespace(poll=lambda:7 if self.clock>=3 else None)
  with self.assertRaisesRegex(RuntimeError,'App exited.*7'):self.capture()
  self.assertLess(self.clock,4);self.assertIn('7',self.journal()[-1]['error']);self.assertEqual(self.check.report['screenshots'],[])
 def test_existing_diagnostic_error_and_parse_failure_are_recorded_as_observations(self):
  state=self.check.diag/'state.json';state.write_text('{partial')
  def advance():
   if self.clock>=3:
    self.state['diagnosticError']='original WK error';self.state['lastJavaScriptError']='original JS observation';self.state['game']['frames']=['large']*1000;state.write_text(json.dumps(self.state))
   if self.clock>=5:(self.check.diag/'reconnected.png').write_bytes(self.png)
  self.callback=advance;self.capture();rows=self.journal()
  self.assertTrue(any('stateReadError' in row for row in rows));states=[row['state'] for row in rows if 'state' in row]
  self.assertTrue(any(row.get('diagnosticError')=='original WK error' and row.get('lastJavaScriptError')=='original JS observation' for row in states))
  self.assertEqual(states[-1]['frames'],'<list>');self.assertFalse(self.check.report['screenshotObservations'][0]['nativeCallbackObserved'])
 def test_unsafe_name_does_not_write_a_request_or_journal(self):
  with self.assertRaisesRegex(AssertionError,'Unsafe screenshot'):self.capture('../other.png')
  self.assertFalse((self.check.diag/'screenshot-request.txt').exists());self.assertFalse(list(self.check.out.glob('screenshot-*')))
class MenuTap(unittest.TestCase):
 def setUp(self):
  self.check=object.__new__(module.CatalogCheck);self.check.held=set();self.check.report={'wire':[]};self.clock=0.;self.reads=0
  self.step={'name':'Choose menu item','keys':['DOWN'],'holdMs':100,'timeoutSeconds':.5,'menuTap':True,'expect':[{'path':'gameplay.focus','op':'eq','value':'target'}]}
  self.before=self.state(10,100,'before',count=0);self.states=[];outer=self
  class Client:
   identity='test-controller'
   def __init__(self):self.lock=threading.RLock();self._seq=0;self.unlockedSequenceReads=0;self.messages=[]
   @property
   def seq(self):
    # A deterministic competing-heartbeat fault if sequence attribution is
    # attempted outside the SDK lock after send returns.
    if not self.lock._is_owned():self.unlockedSequenceReads+=1;self._seq+=1
    return self._seq
   def button(self,key,action,duration=0):
    assert self.lock._is_owned();self._seq+=1;self.messages.append((key,action,outer.clock))
    outer.check.report['wire'].append({'at':module.datetime.datetime.fromtimestamp(outer.clock,module.datetime.timezone.utc).isoformat(),'connection':1,'direction':'sdk-to-game','message':{'type':'button','seq':self._seq,'key':key,'action':action,'pressed':action=='down','controller_id':self.identity}})
  self.check.client=Client();self.check.read=self.read
 def state(self,timestamp,polls,focus='target',count=1):
  buttons={k:False for k in module.KEYS};counts={k:count if k=='DOWN' else 0 for k in module.KEYS}
  return {'timestamp':timestamp,'input':{'players':[{'connected':True,'controllerId':'test-controller','session':'same-session','buttonCounters':counts,'buttons':dict(buttons)}]},'game':{'stage':'menu','controller':{'pollCount':polls,'buttons':dict(buttons)},'gameplay':{'focus':focus}}}
 def read(self):
  self.reads+=1;self.assertFalse(self.check.held,'A diagnostic read delayed release')
  self.assertEqual([row[1] for row in self.check.client.messages],['down','tap'])
  return copy.deepcopy(self.states.pop(0) if len(self.states)>1 else self.states[0])
 def sleep(self,seconds):self.clock+=seconds
 def invoke(self):
  with patch.object(module.time,'monotonic',side_effect=lambda:self.clock),patch.object(module.time,'sleep',side_effect=self.sleep):return self.check.menu_tap(self.step,self.before)
 def test_release_precedes_observation_and_two_post_reload_polls_are_required(self):
  self.states=[None,self.state(11,2),self.state(12,3),self.state(13,4)]
  result=self.invoke();self.assertTrue(result['menuTap']);self.assertEqual(result['stableFreshSamples'],2)
  self.assertAlmostEqual(self.check.client.messages[1][2]-self.check.client.messages[0][2],.016)
  record=self.check.report['menuTapObservations'][0];self.assertEqual(record['status'],'passed');self.assertEqual(record['observedWireHeldMs'],16)
  self.assertEqual(self.check.client.unlockedSequenceReads,0)
  self.assertFalse(self.check.fresh({'timestamp':11,'game':None},self.before,True))
 def test_cached_first_poll_then_only_one_new_poll_cannot_pass(self):
  self.states=[self.state(11,100),self.state(12,101)]
  with self.assertRaisesRegex(AssertionError,'two fresh game frames'):self.invoke()
  self.assertEqual(self.check.report['menuTapObservations'][0]['status'],'failed')
 def test_expectation_must_remain_stable_after_a_transient_match(self):
  self.states=[self.state(11,101),self.state(12,102,'wrong'),self.state(13,103),self.state(14,104),self.state(15,105)]
  self.invoke();self.assertEqual(self.reads,5)
 def test_exact_identity_counter_and_all_released_channels(self):
  good=self.state(11,101);self.assertTrue(self.check.menu_release_observed(good,self.before,'DOWN'))
  mutations=[lambda s:s['input']['players'][0].update(controllerId='other'),lambda s:s['input']['players'][0].update(session='other'),lambda s:s['input']['players'][0]['buttonCounters'].update(DOWN=2),lambda s:s['input']['players'][0]['buttonCounters'].update(A=1),lambda s:s['input']['players'][0]['buttonCounters'].update(DOWN=True),lambda s:s['input']['players'][0]['buttons'].update(A=True),lambda s:s['game']['controller']['buttons'].update(DOWN=True),lambda s:s['game']['controller']['buttons'].pop('Y'),lambda s:s.update(game=None)]
  for mutate in mutations:
   bad=copy.deepcopy(good);mutate(bad)
   with self.subTest(mutate=mutate):self.assertFalse(self.check.menu_release_observed(bad,self.before,'DOWN'))
 def test_noop_nonmenu_or_unreleased_semantics_send_nothing(self):
  original=copy.deepcopy(self.before)
  for mutate in (lambda s:s['game']['gameplay'].update(focus='target'),lambda s:s['game'].update(stage='playing'),lambda s:s['game']['controller']['buttons'].update(A=True),lambda s:s['input']['players'][0].update(controllerId='other')):
   self.before=copy.deepcopy(original);mutate(self.before)
   with self.assertRaises(AssertionError):self.invoke()
   self.assertEqual(self.check.client.messages,[])
 def test_wire_pair_is_the_real_original_sdk_button_pair(self):
  self.states=[self.state(11,101),self.state(12,102),self.state(13,103)];read=self.check.read
  def corrupt():
   value=read();self.check.report['wire'][-1]['message']['action']='sync';return value
  self.check.read=corrupt
  with self.assertRaisesRegex(AssertionError,'wire actions'):self.invoke()
 def test_timeout_retains_bounded_observations_and_actual_hold(self):
  self.step['timeoutSeconds']=8;self.states=[self.state(11,101,'wrong')]
  with self.assertRaises(AssertionError):self.invoke()
  r=self.check.report['menuTapObservations'][0];self.assertGreater(r['sampleCount'],64);self.assertEqual(len(r['samples']),64);self.assertTrue(r['samplesTruncated']);self.assertAlmostEqual(r['sdkCallHeldMs'],16)
 def test_menu_tap_schema_rejects_legacy_flag_nonboolean_and_chords(self):
  plan={'schemaVersion':1,'renderer':'webgl2','pauseStablePaths':['gameplay.x'],'steps':[dict(self.step),{'name':'Drive','keys':['UP'],'holdMs':100,'expect':[{'path':'gameplay.x','op':'changed'}]}]}
  module.qa_plan.validate_plan(copy.deepcopy(plan))
  for changes in ({'menuTap':1},{'keys':['DOWN','A']},{'windowsMenuTap':True}):
   bad=copy.deepcopy(plan);bad['steps'][0].update(changes)
   with self.assertRaises(AssertionError):module.qa_plan.validate_plan(bad)
if __name__=='__main__':unittest.main()

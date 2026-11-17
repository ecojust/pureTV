#!/usr/bin/env python3
"""Reject stale native diagnostics even if their cached values look correct."""
import copy,importlib.util,json,socket,threading,time,unittest
from pathlib import Path
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
   self.assertEqual(blocker.getsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR),1)
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
if __name__=='__main__':unittest.main()

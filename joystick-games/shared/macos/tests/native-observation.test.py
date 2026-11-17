#!/usr/bin/env python3
"""Reject stale native diagnostics even if their cached values look correct."""
import importlib.util,json,socket,threading,time,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('macverify',Path(__file__).resolve().parents[3]/'tools/macos-verify.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class Observation(unittest.TestCase):
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

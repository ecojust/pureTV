from pathlib import Path
import importlib.util,json,threading,time,tempfile,hashlib
from http.server import HTTPServer,BaseHTTPRequestHandler
from types import SimpleNamespace
TREE=Path('/dev/shm/racing-review-driving/graphics-transport-preflight-0415846/tree')
p=TREE/'joystick-games/qa/android/graphics-observer/run.py'
spec=importlib.util.spec_from_file_location('review_graphics_driver',p);driver=importlib.util.module_from_spec(spec);spec.loader.exec_module(driver)
calls=[]
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  calls.append(self.path);data=b'{"fresh":true}'
  self.send_response(200);self.send_header('Content-Length',str(len(data)));self.end_headers()
  try:
   for byte in data:
    self.wfile.write(bytes([byte]));self.wfile.flush();time.sleep(.01)
  except (BrokenPipeError,ConnectionResetError):pass
server=HTTPServer(('127.0.0.1',0),Handler);worker=threading.Thread(target=lambda:server.serve_forever(poll_interval=.01),daemon=True);worker.start()
out=Path('/dev/shm/racing-review-rally/graphics-slowbody-review');out.mkdir(exist_ok=True)
instance=driver.Diagnosis(SimpleNamespace(output=out/'evidence',adb='must-not-run'));instance.port=server.server_port;instance.last=None
started=time.monotonic();error=None
try:instance.menu_graphics(started+.025)
except Exception as e:error={'type':type(e).__name__,'message':str(e)}
ended=time.monotonic();server.shutdown();server.server_close();worker.join(2)
record={'scope':'New reviewer-only real loopback counterexample, not rerun of existing tests, no Android/game/SDK execution','driverSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'originalStepRemainingSeconds':.025,'actualElapsedSeconds':ended-started,'requestCalls':calls,'error':error,'lastAfterExpiredRead':instance.last,'events':instance.report.get('observerTransportEvents'),'deadlineOverrunObserved':ended-started>.08,'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
(out/'result.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))

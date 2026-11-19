#!/usr/bin/env python3
"""Actual production EXE/WebView2 document-start storage and entry-query fixture.

Requires --app pointing to a built Windows package. This fixture replaces only
its own copied web page and metadata; it never mutates the tested game package.
It uses actual localStorage and normal reload/navigation/exit messages, not
game-state mutation. The synchronous host object's COM path is exercised.
"""
import argparse,hashlib,importlib.util,json,os,shutil,subprocess,sys,time,traceback
from pathlib import Path
HOST=Path(__file__).resolve().parents[1]
OBSERVATION=Path(__file__).with_name('navigation-observation.py')
_spec=importlib.util.spec_from_file_location('navigation_observation',OBSERVATION);observation=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(observation)
PAGE='''<!doctype html><meta charset="utf-8"><title>pureTV document bootstrap fixture</title>
<script>
(() => {
 const phase=Number(sessionStorage.getItem('fixture.phase')||0);
 const records=JSON.parse(sessionStorage.getItem('fixture.records')||'[]');
 const expected=[{save:'native initial',removed:'old',other:null},{save:'chosen low 雪',removed:null,other:null},{save:null,removed:null,other:'query write'},{save:'after clear',removed:null,other:null}][phase];
 const current=Object.fromEntries(['save','removed','other'].map(k=>[k,localStorage.getItem('fixture.'+k)]));
 const record={phase,epoch:window.__puretvDocumentEpoch,url:location.href,firstScriptStorage:current,bridgeInitial:window.JoystickDesktop?.initialStorage()};
 let error='';if(!expected||JSON.stringify(current)!==JSON.stringify(expected))error='Wrong storage before first game script: '+JSON.stringify(record);
 if(!Number.isSafeInteger(record.epoch)||record.epoch<=0||(records.length&&record.epoch<=records.at(-1).epoch))error='Non-increasing document epoch';
 if(['save','removed','other'].some(k=>record.bridgeInitial?.['fixture.'+k]!==current[k]))error='Initial bridge snapshot differs from first script';
 records.push(record);sessionStorage.setItem('fixture.records',JSON.stringify(records));
 let frames=0;const tick=()=>{frames++;requestAnimationFrame(tick);};requestAnimationFrame(tick);
 Object.defineProperty(window,'JoystickGameQA',{value:Object.freeze({snapshot:()=>({game:'navigation-storage-fixture',renderer:'dom',webglVersion:0,stage:'menu',paused:false,frames,gameplay:{phase,records,error,done:phase===3&&!error},controller:{pollCount:frames},errors:[]})})});
 if(error)return;
 sessionStorage.setItem('fixture.phase',String(phase+1));
 if(phase===0){localStorage.setItem('fixture.save','chosen low 雪');localStorage.removeItem('fixture.removed');location.reload();}
 else if(phase===1){localStorage.removeItem('fixture.save');localStorage.setItem('fixture.other','query write');location.href='/tv.html?mode=quick&stage=finland&car=rapier&cond=sunset&weather=clear';}
 else if(phase===2){localStorage.clear();localStorage.setItem('fixture.save','after clear');location.href='/tv.html?menu=title';}
 else {localStorage.setItem('fixture.save','final query message');setTimeout(()=>chrome.webview.postMessage({type:'exit'}),5000);}
})();
</script><p>Read-only document-start assertions and normal storage operations.</p>'''
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--app',type=Path,required=True);p.add_argument('--output',type=Path,required=True);args=p.parse_args()
 assert sys.platform=='win32','Actual Windows/WebView2 required; no simulated native pass'
 out=args.output.resolve();assert not out.exists() or not any(out.iterdir());out.mkdir(parents=True,exist_ok=True)
 app=out/'fixture-app';web=app/'Web';web.mkdir(parents=True);profile=out/'profile';profile.mkdir();diag=out/'diagnostics';diag.mkdir()
 shutil.copyfile(args.app/'PureTVGame.exe',app/'PureTVGame.exe')
 for name in ['bridge.js','bootstrap.js','diagnostics.js']:
  original=args.app/'Web'/name;assert original.read_bytes()==(HOST/'Web'/name).read_bytes(),'Built host asset differs from executed source: '+name;shutil.copyfile(original,web/name)
 (web/'tv.html').write_text(PAGE,encoding='utf-8');(app/'game.json').write_text(json.dumps({'name':'pureTV document bootstrap fixture','version':'0.1.0','packageName':'com.ecojust.fixture.documentbootstrap','storageKeys':['fixture.save','fixture.removed','fixture.other']}),encoding='utf-8')
 (profile/'preferences.json').write_text(json.dumps({'fixture.save':'native initial','fixture.removed':'old'}),encoding='utf-8')
 report={'status':'running','scope':'Actual production Windows EXE and actual WebView2; isolated fixture metadata/page, not game acceptance','sourceRun':os.environ.get('GITHUB_RUN_ID'),'sourceCommit':os.environ.get('GITHUB_SHA'),'binarySha256':digest(app/'PureTVGame.exe'),'inputs':{str(x.relative_to(HOST)):digest(x) for x in [Path(__file__),OBSERVATION,HOST/'Sources/main.cpp',HOST/'Sources/EntryURL.hpp',HOST/'Sources/DiagnosticLog.hpp',*[HOST/'Web'/n for n in ['bridge.js','bootstrap.js','diagnostics.js']]]}}
 process=None;started=time.monotonic();read_errors=[];read_error_count=0
 try:
  with (out/'native.log').open('wb') as log:
   process=subprocess.Popen([str(app/'PureTVGame.exe'),'--profile',str(profile),'--diagnostics',str(diag)],stdout=log,stderr=subprocess.STDOUT)
   deadline=time.monotonic()+60;last=None
   while time.monotonic()<deadline:
    try:
     state=json.loads((diag/'state.json').read_text(encoding='utf-8'));last=state
     fixture=(state.get('game') or {}).get('gameplay',{});assert not fixture.get('error'),fixture['error']
     if fixture.get('done'):
      assert state.get('ready') and state['documentEpoch']==state['document']['epoch']==fixture['records'][-1]['epoch'];report['state']=state;break
    except (FileNotFoundError,json.JSONDecodeError,PermissionError) as error:
     read_error_count+=1;read_errors.append({'elapsedSeconds':time.monotonic()-started,'type':type(error).__name__,'message':str(error)[:512],'winerror':getattr(error,'winerror',None)})
     if len(read_errors)>32:del read_errors[8]
    if process.poll() is not None:raise AssertionError('Host quit before successful final document observation')
    time.sleep(.05)
   else:raise AssertionError('Document fixture timed out: '+json.dumps(last))
   process.wait(timeout=15);assert process.returncode==0,'Query-page exit message was not accepted'
  preferences=json.loads((profile/'preferences.json').read_text(encoding='utf-8'));assert preferences=={'fixture.save':'final query message'},preferences
  report.update(status='passed',preferences=preferences,normalQueryExit=True,firstScriptObservations=report['state']['game']['gameplay']['records'])
 except Exception:
  report.update(status='failed',error=traceback.format_exc())
  failure={'elapsedSeconds':time.monotonic()-started,'readErrorCount':read_error_count,'readErrors':read_errors,'readErrorsTruncated':read_error_count>len(read_errors),'processId':process.pid if process else None,'processReturncodeBeforeCleanup':process.poll() if process else None}
  for name in ('state.json','startup-events.jsonl'):
   try:
    path=diag/name;failure[name]={'exists':path.exists(),'bytes':path.stat().st_size if path.exists() else None}
   except OSError as error:failure[name]={'observationError':type(error).__name__,'message':str(error)[:512]}
  try:
   if process and process.poll() is None:failure['ownedWindows']=observation.collect_owned_windows(process.pid)
   else:failure['ownedWindows']={'status':'not_collected_process_not_running'}
  except Exception as error:failure['ownedWindows']={'status':'observation_failed','type':type(error).__name__,'message':str(error)[:512]}
  report['failureObservation']=failure
  (out/'failure-observation.json').write_text(json.dumps(failure,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  raise
 finally:
  if process and process.poll() is None:process.terminate();process.wait(timeout=10)
  (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':main()

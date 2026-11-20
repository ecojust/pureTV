#!/usr/bin/env python3
"""Test the real Mac display assertion against synthetic extracted-DOM samples."""
import argparse,ast,copy,hashlib,importlib.util,json,sys
from pathlib import Path
from types import SimpleNamespace
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[5]
p=argparse.ArgumentParser();p.add_argument('diagnostic_report',type=Path);p.add_argument('output',type=Path);args=p.parse_args();assert not args.output.exists()
source=ROOT/'resource/apps/neon-rush/macos/tests/verify-native.py';ast.parse(source.read_text())
spec=importlib.util.spec_from_file_location('native_check',source);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
samples=json.loads(args.diagnostic_report.read_text());assert samples['status']=='passed'
identity='virtual-0123456789ab';results=[]
def run(name,document,expected=identity,native_identity=identity,present=True,accept=True):
 check=module.NativeCheck.__new__(module.NativeCheck);check.args=SimpleNamespace(language='en');check.report={'controllerIdentityDisplay':[]}
 state={'document':copy.deepcopy(document),'game':{'phase':'menu','paused':False},'input':{'players':[{'id':1,'connected':True,'controllerId':native_identity}] if native_identity else []}}
 def until(predicate,label):
  assert predicate(state),label
  return state
 check.until=until
 try:
  result=check.client_display(name,identity=expected,present=present)
 except AssertionError as error:
  assert not accept,name+' unexpectedly rejected: '+str(error)
  results.append({'name':name,'status':'passed','expected':'rejected','error':str(error)})
 else:
  assert accept,name+' unexpectedly accepted'
  results.append({'name':name,'status':'passed','expected':'accepted','result':result})
normal=samples['cases'][0]['document'];run('Exact SDK identity and unclipped displayed text pass',normal)
for row in samples['cases'][1:]:run('Reject '+row['name'],row['document'],accept=False)
run('Reject another protocol ID',normal,expected='virtual-different',accept=False)
run('Reject disagreement with native receiver identity',normal,native_identity='virtual-different',accept=False)
missing=copy.deepcopy(normal);missing['controllerClients']=[]
run('Actual disconnected native seat and absent display pass',missing,expected=None,native_identity=None,present=False)
run('A live native seat cannot be treated as a disconnected UI success',missing,expected=None,present=False,accept=False)
result={'status':'passed','scope':'Checker boundary test against synthetic DOM diagnostic samples; no macOS application was launched','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'diagnosticReportSha256':hashlib.sha256(args.diagnostic_report.read_bytes()).hexdigest(),'tests':results,'nativeMacOSAppTested':False,'physicalEsp32Tested':False}
args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':'passed','tests':len(results)}))

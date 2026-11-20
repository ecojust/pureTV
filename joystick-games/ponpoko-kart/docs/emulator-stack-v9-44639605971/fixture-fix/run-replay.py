from pathlib import Path
import hashlib,json,os,re,shutil,subprocess,sys
base=Path(__file__).parent;root=base/'source';repo=Path('/dev/shm/puretv-submit')
runner=base/'runner-temp';runner.mkdir();temporary=base/'tmp';temporary.mkdir()
selected={'GITHUB_ACTIONS':'true','GITHUB_SHA':'c22b297146547e5503f8dc9b0bfa9163518f6673',
          'GITHUB_RUN_ID':'44639605971','GITHUB_RUN_ATTEMPT':'1','RUNNER_NAME':'local-isolated-ci-environment-replay',
          'RUNNER_TEMP':str(runner),'TMPDIR':str(temporary),'PYTHONDONTWRITEBYTECODE':'1',
          'SUPERVISE_PON_EMULATOR':'true','PON_DISABLE_VULKAN':'true','PON_CAPTURE_QEMU_STACK':'true',
          'PURETV_DISPOSABLE_EMULATOR':'1','GAME':'ponpoko-kart','GAMES':'ponpoko-kart','BATCH':'racing-01',
          'ARTIFACT_SOURCE':'8f283c73f52f857777306eafc88f710262367834','ARTIFACT_RUN':'44597115244',
          'ARTIFACT_EXPORT':'4249f5c0ec3053a1dec652a7880a040e1bb143f0','ARTIFACT_ID':'','ARTIFACT_ATTEMPT':'',
          'CONFIRM_BACKROAD_INSTALL':'false'}
environment=dict(os.environ,**selected)
(base/'replayed-environment.json').write_text(json.dumps(selected,indent=2)+'\n')
test='joystick-games/qa/android/test_emulator_supervisor.py'
cmd=[sys.executable,'-B',test,'SupervisorTests.test_stack_flag_is_default_off_exact_scope_and_never_changes_argv']
p=subprocess.run(cmd,cwd=root,env=environment,capture_output=True,timeout=60)
(base/'original-test-reproduction.log').write_bytes(p.stdout+p.stderr)
assert p.returncode==1 and b'owned_qemu_stack.Rejected: Missing bounded permission gate' in p.stderr
fixed=(repo/test).read_bytes();(base/'candidate-test_emulator_supervisor.py').write_bytes(fixed);(root/test).write_bytes(fixed)
records=[]
for index,name in enumerate(['joystick-games/qa/android/test_runner.py','joystick-games/tools/android-tests.py',
                            'joystick-games/tools/android-runtime-artifact-tests.py','joystick-games/qa/android/test_environment_diagnostics.py',
                            'joystick-games/qa/android/test_install_confirmation.py',test],1):
 cmd=[sys.executable,'-B',name]
 p=subprocess.run(cmd,cwd=root,env=environment,capture_output=True,timeout=180)
 log=base/f'{index:02d}-{Path(name).stem}.log';log.write_bytes(p.stdout+p.stderr)
 records.append({'command':cmd,'returnCode':p.returncode,'log':log.name,'bytes':log.stat().st_size,'sha256':hashlib.sha256(log.read_bytes()).hexdigest()})
 print(json.dumps(records[-1]),flush=True)
 if p.returncode:break
before=json.loads((base/'source-before.json').read_text());after={}
for name in before['files']:
 data=(root/name).read_bytes();after[name]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
changed=[name for name in after if after[name]!=before['files'][name]]
assert changed==[test],changed
result={'parent':before['source'],'originalFailureReproduced':True,'changedPaths':changed,'candidateSha256':hashlib.sha256(fixed).hexdigest(),
        'checks':records,'allSixPassed':len(records)==6 and all(x['returnCode']==0 for x in records),'files':after,
        'onlyAllowlistedCiVariablesRecorded':True,'actualCiRunner':False,'permissionGateExecuted':False,'avdStarted':False,'newWorkflowPost':False}
(base/'result.json').write_text(json.dumps(result,indent=2)+'\n')
assert result['allSixPassed']

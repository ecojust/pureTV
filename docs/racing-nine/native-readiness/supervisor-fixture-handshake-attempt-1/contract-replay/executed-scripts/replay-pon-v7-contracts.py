from pathlib import Path
import hashlib,json,os,re,subprocess
root=Path('/dev/shm/puretv-submit');base='a79611725f1f3c75816cff229b7883cf9e14c54b';out=Path('/dev/shm/racing-native-readiness/pon-v7-contract-replay');out.mkdir(exist_ok=False);view=out/'source';view.mkdir()
prefixes=['joystick-games/qa/android','joystick-games/tools','resource/game-kit/android/src/main','resource/game-kit/web','resource/game-kit/build.py','puretv-joystick/joystick_sdk.py','tools/resource_catalog.py','tools/puretv-release-certificate-v2.sha256','joystick-games/catalog-registry.json','.github/workflows/joystick-catalog-android-runtime.yml','.github/workflows/joystick-catalog-android.yml','.github/workflows/joystick-games-android.yml']
raw=subprocess.check_output(['git','ls-tree','-r','-l','-z',base,'--',*prefixes],cwd=root);selected={}
for entry in raw.split(b'\0'):
 if not entry:continue
 header,name=entry.decode().split('\t');mode,kind,blob,size=header.split();assert mode=='100644' and kind=='blob';p=Path(name)
 if name.startswith('joystick-games/tools/') and not (p.parent.as_posix()=='joystick-games/tools' and p.suffix=='.py') and not name.startswith(('joystick-games/tools/fixtures/android-runtime-artifact/','joystick-games/tools/fixtures/audio/')):continue
 if name.startswith('resource/game-kit/web/') and p.name not in ['controller.html','controller.js','controller.css']:continue
 selected[name]={'bytes':int(size),'gitBlob':blob}
assert sum(x['bytes']for x in selected.values())<8_000_000
for name,r in selected.items():
 data=subprocess.check_output(['git','show',base+':'+name],cwd=root);assert len(data)==r['bytes'];r['sha256']=hashlib.sha256(data).hexdigest();p=view/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
name='joystick-games/qa/android/test_emulator_supervisor.py';overlay=(root/name).read_bytes();(view/name).write_bytes(overlay);selected[name]['overlaySha256']=hashlib.sha256(overlay).hexdigest();selected[name]['overlayBytes']=len(overlay)
commands=['joystick-games/qa/android/test_runner.py','joystick-games/tools/android-tests.py','joystick-games/tools/android-runtime-artifact-tests.py','joystick-games/qa/android/test_environment_diagnostics.py','joystick-games/qa/android/test_install_confirmation.py','joystick-games/qa/android/test_emulator_supervisor.py'];env=dict(os.environ,TMPDIR=str(out),XDG_CACHE_HOME=str(out/'cache'),PYTHONDONTWRITEBYTECODE='1',SUPERVISE_PON_EMULATOR='true',PON_DISABLE_VULKAN='true',PURETV_DISPOSABLE_EMULATOR='1',GITHUB_ACTIONS='true',GAME='ponpoko-kart',GAMES='ponpoko-kart',BATCH='racing-01',CONFIRM_BACKROAD_INSTALL='false',ARTIFACT_SOURCE='8f283c73f52f857777306eafc88f710262367834',ARTIFACT_RUN='44597115244',ARTIFACT_EXPORT='4249f5c0ec3053a1dec652a7880a040e1bb143f0',ARTIFACT_ID='',ARTIFACT_ATTEMPT='',GITHUB_SHA=base,GITHUB_RUN_ID='44627215167',GITHUB_RUN_ATTEMPT='1')
results=[]
for i,path in enumerate(commands):
 command=['python3','-B',path];p=subprocess.run(command,cwd=view,env=env,capture_output=True);log=out/f'{i+1:02d}-{Path(path).stem}.log';log.write_bytes(p.stdout+p.stderr);match=re.search(rb'Ran (\d+) tests?',p.stdout+p.stderr);result={'command':command,'returnCode':p.returncode,'tests':int(match.group(1)) if match else None,'log':log.name,'logBytes':log.stat().st_size,'logSha256':hashlib.sha256(log.read_bytes()).hexdigest()};results.append(result);print(json.dumps(result),flush=True)
 if p.returncode:break
report={'sourceBase':base,'onlyOverlay':name,'exactFrozenFiles':selected,'commands':results,'status':'passed' if len(results)==6 and all(x['returnCode']==0 for x in results) else 'failed','actualAndroidExecution':False};(out/'result.json').write_text(json.dumps(report,indent=2)+'\n')

#!/usr/bin/env python3
"""Keep package provenance separate from QA revisions; reject changed production."""
import copy,importlib.util,json,os,shutil,subprocess,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
reuse=load('reuse',ROOT/'joystick-games/tools/macos-reuse.py')
class Provenance(unittest.TestCase):
 def test_original_run_and_successful_build_are_mandatory(self):
  run={'id':reuse.RUN,'head_sha':reuse.SOURCE,'run_attempt':1,'repository':{'full_name':reuse.REPO},'path':'.github/workflows/joystick-games-macos.yml'}
  jobs=[{'name':'build ('+g+')','conclusion':'success','status':'completed'} for g in reuse.GAMES]
  artifacts=[{'name':'joystick-macos-package-'+g,'expired':False,'workflow_run':{'id':reuse.RUN,'head_sha':reuse.SOURCE}} for g in reuse.GAMES]
  self.assertEqual(set(reuse.validate_run(run,jobs,artifacts)),set(reuse.GAMES))
  for field,value in [('head_sha','0'*40),('run_attempt',2),('path','other.yml')]:
   bad=copy.deepcopy(run);bad[field]=value
   with self.assertRaises(AssertionError):reuse.validate_run(bad,jobs,artifacts)
  bad=copy.deepcopy(jobs);bad[0]['conclusion']='failure'
  with self.assertRaises(AssertionError):reuse.validate_run(run,bad,artifacts)
  bad=copy.deepcopy(artifacts);bad[0]['expired']=True
  with self.assertRaises(AssertionError):reuse.validate_run(run,jobs,bad)
 def test_source_and_payload_freeze_allow_only_new_qa(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);frozen=root/'original';frozen.mkdir();game='cf-transport-ship'
   names=['joystick-games/shared/macos/Sources/main.swift','joystick-games/shared/macos/Web/bridge.js','joystick-games/shared/web/input.js',f'joystick-games/{game}/src/main.js',f'joystick-games/{game}/dist/tv.html',f'joystick-games/{game}/game.json','puretv-joystick/joystick_sdk.py','.github/workflows/joystick-games-macos.yml']
   for name in names:p=frozen/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(name+'\n')
   target=frozen/'joystick-games/tools/macos-build.py';target.parent.mkdir();shutil.copy2(ROOT/'joystick-games/tools/macos-build.py',target)
   def git(*args):return subprocess.check_output(['git','-C',str(frozen),*args],stderr=subprocess.DEVNULL,text=True).strip()
   git('init');git('-c','user.name=Test','-c','user.email=test@example.invalid','add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-m','frozen')
   commit=git('rev-parse','HEAD');old=reuse.SOURCE;reuse.SOURCE=commit
   try:
    builder=load('fixture_builder',target);meta={'game':game,'sourceCommit':commit,'committedInputsVerified':True,'inputFiles':builder.inputs(frozen/'joystick-games'/game)}
    current=root/'qa';shutil.copytree(frozen,current)
    (current/'joystick-games/tools/macos-build.py').write_text('# QA tool revisions do not change original package provenance\n')
    result=reuse.verify_source(meta,frozen,current);self.assertEqual(result['artifactSourceCommit'],commit)
    changed=current/names[0];original=changed.read_text();changed.write_text('changed production')
    with self.assertRaises(AssertionError):reuse.verify_source(meta,frozen,current)
    changed.write_text(original);extra=current/'joystick-games/shared/macos/Sources/new.swift';extra.write_text('new production')
    with self.assertRaises(AssertionError):reuse.verify_source(meta,frozen,current)
    extra.unlink();(frozen/names[0]).write_text('dirty original')
    with self.assertRaises(AssertionError):reuse.verify_source(meta,frozen,current)
   finally:reuse.SOURCE=old
 def test_native_shell_uses_explicit_platform_arguments(self):
  for workflow in ['joystick-games-macos.yml','joystick-games-macos-qa.yml']:
   text=(ROOT/'.github/workflows'/workflow).read_text();part=text.split('      - name: Verify actual native app through the official SDK\n',1)[1].split('      - name:',1)[0];block=part.split('        run: |\n',1)[1];script='\n'.join(line[10:] for line in block.splitlines() if line.startswith('          '))
   self.assertNotIn('OPTIONS',script)
   with tempfile.TemporaryDirectory() as temp:
    (Path(temp)/'qa').mkdir()
    for platform in ['macos-latest','macos-15-intel']:
     env=dict(os.environ,GAME='cf-transport-ship',RUNNER_KIND=platform,RUNNER_TEMP=temp)
     result=subprocess.check_output(['bash','-c','python3() { printf "%s\\n" "$@"; };\n'+script],env=env,text=True)
     self.assertEqual('--allow-unavailable-webgl' in result,platform=='macos-15-intel')
     self.assertIn('/installed/CF Transport Ship.app',result)
if __name__=='__main__':unittest.main()

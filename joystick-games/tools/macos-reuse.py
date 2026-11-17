#!/usr/bin/env python3
"""Validate the original build provenance before reusing immutable Mac packages."""
import argparse,hashlib,importlib.util,json,re,subprocess
from pathlib import Path
SOURCE='8d6475980ce2312df8839a38dd724794eb59b83b'
RUN=44115155028
REPO='ecojust/pureTV'
GAMES=['cf-transport-ship','qq-speed']
def api(path):return json.loads(subprocess.check_output(['gh','api','repos/'+REPO+'/actions/'+path]))
def validate_run(run,jobs,artifacts):
 assert run['id']==RUN and run['head_sha']==SOURCE and run['run_attempt']==1
 assert run['repository']['full_name']==REPO and run['path']=='.github/workflows/joystick-games-macos.yml'
 for game in GAMES:
  build=[j for j in jobs if j['name']=='build ('+game+')']
  assert len(build)==1 and build[0]['conclusion']=='success' and build[0]['status']=='completed',game
  package=[a for a in artifacts if a['name']=='joystick-macos-package-'+game]
  assert len(package)==1 and not package[0]['expired'],game
  assert package[0]['workflow_run']['id']==RUN and package[0]['workflow_run']['head_sha']==SOURCE
 return {g:next(a for a in artifacts if a['name']=='joystick-macos-package-'+g) for g in GAMES}
def file_hash(path):return {'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
def production_paths(root,game):
 paths=set()
 for folder in ['joystick-games/shared/macos/Sources','joystick-games/shared/macos/Web','joystick-games/shared/web','joystick-games/'+game+'/src','joystick-games/'+game+'/dist']:
  for p in (root/folder).rglob('*'):
   assert not p.is_symlink(),str(p)
   if p.is_file() and '__pycache__' not in p.parts:paths.add(p.relative_to(root).as_posix())
 for name in ['game.json','package.json','package-lock.json','build.mjs','LICENSE','NOTICE.md','UPSTREAM.md']:
  p=root/'joystick-games'/game/name
  if p.exists():paths.add(p.relative_to(root).as_posix())
 paths.add('puretv-joystick/joystick_sdk.py')
 return paths
def verify_source(meta,frozen,current):
 assert meta['sourceCommit']==SOURCE and meta['committedInputsVerified'] is True
 assert subprocess.check_output(['git','-C',str(frozen),'rev-parse','HEAD'],text=True).strip()==SOURCE
 spec=importlib.util.spec_from_file_location('original_builder',frozen/'joystick-games/tools/macos-build.py');builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
 assert builder.inputs(frozen/'joystick-games'/meta['game'])==meta['inputFiles'],'Original input set or bytes differ'
 builder.verify_committed(frozen,meta['inputFiles'],SOURCE)
 expected=production_paths(frozen,meta['game']);assert production_paths(current,meta['game'])==expected,'Current production file set changed'
 for name in expected:
  p=current/name;assert p.is_file() and not any(q.is_symlink() for q in [p,*p.parents]),name
  assert file_hash(p)==file_hash(frozen/name),'Current production differs from packaged source: '+name
 return {'artifactSourceCommit':SOURCE,'artifactRunId':RUN,'qaSourceCommit':subprocess.check_output(['git','-C',str(current),'rev-parse','HEAD'],text=True).strip(),'frozenInputFilesVerified':len(meta['inputFiles']),'unchangedProductionFilesVerified':len(expected)}
def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
 run=api('runs/'+str(RUN));jobs=api('runs/'+str(RUN)+'/jobs?per_page=100')['jobs'];artifacts=api('runs/'+str(RUN)+'/artifacts?per_page=100')['artifacts'];selected=validate_run(run,jobs,artifacts)
 args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps({'artifactSourceCommit':SOURCE,'artifactRunId':RUN,'artifactRunAttempt':1,'run':run,'jobs':jobs,'selectedArtifacts':selected},indent=2)+'\n')
if __name__=='__main__':main()

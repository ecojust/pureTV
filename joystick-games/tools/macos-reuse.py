#!/usr/bin/env python3
"""Validate the original build provenance before reusing immutable Mac packages."""
import argparse,hashlib,importlib.util,json,re,subprocess
from pathlib import Path
SOURCE='8d6475980ce2312df8839a38dd724794eb59b83b'
RUN=44115155028
QQ_QA_SOURCE='6da4d967d41fb0b365b563777d6ada9e8c079fe2'
QQ_QA_RUN=44120745068
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
def validate_previous_qq(run,jobs,artifacts):
 assert run['id']==QQ_QA_RUN and run['head_sha']==QQ_QA_SOURCE and run['run_attempt']==1
 assert run['repository']['full_name']==REPO and run['path']=='.github/workflows/joystick-games-macos-qa.yml'
 selected={}
 for platform in ['macos-latest','macos-15-intel']:
  name='verify (qq-speed, '+platform+')';job=[j for j in jobs if j['name']==name]
  assert len(job)==1 and job[0]['status']=='completed' and job[0]['conclusion']=='success',name
  name='joystick-macos-qa-qq-speed-'+platform;artifact=[a for a in artifacts if a['name']==name]
  assert len(artifact)==1 and not artifact[0]['expired'],name
  assert artifact[0]['workflow_run']['id']==QQ_QA_RUN and artifact[0]['workflow_run']['head_sha']==QQ_QA_SOURCE
  selected[platform]=artifact[0]
 return selected
def file_hash(path):return {'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
def production_paths(root,game):
 paths=set()
 for folder in ['joystick-games/shared/macos/Sources','joystick-games/shared/macos/Web','joystick-games/shared/web','joystick-games/'+game+'/src','joystick-games/'+game+'/dist']:
  assert (root/folder).is_dir() and not (root/folder).is_symlink(),folder
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
 expected=set().union(*(production_paths(frozen,game) for game in GAMES));actual=set().union(*(production_paths(current,game) for game in GAMES))
 assert actual==expected,'Current production file set changed'
 for name in expected:
  p=current/name;assert p.is_file() and not any(q.is_symlink() for q in [p,*p.parents]),name
  assert file_hash(p)==file_hash(frozen/name),'Current production differs from packaged source: '+name
 return {'artifactSourceCommit':SOURCE,'artifactRunId':RUN,'qaSourceCommit':subprocess.check_output(['git','-C',str(current),'rev-parse','HEAD'],text=True).strip(),'frozenInputFilesVerified':len(meta['inputFiles']),'unchangedProductionFilesVerified':len(expected)}
def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--reuse-qq-evidence',action='store_true');args=parser.parse_args()
 run=api('runs/'+str(RUN));jobs=api('runs/'+str(RUN)+'/jobs?per_page=100')['jobs'];artifacts=api('runs/'+str(RUN)+'/artifacts?per_page=100')['artifacts'];selected=validate_run(run,jobs,artifacts)
 record={'artifactSourceCommit':SOURCE,'artifactRunId':RUN,'artifactRunAttempt':1,'run':run,'jobs':jobs,'selectedArtifacts':selected}
 if args.reuse_qq_evidence:
  previous_run=api('runs/'+str(QQ_QA_RUN));previous_jobs=api('runs/'+str(QQ_QA_RUN)+'/jobs?per_page=100')['jobs'];previous_artifacts=api('runs/'+str(QQ_QA_RUN)+'/artifacts?per_page=100')['artifacts']
  record['previousQQ']={'qaSourceCommit':QQ_QA_SOURCE,'qaRunId':QQ_QA_RUN,'run':previous_run,'jobs':previous_jobs,'selectedArtifacts':validate_previous_qq(previous_run,previous_jobs,previous_artifacts)}
 args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(record,indent=2)+'\n')
if __name__=='__main__':main()

from pathlib import Path
import json,os,importlib.util,datetime
repo=Path('/dev/shm/puretv-submit');scratch=Path('/dev/shm/racing-review-driving');base=scratch/'backroad-original-runtime-preflight';base.mkdir(exist_ok=False)
original=Path('/dev/shm/racing-review-karts/backroad-signed-audit-44599353036/signed-artifact');folder=base/'artifact';folder.mkdir()
for p in original.rglob('*'):
 assert not p.is_symlink()
 if p.is_file():
  out=folder/p.relative_to(original);out.parent.mkdir(parents=True,exist_ok=True);os.link(p,out)
os.link('/dev/shm/backroad-signed-artifact-14567692465.zip',base/'artifact.zip')
spec=importlib.util.spec_from_file_location('artifact',repo/'joystick-games/tools/android-runtime-artifact.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def load(name):return json.loads((scratch/name).read_text())
run=load('original-backroad-run.json');jobs=load('original-backroad-jobs.json');listed=load('original-backroad-artifacts.json');a=load('original-backroad-artifact.json')
assert jobs['total_count']==len(jobs['jobs'])<100 and listed['total_count']==len(listed['artifacts'])<100
v={'schemaVersion':1,'kind':'github-actions-signed-artifact','request':{'run':44599353036,'attempt':1,'source':'d548bccbe816bd4c03620388556ceef507b67d30','artifact':14567692465},'run':run,'jobs':jobs['jobs'],'artifact':a,'runArtifacts':listed['artifacts'],'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{p.relative_to(folder).as_posix():m.record(p) for p in folder.rglob('*') if p.is_file()},'localPreflightSource':'Existing independently audited ZIP, read-only current API provenance refreshed; no workflow dispatch or download.'}
v['producerVerification']=m.validate_origin(v,['backroad-rally']);(folder/'actions-artifact-origin.json').write_text(json.dumps(v,indent=2)+'\n');m.verify_local(folder,v['request'],['backroad-rally']);print(json.dumps(v['producerVerification'],indent=2))

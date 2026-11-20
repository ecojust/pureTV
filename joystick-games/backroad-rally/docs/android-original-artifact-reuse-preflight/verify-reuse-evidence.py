from pathlib import Path
import importlib.util,json,shutil,hashlib,datetime
root=Path('/dev/shm/puretv-submit');base=Path('/dev/shm/racing-review-driving/backroad-original-runtime-preflight');evidence=base/'evidence';game='backroad-rally';folder=evidence/('joystick-android-runtime-'+game)/game
folder.mkdir(parents=True)
def mod(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
v=mod('input',root/'joystick-games/tools/android-runtime-inputs.py');c=mod('copies',root/'joystick-games/tools/android-runtime-copies.py')
v.preserve_evidence(base/'input',folder/'verified-inputs')
paths=[root/'joystick-games/tools'/name for name in ['android-runtime-artifact.py','android-runtime-artifact-tests.py','android-runtime-inputs.py','android-runtime-copies.py','artifact-draft-transfer.py','asset-policy.py']]
paths+=[root/'.github/workflows/joystick-catalog-android-runtime.yml',root/'puretv-joystick/joystick_sdk.py']
files={}
for p in paths:
 name=p.relative_to(root).as_posix();dest=folder/'executed-source'/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest);files[name]=v.record(p)
v.write(folder/'executed-source.json',{'files':files,'localPreflightOnly':True})
report=c.audit(evidence,[game]);assert report['status']=='passed',report
allfiles=[p for p in evidence.rglob('*') if p.is_file()];assert not any(p.suffix.lower()=='.apk' for p in allfiles);assert all(p.stat().st_size<100000000 for p in allfiles)
report.update(localPreflightOnly=True,actualApkInstalled=False,workflowDispatched=False,apkBinariesInEvidence=0,allEvidenceFilesBelowUnchanged100MillionLimit=True,evidenceFiles=len(allfiles),evidenceBytes=sum(p.stat().st_size for p in allfiles),maximumEvidenceFileBytes=max(p.stat().st_size for p in allfiles),checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
v.write(base/'evidence-preflight.json',report);print(json.dumps(report,indent=2))
# The full source-copy verification above is now recorded; both copies can be rebuilt from exact Git source.
shutil.rmtree(base/'input/artifact-source');shutil.rmtree(folder/'verified-inputs/artifact-source')
v.write(base/'source-copy-cleanup.json',{'reason':'Recover shared /dev/shm after successful complete source-copy audit; retain original signed APK/ZIP links, receipts, logs and exact inventories. No runtime was performed.','removedSourceCopiesOnly':2,'originalSourceSha':'d548bccbe816bd4c03620388556ceef507b67d30','audit':'evidence-preflight.json'})

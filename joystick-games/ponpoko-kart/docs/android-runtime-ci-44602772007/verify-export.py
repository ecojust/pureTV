#!/usr/bin/env python3
"""Read-only verification of the second QA run against the original signed bytes."""
import argparse, datetime, hashlib, json, re, shutil, subprocess
from pathlib import Path
SOURCE='8f283c73f52f857777306eafc88f710262367834'
QA_RUN=44602772007
ORIGINAL_RUN=44597115244
EXPORT='f97e7ba929e9e215450a5289f1933d3ae9c7e086'
ORIGINAL_EXPORT='4249f5c0ec3053a1dec652a7880a040e1bb143f0'
DOCS=Path(__file__).resolve().parent

def record(path):
    data=path.read_bytes()
    return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

def load(path):return json.loads(path.read_text())

def main():
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--repo',type=Path,required=True);a=p.parse_args()
    root=a.root;manifest=load(root/'export-manifest.json')
    assert str(manifest['qaRunId'])==str(QA_RUN) and str(manifest['qaRunAttempt'])=='1'
    assert manifest['qaSourceSha']==manifest['artifactSourceSha']==SOURCE
    assert str(manifest['artifactRunId'])==str(ORIGINAL_RUN) and manifest['artifactExportCommit']==ORIGINAL_EXPORT
    assert manifest['games']==['ponpoko-kart'] and manifest['reusedSignedPackagesAndObservers'] is True
    actual={}
    for f in root.rglob('*'):
        assert not f.is_symlink()
        if f.is_file() and f!=root/'export-manifest.json':actual[f.relative_to(root).as_posix()]=record(f)
    assert actual==manifest['files']
    base=root/'evidence/joystick-android-runtime-ponpoko-kart/ponpoko-kart'
    inputs=base/'verified-inputs';binding=load(inputs/'input-verification.json')
    assert binding['status']=='passed' and binding['qaSourceSha']==binding['artifactSourceSha']==SOURCE
    assert str(binding['qaRunId'])==str(QA_RUN) and str(binding['artifactRunId'])==str(ORIGINAL_RUN)
    assert binding['artifactExportCommit']==ORIGINAL_EXPORT and binding['localPreflightOnly'] is False
    receipt=load(inputs/'packages/ponpoko-kart/signing-receipt.json');old=DOCS.parent/'android-ci-44597115244/independent-verification.json';prior=load(old)
    apk=inputs/'packages/ponpoko-kart/ponpoko-kart-0.1.0.apk'
    assert record(apk)=={k:receipt[k] for k in ('bytes','sha256')}=={k:prior['apk'][k] for k in ('bytes','sha256')}
    assert receipt['sourceSha']==SOURCE and str(receipt['runId'])==str(ORIGINAL_RUN)
    checked={}
    def verify_source(name,path,want):
        assert not Path(name).is_absolute() and '..' not in Path(name).parts and '\\' not in name
        assert record(path)==want
        raw=subprocess.check_output(['git','show',SOURCE+':'+name],cwd=a.repo)
        assert want=={'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()},name
        checked[name]=want
    for name,want in receipt['sourceInputs'].items():verify_source(name,inputs/'artifact-source'/name,want)
    executed=load(base/'executed-source.json')
    assert executed['qaSourceSha']==SOURCE and str(executed['qaRunId'])==str(QA_RUN)
    for name,want in executed['files'].items():verify_source(name,base/'executed-source'/name,want)
    reports=[]
    for mode in ('normal','occupied'):
        d=root/'evidence/joystick-android-runtime-ponpoko-kart'/('ponpoko-kart-'+mode);v=load(d/'report.json')
        assert v['game']=='ponpoko-kart' and v['sourceCommit']==SOURCE
        assert v['modelWrites'] is False and v['clockOverrides'] is False
        assert v['apk']['sha256']==receipt['sha256']
        for name,want in v['sourceFiles'].items():verify_source(name,d/'source'/name,want)
        snapshots=[]
        for row in v['snapshots']:
            s=row.get('snapshot') or {};snapshots.append({'label':row['label'],'game':s.get('game'),'page':s.get('page'),'windowFocused':s.get('windowFocused'),'activityState':s.get('activityState'),'error':row.get('error')})
        reports.append({'mode':mode,'status':v['status'],'report':record(d/'report.json'),'tests':v['tests'],'error':v.get('error'),'snapshots':snapshots,'captures':v['captures']})
    target=DOCS/'original-evidence';assert not target.exists();target.mkdir();copied={}
    for f in sorted(root.rglob('*')):
        if not f.is_file():continue
        name=f.relative_to(root).as_posix()
        if f.suffix=='.apk' or '/verified-inputs/artifact-source/' in name:continue
        out=target/name;out.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(f,out);assert record(out)==record(f);copied[name]=record(out)
    result={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exportCommit':EXPORT,'qaRunId':QA_RUN,'qaRunAttempt':1,'qaSourceSha':SOURCE,'originalArtifactRunId':ORIGINAL_RUN,'originalArtifactRunAttempt':1,'originalArtifactSourceSha':SOURCE,'originalArtifactExportCommit':ORIGINAL_EXPORT,'exportFilesVerified':len(actual),'originalAppSourceInputsComparedToGit':len(receipt['sourceInputs']),'uniqueOriginalAndExecutedSourceFilesComparedToGit':len(checked),'originalSignedApkUnchanged':record(apk),'signatureAuditReusedFrom':{'path':str(old.relative_to(a.repo)),'record':record(old)},'newApkSigningOrBuild':False,'originalInputBinding':binding,'originalRuntimeResult':manifest['runtimeResult'],'runtimeAccepted':manifest['runtimeAccepted'],'modes':reports,'archivedSubsetFiles':len(copied),'archiveOmissions':'APK binaries and duplicate original artifact-source remain in immutable export/scratch; all files were verified before copying subset. Executed QA sources and original reports retained.','script':record(Path(__file__)),'physicalTvTested':False,'physicalEsp32Tested':False}
    (DOCS/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ('exportFilesVerified','originalAppSourceInputsComparedToGit','uniqueOriginalAndExecutedSourceFilesComparedToGit','originalSignedApkUnchanged','runtimeAccepted','archivedSubsetFiles')}))

if __name__=='__main__':main()

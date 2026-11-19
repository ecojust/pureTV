#!/usr/bin/env python3
"""Read-only verification of the Turbo runtime-only QA run against the original signed bytes."""
import argparse, datetime, hashlib, json, re, shutil, subprocess
from pathlib import Path
SOURCE='06f1ab2b77e45d5fabcbd7233f8d3e9279a9d5c7'
QA_SOURCE='c5ad63e8c6a0ccfada5f763d1d26afa27f45002e'
QA_RUN=44606216069
ORIGINAL_RUN=44600152694
EXPORT='dc8ec7aadcd7ea2357abf4c168a197a2c17b9371'
ORIGINAL_EXPORT='e01ab3ba25008cbbcbfa718321afa49fe6eb2331'
DOCS=Path(__file__).resolve().parent

def record(path):
    data=path.read_bytes()
    return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

def load(path):return json.loads(path.read_text())

def main():
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--repo',type=Path,required=True);a=p.parse_args()
    root=a.root;manifest=load(root/'export-manifest.json')
    assert str(manifest['qaRunId'])==str(QA_RUN) and str(manifest['qaRunAttempt'])=='1'
    assert manifest['qaSourceSha']==QA_SOURCE and manifest['artifactSourceSha']==SOURCE
    assert str(manifest['artifactRunId'])==str(ORIGINAL_RUN) and manifest['artifactExportCommit']==ORIGINAL_EXPORT
    assert manifest['games']==['turbo-kart-rush'] and manifest['reusedSignedPackagesAndObservers'] is True
    actual={}
    for f in root.rglob('*'):
        assert not f.is_symlink()
        if f.is_file() and f!=root/'export-manifest.json':actual[f.relative_to(root).as_posix()]=record(f)
    assert actual==manifest['files']
    base=root/'evidence/joystick-android-runtime-turbo-kart-rush/turbo-kart-rush'
    inputs=base/'verified-inputs';binding=load(inputs/'input-verification.json')
    assert binding['status']=='passed' and binding['qaSourceSha']==QA_SOURCE and binding['artifactSourceSha']==SOURCE
    assert str(binding['qaRunId'])==str(QA_RUN) and str(binding['artifactRunId'])==str(ORIGINAL_RUN)
    assert binding['artifactExportCommit']==ORIGINAL_EXPORT and binding['localPreflightOnly'] is False
    receipt=load(inputs/'packages/turbo-kart-rush/signing-receipt.json');old=DOCS.parent/'android-ci-44600152694/independent-verification.json';prior=load(old)
    apk=inputs/'packages/turbo-kart-rush/turbo-kart-rush-0.1.0.apk'
    assert record(apk)=={k:receipt[k] for k in ('bytes','sha256')}=={k:prior['apk'][k] for k in ('bytes','sha256')}
    assert receipt['sourceSha']==SOURCE and str(receipt['runId'])==str(ORIGINAL_RUN)
    checked={}
    def verify_source(name,path,want,source):
        assert not Path(name).is_absolute() and '..' not in Path(name).parts and '\\' not in name
        assert record(path)==want
        raw=subprocess.check_output(['git','show',source+':'+name],cwd=a.repo)
        assert want=={'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()},name
        checked[source+':'+name]=want
    for name,want in receipt['sourceInputs'].items():verify_source(name,inputs/'artifact-source'/name,want,SOURCE)
    executed=load(base/'executed-source.json')
    assert executed['qaSourceSha']==QA_SOURCE and executed['artifactSourceSha']==SOURCE and str(executed['qaRunId'])==str(QA_RUN)
    for name,want in executed['files'].items():verify_source(name,base/'executed-source'/name,want,QA_SOURCE)
    reports=[]
    for mode in ('normal','occupied'):
        d=root/'evidence/joystick-android-runtime-turbo-kart-rush'/('turbo-kart-rush-'+mode);v=load(d/'report.json')
        assert v['game']=='turbo-kart-rush' and v['sourceCommit']==QA_SOURCE
        assert v['modelWrites'] is False and v['clockOverrides'] is False
        assert v['apk']['sha256']==receipt['sha256']
        for name,want in v['sourceFiles'].items():verify_source(name,d/'source'/name,want,QA_SOURCE)
        snapshots=[]
        for row in v['snapshots']:
            s=row.get('snapshot') or {};snapshots.append({'label':row['label'],'game':{k:(s.get('game') or {}).get(k) for k in ('game','stage','frames','gameplay')},'page':{k:(s.get('page') or {}).get(k) for k in ('width','height','canvases')},'windowFocused':s.get('windowFocused'),'activityState':s.get('activityState'),'error':row.get('error')})
        reports.append({'mode':mode,'status':v['status'],'report':record(d/'report.json'),'tests':[{'name':x['name'],'status':x['status']} for x in v['tests']],'error':v.get('error'),'snapshots':snapshots,'captures':[{k:x[k] for k in ('path','bytes','sha256')} for x in v['captures']], 'observerTransportEvents':v.get('observerTransportEvents',[])})
    target=DOCS/'original-evidence';assert not target.exists();target.mkdir();copied={}
    for f in sorted(root.rglob('*')):
        if not f.is_file():continue
        name=f.relative_to(root).as_posix()
        if f.suffix=='.apk' or '/verified-inputs/artifact-source/' in name:continue
        out=target/name;out.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(f,out);assert record(out)==record(f);copied[name]=record(out)
    result={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exportCommit':EXPORT,'qaRunId':QA_RUN,'qaRunAttempt':1,'qaSourceSha':QA_SOURCE,'originalArtifactRunId':ORIGINAL_RUN,'originalArtifactRunAttempt':1,'originalArtifactSourceSha':SOURCE,'originalArtifactExportCommit':ORIGINAL_EXPORT,'exportFilesVerified':len(actual),'originalAppSourceInputsComparedToGit':len(receipt['sourceInputs']),'uniqueOriginalAndExecutedSourceFilesComparedToGit':len(checked),'originalSignedApkUnchanged':record(apk),'signatureAuditReusedFrom':{'path':str(old.relative_to(a.repo)),'record':record(old)},'newApkSigningOrBuild':False,'originalInputBinding':binding,'originalRuntimeResult':manifest['runtimeResult'],'runtimeAccepted':manifest['runtimeAccepted'],'modes':reports,'archivedSubsetFiles':len(copied),'archiveOmissions':'APK binaries and duplicate original artifact-source remain in immutable export/scratch; all files were verified before copying subset. Executed QA sources and original reports retained.','script':record(Path(__file__)),'physicalTvTested':False,'physicalEsp32Tested':False}
    (DOCS/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ('exportFilesVerified','originalAppSourceInputsComparedToGit','uniqueOriginalAndExecutedSourceFilesComparedToGit','originalSignedApkUnchanged','runtimeAccepted','archivedSubsetFiles')}))

if __name__=='__main__':main()

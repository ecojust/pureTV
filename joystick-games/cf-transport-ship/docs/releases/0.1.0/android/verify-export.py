#!/usr/bin/env python3
"""Independent download and source verification; never substitutes for visual QA."""
from pathlib import Path
import hashlib, importlib.util, json, subprocess, sys

ROOT=Path('/dev/shm/puretv-joystick-games')
HERE=Path(__file__).parent
EXPORT=HERE/'export'
ORIGINAL=HERE.parent/'44110295680/export'
QA='06c73fa33c332736876a0c5324a5d9bb9bf3afe3'
RUN='44118366855'
SOURCE='d30e1ce26abbf27d07d149b708c6a491abb105b3'
ARTIFACT_EXPORT='21618545e8262d69a743be0b10ef6ce9634a6dd3'
ARTIFACT_RUN='44110295680'
GAMES=('cf-transport-ship','qq-speed')

def info(path):
    assert path.is_file() and not path.is_symlink(),path
    data=path.read_bytes()
    return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

def frozen(repo,ref,name):
    assert not Path(name).is_absolute() and '..' not in Path(name).parts
    return subprocess.check_output(['git','show',ref+':'+name],cwd=repo)

def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value)
    return value

helper=module('runtime_inputs',ROOT/'joystick-games/tools/android-runtime-inputs.py')
copy_path=ROOT/'joystick-games/tools/android-runtime-copies.py'
assert copy_path.read_bytes()==frozen(ROOT,QA,copy_path.relative_to(ROOT).as_posix())
copies=module('runtime_copies',copy_path)
export_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=EXPORT,text=True).strip()
manifest=helper.verify_export_origin(EXPORT,export_commit)
files=helper.verify_manifest(EXPORT,manifest)
binding={'qaSourceSha':QA,'qaRunId':RUN,'artifactSourceSha':SOURCE,
         'artifactExportCommit':ARTIFACT_EXPORT,'artifactRunId':ARTIFACT_RUN}
assert all(manifest[k]==v for k,v in binding.items())
assert manifest['reusedSignedPackagesAndObservers'] is True
original_manifest=helper.verify_export_origin(ORIGINAL,ARTIFACT_EXPORT)
helper.verify_manifest(ORIGINAL,original_manifest)
audit=copies.audit(EXPORT/'evidence')
assert audit==json.loads((EXPORT/'archive-verification.json').read_text())
assert audit['status']=='passed',audit
jobs=[]
for slug in GAMES:
    evidence=EXPORT/'evidence'/('joystick-android-runtime-'+slug)
    job=evidence/slug
    executed=json.loads((job/'executed-source.json').read_text())
    assert all(executed[k]==v for k,v in binding.items())
    for name,value in executed['files'].items():
        data=frozen(ROOT,QA,name)
        assert info(job/'executed-source'/name)==value
        assert data==(job/'executed-source'/name).read_bytes(),name
    inputs=job/'verified-inputs'
    verification=json.loads((inputs/'input-verification.json').read_text())
    assert verification['status']=='passed' and verification['localPreflightOnly'] is False
    assert verification['workingTreeBaseSha']==QA
    assert all(verification[k]==v for k,v in binding.items())
    assert (inputs/'original-export-manifest.json').read_bytes()==(ORIGINAL/'export-manifest.json').read_bytes()
    for kind in ('packages','observers'):
        expected={p.relative_to(ORIGINAL/kind).as_posix():info(p) for p in (ORIGINAL/kind).rglob('*') if p.is_file()}
        actual={p.relative_to(inputs/kind).as_posix():info(p) for p in (inputs/kind).rglob('*') if p.is_file()}
        assert actual==expected,(slug,kind)
    original_inputs=inputs/'artifact-source'
    for path in original_inputs.rglob('*'):
        if path.is_file():
            name=path.relative_to(original_inputs).as_posix()
            assert path.read_bytes()==frozen(ROOT,SOURCE,name),name
    production_counts={}
    for game in GAMES:
        receipt=json.loads((inputs/'packages'/game/'signing-receipt.json').read_text())
        assert set(receipt['sourceInputs'])==helper.expected_inputs(ROOT,SOURCE,game)
        old={n for n in receipt['sourceInputs'] if helper.production_path(n,game)}
        new={n for n in helper.expected_inputs(ROOT,QA,game) if helper.production_path(n,game)}
        assert old==new
        for name in old:
            helper.check_production_bytes(ROOT/name,frozen(ROOT,SOURCE,name),frozen(ROOT,QA,name))
        production_counts[game]=len(old)
    scenarios=[]
    for mode in ('normal','occupied'):
        folder=evidence/(slug+'-'+mode)
        if not folder.is_dir():
            scenarios.append({'mode':mode,'status':'not-executed'});continue
        report=json.loads((folder/'report.json').read_text())
        assert report['sourceCommit']==QA and report['game']==slug
        assert report['defaultPortOccupiedFixture']==(mode=='occupied')
        package=inputs/'packages'/slug/(slug+'-0.1.0.apk')
        observer=inputs/'observers'/slug/('observer-'+slug+'.apk')
        for key,path in [('apk',package),('observer',observer)]:
            assert {k:report[key][k] for k in ('bytes','sha256')}==info(path)
        for name,value in report['sourceFiles'].items():
            assert value==info(job/'executed-source'/name)
        for capture in report.get('captures',[]):
            assert info(folder/capture['path'])=={k:capture[k] for k in ('bytes','sha256')}
        if report.get('video'):
            video=report['video'];assert info(folder/video['path'])=={k:video[k] for k in ('bytes','sha256')}
        scenarios.append({'mode':mode,'status':report['status'],'report':info(folder/'report.json'),
                          'passedTests':len([t for t in report['tests'] if t['status']=='passed']),
                          'captures':len(report.get('captures',[])),
                          'controllerService':report.get('controllerService')})
    jobs.append({'game':slug,'sourceCopiesVerified':len(executed['files']),
                 'productionInputsUnchanged':production_counts,'scenarios':scenarios})
result={'status':'passed','scope':'download, immutable source and package-byte integrity',
        **binding,'qaExportCommit':export_commit,'exportFilesVerified':files,
        'exportManifest':info(EXPORT/'export-manifest.json'),'archiveVerification':audit,
        'runtimeResult':manifest['runtimeResult'],'games':jobs,
        'independentVisualAcceptanceRequired':True,'physicalTvTested':False,'physicalEsp32Tested':False,
        'verifier':info(Path(__file__))}
output=HERE/'download-verification.json';assert not output.exists()
output.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))

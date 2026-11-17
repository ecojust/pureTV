#!/usr/bin/env python3
"""Import reviewed frozen Android packages with exact-file provenance, once."""
from pathlib import Path
import argparse, hashlib, json, shutil, sys

ROOT=Path('/dev/shm/puretv-joystick-games')
HERE=Path(__file__).parent
EXPORT=HERE/'export'
ORIGINAL=HERE.parent/'44110295680/export'
SOURCE='d30e1ce26abbf27d07d149b708c6a491abb105b3'
ARTIFACT_EXPORT='21618545e8262d69a743be0b10ef6ce9634a6dd3'
QA='06c73fa33c332736876a0c5324a5d9bb9bf3afe3'
QA_EXPORT='464a4482a4e74b2d652c9fc4deb63f494bfd12a8'
sys.path.insert(0,str(ROOT/'tools'))
from resource_catalog import apk_info
TOOLS=Path('/workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0')

def info(path):
    assert path.is_file() and not path.is_symlink(),path
    data=path.read_bytes()
    return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

def write(path,value):
    assert not path.exists(),path
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--visual-review',type=Path,required=True)
    args=parser.parse_args()
    args.visual_review=args.visual_review.resolve()
    visual=json.loads(args.visual_review.read_text())
    assert visual['status']=='passed' and visual['allImagesManuallyReviewed'] is True
    verified=json.loads((HERE/'download-verification.json').read_text())
    assert verified['status']=='passed' and verified['runtimeResult']=='success'
    assert verified['qaSourceSha']==QA and verified['qaExportCommit']==QA_EXPORT
    assert all(s['status']=='passed' for g in verified['games'] for s in g['scenarios'])
    pin=(ROOT/'tools/puretv-release-certificate-v2.sha256').read_text().strip()
    results=[]
    for slug in ('cf-transport-ship','qq-speed'):
        game=ROOT/'joystick-games'/slug
        destination=game/'docs/releases/0.1.0/android'
        assert not destination.exists(),destination
        apk=ORIGINAL/'packages'/slug/(slug+'-0.1.0.apk')
        user_apk=game/apk.name
        assert not user_apk.exists()
        receipt=json.loads((apk.parent/'signing-receipt.json').read_text())
        identity=apk_info(apk,TOOLS)
        assert identity['certificateSha256']==pin
        assert all(receipt[k]==v for k,v in identity.items())
        assert receipt['sourceSha']==SOURCE and str(receipt['runId'])=='44110295680'
        job=EXPORT/'evidence'/('joystick-android-runtime-'+slug)
        provenance=job/slug
        copied={}
        def copy_file(source,target,origin):
            assert not target.exists() and not source.is_symlink()
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(source,target)
            assert info(source)==info(target)
            copied[target.relative_to(game).as_posix()]={'origin':origin,**info(target)}
        def copy_export(source,target,original=False):
            base=ORIGINAL if original else EXPORT
            commit=ARTIFACT_EXPORT if original else QA_EXPORT
            copy_file(source,target,{'exportCommit':commit,'path':source.relative_to(base).as_posix()})
        def copy_tree(source,target):
            for path in sorted(source.rglob('*')):
                assert not path.is_symlink()
                if path.is_file():copy_export(path,target/path.relative_to(source))
        copy_export(apk,user_apk,True)
        for name in ('build-receipt.json','signing-receipt.json','SHA256SUMS.txt'):
            copy_export(apk.parent/name,destination/name,True)
        for name in ('observer-build.json','observer-signing-receipt.json'):
            copy_export(ORIGINAL/'observers'/slug/name,destination/name,True)
        for name in ('qa-contracts.log','artifact-contracts.log','input-verification.log','emulator-version.txt','executed-source.json'):
            copy_export(provenance/name,destination/name)
        copy_tree(provenance/'executed-source',destination/'executed-source')
        copy_tree(provenance/'verified-inputs/artifact-source',destination/'artifact-source')
        for name in ('input-verification.json','original-export-manifest.json'):
            copy_export(provenance/'verified-inputs'/name,destination/name)
        copy_export(EXPORT/'export-manifest.json',destination/'qa-export-manifest.json')
        copy_export(EXPORT/'archive-verification.json',destination/'archive-verification.json')
        scenarios=[]
        for mode in ('normal','occupied'):
            source=job/(slug+'-'+mode)
            report=json.loads((source/'report.json').read_text())
            assert report['status']=='passed'
            copy_tree(source,destination/('runtime-'+mode))
            scenarios.append({'mode':mode,'report':'runtime-'+mode+'/report.json',
                              'testsPassed':len(report['tests']),'controllerPort':report['controllerService']['port']})
        for name in ('download-verification.json','verify-export.py','final-run.json'):
            copy_file(HERE/name,destination/name,{'localIndependentVerification':True,'file':name})
        for name in ('package-verification.json','verify-export.py'):
            source=HERE.parent/'44110295680'/name
            copy_file(source,destination/('original-'+name),{'localFrozenBuildVerification':True,'artifactRunId':'44110295680','file':name})
        copy_file(args.visual_review,destination/'visual-review.json',{'independentReviewPath':args.visual_review.relative_to(ROOT).as_posix()})
        release={'id':slug,'version':'0.1.0','platform':'Android TV','package':identity,
                 'file':user_apk.name,'artifactSourceSha':SOURCE,'artifactBuildRunId':'44110295680',
                 'artifactExportCommit':ARTIFACT_EXPORT,'productionFreezeSha':'e7a7c9a9b823052425b7ea111d61896b2f92ea60',
                 'qaSourceSha':QA,'qaRunId':'44118366855','qaExportCommit':QA_EXPORT,
                 'reusedOriginalSignedPackage':True,'signedWithRepositoryReleaseCertificate':True,
                 'defaultControllerPort':63485,'controllerSeats':1,
                 'runtimeValidation':{'status':'passed','emulator':'API 36 Android TV x86_64 / tv_1080p / SwiftShader',
                                      'scenarios':scenarios,'visualReviewPassed':True},
                 'minimumSdkInManifest':26,'requiresWebGL2':True,'requiresCompatibleWebView':True,
                 'physicalTvTested':False,'physicalEsp32Tested':False,
                 'evidenceDirectory':'docs/releases/0.1.0/android',
                 'observerIncludedInUserPackage':False}
        write(game/'android-release.json',release)
        copied['android-release.json']={'origin':{'generatedReleaseMetadata':True},**info(game/'android-release.json')}
        report={'status':'passed','game':slug,'artifactSourceSha':SOURCE,'qaSourceSha':QA,
                'artifactExportCommit':ARTIFACT_EXPORT,'qaExportCommit':QA_EXPORT,
                'package':identity,'copiedFiles':copied,'verifier':info(Path(__file__)),
                'scope':'Exact copied-file bytes plus original fixed signing certificate; raw runtime and independent visual review preserved',
                'physicalTvTested':False,'physicalEsp32Tested':False}
        write(destination/'import-verification.json',report)
        results.append({'game':slug,'package':identity,'copiedFiles':len(copied),'evidenceDirectory':destination.relative_to(ROOT).as_posix()})
    write(HERE/'import-summary.json',{'status':'passed','games':results,'verifier':info(Path(__file__))})
    print(json.dumps(results,ensure_ascii=False,indent=2))

if __name__=='__main__':main()

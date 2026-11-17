#!/usr/bin/env python3
"""Read-only current-release audit; writes only the requested JSON outside the repo.

No browser, model tests, build, signing, signature verifier, or video decoder runs.
APK ZIP bytes/manifest and stored evidence are inspected, not re-certified.
Use --through 100 later; omitted --through follows captured progress.completed.
"""
import argparse
import collections
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import zipfile

CERT = 'eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23'
LIMIT = 10_000_000
HASH = re.compile(r'^[0-9a-f]{64}$')
PATH = re.compile(r'^[^\n]+\.(?:json|jsonl|txt|log|md|png|jpg|svg|mp4|apk|js|mjs|cjs|py|xml|css|html)$')
REF_KEYS = {'report','rawReport','metadata','video','path','file','sharedReport','gameSpecificReport','cover','gameplayMetadata','gameplayVideo','verification','signingReceipt','resourceMetadata','inputStateTrace','performanceSamples'}

# Actual legacy descriptive-source fields reviewed during the first audit.
# A new field, or the same field in another game/schema, is NOT grandfathered.
LEGACY_SOURCE_REFERENCES = {
    'verification.independentPilotReview.harnessCorrection.previousScript.file': {17},
    'verification.independentPilotReview.harnessCorrection.previousReport.file': {17},
    'verification.gameRules.actualCandidate.liveWindowReviews[].path': {20},
    'verification.gameRules.actualCandidate.priorAttempt.path': {20},
    'verification.gameRules.captureHistory.captureDriverWindow.path': {24},
    'verification.gameRules.candidateNormalPlay.imageWindows[].path': {26},
    'verification.gameRules.candidateNormalPlay.continuousWindows[].path': {27},
    'verification.gameRules.ordinaryRounds[].report': set(range(28,34)),
    'verification.gameRules.candidateNormalPlay.liveCaptureWindows[].path': {28},
    'verification.gameRules.independentReview.rounds[].source.file': {33},
    'verification.gameRules.candidateNormalPlay.firstMenuOnlyFailure.report': {33},
    'verification.actualGameplay.candidateAttemptHistory.preservedFailedAttempts[].report': {34,35},
    'gameplayMetadata.candidateAttemptHistory.preservedFailedAttempts[].report': {34,35},
    'verification.actualGameplay.candidateEvidence.metadataProjection.originalCandidateGate.path': {36},
    'verification.actualGameplay.candidateEvidence.metadataProjection.originalPersonalReview.path': {36},
    'gameplayMetadata.candidateEvidence.metadataProjection.originalCandidateGate.path': {36},
    'gameplayMetadata.candidateEvidence.metadataProjection.originalPersonalReview.path': {36},
    'verification.gameRules.independent.sourceRuns[].path': {38},
    'verification.actualGameplay.finalPersonalImageReview.secondNonBlockingFindings[].observations[].path': {38},
    'verification.actualGameplay.controllerEvidence.report': {38},
    'gameplayMetadata.finalPersonalImageReview.secondNonBlockingFindings[].observations[].path': {38},
    'gameplayMetadata.controllerEvidence.report': {38},
    'verification.gameRules.independent.rounds[].path': {39},
    'verification.finalLayoutReview.viewports[].path': {39},
    'verification.gameRules.ordinary.runs[].file': {42,43,44,45},
    'verification.finalLayoutReview.firstAttemptsPreserved[].file': {44},
    'verification.finalLayoutReview.firstAttemptsPreserved[].path': {45},
    'verification.supplementaryControls.candidateCapture.parents[].file': {46},
    'verification.supplementaryControls.visualGaps.parents[].file': {46},
    'verification.finalLayoutReview.cover': {46,47},
    'verification.actualGameplay.ordinaryModelRuns.runs[].file': {46},
    'gameplayMetadata.ordinaryModelRuns.runs[].file': {46},
}
MODERN_REQUIRED_REFS = (
    'browser.sharedReport','browser.gameSpecificReport','visualReview.report',
    'catalog.report','gameplay.metadata','gameplay.video',
)
DETAILED_REQUIRED_REFS = ('modelTests.report','independentRules.report','sharedProtocols.report')
ARTIFACT_KEYS = {'apkSize','apkManifest','apkSignature','apkZipIntegrity','apkAssetsMatch','videoSize','videoFormat','videoFullDecode'}
FETCH_ARTIFACT_KEYS = {'signatureVerified','zipalignVerified','crcVerified','sourceIdentityVerified','assetsMatchSigningReceipt','videoSize','videoFormat','videoFullDecode'}

def reference_kind(number,field,legacy):
    normalized=re.sub(r'\[\d+\]','[]',field)
    if legacy and number in LEGACY_SOURCE_REFERENCES.get(normalized,set()):
        return 'recognized-historical-source'
    if field.startswith('resource.') or (not legacy and field.startswith('verification.')):
        return 'explicit-published-report'
    return 'unknown-reference-requires-presence'

def asset_map_checks(data,actual_assets):
    """Pure checks shared by the real audit and mutation tests; never truthiness-only."""
    checks=[('dictionaryType',type(data).__name__,'dict'),('actualAssetsNonempty',bool(actual_assets),True)]
    if type(data) is not dict:return checks
    checks.append(('keySet',sorted(data),sorted(actual_assets)))
    for name,value in data.items():
        checks.append((name+':sha256Format',isinstance(value,str) and HASH.fullmatch(value) is not None,True))
        checks.append((name,value,actual_assets.get(name)))
    return checks

def checklist_checks(entries,minimum=1):
    checks=[('listType',type(entries).__name__,'list')]
    if type(entries) is not list:return checks
    checks.append(('minimumCount',len(entries)>=minimum,True))
    for i,entry in enumerate(entries):
        checks.append((f'[{i}]:objectType',type(entry).__name__,'dict'))
        if type(entry) is dict:checks.append((f'[{i}].passed',entry.get('passed',entry.get('ok')),True))
    return checks

def named_checklist_checks(entries,minimum=1):
    checks=[('listType',type(entries).__name__,'list')]
    if type(entries) is not list:return checks
    checks.append(('minimumCount',len(entries)>=minimum,True))
    checks.append(('nonemptyNames',all(isinstance(x,str) and bool(x.strip()) for x in entries),True))
    return checks

def pass_map_checks(data,required):
    checks=[('dictionaryType',type(data).__name__,'dict')]
    if type(data) is not dict:return checks
    checks.append(('requiredKeys',sorted(required-set(data)),[]))
    for key,value in data.items():checks.append((key,value,True))
    return checks

def report_reference_checks(reference,available):
    valid=isinstance(reference,str) and PATH.fullmatch(reference) is not None
    return [('pathValue',valid,True),('fileExists',valid and reference in available,True)]

def checks_pass(checks):
    return bool(checks) and all(type(actual) is type(expected) and actual==expected for _,actual,expected in checks)

def validation_self_tests():
    """In-memory file-set mutations only: no production files are changed."""
    tests=[]
    def test(name,ok,details):
        if not ok:raise AssertionError(name)
        tests.append({'name':name,'passed':True,**details})
    available={'model-tests.txt','independent-review.json','shared-checks/summary.json'}
    for field,ref in zip(DETAILED_REQUIRED_REFS,('model-tests.txt','independent-review.json','shared-checks/summary.json')):
        kind=reference_kind(48,'verification.'+field,False)
        good=report_reference_checks(ref,available)
        bad=report_reference_checks(ref,available-{ref})
        test('deleted required report: '+field,kind=='explicit-published-report' and checks_pass(good) and not checks_pass(bad),{'classification':kind,'removed':ref,'errors':[c[0] for c in bad if c[1]!=c[2]]})
    expected={'game-model.js':'a'*64,'game.js':'b'*64,'renderer.js':'c'*64}
    test('valid complete asset map control',checks_pass(asset_map_checks(expected,expected)),{})
    for value in ['nonempty',[{'game-model.js':'a'*64}],True,{},dict(expected,extra='d'*64),{**expected,'game.js':'bad-hash'}]:
        result=asset_map_checks(value,expected)
        test('invalid asset map rejected: '+repr(value),not checks_pass(result),{'inputType':type(value).__name__,'errors':[c[0] for c in result if c[1]!=c[2]]})
    test('empty checklist cannot pass',not checks_pass(checklist_checks([])),{})
    test('empty required artifact map cannot pass',not checks_pass(pass_map_checks({},ARTIFACT_KEYS)),{})
    test('unknown missing reference is not historical',reference_kind(48,'verification.newEvidence.report',False)=='explicit-published-report' and reference_kind(17,'verification.newEvidence.report',True)=='unknown-reference-requires-presence',{})
    test('recognized historical citation remains narrowly scoped',reference_kind(17,'verification.independentPilotReview.harnessCorrection.previousScript.file',True)=='recognized-historical-source' and reference_kind(18,'verification.independentPilotReview.harnessCorrection.previousScript.file',True)=='unknown-reference-requires-presence',{})
    return {'kind':'pure-validation-mutation-tests','productionFilesChanged':False,'passed':True,'tests':tests}

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root', default='/workspace/pureTV-publish')
    ap.add_argument('--through', type=int)
    ap.add_argument('--output')
    ap.add_argument('--supersedes',help='Prior report to preserve and identify as superseded; never rewritten')
    ap.add_argument('--aapt', default='/workspace/scratch/game-toolchain/android-sdk/build-tools/34.0.0/aapt')
    args = ap.parse_args()
    root = Path(args.root).resolve()
    progress_path = root/'resource/game-kit/progress.json'
    progress_bytes = progress_path.read_bytes()
    progress = json.loads(progress_bytes)
    through = args.through or progress['completed']
    output = Path(args.output or f'/workspace/scratch/hundred-continuation/progress-audit-through-{through}-v2.json').resolve()
    if output == root or root in output.parents:
        raise SystemExit('Refusing to write an audit report inside the audited repository')
    prior_path=Path(args.supersedes).resolve() if args.supersedes else None
    if prior_path==output:raise SystemExit('Refusing to overwrite the superseded report')
    self_tests=validation_self_tests()
    def git(*parts):
        return subprocess.run(['git','-C',str(root),*parts],capture_output=True,check=False)
    head = git('rev-parse','HEAD').stdout.decode().strip()
    cache = {}
    def digest(path):
        path = Path(path)
        if path not in cache:
            h = hashlib.sha256()
            with path.open('rb') as f:
                for b in iter(lambda:f.read(1<<20),b''): h.update(b)
            cache[path] = h.hexdigest()
        return cache[path]
    def sha(data): return hashlib.sha256(data).hexdigest()
    global_checks = []
    findings = []
    def check(bucket, label, actual, expected, game=None):
        ok = actual == expected and type(actual) is type(expected)
        row = {'field':label,'passed':ok}
        if not ok:
            row.update(actual=actual,expected=expected)
            findings.append({'number':game,'field':label,'actual':actual,'expected':expected})
        bucket.append(row)
        return ok
    selected = [g for g in progress['games'] if isinstance(g.get('number'),int) and 1<=g['number']<=through]
    check(global_checks,'progress.selectedNumbers',sorted(g['number'] for g in selected),list(range(1,through+1)))
    check(global_checks,'selected.idUnique',len({g['id'] for g in selected}),through)
    check(global_checks,'selected.packageNameUnique',len({g['packageName'] for g in selected}),through)
    check(global_checks,'selected.pathUnique',len({g['path'] for g in selected}),through)
    games = []
    model_groups = collections.defaultdict(list)
    for g in sorted(selected,key=lambda g:g['number']):
        n=g['number']; app=root/g['path']; docs=app/'docs'; checks=[]
        item={'number':n,'id':g['id'],'version':g['version'],'packageName':g['packageName'],'checks':checks,'formalReferences':[],'temporaryReferences':[],'hashOnlyEvidence':[],'historicalSourceReferences':[],'schemaNotes':[]}
        games.append(item)
        def ck(label,a,e): return check(checks,label,a,e,n)
        def apply_checks(label,rows):
            for suffix,actual,expected in rows:ck(label+'.'+suffix,actual,expected)
        def positive_count(label,value):
            ck(label+':positiveInteger',type(value) is int and value>0,True)
        def load(path,required=True):
            path=Path(path)
            if not path.is_file():
                if required: ck(str(path.relative_to(root))+':exists',False,True)
                return {}
            try: return json.loads(path.read_text())
            except (ValueError,OSError) as ex:
                ck(str(path.relative_to(root))+':validJson',str(ex),True); return {}
        resource=load(app/'resource.json'); verification=load(app/g['checks']); signing=load(docs/'signing-receipt.json'); game_config=load(app/'game.json')
        ck('progress.status',g.get('status'),'verified')
        for rk,pk in [('version','version'),('packageName','packageName'),('apk','apk'),('apkBytes','apkBytes'),('sha256','apkSha256'),('sourceCommit','sourceCommit'),('gameplayVideo','video')]:
            ck('resource.'+rk,resource.get(rk),g.get(pk))
        ck('resource.buildRun',str(resource.get('buildRun','')).rstrip('/').split('/')[-1],str(g['signingRun']))
        ck('resource.certificateSha256',resource.get('certificateSha256'),CERT)
        for k in ['id','version','packageName']: ck('gameConfig.'+k,game_config.get(k),g.get(k))
        ck('verification.game',verification.get('game'),g['id']); ck('verification.version',verification.get('version'),g['version'])
        for sk,pk in [('slug','id'),('sourceSha','sourceCommit'),('packageName','packageName'),('version','version'),('file','apk'),('sha256','apkSha256'),('bytes','apkBytes')]: ck('signingReceipt.'+sk,signing.get(sk),g[pk])
        ck('signingReceipt.workflowRun',str(signing.get('workflowRun')),str(g['signingRun']))
        ck('signingReceipt.certificateSha256',signing.get('certificateSha256'),CERT)
        for k in ['signatureVerified','sourceAssetsMatchApk','localBuildMatchesCi']:ck('signingReceipt.'+k,signing.get(k),True)
        item['provenance']={'sourceCommit':g['sourceCommit'],'signingRun':g['signingRun'],'signerCommit':signing.get('signerCommit'),'requestCommit':signing.get('requestCommit'),'certificateSha256':signing.get('certificateSha256'),'signatureVerification':'stored receipt bound to actual APK hash; cryptographic verification not rerun'}
        for key in ['sourceAssetsMatchApk','signatureVerified']:ck('resource.verification.'+key,resource.get('verification',{}).get(key),True)
        artifacts={}
        for kind,file_key,bytes_key,sha_key in [('apk','apk','apkBytes','apkSha256'),('video','video','videoBytes','videoSha256')]:
            path=app/g[file_key]
            ck(kind+'.fileExists',path.is_file(),True)
            if path.is_file():
                size=path.stat().st_size; hs=digest(path)
                ck(kind+'.bytes',size,g[bytes_key]);ck(kind+'.sha256',hs,g[sha_key]);ck(kind+'.strictlyBelow10000000',size<LIMIT,True)
                artifacts[kind]={'path':str(path.relative_to(root)),'bytes':size,'sha256':hs}
        item['artifacts']=artifacts
        apk=app/g['apk']; actual_assets={}
        if apk.is_file():
            try:
                with zipfile.ZipFile(apk) as z:
                    ck('apk.zipCrc',z.testzip(),None)
                    asset_names=[name for name in z.namelist() if name.startswith('assets/') and not name.endswith('/')]
                    ck('apk.assetNamesUnique',len(asset_names),len(set(asset_names)))
                    actual_assets={name[7:]:sha(z.read(name)) for name in z.namelist() if name.startswith('assets/') and not name.endswith('/')}
                    cfg=json.loads(z.read('assets/game-config.json'))
                    for key in ['id','version','packageName']:ck('apk.gameConfig.'+key,cfg.get(key),g.get(key))
                    ck('apk.gameConfig.versionCode',cfg.get('versionCode'),game_config.get('versionCode'))
                    for name,relative in [('game-model.js',g['path']+'/src/main/assets/game-model.js'),('game.js',g['path']+'/src/main/assets/game.js'),('renderer.js','resource/game-kit/web/renderer.js')]:
                        source=root/relative
                        ck('publishedSource.'+name+':exists',source.is_file(),True)
                        if source.is_file():ck('apkVsPublishedSource.'+name,actual_assets.get(name),digest(source))
                        frozen=git('show',g['sourceCommit']+':'+relative)
                        ck('frozenSource.'+name+':exists',frozen.returncode,0)
                        if frozen.returncode==0:ck('apkVsFrozenSource.'+name,actual_assets.get(name),sha(frozen.stdout))
                    model_groups[actual_assets.get('game-model.js')].append(n)
            except (ValueError,zipfile.BadZipFile,KeyError) as ex:ck('apk.readableAssets',str(ex),True)
            if Path(args.aapt).is_file():
                badging=subprocess.run([args.aapt,'dump','badging',str(apk)],capture_output=True,text=True)
                match=re.search(r"package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'",badging.stdout)
                ck('apk.manifestReadable',bool(match),True)
                if match:
                    ck('apk.manifest.packageName',match[1],g['packageName']);ck('apk.manifest.versionName',match[3],g['version']);ck('apk.manifest.versionCode',match[2],str(game_config.get('versionCode')))
            else:ck('audit.aaptAvailable',False,True)
        item['actualAssetHashes']=actual_assets
        def asset_map(label,data):
            apply_checks(label,asset_map_checks(data,actual_assets))
        asset_map('signingReceipt.assetsSha256',signing.get('assetsSha256',{}));ck('signingReceipt.checkedAssets',signing.get('checkedAssets'),len(actual_assets))
        asset_map('verification.finalAssets',verification.get('sourceAssetHashes',verification.get('finalAssetHashes',{})))
        # Two documented verification schemas, with every present assertion checked.
        rv=resource.get('verification',{})
        if 'checkedSourceAssetFiles' in rv:ck('resource.checkedSourceAssetFiles',rv['checkedSourceAssetFiles'],len(actual_assets))
        if 'release' in verification:
            item['verificationSchema']='legacy-embedded-results'
            release=verification['release']
            for k,p in [('sourceSha','sourceCommit'),('signingRun','signingRun'),('bytes','apkBytes'),('sha256','apkSha256')]:ck('verification.release.'+k,release.get(k),g[p])
            ck('verification.release.certificateSha256',release.get('certificateSha256'),CERT)
            ck('verification.release.localBuildMatchesCi',release.get('localBuildMatchesCi'),True)
            if 'sourceCommit' in verification:ck('verification.sourceCommit',verification['sourceCommit'],g['sourceCommit'])
            artifact_checks=release.get('artifactChecks')
            required=FETCH_ARTIFACT_KEYS if type(artifact_checks) is dict and 'signatureVerified' in artifact_checks else ARTIFACT_KEYS
            apply_checks('verification.release.artifactChecks',pass_map_checks(artifact_checks,required))
            model=verification.get('modelTests',{})
            positive_count('verification.modelTests.passed',model.get('passed'))
            if 'testNames' in model:
                apply_checks('verification.modelTests.testNames',named_checklist_checks(model['testNames']))
                if type(model['testNames']) is list:ck('verification.modelTests.testNames:count',len(model['testNames']),model.get('passed'))
            if 'modelTestsPassed' in rv:ck('resource.modelTestsPassed',rv['modelTestsPassed'],model.get('passed'))
            if 'modelSha256' in model:ck('verification.modelTests.modelSha256',model['modelSha256'],actual_assets.get('game-model.js'))
            reg=verification.get('sharedBrowserRegression',{});ck('verification.sharedBrowserRegression.passed',reg.get('passed'),True)
            entries=reg.get('checks')
            apply_checks('verification.sharedChecks',checklist_checks(entries,5))
            positive_count('resource.sharedBrowserChecksPassed',rv.get('sharedBrowserChecksPassed'))
            ck('resource.sharedBrowserChecksPassed',rv.get('sharedBrowserChecksPassed'),len(entries) if type(entries) is list else None)
            if 'sourceAssetHashes' in reg:asset_map('verification.sharedBrowserAssets',reg['sourceAssetHashes'])
            if 'supplementaryChecksPassed' in rv:
                su=verification.get('supplementaryUiAndFailure',verification.get('supplementaryChecks',{}))
                ck('verification.supplementaryChecks.passed',su.get('passed'),True)
                apply_checks('verification.supplementaryChecks',checklist_checks(su.get('checks')))
                positive_count('resource.supplementaryChecksPassed',rv['supplementaryChecksPassed'])
                ck('resource.supplementaryChecksPassed',rv['supplementaryChecksPassed'],len(su['checks']) if type(su.get('checks')) is list else None)
            actual=verification.get('actualGameplay',{})
            if 'videoSha256' in actual:ck('verification.actualGameplay.videoSha256',actual['videoSha256'],g['videoSha256'])
            if 'videoBytes' in actual:ck('verification.actualGameplay.videoBytes',actual['videoBytes'],g['videoBytes'])
            if 'visualReviewCompleted' in actual:ck('verification.actualGameplay.visualReviewCompleted',actual['visualReviewCompleted'],True)
            item['schemaNotes'].append('Raw results can be embedded; original hash-only/scratch evidence retention is reported separately, never assumed present.')
        else:
            item['verificationSchema']='separate-formal-reports'
            required_refs=list(MODERN_REQUIRED_REFS)
            if n==48 or 'modelTests' in verification:
                required_refs+=DETAILED_REQUIRED_REFS
            available={str(p.relative_to(docs)) for p in docs.rglob('*') if p.is_file()}
            for ref in required_refs:
                section,key=ref.split('.')
                value=verification.get(section,{})
                value=value.get(key) if type(value) is dict else None
                apply_checks('requiredReport.verification.'+ref,report_reference_checks(value,available))
                if isinstance(value,str) and value in available:ck('requiredReport.verification.'+ref+':nonemptyFile',(docs/value).stat().st_size>0,True)
            if 'modelTests' in verification:
                groups=verification['modelTests'].get('groupedCasesPassed')
                positive_count('verification.modelTests.groupedCasesPassed',groups)
                if 'modelTestGroupsPassed' in rv:ck('resource.modelTestGroupsPassed',rv['modelTestGroupsPassed'],groups)
                positive_count('verification.independentRules.ordinaryWins',verification.get('independentRules',{}).get('ordinaryWins'))
                for name in ['controller','inputLifecycle','exportProtocol']:
                    positive_count('verification.sharedProtocols.'+name,verification.get('sharedProtocols',{}).get(name))
                model_path=docs/verification['modelTests'].get('report','__missing__')
                if model_path.is_file():
                    try:model_details=json.JSONDecoder().raw_decode(model_path.read_text().lstrip())[0]
                    except ValueError:model_details={}
                    ck('modelReport.passed',model_details.get('passed'),True)
                    ck('modelReport.cases',model_details.get('cases'),groups)
                    apply_checks('modelReport.checks',named_checklist_checks(model_details.get('checks')))
                    if type(model_details.get('checks')) is list:ck('modelReport.checks:count',len(model_details['checks']),groups)
                independent=load(docs/verification.get('independentRules',{}).get('report','__missing__'))
                layouts=independent.get('layouts');ck('independentRules.layouts:nonempty',type(layouts) is list and bool(layouts),True)
                ck('independentRules.passed',independent.get('passed'),True)
                if type(layouts) is list:ck('independentRules.ordinaryWins',sum(type(x) is dict and x.get('phase')=='won' for x in layouts),verification['independentRules']['ordinaryWins'])
                shared_path=docs/verification.get('sharedProtocols',{}).get('report','__missing__')
                shared=load(shared_path)
                for name,count_key in [('controller','checksPassed'),('inputLifecycle','checksPassed'),('exportProtocol','testsPassed')]:
                    part=shared.get(name,{})
                    ck('sharedProtocols.'+name+':count',part.get(count_key),verification.get('sharedProtocols',{}).get(name))
                    child=part.get('report',part.get('log'))
                    child_path=shared_path.parent/child if isinstance(child,str) else shared_path.parent/'__missing__'
                    ck('sharedProtocols.'+name+':evidenceExists',child_path.is_file(),True)
                    if child_path.is_file():ck('sharedProtocols.'+name+':evidenceNonempty',child_path.stat().st_size>0,True)
                    if name=='controller':
                        raw=load(child_path);apply_checks('sharedProtocols.controller.checks',named_checklist_checks(raw.get('checks')))
                        ck('sharedProtocols.controller.passed',raw.get('passed'),part.get(count_key))
                        if type(raw.get('checks')) is list:ck('sharedProtocols.controller.checks:count',len(raw['checks']),part.get(count_key))
                    if name=='inputLifecycle':
                        raw=load(child_path);apply_checks('sharedProtocols.inputLifecycle.tests',checklist_checks(raw.get('tests')))
                        if type(raw.get('tests')) is list:ck('sharedProtocols.inputLifecycle.tests:count',len(raw['tests']),part.get(count_key))
            else:
                ck('verification.modelAndIndependentRules:nonempty',isinstance(verification.get('modelAndIndependentRules'),str) and bool(verification['modelAndIndependentRules'].strip()),True)
                for family,choices in [('model',('model-verification.json','model-tests.txt')),('independent',('independent-review.json','independent-report.json'))]:
                    present=[name for name in choices if name in available]
                    ck('requiredReport.'+family+':atLeastOneRecognizedFile',bool(present),True)
                    item['schemaNotes'].append({'family':family,'recognizedPublishedEvidenceFiles':present,'alternativeSchemaNames':list(choices)})
                    for evidence_name in present:
                        ck('requiredReport.'+evidence_name+':nonemptyFile',(docs/evidence_name).stat().st_size>0,True)
                if 'model-verification.json' in available:
                    model_report=load(docs/'model-verification.json')
                    ck('modelReport.passed',model_report.get('passed'),True)
                    count=model_report.get('groupedCases',model_report.get('cases'))
                    positive_count('modelReport.cases',count)
                    if 'checks' in model_report:
                        names=model_report['checks'];ck('modelReport.checks:nonemptyNamedList',type(names) is list and bool(names) and all(isinstance(x,str) and bool(x.strip()) for x in names),True)
                        ck('modelReport.checks:count',len(names) if type(names) is list else None,count)
                    if 'modelSha256' in model_report:ck('modelReport.modelSha256',model_report['modelSha256'],actual_assets.get('game-model.js'))
            ck('verification.sourceCommit',verification.get('sourceCommit'),g['sourceCommit']);ck('verification.signingRun',verification.get('signingRun'),g['signingRun']);ck('verification.passed',verification.get('passed'),True)
            browser=verification.get('browser',{})
            for rk,vk in [('sharedBrowserChecksPassed','sharedChecksPassed'),('gameSpecificBrowserChecksPassed','gameSpecificChecksPassed')]:ck('resource.'+rk,rv.get(rk),browser.get(vk))
            ck('verification.browser.uniqueRulesVerified',browser.get('uniqueRulesVerified'),True)
            ck('verification.visualReview.visualReviewCompleted',verification.get('visualReview',{}).get('visualReviewCompleted'),True)
            performance=verification.get('performance',{})
            positive_count('verification.performance.samples',performance.get('samples'))
            for metric in ['rafIntervalMs','webglDrawCalls','canvasPaintCommands']:
                stats=performance.get(metric,{})
                positive_count('verification.performance.'+metric+'.count',stats.get('count'))
                ck('verification.performance.'+metric+':countMatchesSamples',stats.get('count'),performance.get('samples'))
            positive_count('verification.catalog.signedEntriesVerified',verification.get('catalog',{}).get('signedEntriesVerified'))
            catalog_file=verification.get('catalog',{}).get('report')
            catalog_report=load(docs/(catalog_file if isinstance(catalog_file,str) else '__missing__'))
            ck('catalogReport:nonemptyList',type(catalog_report) is list and bool(catalog_report),True)
            if type(catalog_report) is list:
                ck('catalogReport:count',len(catalog_report),verification['catalog']['signedEntriesVerified'])
                ck('catalogReport:allStoredSignatureChecksTrue',all(type(x) is dict and x.get('signatureVerified') is True for x in catalog_report),True)
            for ref_key,count_key in [('sharedReport','sharedChecksPassed'),('gameSpecificReport','gameSpecificChecksPassed')]:
                report_name=browser.get(ref_key)
                raw=load(docs/(report_name if isinstance(report_name,str) else '__missing__'));entries=raw.get('tests',raw.get('checks',[]))
                positive_count('browser.'+count_key,browser.get(count_key))
                apply_checks('browser.'+ref_key,checklist_checks(entries,10 if ref_key=='sharedReport' else 1))
                ck('browser.'+ref_key+':count',len(entries) if type(entries) is list else None,browser.get(count_key))
                if 'passed' in raw:ck('browser.'+ref_key+':passed',raw['passed'],True)
                if 'sourceAssetHashes' in raw:asset_map('browser.'+ref_key+':assets',raw['sourceAssetHashes'])
            va=verification.get('artifacts',{})
            apply_checks('verification.artifacts.checks',pass_map_checks(va.get('checks'),ARTIFACT_KEYS))
            for key,expected in [('bytes',g['apkBytes']),('sha256',g['apkSha256']),('package',g['packageName']),('versionName',g['version'])]:ck('verification.artifacts.apk.'+key,va.get('apk',{}).get(key),expected)
            ck('verification.artifacts.apk.signerSha256',va.get('apk',{}).get('signerSha256'),[CERT])
            for key,expected in [('bytes',g['videoBytes']),('sha256',g['videoSha256'])]:ck('verification.artifacts.video.'+key,va.get('video',{}).get(key),expected)
            artifact=load(docs/'artifact-validation.json');ck('artifactValidation.equalsPublishedVerification',artifact,va)
            fetch=load(docs/'fetch-verification.json')
            for fk,pk in [('sourceSha','sourceCommit'),('bytes','apkBytes'),('sha256','apkSha256')]:ck('fetch.'+fk,fetch.get(fk),g[pk])
            ck('fetch.runId',str(fetch.get('runId')),str(g['signingRun']));ck('fetch.certificateSha256',fetch.get('certificateSha256'),CERT)
            ck('fetch.receiptSha256',fetch.get('receiptSha256'),digest(docs/'signing-receipt.json'))
            for k in ['signatureVerified','zipalignVerified','crcVerified','sourceIdentityVerified','assetsMatchSigningReceipt']:ck('fetch.'+k,fetch.get(k),True)
            gameplay=verification.get('gameplay',{});ck('verification.gameplay.video',gameplay.get('video'),Path(g['video']).name)
            if 'allThreeLevelsWon' in gameplay:ck('verification.gameplay.allThreeLevelsWon',gameplay['allThreeLevelsWon'],True)
        meta_path=app/resource.get('gameplayMetadata','__missing__');meta=load(meta_path)
        ck('gameplayMetadata.videoBytes',meta.get('videoBytes'),g['videoBytes']);ck('gameplayMetadata.videoSha256',meta.get('videoSha256'),g['videoSha256'])
        for mk,pk in [('version','version'),('sourceSha','sourceCommit')]:
            if mk in meta:ck('gameplayMetadata.'+mk,meta[mk],g[pk])
        asset_map('gameplayMetadata.sourceAssetHashes',meta.get('sourceAssetHashes',{}))
        hardware=verification.get('hardware',verification)
        for k in ['physicalTvTested','physicalPhoneTested']:
            ck('resource.verification.'+k,rv.get(k),False);ck('verification.'+k,hardware.get(k),False);ck('gameplayMetadata.'+k,meta.get(k),False)
        item['hardware']={'physicalTvTested':False,'physicalPhoneTested':False,'auditPerformedDeviceTest':False}
        # Explicit formal references. Scratch paths and omitted frames are classified,
        # never silently rebound to arbitrary files with similar basenames.
        def refs(value,field,owner,scope=None,excluded=False):
            if isinstance(value,dict):
                scope=value.get('scope',scope)
                excluded=excluded or value.get('includedInRelease') is False
                for k,v in value.items():
                    if k in {'previousReleases','maintenance'}:continue
                    if k=='frameManifest':
                        item['schemaNotes'].append({'field':field+'.frameManifest','kind':'capture-intermediate-manifest','entries':len(v) if isinstance(v,list) else None,'rawJpegsRequiredInRelease':False,'reason':'Manifest describes encoder input frames; published video and manifest are the delivery artifacts.'})
                        continue
                    f=field+'.'+k
                    if isinstance(v,str) and k in REF_KEYS and PATH.fullmatch(v) and not v.startswith(('http:','https:')):
                        if excluded or scope=='scratch' or v.startswith(('/workspace/scratch/','/tmp/')):
                            item['temporaryReferences'].append({'field':f,'reference':v,'scope':'explicitly-not-included-in-release' if excluded else scope or 'absolute-temporary'});continue
                        if v.startswith('/workspace/pureTV/') or v.startswith('/workspace/pureTV-publish/'):
                            prefix='/workspace/pureTV-publish/' if v.startswith('/workspace/pureTV-publish/') else '/workspace/pureTV/'
                            candidates=[root/v[len(prefix):]]
                        elif v.startswith('/'):
                            item['temporaryReferences'].append({'field':f,'reference':v,'scope':'external-absolute'});continue
                        elif v.startswith(('resource/','tools/','docs/')):
                            candidates=[app/v,root/v] if v.startswith('docs/') else [root/v]
                        else:candidates=[owner.parent/v,app/v,docs/v,root/v]
                        path=next((p.resolve() for p in candidates if p.is_file()),candidates[0].resolve())
                        present=path.is_file() and root in path.parents
                        record={'field':f,'reference':v,'resolved':str(path.relative_to(root)) if root in path.parents else str(path),'exists':present,'declaredRetention':reference_kind(n,f,'release' in verification)}
                        item['formalReferences'].append(record);ck(f+':formalReferenceExists',present,True)
                        if not present and record['declaredRetention']=='recognized-historical-source':
                            checks[-1]['category']='historical-evidence-retention'
                            findings[-1]['category']='historical-evidence-retention'
                            findings[-1]['reference']=v
                            findings[-1]['resolved']=record['resolved']
                            findings[-1]['note']='Embedded descriptive original-evidence citation; not present in the published tree. This is not an APK/video identity failure and the missing original was not reverified.'
                        if present and k in {'path','file','report'} and HASH.fullmatch(str(value.get('sha256',''))):
                            if f.startswith('verification.sourceArtReview.sourceHashes.'):
                                frozen=git('show',g['sourceCommit']+':'+str(path.relative_to(root)))
                                historical=sha(frozen.stdout) if frozen.returncode==0 else None
                                item['historicalSourceReferences'].append({'field':f,'path':str(path.relative_to(root)),'declaredSha256':value['sha256'],'sourceCommitSha256':historical,'currentSha256':digest(path),'historicalScope':'source-only pre-release art review; later test/runtime updates are not silently substituted'})
                                ck(f+':frozenSourceSha256',historical,value['sha256'])
                            else:ck(f+':referenceSha256',digest(path),value['sha256'])
                    elif isinstance(v,(list,dict)):refs(v,f,owner,scope,excluded)
            elif isinstance(value,list):
                for i,v in enumerate(value):refs(v,f'{field}[{i}]',owner,scope,excluded)
        refs(resource,'resource',app/'resource.json');refs(verification,'verification',app/g['checks']);refs(meta,'gameplayMetadata',meta_path)
        raw_hashes=verification.get('rawEvidenceSha256',{})
        if raw_hashes:
            index=collections.defaultdict(list)
            for path in app.rglob('*'):
                if path.is_file():index[digest(path)].append(str(path.relative_to(root)))
            for label,hs in raw_hashes.items():
                item['hashOnlyEvidence'].append({'field':'verification.rawEvidenceSha256.'+label,'sha256':hs,'publishedFilesWithDigest':index.get(hs,[]),'originalFilePresent':bool(index.get(hs))})
        if meta.get('reviewImagesIncluded') is False:
            item['schemaNotes'].append('Gameplay metadata explicitly says reviewImagesIncluded:false; named reviewed frames are not represented as retained screenshots.')
        item['passed']=all(c['passed'] for c in checks if c.get('category')!='historical-evidence-retention')
        item['historicalEvidenceRetentionComplete']=not any(c.get('category')=='historical-evidence-retention' for c in checks) and all(e['originalFilePresent'] for e in item['hashOnlyEvidence'])
    duplicate_models=[{'sha256':hs,'numbers':ns}for hs,ns in model_groups.items()if len(ns)>1]
    check(global_checks,'models.noDuplicateHashes',duplicate_models,[])
    final_head=git('rev-parse','HEAD').stdout.decode().strip()
    progress_unchanged=progress_path.read_bytes()==progress_bytes
    unlocated=sum(not e['originalFilePresent']for g in games for e in g['hashOnlyEvidence'])
    temp_count=sum(len(g['temporaryReferences'])for g in games)
    cleanup_path=root/'history/published-frame-cleanup-2026-11-03.json'
    cleanup={'path':str(cleanup_path.relative_to(root)),'exists':cleanup_path.is_file()}
    if cleanup_path.is_file():
        cleanup['sha256']=digest(cleanup_path)
        cleanup_data=json.loads(cleanup_path.read_text())
        cleanup['reason']=cleanup_data.get('reason')
        selected_by_id={g['id']:g for g in selected}
        cleanup['entriesWithinScope']=[{'id':e['game'],'removed':e.get('removed'),'frames':e.get('count'),'recordedVideoSha256':e.get('videoSha256'),'matchesCurrentVideo':e.get('videoSha256')==selected_by_id[e['game']]['videoSha256']} for e in cleanup_data.get('entries',[]) if e.get('game') in selected_by_id]
    supersession={'priorReportPreserved':True,'reasons':[
        'The initial primary-reference whitelist omitted current modelTests/independentRules/sharedProtocols report links and treated unknown paths as historical. V2 requires the current schema links and only narrowly identified legacy source fields receive retention classification.',
        'V2 validates asset-map dictionary type, exact actual-APK key set and every SHA256 format/value; nonempty non-dictionaries cannot pass.',
        'V2 requires nonempty typed checklists, positive counts and standard artifact-check keys; empty collections cannot pass vacuously.',
        'Strict APK and gameplay video size limits remain below 10000000 bytes. No browser, model, signing or video-decode rerun was added.'
    ]}
    if prior_path:
        supersession.update(path=str(prior_path),exists=prior_path.is_file())
        if prior_path.is_file():supersession.update(sha256=digest(prior_path),bytes=prior_path.stat().st_size)
    report={
        'schema':4,'revision':2,'supersedes':supersession,'validationSelfTests':self_tests,'auditUtc':datetime.now(timezone.utc).isoformat(),'auditorScriptSha256':digest(Path(__file__).resolve()),'scope':{'root':str(root),'through':through,'currentVersionsOnly':True,'previousReleasesIgnored':True,'capturedCompleted':progress['completed'],'capturedHead':head,'endingHead':final_head,'progressSha256':sha(progress_bytes),'progressUnchangedDuringAudit':progress_unchanged},
        'method':{'readOnly':True,'apkZipAndManifestRead':True,'sha256Recomputed':True,'assetManifestCompared':'Every actual APK asset, exact key set and SHA256 value, against signing/verification/gameplay and present browser asset maps','sourceCompared':'Exactly three source files: actual APK game-model.js, game.js and shared renderer.js against published files AND progress.sourceCommit blobs','browserRerun':False,'modelTestsRerun':False,'buildOrSigningRerun':False,'cryptographicSignatureVerificationRerun':False,'videoDecodeRerun':False,'signatureScope':'stored certificate/signature/source receipts checked against the exact independently hashed APK; no new certificate validation claim','referenceScope':'Current schema report links are required even if their fields are missing. Only game-and-field-specific legacy descriptive citations receive historical-retention classification; unknown references must exist and otherwise fail. Explicit scratch/includedInRelease:false and hash-only originals are disclosed separately. Encoder frameManifest describes intermediate inputs. Old maintenance/previousReleases are not audited.'},
        'passed':all(c['passed']for c in global_checks)and all(g['passed']for g in games),
        'payloadIdentityAndVerificationPassed':not any(':formalReferenceExists' not in f['field'] for f in findings),
        'primaryPublishedReferencesPresent':all(r['exists'] for g in games for r in g['formalReferences'] if r['declaredRetention']=='explicit-published-report'),
        'historicalEvidenceRetentionComplete':all(g['historicalEvidenceRetentionComplete'] for g in games),
        'summary':{'auditedGames':len(games),'failedGames':[g['number']for g in games if not g['passed']],'findingCount':len(findings),'deliveryErrorCount':sum(f.get('category')!='historical-evidence-retention' for f in findings),'historicalRetentionFindingCount':sum(f.get('category')=='historical-evidence-retention' for f in findings),'missingRecognizedHistoricalReferenceCount':sum(f.get('category')=='historical-evidence-retention' for f in findings),'missingUnknownReferenceCount':sum(not r['exists'] and r['declaredRetention']=='unknown-reference-requires-presence' for g in games for r in g['formalReferences']),'distinctMissingReferencePaths':len({r['resolved'] for g in games for r in g['formalReferences'] if not r['exists']}),'payloadIdentityOrVerificationFindingCount':sum(not f['field'].endswith(':formalReferenceExists') for f in findings),'uniqueModelHashes':len(model_groups),'duplicateModels':duplicate_models,'apkMaxBytes':max(g['artifacts'].get('apk',{}).get('bytes',0)for g in games),'videoMaxBytes':max(g['artifacts'].get('video',{}).get('bytes',0)for g in games),'formalReferences':sum(len(g['formalReferences'])for g in games),'primaryPublishedReferenceCount':sum(r['declaredRetention']=='explicit-published-report' for g in games for r in g['formalReferences']),'primaryPublishedReferencesMissing':sum(not r['exists'] and r['declaredRetention']=='explicit-published-report' for g in games for r in g['formalReferences']),'temporaryReferencesNotRequiredAsPublishedFiles':temp_count,'hashOnlyOriginalClaimsWithoutPublishedMatchingFile':unlocated,'gamesWithUnarchivedHashOnlyOriginals':[g['number']for g in games if any(not e['originalFilePresent']for e in g['hashOnlyEvidence'])]},
        'globalChecks':global_checks,'findings':findings,'games':games,'publishedIntermediateFrameCleanup':cleanup,
        'limitations':['No physical TV or phone testing was performed; all current records explicitly report both false.','This audit confirms stored delivery facts and payload/evidence consistency, not a fresh playthrough, signature certification, video decode, or judgment of gameplay uniqueness.','Recorder frameManifest entries are intermediate JPEG inputs, not a promise to publish each JPEG. The video hash and retained manifest are checked; no frame-content decode was rerun.','Missing descriptive legacy citations are retained as historical-evidence-retention findings, separate from primary published report links. Missing originals cannot be reverified from embedded summaries.','Explicit scratch references and unmatched hash-only original-evidence claims are not falsely promoted to archived files; per-game records disclose them.','If publication advanced concurrently, this report covers its captured current releases through the requested number only.'],
        'reproduce':f'python3 {Path(__file__).resolve()} --root {root} --through {through} --output {output}'+(f' --supersedes {prior_path}' if prior_path else '')
    }
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'report':str(output),'passed':report['passed'],**report['summary'],'progressUnchangedDuringAudit':progress_unchanged},ensure_ascii=False,indent=2))
    return 0 if report['passed'] else 1

if __name__=='__main__':sys.exit(main())

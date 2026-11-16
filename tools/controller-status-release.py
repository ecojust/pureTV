#!/usr/bin/env python3
"""Stage this controller-sidebar update from fixed signing/runtime evidence.

No commands commit, push, dispatch CI, or access signing keys. Public resource
metadata changes only after every selected APK, UI report and video passes.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import zipfile
import time
from urllib.parse import quote
from urllib.request import Request, urlopen
from resource_catalog import apk_info

ROOT = Path(__file__).resolve().parents[1]
ROLLOUT = ROOT / 'docs/controller-client-status/rollout.json'
SCOPE = 'controller client status acceptance'
_spec = importlib.util.spec_from_file_location('controller_status_batch', ROOT/'tools/controller-emulator-batch.py')
batch = importlib.util.module_from_spec(_spec);_spec.loader.exec_module(batch)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def relative(base, name):
    assert name and not Path(name).is_absolute() and '..' not in Path(name).parts
    path = base / name
    assert path.resolve().is_relative_to(base.resolve()) and not path.is_symlink()
    return path


def preserve(source, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        assert dest.read_bytes() == source.read_bytes(), str(dest)
    else:
        shutil.copy2(source, dest)


def verify_sources(source_sha, entries):
    assert re.fullmatch('[0-9a-f]{40}', source_sha)
    for name, expected in entries.items():
        relative(ROOT, name)
        data = subprocess.check_output(['git', 'show', source_sha + ':' + name], cwd=ROOT)
        actual = hashlib.sha256(data).hexdigest()
        assert actual == (expected if isinstance(expected, str) else expected['sha256']), name
        if not isinstance(expected, str):
            assert len(data) == expected['bytes'], name


def prepare_requests(args):
    assert re.fullmatch('[0-9a-f]{40}', args.source_sha)
    assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip() == args.source_sha
    assert not args.output.resolve().is_relative_to(ROOT)
    args.output.mkdir(parents=True, exist_ok=False)
    rows = []
    for game in read(ROLLOUT)['games']:
        if game['host'] != 'game-kit':
            continue
        app = ROOT / 'resource/apps' / game['id']
        prefixes = ['resource/game-kit/android/src/main', 'resource/game-kit/web',
                    str(app.relative_to(ROOT) / 'src'), str(app.relative_to(ROOT) / 'game.json'),
                    str(app.relative_to(ROOT) / 'icon.xml')]
        assert not subprocess.check_output(['git', 'diff', args.source_sha, '--', *prefixes], cwd=ROOT)
        output = args.output / 'builds' / game['id']
        command = ['python3', str(ROOT/'resource/game-kit/build.py'), '--game', str(app),
                   '--output', str(output), '--cache', str(args.output/'dex-cache'),
                   '--sdk', str(args.sdk), '--jdk', str(args.jdk), '--zxing', str(args.zxing)]
        output.mkdir(parents=True)
        with (output/'build.stdout.log').open('w') as stdout, (output/'build.stderr.log').open('w') as stderr:
            run = subprocess.run(command, cwd=ROOT, stdout=stdout, stderr=stderr)
        write(output/'execution.json', {'argv':command, 'exitCode':run.returncode, 'sourceSha':args.source_sha})
        assert run.returncode == 0, str(output/'build.stderr.log')
        request = ['python3', str(ROOT/'resource/game-kit/prepare-signing-request.py'), '--build', str(output),
                   '--source-sha', args.source_sha, '--output', str(args.output/'requests-tree')]
        subprocess.run(request, cwd=ROOT, check=True)
        rows.append({'game':game['id'], 'build':str(output), 'request':str(args.output/'requests-tree/requests'/game['id'])})
    assert len(rows) == 9
    write(args.output/'prepared-requests.json', {'sourceSha':args.source_sha, 'signed':False, 'dispatched':False, 'games':rows})
    print(json.dumps({'requestsPrepared':len(rows), 'sourceSha':args.source_sha, 'signed':False}))


def stage(args):
    rollout = read(ROLLOUT)
    assert rollout['status'] == 'source_in_progress' and rollout['published'] is False
    games = {g['id']:g for g in rollout['games']}
    assert len(games) == len(rollout['games']) == 20
    selection = read(args.selection)['games']
    assert set(selection) == set(games)
    signed = {}
    for folder in args.signed_input:
        verification = read(folder/'input-verification.json')
        assert verification['status'] == 'passed'
        for row in verification['packages']:
            slug = row['slug']; assert slug in games and slug not in signed
            package = folder/'packages'/slug
            receipt = read(package/'signing-receipt.json')
            apk = package/games[slug]['apk']
            identity = apk_info(apk, args.build_tools)
            badging = subprocess.check_output([str(args.build_tools/'aapt'),'dump','badging',str(apk)],text=True)
            assert re.search(r"^sdkVersion:'26'$",badging,re.MULTILINE), 'Minimum Android version changed'
            assert identity == row['package'] and sha(apk) == receipt['sha256']
            assert receipt['signatureVerified'] is True and receipt['sourceSha'] == row['artifactSourceSha']
            verify_sources(receipt['sourceSha'], receipt.get('nativeSourceSha256', receipt.get('inputFiles')))
            expected_assets = receipt.get('assetsSha256') or {n:v['sha256'] for n,v in receipt['assets'].items()}
            with zipfile.ZipFile(apk) as archive:
                actual = {n[7:]:archive.read(n) for n in archive.namelist() if n.startswith('assets/') and not n.endswith('/')}
            assert {n:hashlib.sha256(v).hexdigest() for n,v in actual.items()} == expected_assets
            for name, data in actual.items():
                local = ROOT/'resource/apps'/slug/'src/main/assets'/name
                if not local.exists() and games[slug]['host'] == 'game-kit':
                    local = ROOT/'resource/game-kit/web'/name
                if local.is_file():
                    assert local.read_bytes() == data, 'Production asset changed since signing: '+str(local)
            model_path = 'resource/apps/'+slug+'/src/main/assets/game-model.js'
            prior_model = subprocess.check_output(['git','show',rollout['baseCommit']+':'+model_path],cwd=ROOT)
            assert actual['game-model.js'] == prior_model, 'UI update unexpectedly changes the game model: '+slug
            row = {**row, 'modelReuse': {'sourceRef':rollout['baseCommit']+':'+model_path,'sha256':hashlib.sha256(prior_model).hexdigest(),'bytes':len(prior_model),'matchesNewApk':True}}
            signed[slug] = (apk, receipt, row, package/'signing-receipt.json')
    assert set(signed) == set(games)
    exports = {}
    for folder in args.runtime_export:
        manifest = read(folder/'export-manifest.json');run = str(manifest['runId'])
        assert re.fullmatch('[1-9][0-9]*', run) and run not in exports
        assert manifest['selection']['acceptanceMode'] == 'client-status'
        for name, value in manifest['files'].items():
            p = relative(folder, name)
            assert p.stat().st_size == value['bytes'] and sha(p) == value['sha256']
        exports[run] = (folder, manifest)
    prepared = []
    for slug, game in games.items():
        choice = selection[slug];run = str(choice['runId']);folder, export = exports[run]
        assert re.fullmatch('controller-runtime-[a-z0-9-]+', choice['group'])
        group = folder/'evidence'/choice['group'];case_dir = group/slug
        report = read(group/'report.json');driver = read(case_dir/'gameplay/report.json')
        case = read(case_dir/'case.json');source = read(group/'executed-source-manifest.json')
        assert source['qaSourceSha'] == export['qaSourceSha']
        assert report['acceptanceMode'] == case['acceptanceMode'] == 'client-status'
        assert case['status'] == driver['status'] == 'passed' and case['inPlaceUpgradeInstalled']
        batch.verify_driver_acceptance(driver, 'client-status')
        assert driver['slug'] == slug and driver['scope'] == SCOPE and driver['mode'] == 'android'
        assert driver['fullGameplayAcceptance'] is False and driver['statusAcceptanceEnvironment'] == 'android-menu'
        assert driver['modelWrites'] is False and driver['clockOverrides'] is False
        assert driver['tests'] and all(t['status'] == 'passed' for t in driver['tests'])
        verify_sources(export['qaSourceSha'], driver['sourceHashes'])
        apk, receipt, binding, receipt_file = signed[slug]
        assert case['artifactSourceSha'] == receipt['sourceSha']
        assert case['packageSha256'] == binding['package']['sha256'] == sha(apk)
        assert case['observerSourceSha'] == binding['observerSourceSha'] and case['observerSha256'] == binding['observerSha256']
        old = read(ROOT/'resource/apps'/slug/'resource.json');baseline = ROOT/game['baseline']
        assert old['version'] == game['previousVersion'] and old['versionCode'] == game['previousVersionCode']
        for name, record in game['baselineFiles'].items():
            assert sha(baseline/name) == record['sha256'] and (baseline/name).read_bytes() == (ROOT/'resource/apps'/slug/name).read_bytes()
        identity = binding['package']
        assert identity['packageName'] == old['packageName'] == game['packageName']
        assert identity['versionName'] == game['version'] and identity['versionCode'] == game['versionCode'] > old['versionCode']
        assert identity['certificateSha256'] == old['certificateSha256']
        preview = ROOT/'docs/previews/en'/('app-'+slug+'.png')
        assert sha(preview) == game['baselineFiles']['thumb.png']['sha256'], 'Preserve changed English preview separately before staging'
        image = case_dir/'gameplay/controller-connected-android.png'
        assert image.name in driver['screenshots'] and image.read_bytes().startswith(bytes.fromhex('89504e470d0a1a0a'))
        video = case_dir/'gameplay.mp4';assert sha(video) == case['recording']['sha256'] and 0 < video.stat().st_size < 10_000_000
        probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
        stream = next(x for x in probe['streams'] if x['codec_type'] == 'video')
        assert stream['codec_name'] == 'h264' and stream['pix_fmt'] == 'yuv420p' and float(probe['format']['duration']) > 1
        decode = subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(video),'-vsync','0','-enc_time_base','-1','-f','null','-'],capture_output=True,text=True)
        assert decode.returncode == 0 and not decode.stderr, decode.stderr
        prepared.append((slug, game, old, binding, receipt, receipt_file, case, driver, image, video, export, choice, probe))
    # Everything above is validation. Preserve immutable raw evidence before metadata writes.
    archive_root = ROOT/'docs/controller-client-status/android'
    for run, (source, manifest) in exports.items():
        target = archive_root/run
        for name in ['export-manifest.json', *manifest['files']]:
            preserve(relative(source, name), relative(target, name))
    results = []
    progress = read(ROOT/'resource/game-kit/progress.json')
    progress_by_id = {g['id']:g for g in progress['games']}
    for slug, game, old, binding, receipt, receipt_file, case, driver, image, video, export, choice, probe in prepared:
        app = ROOT/'resource/apps'/slug;release = app/'docs/releases'/game['version'];run = str(export['runId'])
        original = (archive_root/run/'evidence'/choice['group']/slug).relative_to(ROOT).as_posix()
        preserve(signed[slug][0], app/game['apk']);preserve(receipt_file, release/'signing-receipt.json')
        preserve(image, release/'connected.png');preserve(video, release/'controller-status.mp4')
        shutil.copy2(image, app/'thumb.png');shutil.copy2(image, ROOT/'docs/previews/en'/('app-'+slug+'.png'))
        captures = {}
        for name in driver['screenshots']:
            source = image.parent/name
            if source.is_file():
                preserve(source, release/'captures'/name);captures[name] = {'sha256':sha(source), 'bytes':source.stat().st_size}
        verification = {'status':'passed','scope':SCOPE,'game':slug,'version':game['version'],'artifactSourceSha':receipt['sourceSha'],
            'qaSourceSha':export['qaSourceSha'],'runtimeRun':run,'sourceWorkflowResult':export['runtimeResult'],
            'sourceGroupResult':read(image.parents[2]/'report.json')['status'],'apk':binding['package'],'signatureVerified':True,
            'sourceAssetsMatchApk':True,'nativeSourceReceiptMatchesCommit':True,'inPlaceUpgradeInstalled':True,
            'controllerClientStatusAcceptancePassed':True,'fullGameplayAcceptancePerformedInThisUpdate':False,'modelReuse':binding['modelReuse'],
            'previousReleaseVerification':{'version':old['version'],'metadata':game['baseline']+'/resource.json','scope':'Historical evidence, not current UI captures'},
            'tests':driver['tests'],'originalEvidence':original,'originalDriverSha256':sha(image.parent/'report.json'),
            'captures':captures,'connectedCaptureSha256':sha(image),'actualAndroidEmulator':True,
            'physicalTvTested':False,'physicalPhoneTested':False,'physicalEsp32Tested':False}
        if slug == 'used-car-racing':
            verification['knownLimitation'] = 'Previous complete Android gameplay was blocked by a host emulator RenderThread crash; this update validates connection status in the menu only and does not close that limitation.'
        write(release/'verification.json', verification)
        recording = {'file':'controller-status.mp4','scope':SCOPE,'sha256':sha(video),'bytes':video.stat().st_size,
            'durationSeconds':float(probe['format']['duration']),'capture':'Android screenrecord during ordinary original-SDK connection-state inputs',
            'fullDecodeVerified':True,'fullGameplayAcceptance':False,'modelWrites':False,'clockOverrides':False,
            'originalRepositoryPath':original+'/gameplay.mp4','originalRecording':case['recording'],
            'apkSha256':binding['package']['sha256'],'artifactSourceSha':receipt['sourceSha'],'qaSourceSha':export['qaSourceSha'],
            'physicalTvTested':False,'physicalPhoneTested':False,'physicalEsp32Tested':False}
        write(release/'controller-status.json', recording)
        previous = copy.deepcopy(old);previous.pop('previousReleases', None)
        previous.update(cover=str(Path(game['baseline']).relative_to(app.relative_to(ROOT))/'thumb.png'),metadata=str(Path(game['baseline']).relative_to(app.relative_to(ROOT))/'resource.json'))
        current = copy.deepcopy(old)
        current.update(version=game['version'],versionCode=game['versionCode'],apk=game['apk'],apkBytes=binding['package']['bytes'],sha256=binding['package']['sha256'],sourceCommit=receipt['sourceSha'],buildRun='https://github.com/ecojust/pureTV/actions/runs/'+str(receipt.get('workflowRun',receipt.get('runId'))),cover='thumb.png',coverSource='Unmodified connected-controller screenshot of this signed APK running in an Android TV emulator.',controllerStatusVideo='docs/releases/'+game['version']+'/controller-status.mp4',controllerStatusMetadata='docs/releases/'+game['version']+'/controller-status.json')
        if 'gameplayVideo' in current:
            current['historicalGameplayVideo'] = {'version':old['version'],'video':current.pop('gameplayVideo'),'metadata':current.pop('gameplayMetadata',None),'currentUiEvidence':False}
        current['wifiController']['clientIdentityDisplay'] = True
        current['wifiController']['signalStrength'] = 'Unavailable: current controller protocol does not report RSSI; signal strength is not displayed.'
        current['verification'] = {k:verification[k] for k in ['status','scope','signatureVerified','sourceAssetsMatchApk','inPlaceUpgradeInstalled','controllerClientStatusAcceptancePassed','fullGameplayAcceptancePerformedInThisUpdate','actualAndroidEmulator','physicalTvTested','physicalPhoneTested','physicalEsp32Tested']}
        current['verification']['verificationReport'] = 'docs/releases/'+game['version']+'/verification.json'
        current['previousReleases'] = old.get('previousReleases',[]) + [previous]
        write(app/'resource.json', current)
        if slug in progress_by_id:
            entry = progress_by_id[slug];previous_entry = copy.deepcopy(entry);previous_entry.pop('previousReleases',None)
            entry.update(version=game['version'],apk=game['apk'],apkBytes=binding['package']['bytes'],apkSha256=binding['package']['sha256'],sourceCommit=receipt['sourceSha'],signingRun=int(receipt.get('workflowRun',receipt.get('runId'))),checks='docs/releases/'+game['version']+'/verification.json',video=current['controllerStatusVideo'],videoBytes=video.stat().st_size,videoSha256=sha(video),videoScope=SCOPE,modelReuse=binding['modelReuse'],fullGameplayAcceptancePerformedInThisUpdate=False)
            entry['previousReleases'] = entry.get('previousReleases',[])+[previous_entry]
        game.update(status='signed_apk_status_verified',sourceCommit=receipt['sourceSha'],sha256=binding['package']['sha256'],verification='../../resource/apps/'+slug+'/docs/releases/'+game['version']+'/verification.json')
        results.append({'game':slug,'runId':run,'qaSourceSha':export['qaSourceSha'],'apkSha256':binding['package']['sha256'],'scope':SCOPE})
    write(ROOT/'resource/game-kit/progress.json', progress)
    rollout.update(status='signed_apks_status_verified_pending_publication',acceptanceScope=SCOPE,fullGameplayAcceptancePerformedInThisUpdate=False)
    write(ROLLOUT, rollout)
    write(ROOT/'docs/controller-client-status/acceptance-set.json', {'status':'passed','scope':SCOPE,'games':results,'fullGameplayAcceptancePerformedInThisUpdate':False,'physicalTvTested':False,'physicalPhoneTested':False,'physicalEsp32Tested':False})
    print(json.dumps({'gamesStaged':len(results),'published':False,'scope':SCOPE}))



def checksums(args):
    rollout = read(ROLLOUT)
    assert rollout['status'] == 'signed_apks_status_verified_pending_publication'
    results = []
    for game in rollout['games']:
        app = ROOT/'resource/apps'/game['id']
        names = subprocess.check_output(['git','ls-files','-z','--cached','--others','--exclude-standard','--',str(app.relative_to(ROOT))],cwd=ROOT).decode().split('\0')
        output = app/'SHA256SUMS.txt';lines = []
        for name in sorted(set(n for n in names if n)):
            p = ROOT/name
            if p == output:
                continue
            assert p.is_file() and not p.is_symlink(), name
            lines.append(sha(p)+'  '+p.relative_to(app).as_posix())
        output.write_text('\n'.join(lines)+'\n')
        subprocess.run(['sha256sum','--check','--quiet','SHA256SUMS.txt'],cwd=app,check=True)
        results.append({'game':game['id'],'filesVerified':len(lines),'manifestSha256':sha(output)})
    write(ROOT/'docs/controller-client-status/checksum-verification.json',{'status':'passed','games':results})
    print(json.dumps({'appsVerified':len(results),'filesVerified':sum(r['filesVerified'] for r in results)}))


def public_verify(args):
    assert re.fullmatch('[0-9a-f]{40}', args.ref) and not args.output.exists()
    rollout = read(ROLLOUT)
    paths = {'README.md','README.en.md','resource/README.md','resource/tv-store-catalog.json',
             'docs/controller-client-status/README.md','docs/controller-client-status/rollout.json'}
    for game in rollout['games']:
        base = 'resource/apps/'+game['id']+'/'
        paths.update(base+n for n in [game['apk'],'resource.json','thumb.png','SHA256SUMS.txt','README.md'])
        paths.update(base+'docs/releases/'+game['version']+'/'+n for n in ['verification.json','controller-status.mp4','controller-status.json','connected.png'])
        paths.add('docs/previews/en/app-'+game['id']+'.png')
    mac = 'resource/apps/neon-rush/macos/'
    paths.update(mac+'NeonRush-'+rollout['macos']['version']+'-macos-universal.'+extension for extension in ['dmg','zip'])
    paths.update(mac+n for n in ['README.md','SHA256SUMS.txt'])
    for name in paths:
        assert (ROOT/name).is_file(), name
    def verify(name):
        p = ROOT/name;expected = sha(p);url = 'https://raw.githubusercontent.com/ecojust/pureTV/'+args.ref+'/'+quote(name)
        attempts = []
        for number in range(1,4):
            try:
                size = 0;fingerprint = hashlib.sha256()
                with urlopen(Request(url,headers={'User-Agent':'pureTV-controller-status-verification'}),timeout=60) as response:
                    assert response.status == 200
                    while chunk := response.read(1024*1024):
                        size += len(chunk);fingerprint.update(chunk)
                assert size == p.stat().st_size and fingerprint.hexdigest() == expected
                attempts.append({'attempt':number,'status':'passed','bytes':size,'sha256':fingerprint.hexdigest()})
                return {'path':name,'url':url,'status':'passed','attempts':attempts}
            except Exception as error:
                attempts.append({'attempt':number,'status':'failed','error':repr(error)})
                if number < 3:
                    time.sleep(number)
        return {'path':name,'url':url,'status':'failed','attempts':attempts}
    results = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for future in as_completed([pool.submit(verify,n) for n in sorted(paths)]):
            results.append(future.result())
            if len(results) % 20 == 0:
                print(json.dumps({'checked':len(results),'total':len(paths)}),flush=True)
    status = 'passed' if all(r['status']=='passed' for r in results) else 'failed'
    write(args.output,{'status':status,'publicationCommit':args.ref,'method':'Complete unauthenticated downloads; byte count and SHA256 compared with the delivered tree.','files':sorted(results,key=lambda r:r['path']),'marketServerUploaded':False,'physicalTvTested':False,'physicalEsp32Tested':False})
    print(json.dumps({'status':status,'filesChecked':len(results)}));assert status == 'passed'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    request = commands.add_parser('requests')
    request.add_argument('--source-sha', required=True)
    request.add_argument('--output', type=Path, required=True)
    for name in ['sdk','jdk','zxing']:
        request.add_argument('--'+name, type=Path, required=True)
    publish = commands.add_parser('stage')
    publish.add_argument('--selection', type=Path, required=True)
    publish.add_argument('--runtime-export', type=Path, action='append', required=True)
    publish.add_argument('--signed-input', type=Path, action='append', required=True)
    publish.add_argument('--build-tools', type=Path, required=True)
    commands.add_parser('checksums')
    public = commands.add_parser('public-verify')
    public.add_argument('--ref',required=True)
    public.add_argument('--output',type=Path,required=True)
    args = parser.parse_args()
    {'requests':prepare_requests,'stage':stage,'checksums':checksums,'public-verify':public_verify}[args.command](args)


if __name__ == '__main__':
    main()

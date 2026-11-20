from pathlib import Path, PurePosixPath
import concurrent.futures, hashlib, importlib.util, json, stat, struct, subprocess, urllib.request, zipfile

ROOT = Path('/dev/shm/puretv-submit')
OUT = Path('/dev/shm/root-windows-four')
BASE = ROOT / 'joystick-games/shared/windows/docs/attempts/44615299245'
EVIDENCE = BASE / 'original-bounded-export'
SOURCE = '6c7cb4fdb99dce236b634c842326bae6aed5f232'
EXPORT = '6dc14b79a364dc8679f370f17099e0636acef356'
GAMES = ['dirt-crown', 'last-track', 'night-racer', 'penguintrack']

def sig(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')

tree = json.loads((BASE / 'original-export-tree.json').read_text())
assert not tree['truncated']
blobs = {x['path']: x for x in tree['tree'] if x['type'] == 'blob'}
manifest = json.loads((EVIDENCE / 'export-manifest.json').read_text())
assert manifest['sourceCommit'] == SOURCE and str(manifest['runId']) == '44615299245'
assert set(manifest['verifiedGames']) == set(GAMES) and manifest['allGamesVerified'] is False

def check_export(name, data):
    b = blobs[name]
    assert b['mode'] in ('100644', '100755') and len(data) == b['size']
    assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == b['sha'], name
    if name != 'export-manifest.json': assert sig(data) == manifest['files'][name], name

check_export('export-manifest.json', (EVIDENCE / 'export-manifest.json').read_bytes())
needed = set()
for game in GAMES:
    prefix = 'joystick-windows-evidence-' + game + '/'
    for file in ['build-manifest.json', 'package-verification.json', 'evidence-manifest.json', 'runtime-bootstrap/report.json']:
        check_export(prefix + file, (EVIDENCE / prefix / file).read_bytes())
    for mode in ['normal', 'occupied']:
        path = prefix + 'runtime-' + mode + '/report.json'
        data = (EVIDENCE / path).read_bytes(); check_export(path, data)
        report = json.loads(data)
        for shot in report['screenshots']:
            name = prefix + 'runtime-' + mode + '/' + shot['path']
            assert manifest['files'][name] == {k: shot[k] for k in ('bytes', 'sha256')}
            needed.add(name)
    needed.update(p for p in manifest['files'] if p.startswith('joystick-windows-packages-' + game + '/'))

def fetch(name):
    p = OUT / 'original-files' / name
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists(): data = p.read_bytes()
    else:
        url = 'https://raw.githubusercontent.com/ecojust/pureTV/' + EXPORT + '/' + name
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'pureTV-original-package-audit'}), timeout=60) as response:
            assert response.status == 200
            data = response.read()
        check_export(name, data)
        p.write_bytes(data)
    check_export(name, data)
    return {'originalPath': name, 'localPath': str(p), **sig(data)}

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    downloaded = list(pool.map(fetch, sorted(needed)))
write(OUT / 'download-verification.json', {'sourceCommit': SOURCE, 'immutableExportCommit': EXPORT, 'files': downloaded})

inventory = {}
for row in subprocess.check_output(['git', 'ls-tree', '-rz', SOURCE], cwd=ROOT).split(b'\0'):
    if row:
        header, name = row.split(b'\t'); mode, kind, oid = header.decode().split()
        inventory[name.decode()] = {'mode': mode, 'kind': kind, 'sha': oid}
frozen_scope = subprocess.check_output(['git', 'show', SOURCE + ':joystick-games/tools/windows-inputs.py'], cwd=ROOT)
(OUT / 'executed-frozen-windows-inputs.py').write_bytes(frozen_scope)
spec = importlib.util.spec_from_file_location('original_scope', OUT / 'executed-frozen-windows-inputs.py')
scope = importlib.util.module_from_spec(spec); spec.loader.exec_module(scope)
batch = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
seen_sources = {}

def source_bytes(name, expected):
    if name in seen_sources:
        assert seen_sources[name]['signature'] == expected
        return seen_sources[name]['bytes']
    entry = inventory[name]
    assert entry['kind'] == 'blob' and entry['mode'] in ('100644', '100755')
    batch.stdin.write((entry['sha'] + '\n').encode()); batch.stdin.flush()
    header = batch.stdout.readline().split(); assert header[1] == b'blob'
    data = batch.stdout.read(int(header[2])); assert batch.stdout.read(1) == b'\n'
    assert sig(data) == expected, name
    assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == entry['sha']
    # Retain only small QA/config sources; large assets are checked and released.
    keep = data if len(data) < 1000000 else None
    seen_sources[name] = {'signature': expected, 'bytes': keep}
    return keep

audits = {}
for game in GAMES:
    ep = EVIDENCE / ('joystick-windows-evidence-' + game)
    packages = OUT / 'original-files' / ('joystick-windows-packages-' + game)
    mbytes = (packages / 'build-manifest.json').read_bytes()
    assert mbytes == (ep / 'build-manifest.json').read_bytes()
    meta = json.loads(mbytes)
    assert meta['sourceCommit'] == SOURCE and meta['game'] == game and meta['committedInputsVerified'] is True
    assert meta['architecture'] == 'x86_64' and meta['authenticodeSigned'] is False
    assert scope.file_records(meta['inputScope']) == meta['inputFiles']
    scope.verify_complete_git_selection(meta['inputScope'], inventory)
    for name, expected in meta['inputFiles'].items(): source_bytes(name, expected)
    actual = {}; payload = {}
    for name, expected in meta['packages'].items():
        p = packages / name; assert sig(p.read_bytes()) == expected
        if not name.endswith('.zip'): continue
        with zipfile.ZipFile(p) as archive:
            names = set(); prefix = None
            for item in archive.infolist():
                n = item.filename; rel = PurePosixPath(n)
                assert not rel.is_absolute() and '..' not in rel.parts and '\\' not in n
                assert n.casefold() not in names and not stat.S_ISLNK(item.external_attr >> 16) and not item.flag_bits & 1
                names.add(n.casefold())
                if item.is_dir(): continue
                if prefix is None: prefix = rel.parts[0] + '/'
                assert n.startswith(prefix)
                data = archive.read(item); short = n[len(prefix):]
                actual[short] = sig(data); payload[short] = data
    assert actual == meta['appFiles']
    binary = payload['PureTVGame.exe']; off = struct.unpack_from('<I', binary, 60)[0]
    assert binary[:2] == b'MZ' and binary[off:off+4] == b'PE\0\0' and struct.unpack_from('<H', binary, off+4)[0] == 0x8664
    for p in (ROOT / 'joystick-games' / game / 'dist').rglob('*'):
        if p.is_file(): assert p.read_bytes() == payload['Web/' + p.relative_to(ROOT / 'joystick-games' / game / 'dist').as_posix()]
    installed = json.loads((ep / 'package-verification.json').read_text())
    assert installed['status'] == 'passed' and installed['sourceCommit'] == SOURCE and installed['game'] == game
    assert installed['packages'] == meta['packages'] and installed['binarySha256'] == actual['PureTVGame.exe']['sha256']
    for key in ['installedBytesMatchPortable', 'completeFileSetVerified', 'uninstallPreservesUnrelatedFiles', 'uninstallRemovesOnlyPackagedFiles', 'packageHashesVerified', 'zipCrcVerified', 'silentInstallerExecuted']:
        assert installed[key] is True
    modes = []
    for mode in ['normal', 'occupied']:
        rp = ep / ('runtime-' + mode) / 'report.json'; r = json.loads(rp.read_text())
        assert r['status'] == 'passed' and r['qaSourceCommit'] == SOURCE and r['game'] == game
        assert r['binarySha256'] == actual['PureTVGame.exe']['sha256'] and len(r['tests']) == 10 and all(t['status'] == 'passed' for t in r['tests'])
        for name, digest in r['sourceHashes'].items():
            canonical = name.replace('\\', '/'); assert meta['inputFiles'][canonical]['sha256'] == digest
        plan_path = 'joystick-games/' + game + '/qa-plan.json'
        assert r['qaPlan'] == json.loads(source_bytes(plan_path, meta['inputFiles'][plan_path]))
        storage = r['storageRestart']; assert storage['initialHydrationEqual'] and storage['cleanBrowserCacheVerified']
        if r['qaPlan'].get('storageRestartRequired'): assert storage['status'] == 'passed' and storage['nativeSavedAfterQuit']
        assert r['nativeDisplay']['originalModeRestored']
        modes.append({'mode': mode, 'checks': 10, 'reportSha256': hashlib.sha256(rp.read_bytes()).hexdigest(), 'screenshots': r['screenshots'], 'storageStatus': storage['status']})
    audits[game] = {'status': 'package_source_and_original_runtime_passed', 'sourceCommit': SOURCE, 'sourceRunId': 44615299245, 'immutableExportCommit': EXPORT, 'originalRunConclusion': 'failure', 'selectedVerifyJobConclusion': 'success', 'sourceFilesVerified': len(meta['inputFiles']), 'portableAppFilesVerified': len(actual), 'binarySha256': actual['PureTVGame.exe']['sha256'], 'peMachine': 'AMD64', 'currentDistMatches': True, 'packages': meta['packages'], 'runtimeModes': modes, 'authenticodeSigned': False, 'physicalControllerTested': False, 'fullGameCompletionTested': False, 'visualReview': 'pending_independent_image_view'}
    write(OUT / (game + '-audit.json'), audits[game])
    print(game, 'source/package/runtime audit passed', len(meta['inputFiles']), flush=True)
batch.stdin.close(); assert batch.wait() == 0
write(OUT / 'summary.json', {'games': audits, 'uniqueSourceFilesVerified': len(seen_sources), 'downloadedFiles': len(downloaded)})

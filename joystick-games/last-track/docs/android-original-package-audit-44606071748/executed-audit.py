import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import tempfile
import zipfile

ROOT = Path('/dev/shm/puretv-submit')
BASE = Path('/dev/shm/racing-review-arcade/android-v3-monitor')
SOURCE = 'c5ad63e8c6a0ccfada5f763d1d26afa27f45002e'
EXPORT = '35fca55f5a05d38785fb531004eca9add6913f04'
RUN = '44606071748'
ARCHIVE = BASE / ('production-' + RUN + '-' + EXPORT)
OUT = Path('/dev/shm/racing-review-arcade/last-original-package-audit-44606071748')
TOOLS = Path('/workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0')
OUT.mkdir(exist_ok=False)
tempfile.tempdir = '/dev/shm/racing-review-arcade/tmp'
os.environ['GIT_NO_LAZY_FETCH'] = '1'


def rec(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def gitblob(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def frozen(name):
    return subprocess.check_output(['git', 'show', SOURCE + ':' + name], cwd=ROOT)


def write(name, value):
    p = OUT / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


# Materialize only the small immutable verifier dependency closure, never a source checkout.
dependency_paths = ['joystick-games/tools/android-build.py', 'joystick-games/tools/asset-policy.py',
                    'joystick-games/catalog-registry.json', 'tools/resource_catalog.py']
executed = {}
for name in dependency_paths:
    data = frozen(name)
    p = OUT / 'executed-tools' / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data)
    executed[name] = {'sourceCommit': SOURCE, **rec(data)}
helper_name = 'joystick-games/tools/android-runtime-inputs.py'
helper_source = ROOT / 'joystick-games/penguintrack/docs/android-original-qa-isolation-attempt-2/executed-overlay' / helper_name
helper = helper_source.read_bytes()
assert rec(helper)['sha256'] == 'aa6c535038fc14a97d83bc8ded3b91a2e1a94dafe5e94214ab564f4f99842c08'
(OUT / 'executed-tools' / helper_name).write_bytes(helper)
executed[helper_name] = {'origin': helper_source.relative_to(ROOT).as_posix(), **rec(helper)}
spec = importlib.util.spec_from_file_location('last_frozen_inputs', OUT / 'executed-tools' / helper_name)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

tree_data = (BASE / ('production-' + RUN + '-git-tree.json')).read_bytes()
tree = json.loads(tree_data)
assert tree['sha'] == EXPORT and not tree['truncated']
blobs = {item['path']: item for item in tree['tree'] if item['type'] == 'blob'}
bound = {}


def original(name):
    path = ARCHIVE / name
    assert path.is_file() and not path.is_symlink()
    data = path.read_bytes()
    item = blobs[name]
    assert item['size'] == len(data) and item['sha'] == gitblob(data), name
    if name != 'export-manifest.json':
        assert manifest['files'][name] == rec(data), name
    bound[name] = {**rec(data), 'gitBlobSha1': item['sha']}
    return data


manifest = json.loads(original('export-manifest.json'))
assert manifest['sourceSha'] == SOURCE and manifest['runId'] == RUN and manifest['runAttempt'] == '1'
assert manifest['buildResult'] == manifest['signResult'] == 'success'
assert manifest['runtimeResult'] == 'failure'
receipt = json.loads(original('packages/last-track/signing-receipt.json'))
unsigned = json.loads(original('packages/last-track/build-receipt.json'))
assert receipt['sourceSha'] == unsigned['sourceSha'] == SOURCE
assert receipt['runId'] == unsigned['runId'] == RUN
assert receipt['game'] == unsigned['game'] == 'last-track'
assert receipt['signatureVerified'] is True and unsigned['unsigned'] is True and unsigned['committedInputsVerified'] is True
assert unsigned['sha256'] == receipt['unsignedSha256'] and unsigned['contentSha256'] == receipt['contentSha256']
assert unsigned['sourceInputsSha256'] == hashlib.sha256(json.dumps(receipt['sourceInputs'], sort_keys=True, separators=(',', ':')).encode()).hexdigest()
assert set(receipt['sourceInputs']) == m.expected_inputs(ROOT, SOURCE, 'last-track')

frozen_inputs = {}
source_records = {}
for name, expected in receipt['sourceInputs'].items():
    data = frozen(name)
    assert rec(data) == expected
    assert original('artifact-source/' + name) == data
    frozen_inputs[name] = data
    source_records[name] = {**expected, 'gitBlobSha1': gitblob(data)}
assert len(source_records) == 504
pin = frozen('tools/puretv-release-certificate-v2.sha256').decode().strip()
assert pin == 'eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23'
meta = json.loads(frozen_inputs['joystick-games/last-track/game.json'])
registered = json.loads(frozen_inputs['joystick-games/catalog-registry.json'])['games']['last-track']


def identity(path, label):
    commands = [[str(TOOLS / 'aapt'), 'dump', 'badging', str(path)],
                [str(TOOLS / 'apksigner'), 'verify', '--verbose', '--print-certs', str(path)]]
    logs = []
    for i, command in enumerate(commands):
        result = subprocess.run(command, capture_output=True, text=True)
        text = result.stdout + result.stderr
        name = label + ('-aapt-badging.txt' if i == 0 else '-apksigner-verification.txt')
        (OUT / name).write_text(text)
        logs.append({'command': command, 'returnCode': result.returncode, 'log': name, **rec(text.encode())})
        assert result.returncode == 0, name
    aapt = (OUT / logs[0]['log']).read_text()
    signing = (OUT / logs[1]['log']).read_text()
    package = re.search(r"package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'", aapt)
    cert = re.search(r'Signer #1 certificate SHA-256 digest: (\S+)', signing)
    minimum = re.search(r"sdkVersion:'(\d+)'", aapt)
    target = re.search(r"targetSdkVersion:'(\d+)'", aapt)
    assert package and cert and minimum and target
    assert cert[1].lower() == pin and len(re.findall(r'Signer #\d+ certificate SHA-256 digest:', signing)) == 1
    info = {'packageName': package[1], 'versionCode': int(package[2]), 'versionName': package[3],
            'certificateSha256': cert[1].lower(), **rec(path.read_bytes())}
    return info, {'minSdk': int(minimum[1]), 'targetSdk': int(target[1])}, logs


def zip_records(path):
    records = {}
    with zipfile.ZipFile(path) as z:
        assert len(z.infolist()) == len({i.filename for i in z.infolist()}) and len(z.infolist()) <= 2048
        assert z.testzip() is None
        assert sum(i.file_size for i in z.infolist()) < 256 * 1024 * 1024
        for entry in z.infolist():
            name = entry.filename
            m.safe_name(name.rstrip('/'))
            assert entry.compress_type in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED)
            assert not entry.flag_bits & 1
            assert stat.S_IFMT(entry.external_attr >> 16) != stat.S_IFLNK
            data = z.read(entry)
            assert len(data) == entry.file_size
            records[name] = {**rec(data), 'crc32': f'{entry.CRC:08x}', 'compressedBytes': entry.compress_size,
                             'compressionMethod': entry.compress_type}
    return records


apk_name = 'packages/last-track/last-track-0.1.0.apk'
apk_data = original(apk_name)
assert rec(apk_data) == {k: receipt[k] for k in ('bytes', 'sha256')}
apk = ARCHIVE / apk_name
package, android, package_commands = identity(apk, 'last-track')
assert all(package[k] == receipt[k] for k in package)
assert package['packageName'] == meta['packageName'] == registered['packageName']
assert package['versionCode'] == meta['versionCode'] and package['versionName'] == meta['version']
assert android['minSdk'] == 26 and android['targetSdk'] == 29
assert package['bytes'] < m.build.asset_policy.limits(meta, registered)['maxApkBytes']
content = zip_records(apk)
assert {n: r['sha256'] for n, r in content.items() if not n.endswith('/') and not n.startswith('META-INF/')} == receipt['contentSha256']
payload = m.frozen_payload(meta, registered, frozen_inputs, 'last-track')
with zipfile.ZipFile(apk) as z:
    actual_assets = {n[7:]: z.read(n) for n in z.namelist() if n.startswith('assets/')}
assert actual_assets == payload
assert {n: rec(data) for n, data in actual_assets.items()} == receipt['assets']
assert len(actual_assets) == 153 and sum('/' in n for n in actual_assets) == 144

observer = json.loads(original('observers/last-track/observer-signing-receipt.json'))
observer_build = json.loads(original('observers/last-track/observer-build.json'))
assert observer['sourceSha'] == SOURCE and observer['runId'] == RUN and observer['game'] == 'last-track'
assert observer['signatureVerified'] is True and observer['signed'] is True
assert observer['modelWrites'] is False and observer['clockOverrides'] is False and observer['testArtifactOnly'] is True
assert observer['targetPackage'] == meta['packageName'] and observer_build['signed'] is False
for key in ('game', 'targetPackage', 'observerPackage', 'component', 'readonlyEndpoints', 'modelWrites', 'clockOverrides', 'sourceFiles', 'classFiles'):
    assert observer_build[key] == observer[key]
for name, expected in observer['sourceFiles'].items():
    assert rec(frozen(name)) == expected
observer_name = 'observers/last-track/' + observer['apk']
original(observer_name)
observer_identity, observer_android, observer_commands = identity(ARCHIVE / observer_name, 'observer-last-track')
assert observer_identity == observer['apkIdentity'] and observer_android['minSdk'] == 26
observer_content = zip_records(ARCHIVE / observer_name)

runtime = {}
for mode in ('normal', 'occupied'):
    name = 'reports/joystick-android-report-runtime-last-track/last-track-' + mode + '/report.json'
    report = json.loads(original(name))
    assert report['status'] == 'failed' and report['sourceCommit'] == SOURCE and report['game'] == 'last-track'
    runtime[mode] = {'status': 'failed', 'passedChecks': len(report['tests']), 'report': name, **bound[name]}

write('source-input-verification.json', {'sourceCommit': SOURCE, 'files': source_records})
write('apk-zip-content.json', {'file': apk_name, 'package': package, 'entries': content})
write('observer-zip-content.json', {'file': observer_name, 'package': observer_identity, 'entries': observer_content})
write('original-export-bindings.json', {'exportCommit': EXPORT, 'originalGitTree': rec(tree_data), 'filesVerified': bound})
write('executed-tools.json', executed)
write('tool-commands.json', package_commands + observer_commands)
result = {
    'status': 'passed-original-signed-package-audit', 'game': 'last-track', 'sourceCommit': SOURCE,
    'originalRun': int(RUN), 'originalAttempt': 1, 'originalExportCommit': EXPORT,
    'package': package, 'android': android, 'observer': observer_identity, 'observerAndroid': observer_android,
    'frozenSourceInputsVerified': len(source_records), 'originalSourceCopiesAndGitBlobsVerified': len(source_records),
    'apkZipEntriesVerified': len(content), 'apkUnsignedContentEntriesVerified': len(receipt['contentSha256']),
    'assetsVerified': len(actual_assets), 'nestedAssetsVerified': 144, 'observerZipEntriesVerified': len(observer_content),
    'originalExportFilesBound': len(bound), 'strictExpectedSourceInventoryVerified': True,
    'fullPackageSignatureVerified': True, 'fixedCertificateVerified': True,
    'everyAssetEqualsOriginalFrozenPayload': True, 'originalBuildSign': 'success',
    'originalRuntime': runtime, 'runtimePassed': False, 'originalRunConclusionNotChanged': True,
    'packageLocation': str(apk), 'apkCopiedIntoRepository': False, 'sourceCheckoutCopied': False,
    'nativeRerun': False, 'newBuild': False, 'newSigning': False, 'workflowDispatched': False,
    'physicalTvTested': False, 'physicalEsp32Tested': False,
    'limitations': ['Package/source verification does not establish gameplay. Original normal and occupied runtime failures remain failed.',
                    'No APK is published by this audit; the original complete Git export retains the exact signed bytes.',
                    'The verification reconstructs only the original payload in a cleaned temporary directory; no native classes or APK are rebuilt.']
}
write('report.json', result)
shutil.copyfile(__file__, OUT / 'executed-audit.py')
print(json.dumps({'status': result['status'], 'sourceInputs': len(source_records), 'assets': len(actual_assets),
                  'package': package, 'android': android, 'output': str(OUT)}))

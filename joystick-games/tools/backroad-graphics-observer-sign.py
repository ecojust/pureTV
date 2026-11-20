#!/usr/bin/env python3
"""Sign/verify only the separate Backroad graphics test Observer. Never sign a game."""
import argparse
import base64
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
REPO = 'ecojust/pureTV'
HERE = 'joystick-games/qa/android/graphics-observer/'
PACKAGE = 'com.ecojust.joystickgraphicsqa.backroadrally'
TARGET = 'com.ecojust.joystick.backroadrally'
RUNNER = 'com.ecojust.graphicsqa.GraphicsObserver'
PIN = 'eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23'
PIN_PATH = 'tools/puretv-release-certificate-v2.sha256'
UNSIGNED = 'backroad-graphics-observer-unsigned.apk'
SIGNED = 'backroad-graphics-observer.apk'
RECEIPT = 'graphics-observer-signing-receipt.json'
BUILD = 'observer-build.json'
ORIGIN = 'original-actions-artifact-origin.json'
WORKFLOW = '.github/workflows/joystick-backroad-graphics-diagnostic.yml'
SELF = 'joystick-games/tools/backroad-graphics-observer-sign.py'
MAX_APK = 1024 * 1024
SOURCE_NAMES = {HERE + 'build.py', HERE + 'graphics.js',
                HERE + 'src/com/ecojust/graphicsqa/GraphicsObserver.java',
                HERE + 'src/com/ecojust/graphicsqa/BoundedEvents.java'}
SIGNER_NAMES = {SELF, WORKFLOW, PIN_PATH, 'joystick-games/tools/android-runtime-artifact.py',
                'joystick-games/tools/artifact-draft-transfer.py'}
CONTENTS = {'AndroidManifest.xml', 'resources.arsc', 'classes.dex', 'assets/graphics.js'}
SIGNATURES = {'META-INF/MANIFEST.MF', 'META-INF/PURETV.SF', 'META-INF/PURETV.RSA'}
ORIGINAL = {
    'repository': REPO, 'sourceSha': '65a782561c91b45beae64d9b1a7874a27adf2830',
    'runId': 44681226359, 'runAttempt': 1, 'artifactId': 14604367849,
    'artifactName': 'joystick-android-signed', 'artifactBytes': 104996606,
    'artifactSha256': '8ae777830cfbbdc341663ab7c45145dcd40e75408a6df363d250482d13991c34',
    'file': 'backroad-rally-0.1.1.apk', 'bytes': 105024551,
    'sha256': '772f628b498ed73b7ac378e30797f4007145960222af0040be89b8e28b9af13d',
    'packageName': TARGET, 'certificateSha256': PIN}


class Rejected(Exception):
    pass


def require(value, code):
    if not value:
        raise Rejected(code)


def record_bytes(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def record(path, limit=MAX_APK):
    require(path.is_file() and not path.is_symlink() and 0 < path.stat().st_size <= limit, 'regular_bounded_file')
    return record_bytes(path.read_bytes())


def unique(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'duplicate_json_key')
        result[key] = value
    return result


def load(path):
    record(path)
    return json.loads(path.read_text(), object_pairs_hook=unique)


def command(args, *, timeout=60, check=True):
    result = subprocess.run([str(v) for v in args], capture_output=True, timeout=timeout)
    require(len(result.stdout) <= 262144 and len(result.stderr) <= 262144, 'command_output_budget')
    if check:
        require(result.returncode == 0, 'command_failed')
    return result


def frozen(commit, name):
    return command(['git', '-C', ROOT, 'show', commit + ':' + name]).stdout


def source_identity():
    require(os.environ.get('GITHUB_REPOSITORY') == REPO, 'repository')
    commit = command(['git', '-C', ROOT, 'rev-parse', 'HEAD']).stdout.decode().strip()
    require(re.fullmatch('[a-f0-9]{40}', commit) and commit == os.environ.get('GITHUB_SHA'), 'checkout_source')
    for name in ('GITHUB_RUN_ID', 'GITHUB_RUN_ATTEMPT'):
        require(re.fullmatch('[1-9][0-9]*', os.environ.get(name, '')), 'run_identity')
    require((ROOT / PIN_PATH).read_text().strip() == PIN and
            frozen(commit, PIN_PATH).decode().strip() == PIN and
            frozen(ORIGINAL['sourceSha'], PIN_PATH).decode().strip() == PIN, 'fixed_certificate')
    return {'sourceSha': commit, 'runId': os.environ['GITHUB_RUN_ID'],
            'runAttempt': int(os.environ['GITHUB_RUN_ATTEMPT'])}


def source_records(names, commit):
    result = {}
    for name in sorted(names):
        value = record(ROOT / name)
        require(value == record_bytes(frozen(commit, name)), 'uncommitted_source')
        result[name] = value
    return result


def content(apk, signed):
    record(apk)
    if not signed:
        require(b'APK Sig Block 42' not in apk.read_bytes(), 'unsigned_signature_block')
    with zipfile.ZipFile(apk) as archive:
        entries = archive.infolist()
        names = [entry.filename for entry in entries]
        require(len(names) == len(set(names)) and set(names) == CONTENTS | (SIGNATURES if signed else set()), 'apk_members')
        require(all(0 < entry.file_size <= MAX_APK and not entry.is_dir() and
                    (entry.external_attr >> 16) & 0o170000 != 0o120000 for entry in entries), 'apk_entry_budget')
        require(sum(entry.file_size for entry in entries) <= 2 * MAX_APK, 'apk_total_budget')
        require(archive.testzip() is None, 'apk_crc')
        empty_table = archive.read('resources.arsc')
        require(len(empty_table) == 40 and empty_table[:12] == bytes.fromhex('02000c002800000000000000'), 'empty_resource_table')
        return {name: record_bytes(archive.read(name)) for name in sorted(CONTENTS)}


def expected_manifest():
    return f'''N: android=http://schemas.android.com/apk/res/android
  E: manifest
    A: android:versionCode(0x0101021b)=(type 0x10)0x1
    A: android:versionName(0x0101021c)="1.0" (Raw: "1.0")
    A: android:compileSdkVersion(0x01010572)=(type 0x10)0x23
    A: android:compileSdkVersionCodename(0x01010573)="15" (Raw: "15")
    A: package="{PACKAGE}" (Raw: "{PACKAGE}")
    A: platformBuildVersionCode=(type 0x10)0x23
    A: platformBuildVersionName=(type 0x10)0xf
    E: uses-sdk
      A: android:minSdkVersion(0x0101020c)=(type 0x10)0x1a
      A: android:targetSdkVersion(0x01010270)=(type 0x10)0x23
    E: uses-permission
      A: android:name(0x01010003)="android.permission.INTERNET" (Raw: "android.permission.INTERNET")
    E: application
      A: android:label(0x01010001)="pureTV graphics diagnostic observer" (Raw: "pureTV graphics diagnostic observer")
      A: android:hasCode(0x0101000c)=(type 0x12)0xffffffff
      A: android:testOnly(0x01010272)=(type 0x12)0xffffffff
    E: instrumentation
      A: android:name(0x01010003)="{RUNNER}" (Raw: "{RUNNER}")
      A: android:targetPackage(0x01010021)="{TARGET}" (Raw: "{TARGET}")
      A: android:handleProfiling(0x01010022)=(type 0x12)0x0
      A: android:functionalTest(0x01010023)=(type 0x12)0xffffffff'''


def inspect_apk(apk, tools, signed):
    value = record(apk)
    tree = command([tools / 'aapt', 'dump', 'xmltree', apk, 'AndroidManifest.xml']).stdout.decode()
    require(re.sub(r' \(line=[0-9]+\)', '', tree).strip() == expected_manifest(), 'observer_manifest')
    signature = command([tools / 'apksigner', 'verify', '--print-certs', apk], check=False)
    certificates = re.findall(rb'^Signer #[0-9]+ certificate SHA-256 digest: ([a-fA-F0-9]{64})$', signature.stdout, re.M)
    if signed:
        require(signature.returncode == 0 and certificates == [PIN.encode()], 'observer_signature')
        command([tools / 'zipalign', '-c', '4', apk])
    else:
        require(signature.returncode != 0 and not certificates, 'already_signed')
    return dict(value, packageName=PACKAGE, versionCode=1, versionName='1.0',
                certificateSha256=PIN if signed else None, minSdk=26, targetSdk=35, testOnly=True)


def validate_build(directory, tools, identity, apk_required=True):
    require(directory.is_dir() and not directory.is_symlink(), 'input_directory')
    receipt = load(directory / BUILD)
    expected = {'schemaVersion': 1, 'game': 'backroad-rally', 'packageName': PACKAGE,
                'targetPackage': TARGET, 'instrumentationRunner': RUNNER, 'component': PACKAGE + '/' + RUNNER,
                'sourceCommit': identity['sourceSha'], 'committedInputsVerified': True,
                'minSdk': 26, 'targetSdk': 35, 'testOnly': True, 'signed': False,
                'targetApkBuilt': False, 'targetApkChanged': False, 'modelWrites': False,
                'clockOverrides': False, 'nativeInputPolls': False, 'glContextCalls': True,
                'fixedTestInputEndpoints': ['POST /post-key'], 'readonlyEndpoints': ['/status', '/console', '/graphics', '/capabilities'], 'apk': UNSIGNED}
    for key, value in expected.items():
        require(type(receipt.get(key)) is type(value) and receipt[key] == value, 'build_' + key)
    require(receipt['sourceFiles'] == source_records(SOURCE_NAMES, identity['sourceSha']), 'build_source_inventory')
    require(set(receipt['content']) == CONTENTS and receipt['content']['assets/graphics.js'] == receipt['sourceFiles'][HERE + 'graphics.js'], 'build_content_inventory')
    if apk_required:
        apk = directory / UNSIGNED
        require(record(apk) == receipt['apkIdentity'], 'unsigned_identity')
        require(content(apk, False) == receipt['content'], 'unsigned_content')
        inspect_apk(apk, tools, False)
    return receipt


def validate_origin_metadata(path):
    value = load(path)
    request = {'run': ORIGINAL['runId'], 'attempt': ORIGINAL['runAttempt'],
               'source': ORIGINAL['sourceSha'], 'artifact': ORIGINAL['artifactId']}
    require(value.get('request') == request, 'original_request')
    artifact = value['artifact']
    require(artifact['id'] == ORIGINAL['artifactId'] and artifact['name'] == ORIGINAL['artifactName'] and
            artifact['size_in_bytes'] == ORIGINAL['artifactBytes'] and
            artifact['digest'] == 'sha256:' + ORIGINAL['artifactSha256'], 'original_artifact')
    spec = importlib.util.spec_from_file_location('graphics_original_artifact', ROOT / 'joystick-games/tools/android-runtime-artifact.py')
    reader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(reader)
    reader.validate_origin(value, ['backroad-rally'])
    return record(path)


def sign(directory, output, tools, original_origin):
    identity = source_identity()
    build = validate_build(directory, tools, identity)
    signer_sources = source_records(SIGNER_NAMES, identity['sourceSha'])
    original_origin_record = validate_origin_metadata(original_origin)
    require(not output.exists() and not output.is_symlink() and
            not output.resolve().is_relative_to(ROOT.resolve()), 'new_external_output')
    # All artifact/source/manifest checks finish before consulting signing credentials.
    encoded = os.environ.get('PURETV_KEYSTORE_BASE64')
    require(encoded and os.environ.get('PURETV_KEYSTORE_PASSWORD'), 'existing_signing_credentials')
    require(len(encoded) <= 262144, 'key_budget')
    output.mkdir(parents=True)
    with tempfile.TemporaryDirectory(prefix='backroad-test-observer-sign-') as temporary:
        scratch = Path(temporary)
        key = scratch / 'release.jks'
        descriptor = os.open(key, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        with os.fdopen(descriptor, 'wb') as stream:
            stream.write(base64.b64decode(encoded, validate=True))
        cert = command(['keytool', '-exportcert', '-alias', 'puretv', '-keystore', key,
                        '-storepass:env', 'PURETV_KEYSTORE_PASSWORD'], timeout=30).stdout
        require(hashlib.sha256(cert).hexdigest() == PIN, 'key_certificate')
        aligned = scratch / 'observer-aligned.apk'
        command([tools / 'zipalign', '-f', '4', directory / UNSIGNED, aligned])
        command([tools / 'apksigner', 'sign', '--min-sdk-version', '26',
                 '--v1-signing-enabled', 'true', '--v2-signing-enabled', 'true',
                 '--v3-signing-enabled', 'true', '--v4-signing-enabled', 'false',
                 '--ks', key, '--ks-key-alias', 'puretv', '--ks-pass', 'env:PURETV_KEYSTORE_PASSWORD',
                 '--key-pass', 'env:PURETV_KEYSTORE_PASSWORD', '--out', output / SIGNED, aligned], timeout=120)
        require(content(output / SIGNED, True) == build['content'], 'signing_changed_payload')
        apk_identity = inspect_apk(output / SIGNED, tools, True)
    require(source_records(SOURCE_NAMES, identity['sourceSha']) == build['sourceFiles'] and
            source_records(SIGNER_NAMES, identity['sourceSha']) == signer_sources, 'source_changed_during_signing')
    shutil.copyfile(directory / BUILD, output / BUILD)
    shutil.copyfile(original_origin, output / ORIGIN)
    receipt = dict(identity, schemaVersion=1, repository=REPO, game='backroad-rally',
                   originalTarget=ORIGINAL, packageName=PACKAGE, targetPackage=TARGET,
                   instrumentationRunner=RUNNER, component=PACKAGE + '/' + RUNNER,
                   signed=True, testArtifactOnly=True, formalAcceptance=False,
                   targetApkBuilt=False, targetApkSigned=False, targetApkChanged=False,
                   apk=SIGNED, apkIdentity=apk_identity, unsignedApkIdentity=build['apkIdentity'],
                   buildReceipt=record(output / BUILD), sourceFiles=build['sourceFiles'],
                   originalOrigin=original_origin_record,
                   signerSourceFiles=signer_sources, content=build['content'],
                   readonlyEndpoints=build['readonlyEndpoints'], diagnosticPort=63487)
    (output / RECEIPT).write_text(json.dumps(receipt, indent=2) + '\n')
    verify(output, tools)
    return receipt


def verify(directory, tools):
    identity = source_identity()
    require(directory.is_dir() and not directory.is_symlink() and
            set(p.name for p in directory.iterdir()) == {SIGNED, BUILD, RECEIPT, ORIGIN}, 'signed_directory_members')
    receipt = load(directory / RECEIPT)
    build = validate_build(directory, tools, identity, apk_required=False)
    expected = dict(identity, schemaVersion=1, repository=REPO, game='backroad-rally',
                    originalTarget=ORIGINAL, packageName=PACKAGE, targetPackage=TARGET,
                    instrumentationRunner=RUNNER, component=PACKAGE + '/' + RUNNER,
                    signed=True, testArtifactOnly=True, formalAcceptance=False,
                    targetApkBuilt=False, targetApkSigned=False, targetApkChanged=False,
                    apk=SIGNED, buildReceipt=record(directory / BUILD),
                    unsignedApkIdentity=build['apkIdentity'], sourceFiles=build['sourceFiles'],
                    originalOrigin=validate_origin_metadata(directory / ORIGIN),
                    signerSourceFiles=source_records(SIGNER_NAMES, identity['sourceSha']),
                    content=build['content'], readonlyEndpoints=build['readonlyEndpoints'], diagnosticPort=63487)
    for key, value in expected.items():
        require(type(receipt.get(key)) is type(value) and receipt[key] == value, 'signed_' + key)
    require(content(directory / SIGNED, True) == build['content'], 'signed_content')
    require(inspect_apk(directory / SIGNED, tools, True) == receipt['apkIdentity'], 'signed_apk_identity')
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['sign', 'verify'])
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--original-origin', type=Path)
    parser.add_argument('--build-tools', type=Path, required=True)
    args = parser.parse_args()
    try:
        require((args.output is not None) == (args.action == 'sign'), 'output_action')
        require((args.original_origin is not None) == (args.action == 'sign'), 'origin_action')
        receipt = sign(args.input, args.output, args.build_tools, args.original_origin) if args.action == 'sign' else verify(args.input, args.build_tools)
        print(json.dumps({'status': 'passed', 'testArtifactOnly': True, 'formalAcceptance': False,
                          'sourceSha': receipt['sourceSha'], 'apkIdentity': receipt['apkIdentity']}))
    except Exception as error:
        # Subprocess exceptions can contain paths or process output. Only a fixed error code is emitted.
        code = str(error) if isinstance(error, Rejected) and re.fullmatch('[a-zA-Z_]+', str(error)) else type(error).__name__
        print(json.dumps({'status': 'failed', 'error': code, 'formalAcceptance': False}))
        raise SystemExit(1)


if __name__ == '__main__':
    main()

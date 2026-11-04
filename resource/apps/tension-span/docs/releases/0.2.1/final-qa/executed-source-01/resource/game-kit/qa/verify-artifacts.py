#!/usr/bin/env python3
"""Strict size, package/signature, asset and MP4 decode gate. Emits JSON."""
import argparse, hashlib, json, pathlib, re, subprocess, zipfile

p = argparse.ArgumentParser()
p.add_argument('--apk', type=pathlib.Path)
p.add_argument('--video', type=pathlib.Path)
p.add_argument('--assets', type=pathlib.Path)
p.add_argument('--package')
p.add_argument('--limit', type=int, default=10_000_000)
p.add_argument('--output', type=pathlib.Path)
p.add_argument('--build-tools', type=pathlib.Path, default=pathlib.Path('/workspace/scratch/usedcar-android-sdk/build-tools/34.0.0'))
a = p.parse_args()
if not a.apk and not a.video: p.error('provide --apk and/or --video')
if a.assets and not a.apk: p.error('--assets requires --apk')

def run(args):
    r = subprocess.run([str(x) for x in args], text=True, capture_output=True)
    if r.returncode: raise RuntimeError(f'{args[0]} failed ({r.returncode}): {r.stderr[-6000:]}')
    return r.stdout

def identity(file):
    size = file.stat().st_size
    assert 0 < size < a.limit, f'{file}: {size} bytes, must be below {a.limit}'
    return {'file': str(file.resolve()), 'bytes': size, 'sha256': hashlib.file_digest(file.open('rb'), 'sha256').hexdigest()}

result = {'limitBytes': a.limit, 'checks': {}}
if a.apk:
    apk = identity(a.apk)
    badging = run([a.build_tools/'aapt2', 'dump', 'badging', a.apk])
    match = re.search(r"package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'", badging)
    assert match, 'APK manifest must contain package and version'
    apk.update(dict(zip(['package', 'versionCode', 'versionName'], match.groups())))
    if a.package: assert apk['package'] == a.package, 'Unexpected Android package'
    assert re.search(r"launchable-activity: name='[^']+'", badging), 'No launchable activity'
    signature = run([a.build_tools/'apksigner', 'verify', '--verbose', '--print-certs', a.apk])
    apk['signerSha256'] = re.findall(r'Signer #\d+ certificate SHA-256 digest: ([0-9a-f]+)', signature)
    assert apk['signerSha256'], 'Signature verification produced no certificate digest'
    with zipfile.ZipFile(a.apk) as archive:
        assert archive.testzip() is None, 'Corrupt ZIP entry'
        assert len(archive.namelist()) == len(set(archive.namelist())), 'Duplicate APK ZIP entries'
        if a.assets:
            expected = {f'assets/{x.relative_to(a.assets).as_posix()}': x for x in a.assets.rglob('*') if x.is_file()}
            actual = {x for x in archive.namelist() if x.startswith('assets/') and not x.endswith('/')}
            assert set(expected) == actual, f'APK asset set mismatch: missing={set(expected)-actual}, extra={actual-set(expected)}'
            for name, file in expected.items():
                assert hashlib.sha256(archive.read(name)).digest() == hashlib.sha256(file.read_bytes()).digest(), f'Asset mismatch: {name}'
            apk['matchedAssetCount'] = len(expected)
    result['apk'] = apk
    result['checks'].update(apkSize=True, apkManifest=True, apkSignature=True, apkZipIntegrity=True)
    if a.assets: result['checks']['apkAssetsMatch'] = True
if a.video:
    video = identity(a.video)
    probe = json.loads(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,pix_fmt,avg_frame_rate', '-of', 'json', a.video]))
    streams = [s for s in probe['streams'] if s['codec_type'] == 'video']
    assert len(streams) == 1 and streams[0]['codec_name'] == 'h264', 'Expected one H.264 video stream'
    assert streams[0]['pix_fmt'] == 'yuv420p', 'Expected widely compatible yuv420p'
    assert float(probe['format']['duration']) > 0, 'Empty video'
    run(['ffmpeg', '-v', 'error', '-xerror', '-i', a.video, '-map', '0', '-f', 'null', '-'])
    video.update(probe)
    result['video'] = video
    result['checks'].update(videoSize=True, videoFormat=True, videoFullDecode=True)
result['limitations'] = ['No physical Android installation or TV/phone execution is certified by this artifact check.', 'Visual review and unique gameplay assertions are separate required checks.']
raw = json.dumps(result, ensure_ascii=False, indent=2)+'\n'
if a.output: a.output.write_text(raw)
print(raw, end='')

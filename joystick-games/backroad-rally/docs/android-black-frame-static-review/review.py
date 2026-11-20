#!/usr/bin/env python3
"""Read existing frozen source/reports only; no game launch, GL call or network."""
import hashlib
import json
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
SOURCE = '4b6cf0b8cba288eae66bcae2ef2784acc279a695'
QA = '382de3792628050773abec8821920348503f72ce'
BASE = 'joystick-games/backroad-rally/'
ENV = dict(os.environ, GIT_NO_LAZY_FETCH='1')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def record(path):
    data = (ROOT / path).read_bytes()
    return {'path': path, 'bytes': len(data), 'sha256': digest(data)}


def frozen(path):
    data = subprocess.check_output(['git', 'show', SOURCE + ':' + path], cwd=ROOT, env=ENV)
    assert data == (ROOT / path).read_bytes(), path
    return {**record(path), 'commit': SOURCE, 'currentEqualsFrozen': True}


files = [BASE + 'src/upstream/src/' + p for p in [
    'main.ts', 'boot.ts', 'look/look.ts', 'look/post.ts', 'look/quality.ts',
    'puretv.ts', 'puretv-observation.ts', 'style.css', 'menu/stageMenus.ts', 'menu/menuPage.ts']]
files += [BASE + 'src/upstream/package-lock.json', BASE + 'dist/assets/three-Bfh60JNy.js',
          'resource/game-kit/android/src/main/java/com/ecojust/gamekit/MainActivity.java']
sources = [frozen(path) for path in files]
bundle = (ROOT / files[-2]).read_text()
needles = [
    'webglcontextlost', '_onDeviceLost(e)', 'Device Lost:',
    '_renderScene(e,t,n=!0){if(this._isDeviceLost===!0)return;',
    'EXT_color_buffer_float', 'RGBA16F',
    'setPixelRatio(e=1){this._pixelRatio!==e&&',
    'this.domElement.width=Math.floor(e*this._pixelRatio)',
]
excerpts = []
for needle in needles:
    pos = bundle.find(needle)
    assert pos >= 0, needle
    excerpts.append({'needle': needle, 'characterOffset': pos,
                     'excerpt': bundle[max(0, pos - 80):pos + len(needle) + 160]})

native = []
for mode in ('normal', 'occupied'):
    folder = BASE + 'docs/android-initial-ready-v7-44630023214/original-export/evidence/' + \
             'joystick-android-runtime-backroad-rally/backroad-rally-' + mode + '/'
    report_path = folder + 'report.json'
    report = json.loads((ROOT / report_path).read_text())
    assert report['sourceCommit'] == QA
    assert report['apk']['sha256'] == '2cd35f145f5362264a720708325c22e283a3828d21899058f17422ba87103c08'
    capture = next(c for c in report['captures'] if c['path'] == 'playing.png')
    image = record(folder + 'playing.png')
    assert image['bytes'] == capture['bytes'] and image['sha256'] == capture['sha256']
    samples = {}
    for key in ('before', 'after'):
        snapshot = capture[key]
        game = snapshot['game']
        # Deliberately do not copy the room URL, QR, or large protocol state.
        samples[key] = {
            'game': {k: game.get(k) for k in ['game', 'renderer', 'webglVersion', 'frames',
                                             'stage', 'paused', 'gameplay', 'errors']},
            'page': snapshot.get('page'), 'windowFocused': snapshot.get('windowFocused'),
            'activityState': snapshot.get('activityState')}
    native.append({'mode': mode, 'report': record(report_path), 'status': report['status'],
                   'testCount': len(report['tests']), 'image': image, 'samples': samples})

existing = [BASE + 'docs/' + p for p in [
    'android-v7-root-image-analysis/review.json',
    'android-v7-dpr2-browser-diagnosis/analysis.json',
    'browser-attempt-4/report.json', 'browser-attempt-4/driving-960.png']]
observer_paths = [
    'joystick-games/qa/android/graphics-observer/graphics.js',
    'joystick-games/qa/android/graphics-observer/src/com/ecojust/graphicsqa/GraphicsObserver.java']
observer_records = []
for path in observer_paths:
    data = subprocess.check_output(['git', 'show', '6d91b69:' + path], cwd=ROOT, env=ENV)
    assert data == (ROOT / path).read_bytes()
    observer_records.append(record(path))
result = {
    'scope': 'Static review plus actual viewing of two previously captured images. No new browser/native execution.',
    'packageSource': SOURCE, 'originalQaSource': QA, 'originalRun': 44630023214,
    'originalApkSha256': '2cd35f145f5362264a720708325c22e283a3828d21899058f17422ba87103c08',
    'causeProven': False, 'deliveryStatus': 'visual_delivery_blocked',
    'sourceFiles': sources, 'frozenBundleExcerpts': excerpts, 'originalNative': native,
    'existingEvidence': [record(p) for p in existing],
    'pendingObserverCommit': subprocess.check_output(['git', 'rev-parse', '6d91b69^{commit}'], cwd=ROOT, env=ENV).decode().strip(),
    'pendingObserverFiles': observer_records,
    'actuallyViewedThisReview': [
        {'path': existing[-1], 'observation': '960x540 original browser capture: visible car, road, crowd, shadows and foliage; HUD says 6 km/h. Older browser evidence, not an Android render result.'},
        {'path': native[0]['image']['path'], 'observation': '1920x1080 original Android capture: dark flat field, HUD/controller card visible, no car or track visible.'}],
    'limitations': [
        'The occupied PNG is hash-checked here; its appearance and pixel count are from the separately preserved root image review, not a new view in this review.',
        'The new Observer has no direct context health, draw-call or renderer-internal read; cached webgl2 and positive frame count are not evidence of successful drawing.',
        'Context-lost console records require URL/time correlation: old-document teardown during query navigation is not proof that the current stage lost its context.',
        'The earlier DPR2 browser attempt reached Low settings but did not reach a visible driving scene; it cannot establish the Android cause.',
        'No source, APK, clocks, model, renderer or acceptance predicate was changed. No new test suite, native run, GPU case or dispatch was performed.'
    ]}
(OUT / 'review.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'sourceFiles': len(sources), 'nativeModes': len(native),
                  'report': record(str((OUT / 'review.json').relative_to(ROOT)))}, ensure_ascii=False))

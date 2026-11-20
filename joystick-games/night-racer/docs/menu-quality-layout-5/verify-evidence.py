#!/usr/bin/env python3
"""Check saved DOM evidence and the native plan without running a game."""
import hashlib
import importlib.util
import json
from pathlib import Path
import struct

here = Path(__file__).resolve().parent
game = here.parent.parent
repo = game.parent.parent
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
report_path = here / 'report.json'
report = json.loads(report_path.read_text())
plan_path = game / 'qa-plan.json'
plan = json.loads(plan_path.read_text())
old = json.loads((here.parent / 'menu-quality-layout-1/qa-plan-before.json').read_text())
spec = importlib.util.spec_from_file_location('qa_plan', game.parent / 'tools/qa-plan.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.validate_plan(plan)
assert report['status'] == 'passed' and not report['errors']
assert len(report['cases']) == 4 and len(report['captures']) == 12
for item in report['inputs']:
    file = game / item['path']
    assert len(file.read_bytes()) == item['bytes'] and sha(file) == item['sha256'], file
assert sha(game / 'tests/menu-quality-layout.mjs') == sha(here / 'executed-menu-quality-layout.mjs')
captures = []
for item in report['captures']:
    file = here / (item['name'] + '.png')
    data = file.read_bytes()
    assert len(data) == item['bytes'] and sha(file) == item['sha256'], file
    dimensions = struct.unpack('>II', data[16:24])
    assert dimensions == (item['viewport']['width'], item['viewport']['height'])
    captures.append({'path': str(file.relative_to(game)), 'bytes': len(data), 'sha256': sha(file), 'dimensions': dimensions})
assert len(plan['steps']) == len(old['steps']) + 11 == 20
assert plan['steps'][12:] == old['steps'][1:]
assert {k:v for k,v in plan['steps'][11].items() if k != 'expect'} == {k:v for k,v in old['steps'][0].items() if k != 'expect'}
assert plan['steps'][11]['expect'][:-1] == old['steps'][0]['expect']
assert plan['steps'][11]['expect'][-1] == {'path':'gameplay.renderPreset','op':'eq','value':'low'}
for row in report['cases']:
    for step, action in zip(plan['steps'][:10], row['actions'][:10]):
        assert step['keys'] == [action['key']]
        assert module.matches(step['expect'], {'gameplay': {'menu': action['after']}}, {})
    assert plan['steps'][10]['keys'] == ['A']
    assert module.matches(plan['steps'][10]['expect'], row['afterReload'], {})
    assert row['savedPreference'] == 'low'
    assert all(row[k] for k in ['qualityPathPassed','pointerResumePassed','controllerResumePassed'])
    polls = row['snapshotReadsDoNotPoll']
    assert polls['before'] == polls['after'] and polls['callsBefore'] == polls['callsAfter']
original_native = []
for mode in ['normal','occupied']:
    path = game / f'docs/android-ci-44596704682/original-evidence/reports/joystick-android-report-runtime-night-racer/night-racer-{mode}/report.json'
    native = json.loads(path.read_text())
    assert native['status'] == 'passed' and len(native['tests']) == 47
    original_native.append({'mode': mode, 'path': str(path.relative_to(game)), 'sourceCommit': native['sourceCommit'], 'status': native['status'], 'checks': len(native['tests']), 'sha256': sha(path)})
output = {
    'status': 'passed',
    'scope': 'Saved DOM-only evidence, source and image hashes, strict native-plan schema, and consistency of the first 11 planned inputs with the observed menu path. No renderer or native game run.',
    'reportSha256': sha(report_path),
    'qaPlanSha256': sha(plan_path),
    'executedBrowserScriptSha256': sha(here / 'executed-menu-quality-layout.mjs'),
    'evidenceVerificationScriptSha256': sha(Path(__file__).resolve()),
    'domCasesPassed': 4,
    'sourceInputHashesVerified': len(report['inputs']),
    'imageHashesAndDimensionsVerified': captures,
    'menuPath': ['UP','RIGHT','DOWN','RIGHT','A','DOWN','LEFT','LEFT','LEFT','LEFT','A'],
    'menuPathUsesOriginalQualityHandlerAndPageReload': True,
    'remainingNinePlanStepsPreservedExceptStartAlsoExpectsLow': True,
    'visualReview': {
        'viewedImages': ['paused-en-960.png','paused-en-1280.png','paused-zh-960.png','paused-zh-1280.png','low-focused-en-960.png','low-focused-zh-960.png'],
        'finding': 'All four pause layouts visibly preserve the original five buttons, with Resume clear of the left controller card and bottom help. Both 960-wide settings images show the focused original Low option (Smooth / 流畅); the selected High underline is expected before confirmation. The original settings panel scrolls vertically.',
        'gameplayBackgroundAbsentByDesign': True
    },
    'preservedOriginalAndroidV2': original_native,
    'nativeCalibrationOfNew20StepPlan': False,
    'newSourceNativeGameplayPassed': False,
    'modelWrites': False,
    'clockOverrides': False,
    'physicalTvTested': False,
    'physicalEsp32Tested': False,
    'limitations': [
        'The fixture deliberately isolates DOM and the original settings/resume handlers. It does not create a renderer, simulate a race, wait a real countdown, or test native TCP transport.',
        'Menu inputs are single consumed synthetic frames; the native plan hold durations and host button handling across page reload still require the real native run.',
        'The original default High preset and all game physics/timing remain unchanged; only the QA plan chooses the existing Low option through ordinary menu input.',
        'Saved v2 Android checks apply only to their original source and package, not to this CSS/observer revision.'
    ]
}
(here / 'validation-summary.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': output['status'], 'cases': 4, 'inputs': len(report['inputs']), 'images': len(captures), 'planSteps': len(plan['steps']), 'nativeCalibrationOfNew20StepPlan': False}))

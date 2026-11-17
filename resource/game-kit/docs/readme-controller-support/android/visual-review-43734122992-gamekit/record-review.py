#!/usr/bin/env python3
"""Record a manual, read-only image review; this does not run or grade the APKs."""
from pathlib import Path
import hashlib
import json
import os
import struct
import shutil

ROOT = Path('/dev/shm/puretv-controller-games')
RAW = ROOT / 'resource/game-kit/docs/readme-controller-support/android/43734122992/evidence/controller-runtime-kit'
EXPORT = Path('/dev/shm/controller-release-ci/ed925cc1839da4629991ecf46fc2f625821322ce/runtime/export')
OUT = ROOT / 'resource/game-kit/docs/readme-controller-support/android/visual-review-43734122992-gamekit'
assert not OUT.exists(), 'Use a new directory; never overwrite an existing review.'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def link(path):
    return os.path.relpath(path, OUT)

def receipt(path):
    return {'path': link(path), 'bytes': path.stat().st_size, 'sha256': sha(path)}

notes = {
    'twenty-four': {
        'menu-android.png': 'Six level choices, title/rules and start button visible. QR and horizontal Wi-Fi card are complete; search instruction, 10.0.2.15:63485 and aliases fit.',
        'gameplay.png': 'Connected Wi-Fi card and primary controls remain visible. Number cards, operator choices and game HUD are readable, with no material clipping.',
        'paused.png': 'Pause message and resume action are visible; controller address remains readable. No material clipping of primary controls.',
        'reconnected.png': 'Connected status and address remain visible after reconnect; arithmetic board and actions are readable.',
        'failure.png': 'Byte-identical to the directly inspected reconnected.png; same visual conclusion. This image is a failure-time capture, not proof that the runtime suite passed.',
        'failure-screen.png': 'Disconnected/paused state is visibly displayed, including resume action and address. Screenshot does not show an application crash or material layout clipping.'
    },
    'torch-bridge': {
        'menu-android.png': 'Six level choices and start button are visible. Left QR, search instruction, Wi-Fi address and controls fit the side panel.',
        'gameplay.png': 'Bridge/travelers and game HUD are visible; left connected status, 10.0.2.15:63485, aliases and controls are readable.',
        'paused.png': 'Pause overlay and resume action are clear; sidebar QR, Wi-Fi address and primary controls remain visible.',
        'reconnected.png': 'Bridge scene and selected traveler are visible; connected status and service address fit. No material clipping.',
        'failure.png': 'Failure-time gameplay capture retains visible bridge scene, selected traveler, connected status, address and controls. Visual appearance does not resolve the ACK timeout.',
        'failure-screen.png': 'Disconnected/paused state and resume action are visible. Sidebar address and instructions remain readable.'
    },
    'tower-overlap': {
        'menu-android.png': 'Six level choices and start action are visible; horizontal QR/controller rail is complete and address/aliases fit.',
        'gameplay.png': 'One built floor and moving slab are visible; tower area, effective-width/rhythm HUD and remaining-slab status are not materially clipped.',
        'paused.png': 'Pause overlay and resume action are clear; controller rail and service address remain visible.',
        'reconnected.png': 'Two built floors and moving slab are visible; connected status, address and tower/HUD remain readable.'
    },
    'packing-sculptor': {
        'menu-android.png': 'Six level choices/start are visible. QR, service address, three primary controls and optional tip are visible in this shorter disconnected status layout.',
        'gameplay.png': 'Board, tray and check action are visible. Connected English status wraps to two lines; service address and primary controls fit, but the tail of optional sidebar tip lies below the viewport.',
        'paused.png': 'Pause/resume and sidebar primary controls/address remain visible. Two-line English connection status leaves part of the optional bottom tip below the viewport.',
        'reconnected.png': 'Connected state, address, board and primary actions remain visible. Optional sidebar tip extends below viewport; actual Android scrolling is not demonstrated by this still image.',
        'failure.png': 'Failure-time board capture retains visible address and primary actions. Connected status wraps and optional sidebar tip extends below viewport; this does not establish a passing runtime suite.',
        'failure-screen.png': 'Disconnected/paused state is visible, and the shorter status leaves more room for the optional tip. Resume action, service address and primary instructions are readable.'
    },
    'conveyor-window': {
        'menu-android.png': 'Blueprint introduction, six level choices and start are visible. QR, Wi-Fi address, primary controls and optional tip all fit.',
        'gameplay.png': 'Source/socket belts, part details and four bottom HUD cards are visible. Connected status wraps to two lines but address, controls and sidebar tip remain visible.',
        'paused.png': 'Blueprint pause panel and resume action are complete. Address, aliases and sidebar controls remain visible.',
        'reconnected.png': 'Connected status and 10.0.2.15:63485 are readable. Belts, held-part/socket details, bottom HUD and sidebar tip are complete.',
        'failure.png': 'Failure-time gameplay shows later belt positions/time; connected status, service address, details, controls and HUD remain visible. No material layout clipping; ACK status is independent.',
        'failure-screen.png': 'Disconnected/paused message, blueprint summary and resume action are visible. QR, service address, aliases, controls and sidebar tip fit.'
    }
}

export_manifest = json.loads((EXPORT / 'export-manifest.json').read_text())
group_report = json.loads((RAW / 'report.json').read_text())
assert export_manifest['runId'] == '43734122992'
OUT.mkdir(parents=True)
entries = []
games = []
for slug, pictures in notes.items():
    case_path = RAW / slug / 'case.json'
    gameplay_path = RAW / slug / 'gameplay/report.json'
    case = json.loads(case_path.read_text())
    gameplay = json.loads(gameplay_path.read_text())
    actual_pictures = set((RAW / slug).rglob('*.png'))
    reviewed_paths = set()
    for name, note in pictures.items():
        path = RAW / slug / name if name == 'failure-screen.png' else RAW / slug / 'gameplay' / name
        reviewed_paths.add(path)
        relative = path.relative_to(RAW)
        original = EXPORT / 'evidence/controller-runtime-kit' / relative
        expected = export_manifest['files']['evidence/controller-runtime-kit/' + relative.as_posix()]
        assert sha(path) == sha(original) == expected['sha256']
        data = path.read_bytes()
        assert data[:8] == b'\x89PNG\r\n\x1a\n'
        width, height = struct.unpack('>II', data[16:24])
        item = {'game': slug, 'capture': str(relative), **receipt(path), 'width': width, 'height': height,
                'reviewMethod': 'Direct image view via view_image', 'visualConclusion': note,
                'visualStatus': 'primary-content-visible-with-optional-tip-below-viewport' if slug == 'packing-sculptor' and name in ('gameplay.png', 'paused.png', 'reconnected.png', 'failure.png') else 'no-material-clipping-observed'}
        if slug == 'twenty-four' and name == 'failure.png':
            other = RAW / slug / 'gameplay/reconnected.png'
            assert sha(path) == sha(other)
            item['reviewMethod'] = 'SHA-256-identical to directly viewed reconnected.png'
            item['identicalTo'] = link(other)
        entries.append(item)
    assert actual_pictures == reviewed_paths, (slug, actual_pictures ^ reviewed_paths)
    games.append({'game': slug, 'screenshotCount': len(pictures), 'visualReviewCompleted': True,
                  'runtimeCaseStatusAsReported': case['status'], 'runtimeGameplayStatusAsReported': gameplay['status'],
                  'artifactSourceSha': case['artifactSourceSha'], 'observerSourceSha': case['observerSourceSha'],
                  'apkSha256AsReported': case['packageSha256'], 'caseReceipt': receipt(case_path),
                  'gameplayReportReceipt': receipt(gameplay_path),
                  'failedTestsAsReported': [test for test in gameplay['tests'] if test['status'] != 'passed']})

missing = []
for slug in ('glass-fold', 'tension-span', 'prism-relay'):
    assert not list((RAW / slug).rglob('*.png'))
    case_path = RAW / slug / 'case.json'
    case = json.loads(case_path.read_text())
    missing.append({'game': slug, 'visualStatus': 'not-reviewed-no-screenshot-in-this-run',
                    'runtimeStatusAsReported': case['status'], 'errorAsReported': case['error'],
                    'caseReceipt': receipt(case_path)})

report = {
    'reviewer': '/root/controller_gamekit', 'reviewType': 'read-only still-image inspection',
    'runId': '43734122992', 'runUrl': 'https://github.com/ecojust/pureTV/actions/runs/43734122992',
    'apkSourceSha': group_report['sourceSha'], 'qaSourceSha': group_report['legacySourceSha'],
    'runtimeGroupStatusAsReported': group_report['status'],
    'actualAndroidEmulatorAsReported': group_report['actualAndroidEmulator'],
    'physicalTvTested': False, 'physicalEsp32Tested': False,
    'reviewedGames': len(games), 'reviewedScreenshotFiles': len(entries),
    'directlyViewedUniqueScreenshotFiles': len(entries) - 1,
    'screenshotsEdited': False, 'originalRawFilesModified': False, 'productionModified': False,
    'runtimeSuiteRerunByThisReview': False, 'visualReviewIsRuntimeAcceptance': False,
    'limitations': [
        'Still images establish layout and displayed state only, not functional/protocol/physical-device acceptance.',
        'Only tower-overlap has a passed raw runtime case in this reviewed subset; four others retain the reported final ACK timeout.',
        'Packing connected English status wraps to two lines. Its optional tip tail is below the viewport; primary controls and the service address remain visible. Actual Android scrolling was not verified by these screenshots.',
        'Glass, Tension and Prism have no screenshot in this run and need a later actual-APK run.',
        'Neon is assigned to a different reviewer and is outside this report.'
    ],
    'sourceReceipts': [receipt(RAW / name) for name in ('report.json', 'bundle-manifest.json', 'executed-source-manifest.json', 'emulator-configuration.json')],
    'exportManifestReceipt': receipt(RAW.parents[1] / 'export-manifest.json'),
    'games': games, 'screenshots': entries, 'missingScreenshots': missing
}
(OUT / 'review.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
shutil.copyfile(__file__, OUT / 'record-review.py')
(OUT / 'README.md').write_text('''# Game Kit 实际 APK 截图审阅 · run 43734122992

只读审阅该失败运行已生成的 5 款游戏、28 个 PNG 文件：27 张通过图片工具直接目视；四则二十四的 failure.png 与已目视的 reconnected.png 字节相同，以 SHA-256 确认。原始图片和测试报告未改动；没有改生产代码、重跑测试或生成替代图片。

- 来源：[真实 Android 运行](https://github.com/ecojust/pureTV/actions/runs/43734122992)、[原始组报告](../43734122992/evidence/controller-runtime-kit/report.json)。APK 源码 a657ce24fc4c0c5adb07a671adabb3ce604f68f8，测试源码 ed925cc1839da4629991ecf46fc2f625821322ce。
- 环境：Android TV API 36 模拟器。未验证实体电视、手机或 ESP32 手柄；本报告只判断截图所见布局，不等同完整验收。
- [review.json](review.json) 记录每张图的相对路径、SHA-256、原始尺寸、视觉结论，以及独立保留的原始运行状态和失败信息。所有图片同时与原始导出及导出清单逐一校验。

| 游戏 | 截图数 | 目视结论 | 原始运行结果 |
| --- | ---: | --- | --- |
| 四则二十四 | 6 | 菜单、六关选择、连接地址、数字与运算区、暂停操作可见 | failed：末项 ACK 超时 |
| 夜桥接力 | 6 | 侧栏连接文案、桥梁人物、选中项、暂停操作可见 | failed：末项 ACK 超时 |
| 叠塔工匠 | 4 | 底部连接栏、搭塔区域、状态数值与暂停操作可见 | passed（引用原始报告） |
| 异形装箱 | 6 | 地址、主要操作、装箱区域可见；连接后的英文状态换两行，侧栏可选“小提示”末尾落在视口下方 | failed：末项 ACK 超时 |
| 窗口装配 | 6 | 地址、传送带、零件详情、状态数值及侧栏提示可见 | failed：末项 ACK 超时 |

异形装箱的实际 Android 滚动能力没有由这些静态截图证明，不能把此前浏览器的滚动验证当作本轮 Android 滚动验证。截图中的状态正常也不能消除原始 ACK 失败。

折光工坊、拉索桥梁和镜光接力在此运行没有截图，保留为未审阅，等待下一次实际 APK 运行；霓虹飞车由另一位审阅者负责。原始失败记录不以本次视觉结论改写。
''')
print(json.dumps({'directory': str(OUT), 'games': len(games), 'screenshotFiles': len(entries),
                  'dimensions': sorted(set((i['width'], i['height']) for i in entries)),
                  'rawAndExportHashesVerified': len(entries), 'reviewSha256': sha(OUT / 'review.json')}, ensure_ascii=False))

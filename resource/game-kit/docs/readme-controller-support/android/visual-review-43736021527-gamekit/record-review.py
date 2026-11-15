#!/usr/bin/env python3
"""Record direct visual review and bind it to already archived actual-APK evidence."""
from pathlib import Path
import hashlib, json, os, shutil, struct

ROOT = Path('/dev/shm/puretv-controller-games')
RUN = ROOT / 'resource/game-kit/docs/readme-controller-support/android/43736021527'
OUT = RUN.parent / 'visual-review-43736021527-gamekit'
assert not OUT.exists(), 'Keep each prior review immutable.'

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def rel(p): return os.path.relpath(p, OUT)
def receipt(p): return {'path': rel(p), 'sha256': sha(p), 'bytes': p.stat().st_size}

notes = {
 'twenty-four': [
  'Menu title, rules, six level choices and start action fit; QR, search instruction, Wi-Fi address 10.0.2.15:63485 and aliases are complete in the bottom rail.',
  'Four number cards, six operations, target and score/undo HUD are visible. Connected status, address and main controls are readable with no material clipping.',
  'Paused message, resume action and START instruction are clear; controller rail, QR and address remain visible.',
  'Reconnected gameplay visibly shows L=2, the next card selected, and clear operations/HUD. Connection status and address remain readable.'
 ],
 'torch-bridge': [
  'Six level choices and start action are visible. Left QR, service address, aliases, primary controls and optional tip fit; the phone URL wraps legibly.',
  'Traveler 01 has crossed to the right and the ledger reads 1/19. Camp rosters, bridge and HUD are complete; connected status and service address fit.',
  'Pause/resume overlay is clear and confined to the game region; controller sidebar, address and bottom HUD remain visible.',
  'Traveler 01 is selected on the right, with PARTY 1/2 and the ledger readable. Connection address, instructions and game area show no material clipping.'
 ],
 'tower-overlap': [
  'Six site choices and start action fit. Bottom QR/controller rail and 10.0.2.15:63485 are visible; primary drop/pause instructions are readable.',
  'One built floor, incoming slab, floor scale, overlap/rhythm/speed indicators and top HUD are visible; bottom connection card is complete.',
  'Paused message and resume action fit inside the game region, while top HUD and bottom controller rail remain visible.',
  'Two built floors and next slab are visible, with width 32.1 in the host HUD. Floor scale and rhythm/overlap panels fit; service address remains readable.'
 ],
 'packing-sculptor': [
  'Six tasks, start action, QR, controller address, three primary controls and optional tip are visible in this shorter menu status layout.',
  'Board, vertical rail preview, parts tray and CHECK are visible. Connected English status wraps to two lines; address and primary controls fit, but the optional tip tail extends below the viewport.',
  'Pause/resume action, address and primary controls remain visible. The connected English status wraps, and optional sidebar tip text extends below the viewport.',
  'One placed rail, LOAD SHEET, exit condition and all tray actions are visible. Address and primary controls fit; optional sidebar tip tail is below viewport. Android scrolling is not demonstrated by a still image.'
 ],
 'conveyor-window': [
  'Blueprint rules, six level choices and start action are complete. QR, search instruction, service address, controls and sidebar tip fit.',
  'Source/socket belts, part orientation detail and all four bottom HUD cards are visible. Connected status wraps legibly; address, controls and sidebar tip fit.',
  'Blueprint pause summary and resume action fit. Controller address, aliases, primary controls and sidebar tip remain complete.',
  'Later belt positions and socket detail are visible after reconnect. Connection address, two-line status, bottom HUD and sidebar tip remain readable, with no material clipping.'
 ]
}
slugs = list(notes)
filenames = ['menu-android.png', 'gameplay.png', 'paused.png', 'reconnected.png']
manifest_path = RUN / 'export-manifest.json'
manifest = json.loads(manifest_path.read_text())
assert manifest['runId'] == '43736021527'
OUT.mkdir(parents=True)
screenshots, games, inputs, source_receipts = [], [], [], []
for batch in ('kit-1', 'kit-2'):
 d=RUN/'evidence'/('controller-runtime-'+batch)
 group=json.loads((d/'report.json').read_text())
 assert group['status']=='passed'
 executed=json.loads((d/'executed-source-manifest.json').read_text())
 assert executed['qaSourceSha']==manifest['qaSourceSha']
 source_receipts += [receipt(d/n) for n in ('report.json','executed-source-manifest.json','emulator-configuration.json','bundle-manifest.json')]
for slug in slugs:
 batch='kit-1' if slug in ('twenty-four','torch-bridge') else 'kit-2'
 d=RUN/'evidence'/('controller-runtime-'+batch)/slug
 case=json.loads((d/'case.json').read_text())
 test=json.loads((d/'gameplay/report.json').read_text())
 assert case['status']==test['status']=='passed'
 assert len(test['tests'])==8 and all(t['status']=='passed' for t in test['tests'])
 assert test['androidAppTested'] and not test['syntheticNativeBridge']
 assert not test['modelWrites'] and not test['clockOverrides']
 app=ROOT/'resource/apps'/slug
 meta=json.loads((app/'game.json').read_text())
 apk=app/(slug+'-'+meta['version']+'.apk')
 assert sha(apk)==case['packageSha256']
 assert set(p.name for p in (d/'gameplay').glob('*.png'))==set(filenames)
 for name,note in zip(filenames, notes[slug]):
  p=d/'gameplay'/name
  e=manifest['files'][p.relative_to(RUN).as_posix()]
  assert sha(p)==e['sha256'] and p.stat().st_size==e['bytes']
  width,height=struct.unpack('>II',p.read_bytes()[16:24])
  screenshots.append({'game':slug,'capture':name,**receipt(p),'width':width,'height':height,
                      'method':'Direct inspection of original image with view_image',
                      'visualStatus':'passed-with-nonblocking-note' if slug=='packing-sculptor' and name!='menu-android.png' else 'passed',
                      'conclusion':note})
 video=d/'gameplay.mp4'
 assert sha(video)==case['recording']['sha256']
 games.append({'game':slug,'version':meta['version'],'batch':batch,'actualApkRuntimeStatus':'passed',
               'runtimeTestCount':8,'runtimeTestsAsReported':test['tests'],
               'apkSourceSha':case['artifactSourceSha'],'observerSourceSha':case['observerSourceSha'],
               'executedQaSourceSha':manifest['qaSourceSha'], 'apkReceipt':receipt(apk),
               'caseReceipt':receipt(d/'case.json'),'gameplayReportReceipt':receipt(d/'gameplay/report.json'),
               'recordingReceipt':receipt(video),'visualReviewStatus':'passed-with-nonblocking-note' if slug=='packing-sculptor' else 'passed'})
 inputs.append({'game':slug,'version':meta['version'],
                'menu':{'source':receipt(d/'gameplay/menu-android.png'),'destination':f'resource/apps/{slug}/docs/releases/{meta["version"]}/menu.png'},
                'video':{'source':receipt(video),'destination':f'resource/apps/{slug}/docs/releases/{meta["version"]}/gameplay.mp4'},
                'verification':{'runtimeReport':receipt(d/'gameplay/report.json'),'case':receipt(d/'case.json'),
                                'destination':f'resource/apps/{slug}/docs/releases/{meta["version"]}/verification.json'}})
report={'runId':'43736021527','runUrl':'https://github.com/ecojust/pureTV/actions/runs/43736021527',
        'reviewer':'/root/controller_gamekit','reviewType':'Direct visual inspection plus read-only actual-APK report/hash binding',
        'reviewedGames':5,'directlyViewedScreenshotFiles':20,'actualApkRuntimePassedGames':5,
        'wholeRunResultAsReported':manifest['runtimeResult'],'executedQaSourceSha':manifest['qaSourceSha'],
        'actualAndroidEmulator':True,'physicalTvTested':False,'physicalPhoneTested':False,'physicalEsp32Tested':False,
        'productionModified':False,'rawEvidenceModified':False,'imagesEdited':False,'runtimeRerunByReview':False,
        'videoPlaybackReviewed':False,'publicationConfirmed':False,
        'scopeNotes':[
          'All 20 listed original PNGs were individually viewed. Functional PASS comes from the exact APK runtime reports, not from image appearance.',
          'Only these five games are covered. The whole workflow result remains failure; other games must be resolved separately.',
          'Packing primary controls, QR and address remain visible. Connected English status wraps, placing the optional tip tail below the viewport; these still images do not verify Android scrolling.',
          'Neon has a different visual reviewer. Glass, Tension and Prism need later actual-APK startup/runtime evidence.',
          'APK source, observer source and executed QA source are different refs and are recorded independently.',
          'Recordings were hash-bound for README use; this review did not play or inspect every video frame.',
          'Prior failed run 43734122992 and its visual review remain unchanged. This new per-game passing run does not rewrite earlier results.'
        ],'sourceReceipts':source_receipts,'exportManifestReceipt':receipt(manifest_path),'games':games,'screenshots':screenshots}
(OUT/'review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(OUT/'readme-asset-inputs.json').write_text(json.dumps({'publicationConfirmed':False,'assetsGeneratedByThisScript':False,'inputs':inputs},ensure_ascii=False,indent=2)+'\n')
shutil.copyfile(__file__,OUT/'record-review.py')
(OUT/'README.md').write_text('''# Game Kit 最终候选 APK 截图审阅 · run 43736021527

本次逐张目视 5 款游戏的 20 张原始截图，并只读核对同一安装包的运行报告：**5 款均通过全部 8 项实际 Android 手柄回归检查**。截图审阅与功能测试结果分开记录；没有改图、改生产代码、重跑测试或重写旧失败证据。安装包尚未在本报告中确认公开发布。

| 游戏（候选 0.2.1） | 原始批次 | 实际 APK 运行 | 视觉审阅 |
| --- | --- | --- | --- |
| 四则二十四 | kit-1 | PASS，8/8 | 菜单、运算区、暂停与连接栏完整 |
| 夜桥接力 | kit-1 | PASS，8/8 | 六关菜单、桥梁人物、暂停与连接侧栏完整 |
| 叠塔工匠 | kit-2 | PASS，8/8 | 菜单、塔楼与状态仪表、暂停、连接栏完整 |
| 异形装箱 | kit-2 | PASS，8/8 | 主要操作、棋盘、零件栏及地址可见；可选提示尾部低于视口 |
| 窗口装配 | kit-2 | PASS，8/8 | 菜单蓝图、双层传送带、详情与连接侧栏完整 |

异形装箱连接后的英文状态分成两行，侧栏末尾部分可选提示需要滚动查看；这些实际 Android 静态截图没有验证滚动动作。主要按键与地址可见，不将这一限制隐藏为“所有文字均完整可见”。

来源：[CI run](https://github.com/ecojust/pureTV/actions/runs/43736021527)，[kit-1 原始报告](../43736021527/evidence/controller-runtime-kit-1/report.json)，[kit-2 原始报告](../43736021527/evidence/controller-runtime-kit-2/report.json)。APK 源码为 `a657ce24fc4c0c5adb07a671adabb3ce604f68f8`，observer 为 `ed925cc1839da4629991ecf46fc2f625821322ce`，执行夹具为 `e8a46fb7c3b5a56e77b6446a9550f18e7a7c8abb`。

[review.json](review.json) 包含每图 SHA-256、原始尺寸和结论，并将运行报告、录像与本地 0.2.1 签名 APK 绑定。[readme-asset-inputs.json](readme-asset-inputs.json) 给出版本文档准备使用的原始菜单和录像；仅验证录像哈希，未逐帧审阅录像。该工作流整体仍有其他游戏失败，不能以这 5 款通过代替全 20 款通过。

环境为实际 Android TV API 36 模拟器，没有实体电视、手机或 ESP32 验证。霓虹飞车由另一位审阅者负责；折光工坊、拉索桥梁及镜光接力等待后续启动问题补验。旧 run 43734122992 的失败记录及审阅原样保留。
''')
print(json.dumps({'directory':str(OUT),'games':len(games),'screenshots':len(screenshots),'reviewSha256':sha(OUT/'review.json')},ensure_ascii=False))

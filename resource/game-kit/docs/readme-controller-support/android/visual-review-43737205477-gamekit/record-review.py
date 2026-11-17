#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, os, re, shutil, struct

ROOT=Path('/dev/shm/puretv-controller-games')
RUN=ROOT/'resource/game-kit/docs/readme-controller-support/android/43737205477'
GROUP=RUN/'evidence/controller-runtime-kit-3'
OUT=RUN.parent/'visual-review-43737205477-gamekit'
assert not OUT.exists(), 'Do not rewrite earlier reviews.'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def receipt(p):return {'path':os.path.relpath(p,OUT),'bytes':p.stat().st_size,'sha256':sha(p)}
manifest=json.loads((RUN/'export-manifest.json').read_text())
group=json.loads((GROUP/'report.json').read_text())
executed=json.loads((GROUP/'executed-source-manifest.json').read_text())
assert manifest['runId']=='43737205477' and executed['qaSourceSha']==manifest['qaSourceSha']
notes={
 'glass-fold':[
  'Six work choices, complete rules and start button fit. Overlay/blur is confined to the arena. Bottom QR, controller search instruction, 10.0.2.15:63485, aliases and fold/undo controls remain visible.',
  'Workpiece and reference grids, fold-direction/line selector, work description and top HUD are complete. Connected status, service address and bottom controls are readable.',
  'Pause message and resume action fit inside the arena without covering or blurring the controller rail. Address, aliases and main controls remain visible.',
  'Folded workpiece, selected second fold line, reference grid and 2/3 remaining-fold HUD are visible after reconnect. Connected status/address and primary controls fit with no material clipping.'
 ],
 'tension-span':[
  'Six bridge choices, rules and start button fit. Top material/load/time HUD and bottom QR, search instruction, 10.0.2.15:63485, aliases and build/load-test controls are visible.',
  'Bridge, vehicle, first installed cable, material budget and engineering labels are complete. Connection status/address and primary controls remain readable.',
  'Pause message, resume action and START instruction fit; top engineering HUD and bottom controller rail remain visible and readable.',
  'Two installed cables and remaining material 143/255 are visible after reconnect, with bridge, vehicle and cable details complete. Connected status, service address and primary controls fit.'
 ]
}
names=['menu-android.png','gameplay.png','paused.png','reconnected.png']
OUT.mkdir(parents=True)
games=[];pictures=[];inputs=[];changes=[]
for slug,visuals in notes.items():
 d=GROUP/slug;case=json.loads((d/'case.json').read_text());test=json.loads((d/'gameplay/report.json').read_text())
 assert case['status']==test['status']=='passed'
 assert len(test['tests'])==8 and all(t['status']=='passed' for t in test['tests'])
 assert test['androidAppTested'] and not test['syntheticNativeBridge'] and not test['modelWrites'] and not test['clockOverrides']
 app=ROOT/'resource/apps'/slug;version=json.loads((app/'game.json').read_text())['version'];apk=app/f'{slug}-{version}.apk'
 assert sha(apk)==case['packageSha256']
 assert set(p.name for p in (d/'gameplay').glob('*.png'))==set(names)
 for name,note in zip(names,visuals):
  p=d/'gameplay'/name;e=manifest['files'][p.relative_to(RUN).as_posix()]
  assert sha(p)==e['sha256'] and p.stat().st_size==e['bytes']
  width,height=struct.unpack('>II',p.read_bytes()[16:24])
  pictures.append({'game':slug,'capture':name,**receipt(p),'width':width,'height':height,
                   'method':'Direct inspection of original image with view_image','visualStatus':'passed','conclusion':note})
 video=d/'gameplay.mp4';assert sha(video)==case['recording']['sha256']
 games.append({'game':slug,'version':version,'actualApkRuntimeStatus':'passed','visualStatus':'passed','runtimeTestCount':8,
               'runtimeTestsAsReported':test['tests'],'apkSourceSha':case['artifactSourceSha'],
               'observerSourceSha':case['observerSourceSha'],'executedQaSourceSha':manifest['qaSourceSha'],
               'apkReceipt':receipt(apk),'caseReceipt':receipt(d/'case.json'),
               'gameplayReportReceipt':receipt(d/'gameplay/report.json'),'recordingReceipt':receipt(video)})
 inputs.append({'game':slug,'version':version,
                'menu':{'source':receipt(d/'gameplay/menu-android.png'),'destination':f'resource/apps/{slug}/docs/releases/{version}/menu.png'},
                'video':{'source':receipt(video),'destination':f'resource/apps/{slug}/docs/releases/{version}/gameplay.mp4'},
                'verification':{'runtimeReport':receipt(d/'gameplay/report.json'),'case':receipt(d/'case.json'),
                                'destination':f'resource/apps/{slug}/docs/releases/{version}/verification.json'}})
 p=app/'README.md';old=p.read_text();title=old.split('\n',1)[0]
 marker=re.search(r'^历史 0\.2\.\d+：',old,re.M);assert marker
 tail=old[marker.start():];controller=old[old.index('## pureTV Wi-Fi 手柄'):]
 prefix=f'''{title}

**{version} · pureTV 手柄更新（待发布）：** [签名安装包]({slug}-{version}.apk) · [Android 实包手柄回归录像](docs/releases/{version}/gameplay.mp4) · [版本验证](docs/releases/{version}/verification.json) · [本轮接入记录](../../../docs/readme-controller-support/README.md)

新增 pureTV Wi-Fi 手柄支持，默认端口 **63485**，显示真实连接状态，断线时暂停并清除输入。保留原六关及规则，遥控器和扫码手机仍可使用。

本候选签名 APK 已在 Android TV API 36 模拟器中通过 8 项手柄回归，覆盖开始、实际游戏操作、暂停恢复、断线重连、九键输入及逐消息 ACK。下图和上方录像来自本版本实际 APK；录像记录手柄回归过程，不是六关通关录像。尚未进行实体电视、手机或 ESP32 测试。

![{version} 实际 Android APK 菜单](docs/releases/{version}/menu.png)

'''
 new=prefix+tail;assert new[new.index('## pureTV Wi-Fi 手柄'):]==controller;p.write_text(new)
 missing=[]
 for target in re.findall(r'\]\(([^)]+)\)',new):
  if target.startswith(('https://','http://')):continue
  if not (app/target).exists():
   assert target in [f'docs/releases/{version}/'+n for n in ('menu.png','gameplay.mp4','verification.json')],target
   missing.append(target)
 changes.append({'path':str(p.relative_to(ROOT)),'beforeSha256':hashlib.sha256(old.encode()).hexdigest(),
                 'afterSha256':hashlib.sha256(new.encode()).hexdigest(),'version':version,
                 'controllerInstructionsUnchanged':True,'historicalRulesAndEvidenceUnchanged':True,
                 'newReleaseAssetsPendingRootAggregation':missing})
prism_case=GROUP/'prism-relay/case.json';prism_test=GROUP/'prism-relay/gameplay/report.json'
prism=json.loads(prism_test.read_text());assert prism['status']=='failed'
report={'runId':'43737205477','runUrl':'https://github.com/ecojust/pureTV/actions/runs/43737205477',
        'reviewer':'/root/controller_gamekit','reviewType':'Direct visual inspection plus exact-APK runtime report binding',
        'reviewedGames':2,'directlyViewedScreenshotFiles':8,'actualApkRuntimePassedGames':2,
        'wholeRunResultAsReported':manifest['runtimeResult'],'groupResultAsReported':group['status'],
        'executedQaSourceSha':manifest['qaSourceSha'],'actualAndroidEmulator':True,
        'physicalTvTested':False,'physicalPhoneTested':False,'physicalEsp32Tested':False,
        'productionModified':False,'rawEvidenceModified':False,'imagesEdited':False,'runtimeRerunByReview':False,
        'videoPlaybackReviewed':False,'publicationConfirmed':False,
        'sourceReceipts':[receipt(GROUP/n) for n in ('report.json','executed-source-manifest.json','emulator-configuration.json','bundle-manifest.json')],
        'exportManifestReceipt':receipt(RUN/'export-manifest.json'),'games':games,'screenshots':pictures,
        'excludedPrism':{'runtimeStatusAsReported':'failed','visualReviewPerformed':False,'caseReceipt':receipt(prism_case),
                         'gameplayReportReceipt':receipt(prism_test),'failedTestsAsReported':[t for t in prism['tests'] if t['status']!='passed']},
        'scopeNotes':[
         'Functional PASS is taken from eight passed tests for each exact signed APK, not inferred from still images.',
         'All eight screenshots were directly viewed; no material cropping observed in menus, connected gameplay, pause, reconnect, service address or primary controls.',
         'Prism is excluded: its raw case remains failed at protocol test pause. No whole-group, whole-workflow or catalog-wide PASS is claimed.',
         'Recordings were bound by SHA-256 for README use, not played or reviewed frame by frame.',
         'API 36 Android TV emulator evidence does not establish physical television, phone or ESP32 compatibility.',
         'Prior failure reports remain unchanged. New README release resource paths await root aggregation and publication is not confirmed.'
        ]}
(OUT/'review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(OUT/'readme-asset-inputs.json').write_text(json.dumps({'publicationConfirmed':False,'assetsGeneratedByThisScript':False,'inputs':inputs},ensure_ascii=False,indent=2)+'\n')
(OUT/'readme-update-receipt.json').write_text(json.dumps({'published':False,'changes':changes},ensure_ascii=False,indent=2)+'\n')
shutil.copyfile(__file__,OUT/'record-review.py')
(OUT/'README.md').write_text('''# 折光工坊、拉索桥梁实际 APK 审阅 · run 43737205477

两款候选签名 APK 在 Android TV API 36 模拟器中均通过全部 8 项手柄回归；本次逐张目视两款的菜单、游戏、暂停与重连截图，共 8 张原始 PNG。六关选择、开始/继续按钮、连接状态与地址、主要操作和游戏区域均可见，没有明显裁切。折光工坊菜单与暂停层限于游戏区域，底部手柄栏保持清晰。

| 游戏 | 候选版本 | 实际 APK 测试 | 逐消息 ACK | 视觉结论 |
| --- | --- | --- | --- | --- |
| 折光工坊 | 0.2.1 | PASS，8/8 | 79/79，2 个连接 | PASS，4 张 |
| 拉索桥梁 | 0.2.2 | PASS，8/8 | 63/63，2 个连接 | PASS，4 张 |

来源：[CI run](https://github.com/ecojust/pureTV/actions/runs/43737205477)、[原始批次报告](../43737205477/evidence/controller-runtime-kit-3/report.json)。APK 源码 `a657ce24fc4c0c5adb07a671adabb3ce604f68f8`，observer 源码 `ed925cc1839da4629991ecf46fc2f625821322ce`，执行 QA 源码 `beaffd54f7dd1620086a12518b0e8e414e452525`。

[review.json](review.json) 分开记录逐图 SHA-256、尺寸、视觉判断和实际 APK 功能结果，并校验本地签名包与受测包的 SHA 一致。[readme-asset-inputs.json](readme-asset-inputs.json) 列出新版菜单、录像及验证文档的聚合来源；仅核对录像哈希，没有逐帧审阅。README 保留“待发布”，新版本资源由 root 聚合。

镜光接力不在此次通过范围：其原始测试仍在 protocol test pause 失败，等待独立复测。因此本批次和工作流的整体失败状态均保留。没有改生产代码、原图或旧失败记录，没有进行实体电视、手机或 ESP32 测试。
''')
print(json.dumps({'directory':str(OUT),'reviewedScreenshots':len(pictures),'passedGames':len(games),
                  'readmesUpdated':len(changes),'pendingReleaseAssetLinks':sum(len(x['newReleaseAssetsPendingRootAggregation']) for x in changes)},ensure_ascii=False))

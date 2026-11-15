#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,os,re,shutil,struct

ROOT=Path('/dev/shm/puretv-controller-games')
RUN=ROOT/'resource/game-kit/docs/readme-controller-support/android/43738487701'
GROUP=RUN/'evidence/controller-runtime-retry-prism'
DATA=GROUP/'prism-relay'
OUT=RUN.parent/'visual-review-43738487701-gamekit'
assert not OUT.exists()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def receipt(p):return {'path':os.path.relpath(p,OUT),'bytes':p.stat().st_size,'sha256':sha(p)}
manifest=json.loads((RUN/'export-manifest.json').read_text())
group=json.loads((GROUP/'report.json').read_text())
case=json.loads((DATA/'case.json').read_text())
test=json.loads((DATA/'gameplay/report.json').read_text())
executed=json.loads((GROUP/'executed-source-manifest.json').read_text())
assert manifest['runId']=='43738487701' and manifest['qaSourceSha']==executed['qaSourceSha']
assert case['status']==test['status']==group['status']=='passed'
assert len(test['tests'])==8 and all(t['status']=='passed' for t in test['tests'])
assert test['androidAppTested'] and not test['syntheticNativeBridge'] and not test['modelWrites'] and not test['clockOverrides']
app=ROOT/'resource/apps/prism-relay';meta=json.loads((app/'game.json').read_text());version=meta['version'];assert version=='0.2.2'
apk=app/'prism-relay-0.2.2.apk';assert sha(apk)==case['packageSha256']
video=DATA/'gameplay.mp4';assert sha(video)==case['recording']['sha256']
notes={
 'menu-android.png':'Six level choices, complete menu rules and start action are visible. QR, search status, 10.0.2.15:63485, aliases and all primary sidebar controls fit. Optional tip tail extends below the sidebar viewport.',
 'gameplay.png':'Optical board, selected mirror, downward red path, routing diagram and four HUD cards are visible. Connected status, address and main sidebar controls remain readable. Optional tip tail is below the viewport.',
 'paused.png':'Pause message, resume action and START instruction are clear. QR, controller status/address and primary controls remain visible; optional sidebar tip extends below the viewport.',
 'reconnected.png':'Mirror is rotated to connect the upward red path to the receiver; selected-device panel and HUD are complete. Connected status/address and primary controls fit. Optional tip tail is below viewport; still images do not verify Android scrolling.'
}
assert set(p.name for p in (DATA/'gameplay').glob('*.png'))==set(notes)
OUT.mkdir(parents=True);pictures=[]
for name,note in notes.items():
 p=DATA/'gameplay'/name;e=manifest['files'][p.relative_to(RUN).as_posix()]
 assert sha(p)==e['sha256'] and p.stat().st_size==e['bytes']
 width,height=struct.unpack('>II',p.read_bytes()[16:24])
 pictures.append({'game':'prism-relay','capture':name,**receipt(p),'width':width,'height':height,
                  'method':'Direct inspection of original image with view_image',
                  'visualStatus':'passed-with-nonblocking-note','conclusion':note})
previous=RUN.parent/'43737205477/evidence/controller-runtime-kit-3/prism-relay/gameplay/report.json'
assert json.loads(previous.read_text())['status']=='failed'
report={'runId':'43738487701','runUrl':'https://github.com/ecojust/pureTV/actions/runs/43738487701',
        'reviewer':'/root/controller_gamekit','reviewType':'Direct original image inspection and exact-APK runtime report binding',
        'reviewedGames':1,'directlyViewedScreenshotFiles':4,'actualApkRuntimePassedGames':1,
        'wholeRunResultAsReported':manifest['runtimeResult'],'groupResultAsReported':group['status'],
        'game':'prism-relay','version':version,'actualApkRuntimeStatus':'passed','visualStatus':'passed-with-nonblocking-note',
        'apkSourceSha':case['artifactSourceSha'],'observerSourceSha':case['observerSourceSha'],
        'executedQaSourceSha':manifest['qaSourceSha'],'actualAndroidEmulator':True,
        'runtimeTestCount':8,'runtimeTestsAsReported':test['tests'],
        'physicalTvTested':False,'physicalPhoneTested':False,'physicalEsp32Tested':False,
        'productionModified':False,'rawEvidenceModified':False,'imagesEdited':False,'runtimeRerunByReview':False,
        'videoPlaybackReviewed':False,'publicationConfirmed':False,
        'sourceReceipts':[receipt(GROUP/n) for n in ('report.json','executed-source-manifest.json','emulator-configuration.json','bundle-manifest.json')],
        'exportManifestReceipt':receipt(RUN/'export-manifest.json'),'apkReceipt':receipt(apk),
        'caseReceipt':receipt(DATA/'case.json'),'gameplayReportReceipt':receipt(DATA/'gameplay/report.json'),
        'recordingReceipt':receipt(video),'previousFailureReportReceipt':receipt(previous),'screenshots':pictures,
        'scopeNotes':[
         'Functional PASS comes from all eight actual-APK tests, not from image appearance; each of the four original PNGs was directly viewed.',
         'The menu, game board, pause action, service address and primary controls are visible. Optional sidebar tip tail is below viewport; these still images do not establish actual Android scrolling.',
         'This API 36 Android TV emulator result is not a physical TV, phone or ESP32 test.',
         'Whole workflow still has other failures; this record claims only Prism acceptance, not a catalog-wide PASS.',
         'Earlier Prism failed run 43737205477 remains unchanged. This independent passing run is recorded separately.',
         'Video is SHA-bound but was not played/reviewed frame by frame. Release assets await root aggregation and public publication is not confirmed.'
        ]}
(OUT/'review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
inputs={'publicationConfirmed':False,'assetsGeneratedByThisScript':False,'inputs':[{'game':'prism-relay','version':version,
 'menu':{'source':receipt(DATA/'gameplay/menu-android.png'),'destination':f'resource/apps/prism-relay/docs/releases/{version}/menu.png'},
 'video':{'source':receipt(video),'destination':f'resource/apps/prism-relay/docs/releases/{version}/gameplay.mp4'},
 'verification':{'runtimeReport':receipt(DATA/'gameplay/report.json'),'case':receipt(DATA/'case.json'),
                 'destination':f'resource/apps/prism-relay/docs/releases/{version}/verification.json'}}]}
(OUT/'readme-asset-inputs.json').write_text(json.dumps(inputs,ensure_ascii=False,indent=2)+'\n')
p=app/'README.md';old=p.read_text();title=old.split('\n',1)[0];marker='历史 0.2.1：';assert old.count(marker)==1
tail=old[old.index(marker):];controller=old[old.index('## pureTV Wi-Fi 手柄'):]
prefix=f'''{title}

**{version} · pureTV 手柄更新（待发布）：** [签名安装包](prism-relay-{version}.apk) · [Android 实包手柄回归录像](docs/releases/{version}/gameplay.mp4) · [版本验证](docs/releases/{version}/verification.json) · [本轮接入记录](../../../docs/readme-controller-support/README.md)

新增 pureTV Wi-Fi 手柄支持，默认端口 **63485**，显示真实连接状态，断线时暂停并清除输入。保留原六关及规则，遥控器和扫码手机仍可使用。

本候选签名 APK 已在 Android TV API 36 模拟器中通过 8 项手柄回归，覆盖开始、实际游戏操作、暂停恢复、断线重连、九键输入及逐消息 ACK。下图和上方录像来自本版本实际 APK；录像记录手柄回归过程，不是六关通关录像。尚未进行实体电视、手机或 ESP32 测试。

![{version} 实际 Android APK 菜单](docs/releases/{version}/menu.png)

'''
new=prefix+tail;assert new[new.index('## pureTV Wi-Fi 手柄'):]==controller;p.write_text(new)
missing=[]
for target in re.findall(r'\]\(([^)]+)\)',new):
 if target.startswith(('https://','http://')):continue
 if not(app/target).exists():
  assert target in [f'docs/releases/{version}/'+n for n in ('menu.png','gameplay.mp4','verification.json')],target
  missing.append(target)
(OUT/'readme-update-receipt.json').write_text(json.dumps({'published':False,'changes':[{
 'path':str(p.relative_to(ROOT)),'beforeSha256':hashlib.sha256(old.encode()).hexdigest(),
 'afterSha256':hashlib.sha256(new.encode()).hexdigest(),'version':version,
 'controllerInstructionsUnchanged':True,'historicalRulesAndEvidenceUnchanged':True,
 'newReleaseAssetsPendingRootAggregation':missing}]},ensure_ascii=False,indent=2)+'\n')
shutil.copyfile(__file__,OUT/'record-review.py')
(OUT/'README.md').write_text('''# 镜光接力实际 APK 最终补验审阅 · run 43738487701

候选 **0.2.2** 在独立 Android TV API 36 模拟器中通过全部 **8 项**实际手柄回归，包括九键长按与逐消息 ACK（81/81，2 个连接）。本次逐张目视原始菜单、游戏、暂停和重连截图共 4 张，并确认本地签名 APK 的 SHA 与本轮受测包一致。

六关菜单、开始/继续按钮、光路棋盘、器件说明和状态栏完整，QR、连接状态、`10.0.2.15:63485` 地址及主要操作均可见。侧栏“小提示”的末尾在视口下方；这属于保留的非主要操作区限制，本次静态截图没有证明 Android 上的实际滚动动作。

来源：[CI run](https://github.com/ecojust/pureTV/actions/runs/43738487701)、[原始批次报告](../43738487701/evidence/controller-runtime-retry-prism/report.json)。APK 源码 `a657ce24fc4c0c5adb07a671adabb3ce604f68f8`，observer 源码 `ed925cc1839da4629991ecf46fc2f625821322ce`，执行 QA 源码 `a381b69f2cad78d9466872af656b3cb28d153211`。

[review.json](review.json) 记录每图尺寸、SHA-256、视觉结论和实际功能结果；[readme-asset-inputs.json](readme-asset-inputs.json) 列出新版菜单、录像和验证文档的原始来源。录像只核对哈希，未逐帧审阅。README 仍标为“待发布”，资源由 root 聚合。

旧 run 43737205477 的 Prism 失败证据原样保留；本报告记录新的独立通过结果，不重写旧报告。本次工作流仍有其他游戏失败，不能据此称全 20 款已通过或已发布。没有改生产代码、原始图片或测试报告，未进行实体电视、手机或 ESP32 测试。
''')
print(json.dumps({'directory':str(OUT),'screenshots':len(pictures),'actualTestsPassed':8,'pendingReleaseAssetLinks':len(missing)},ensure_ascii=False))

from pathlib import Path
import copy,datetime,hashlib,json,os,re

ROOT=Path('/dev/shm/puretv-submit')
GAME=ROOT/'joystick-games/night-racer'
DOCS=GAME/'docs/android-delivery'
APK=Path('/dev/shm/racing-review-arcade/night-44618869289/original-package/night-racer-0.1.0.apk')
PRODUCTION='315f8889ea677ed6a9211bf7d66c8c78dff57f01'
QA='f3e1e9f6634e35d1c9ae0cfbf1f8a51d42de7965'
FROZEN_AUDIT='e7b201e37c4f60ed469f5a081e4727d5abc1014fd50da69592a6f8bd348b91c4'

def sig(path):
    data=path.read_bytes()
    return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

manifest_path=DOCS/'delivery-audit-manifest.json'
assert sig(manifest_path)['sha256']==FROZEN_AUDIT
manifest=json.loads(manifest_path.read_text())
audit_path=DOCS/'independent-package-runtime-verification.json'
assert sig(audit_path)==manifest['files'][audit_path.name]
audit=json.loads(audit_path.read_text());visual=json.loads((DOCS/'visual-review.json').read_text())
assert audit['status']=='passed' and audit['artifactSourceSha']==PRODUCTION and audit['artifactRunId']==44613335670 and audit['artifactRunAttempt']==1
assert audit['qaSourceSha']==QA and audit['qaRunId']==44618869289 and audit['qaRunAttempt']==1
assert audit['actualMinSdk']==26 and audit['sourceInputsComparedToFixedGitAndOriginalArchive']==200 and audit['executedQaSourcesComparedToFixedGitAndOriginalArchive']==35
assert audit['actualApkAssetsVerified']==30 and audit['actualApkContentEntriesVerified']==36 and audit['currentDistFilesUnchanged']==25
assert audit['oldProductionRuntimeFailurePreserved'] is True and audit['storagePersistenceScenarioTested'] is False
signed=audit['signedApk']
assert signed['packageName']=='com.ecojust.joystick.nightracer' and signed['versionName']=='0.1.0' and signed['versionCode']==1
assert signed['bytes']==22465268 and signed['sha256']=='66e2589ece8a13bc03d9796259b2662aef34c56c166265db0a63d3baa2b72c91'
assert signed['certificateSha256']=='eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23'
assert sig(APK)=={k:signed[k] for k in ('bytes','sha256')}
runtime=[]
assert len(audit['runtimeModes'])==2
for row,mode,acks in zip(audit['runtimeModes'],('normal','occupied'),(644,641)):
    assert row['mode']==mode and row['status']=='passed' and row['checks']==58
    assert len(row['planExpectationsIndependentlyRecomputed'])==20
    wire=row['wireIndependentlyRecomputed']
    assert wire['acceptedSdkMessages']==wire['matchingAcks']==acks and wire['rejectedSdkMessages']==10 and wire['missingAcks']==wire['duplicateAcks']==wire['unexpectedReplies']==0
    assert len(row['captures'])==7 and all(x['pixelSize']==[1920,1080] and x['logicalViewport']==[960,540] for x in row['captures'])
    runtime.append({'mode':mode,'status':'passed','checks':58,'port':row['port'],'report':row['report'],
        'acceptedSdkMessagesAndUniqueAcks':acks,'rejectedSecondControllerMessages':10,'planExpectationsIndependentlyRecomputed':20,
        'primaryControllerId':wire['primaryControllerId'],'originalScreenshotCount':7,'logicalViewport':[960,540],'screenshotPixels':[1920,1080]})
meta_path=GAME/'packages.json';before=json.loads(meta_path.read_text());before_other={k:v for k,v in before.items() if k!='android'}
old_sums=(GAME/'SHA256SUMS.txt').read_text()
target=GAME/APK.name;assert not target.exists()
os.link(APK,target);assert os.path.samefile(APK,target)
android={'file':APK.name,'bytes':signed['bytes'],'sha256':signed['sha256'],'packageName':signed['packageName'],'versionName':signed['versionName'],'versionCode':1,
    'status':'verified','sourceCommit':PRODUCTION,'buildRunId':44613335670,'runAttempt':1,'artifactId':14571679832,
    'exportCommit':audit['originalApkGitExport'],'certificateSha256':signed['certificateSha256'],'minAndroidApi':26,'requiredRenderer':'webgl2',
    'nativeRuntimePassed':True,'qaSourceCommit':QA,'qaRunId':44618869289,'qaRunAttempt':1,'qaExportCommit':audit['runtimeExportCommit'],
    'originalSignedApkUnchanged':True,'modes':['normal','occupied'],'checksPerMode':58,'acceptedSdkMessagesAndUniqueAcks':{'normal':644,'occupied':641},
    'verification':'docs/android-delivery/README.md','defaultGraphicsPreset':'high','acceptanceGraphicsPreset':'low_selected_through_original_menu',
    'videoScope':'Only the first approximately 180 seconds: menus, original countdown and initial race. Later driving is supported by original snapshots, wire and separate screenshots, not claimed as a complete driving video.',
    'storagePersistenceScenarioTested':False,'fullCareerCompleted':False,'physicalTvTested':False,'physicalEsp32Tested':False,'oldProductionRuntimeFailurePreserved':True}
after=copy.deepcopy(before);after['android']=android
assert {k:v for k,v in after.items() if k!='android'}==before_other
write(meta_path,after)
(GAME/'SHA256SUMS.txt').write_text(old_sums+signed['sha256']+'  '+APK.name+'\n')
section='''## Android TV 下载

[Night Racer 0.1.0 APK](night-racer-0.1.0.apk)（22,465,268 字节）· [SHA256 校验](SHA256SUMS.txt) · [原包与运行核验](docs/android-delivery/README.md)

需要 **Android 8.0 / API 26 或更新版本，以及支持 WebGL 2 的系统 WebView**。APK 沿用固定发布证书的原签名文件，未重新打包或签名。原生模拟器正常端口与占用回退两种模式各通过 58 项检查，覆盖原菜单、实际驾驶、左右转向、氮气、视角、复位、九键、暂停恢复、断线与真实手柄 ID。测试通过原菜单选择原有 Low 画质，安装包默认 High 保持不变。

已逐张检查 14 张原截图，逻辑视口为 960×540、截图为 1920×1080。菜单底部部分键盘提示被固定手柄提示条遮住，实际九键说明与可操作按钮仍可读。原视频仅录制最初约 180 秒，涵盖菜单、倒计时和初始比赛，不作为完整驾驶录像。原首次 reload 验证失败记录保留；本次未做专项持久存档、完整职业或实体电视／ESP32 手柄测试。

'''
readme=(GAME/'README.md').read_text()
readme=readme.replace('已提供下方 Windows 和 macOS 安装包；Android TV 仍在验证。','已提供下方 Android TV、Windows 和 macOS 安装包，各平台要求与验证范围分别列明。')
assert '\n## Windows 下载\n' in readme
readme=readme.replace('\n## Windows 下载\n','\n'+section+'## Windows 下载\n',1)
readme=readme.replace('Windows 与 macOS 的原 SDK、原生图形、存档与安装包验证见上方；Android TV 仍在验证；实体电视和 ESP32 尚未测试。','各平台的原包、原 SDK 运行及验证范围见上方；Android 尚未专项测试持久存档，实体电视和 ESP32 尚未测试。')
(GAME/'README.md').write_text(readme)
for name in ('README.md','delivery-verification.json','executed-delivery-materialization.py','delivery-preparation.json','producer-origin-recheck.json','executed-producer-origin-recheck.py'):assert not (DOCS/name).exists()
origin=Path('/dev/shm/racing-review-arcade/night-44618869289')
origin_check=json.loads((origin/'producer-origin-recheck.json').read_text())
assert origin_check['status']=='passed' and origin_check['producerVerification']['jobId']==135876782805 and origin_check['producerVerification']['jobConclusion']=='success'
assert origin_check['producerVerification']['buildJobs']==[{'game':'night-racer','jobId':135875890262,'uploadStep':9}]
os.link(origin/'producer-origin-recheck.json',DOCS/'producer-origin-recheck.json')
os.link(origin/'recheck-origin.py',DOCS/'executed-producer-origin-recheck.py')
(DOCS/'README.md').write_text('''# Night Racer Android 0.1.0 原包交付

[下载原 APK](../../night-racer-0.1.0.apk) · [校验值](../../SHA256SUMS.txt) · [平台清单](../../packages.json)

原签名 APK 为 22,465,268 字节，包名 `com.ecojust.joystick.nightracer`，版本 0.1.0 / code 1，最低 API 26（Android 8.0），需要 WebGL 2 系统 WebView。原生产源 `315f8889ea677ed6a9211bf7d66c8c78dff57f01`、流程 `44613335670` attempt 1、signed artifact `14571679832`，完整 APK 从不可变导出 `8a27f4906bd9e3c29c91500ffd593d36a1889bd1` 逐字节恢复。固定发布证书 SHA256 为 `eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23`。没有重新编译、打包、签名或改游戏时钟。

本次原包复验为流程 `44618869289` attempt 1，QA 源 `f3e1e9f6634e35d1c9ae0cfbf1f8a51d42de7965`，原运行导出 `c6328e03941bbc70a650f33dabcdbd7c555f15c0`。正常端口 63485 与占用回退 32849 两种模式各 58 项通过；有效原 SDK 消息分别 644、641 个，各有唯一同序号 ACK，两个模式还分别拒绝第二手柄的 10 条消息。两模式各 20 个原计划期望均独立按原快照重算，覆盖原菜单选择 Low、正常 reload、等待原倒计时结束、真实加速和双向转向、氮气、视角、复位及暂停恢复。原包默认 High 没有被测试预设替换。

[独立原包与运行核验](independent-package-runtime-verification.json) 逐一核对 200 个原生产输入、35 个实际 QA 输入、30 个 APK 资产、36 个包内容条目及当前 25 个 dist 文件，并保留原签名工具与 aapt 日志。原始 337 文件及其哈希范围固定在 [delivery-audit-manifest.json](delivery-audit-manifest.json)；该记录保留在物化前的实际状态，不因新增本文和交付准备文件而重写。最早生产运行中 reload 相关 QA 失败及中间预检记录保持原样。

[逐张目视记录](visual-review.json) 已实际查看 14 张未修改截图，逻辑视口 960×540、物理截图 1920×1080，原车/赛道、HUD、完整 ID 与可操作控件可读；底部部分键盘说明受固定手柄提示条遮挡。UI 中的 FPS 不是实体电视性能测试。

原录像长度分别为 179.391 秒和 180.258 秒：[正常模式](original-export/evidence/joystick-android-runtime-night-racer/night-racer-normal/controller-gameplay.mp4)、[端口占用模式](original-export/evidence/joystick-android-runtime-night-racer/night-racer-occupied/controller-gameplay.mp4)。它们只覆盖最初约三分钟：5 秒抽帧为菜单，170 秒正常模式仍为倒计时 2，占用模式是 0 km/h 的初始比赛。未声称逐帧看完或录下全部驾驶验收；后续加速、动作和断线依据完整原快照、wire 与另行截图。

原生产流程整体失败记录仍保留，但本 APK 的原 build 与 sign job 成功；签名上传时间窗、唯一 artifact、同源／同 attempt 的 [只读来源重算](producer-origin-recheck.json) 与原 producerVerification 完全一致，[实际重算脚本](executed-producer-origin-recheck.py) 一并保留。

本 Android 场景没有专项持久存档生命周期、完整职业、实体电视或 ESP32 手柄测试。Windows、Mac 的原清单与各自限制不变。新增交付文件和原 APK 硬链接记录见 [delivery-verification.json](delivery-verification.json) 与 [delivery-preparation.json](delivery-preparation.json)。
''')
os.link(Path(__file__),DOCS/'executed-delivery-materialization.py')
verification={'schemaVersion':1,'status':'original_signed_apk_materialized','game':'night-racer','originalApk':android,
    'originalPackageHardlinked':True,'apkBytesMatchFrozenAudit':True,'originalAuditManifestSha256':FROZEN_AUDIT,
    'originalAuditManifest':'delivery-audit-manifest.json','originalIndependentVerification':'independent-package-runtime-verification.json',
    'originalAuditScopeFiles':len(manifest['files']),'runtimeModes':runtime,'otherPlatformsMetadataUnchanged':True,
    'originalProducerIdentityRecheck':{'path':'producer-origin-recheck.json',**sig(DOCS/'producer-origin-recheck.json')},
    'oldChecksumsPreserved':True,'originalFailedReportsPreserved':True,'storagePersistenceScenarioTested':False,
    'fullCareerCompleted':False,'physicalTvTested':False,'physicalEsp32Tested':False,'nativeRerunForMaterialization':False,
    'sourceOrApkContentAuditRepeated':False,'visualReview':'visual-review.json','videoScope':visual['videoScope'],
    'existingNonAndroidManifestSha256':hashlib.sha256(json.dumps(before_other,sort_keys=True,separators=(',',':')).encode()).hexdigest()}
write(DOCS/'delivery-verification.json',verification)
assert sig(target)=={k:signed[k] for k in ('bytes','sha256')} and os.path.samefile(target,APK)
assert {k:v for k,v in json.loads(meta_path.read_text()).items() if k!='android'}==before_other
assert (GAME/'SHA256SUMS.txt').read_text().startswith(old_sums)
assert sig(manifest_path)['sha256']==FROZEN_AUDIT
owned=[target,meta_path,GAME/'README.md',GAME/'SHA256SUMS.txt',DOCS/'README.md',DOCS/'delivery-verification.json',DOCS/'executed-delivery-materialization.py',DOCS/'producer-origin-recheck.json',DOCS/'executed-producer-origin-recheck.py']
records={p.relative_to(ROOT).as_posix():sig(p) for p in owned}
preparation={'status':'prepared_in_worktree_not_committed_or_pushed','preparedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'game':'night-racer','productionSourceCommit':PRODUCTION,'productionRunId':44613335670,'qaSourceCommit':QA,'qaRunId':44618869289,
    'originalAuditManifestSha256':FROZEN_AUDIT,'original337EvidenceFilesUnchanged':True,'apkHardlinkVerified':True,
    'otherPlatformsMetadataUnchanged':True,'checksumsAndReadmeLinksPassed':True,'nativeTestsRerun':False,'packageRebuiltOrResigned':False,
    'files':records,'scope':'Only these added/updated delivery files, excluding this preparation record itself. The previous 337-file audit manifest remains a separate unchanged scope.'}
write(DOCS/'delivery-preparation.json',preparation)
for p in [GAME/'README.md',DOCS/'README.md']:
    for dest in re.findall(r'\]\(([^)]+)\)',p.read_text()):
        if '://' not in dest and not dest.startswith('#'):assert (p.parent/dest.split('#')[0]).exists(),(p,dest)
records[(DOCS/'delivery-preparation.json').relative_to(ROOT).as_posix()]=sig(DOCS/'delivery-preparation.json')
freeze=Path('/dev/shm/windows-host-tmp/night-android-freeze.json')
write(freeze,{'status':'stable_for_root_review_commit','game':'night-racer','files':records})
print(json.dumps({'files':len(records),'bytes':sum(r['bytes'] for r in records.values()),'freeze':str(freeze),'sha256':sig(freeze)['sha256']},indent=2))

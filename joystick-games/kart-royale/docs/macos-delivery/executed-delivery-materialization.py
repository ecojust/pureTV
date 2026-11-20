from pathlib import Path
import datetime,hashlib,json,os,re

ROOT=Path('/dev/shm/puretv-submit')
ORIGINAL=Path('/dev/shm/root-mac03-v3-transfer/packages')
BASE=ROOT/'docs/racing-nine/native-readiness/ci-44615880581-attempt-1'
SOURCE='6c7cb4fdb99dce236b634c842326bae6aed5f232'
RUN=44615880581
GAMES=('turbo-kart-rush','kart-royale')
ARM_EXPORT='9789c5a17e338df15728b3aec502bfbb42dce6a6'
INTEL_EXPORT='5779100b7c50df0a666c4fe5433f890f6a013bfe'

def sig(p):
    data=p.read_bytes()
    return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def write(p,obj):p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def link(src,dst):
    assert src.is_file() and not src.is_symlink() and not dst.exists()
    os.link(src,dst)
    assert os.path.samefile(src,dst)

audit=json.loads((BASE/'package-source-audit/audit.json').read_text())
arm=json.loads((BASE/'readonly-arm-export-verification.json').read_text())
intel=json.loads((BASE/'readonly-intel-export-verification.json').read_text())
findings=json.loads((BASE/'intel-findings.json').read_text())
assert audit['sourceCommit']==SOURCE and audit['originalRun']==RUN
assert arm['sourceRunId']==intel['sourceRunId']==RUN and arm['sourceCommit']==intel['sourceCommit']==SOURCE
assert arm['exportCommit']==ARM_EXPORT and arm['partial'] is False and arm['fileCount']==516
assert intel['exportCommit']==INTEL_EXPORT and intel['fileCount']==309
freeze={}
for game in GAMES:
    folder=ROOT/'joystick-games'/game
    assert not (folder/'packages.json').exists() and not (folder/'SHA256SUMS.txt').exists()
    assert not (folder/'macos').exists() and not (folder/'docs/macos-delivery').exists()
    app_audit=next(x for x in audit['games'] if x['game']==game)
    source=ORIGINAL/game;meta=json.loads((source/'build-manifest.json').read_text())
    visual_path=folder/'docs/macos-ci-44615880581-visual-review.json'
    visual=json.loads(visual_path.read_text())
    assert visual['originalRunId']==RUN and visual['packageSourceCommit']==visual['qaSourceCommit']==SOURCE and visual['immutableEvidenceExport']==ARM_EXPORT
    assert visual['imagesInspected']==9 and all(x['viewImageInspected'] for x in visual['observations'])
    assert meta['sourceCommit']==SOURCE and meta['game']==game and meta['committedInputsVerified'] is True
    assert meta['signature']=='ad-hoc' and meta['appleNotarized'] is False and set(meta['architectures'])=={'arm64','x86_64'}
    assert app_audit['completeInputInventoryRebuiltByOriginalBuilder'] is True and app_audit['originalPassedNativeReportBinaryMatched'] is True
    binary=app_audit['actualBinarySha256']
    assert sig(source/'build-manifest.json')=={k:app_audit['originalBuildManifest'][k] for k in ('bytes','sha256')}
    runtime=[]
    for mode,architecture in [('native','arm64'),('occupied-port','arm64'),('rosetta','x86_64')]:
        relative=f'artifact/{game}/{mode}/report.json';path=BASE/'original-arm-export'/relative
        record=sig(path);assert record=={k:arm['files'][relative][k] for k in ('bytes','sha256')}
        r=json.loads(path.read_text())
        assert r['status']=='passed' and r['artifactSourceCommit']==r['qaSourceCommit']==SOURCE and r['qaRunId']==RUN and r['qaRunAttempt']==1
        assert r['nativeProcessArchitecture']==architecture and r['binarySha256']==binary
        assert len(r['tests'])==9 and all(t['status']=='passed' for t in r['tests'])
        storage=r['storageRestart'];assert storage['newOriginVerified'] is True and storage['initialHydrationEqual'] is True
        if game=='turbo-kart-rush':
            assert storage['required'] is False and storage['status']=='not_exercised' and storage['actualStoredKeys']==[] and storage['nativeSavedAfterQuit']=={}
        else:
            assert storage['required'] is True and storage['status']=='passed' and storage['actualStoredKeys']==['kr.controls.v1']
            assert storage['nativeSavedAfterQuit'] and storage['after']['initial']==storage['nativeSavedAfterQuit']
        runtime.append({'mode':mode,'path':path.relative_to(ROOT).as_posix(),**record,'testsPassed':9,'processArchitecture':architecture,
            'binarySha256':binary,'storageRequired':storage['required'],'storageStatus':storage['status'],'storedKeys':storage['actualStoredKeys'],
            'newOriginVerified':True,'initialHydrationEqual':True,'realStorageRestartVerified':storage['status']=='passed'})
    actual_dist={p.relative_to(folder/'dist').as_posix():sig(p) for p in (folder/'dist').rglob('*') if p.is_file()}
    assert len(actual_dist)==app_audit['exactOriginalDistFiles']
    assert all(meta['webFiles'][name]==record for name,record in actual_dist.items())
    observation=next(x for x in findings['reports'] if x['game']==game)
    assert observation['originalStatus']=='failed' and observation['initializationBoundaryCheckOnly']=='blocked_by_initialization_boundary' and observation['gameFailureCauseProven'] is False
    assert len(observation['capabilityObservations'])==2 and all(x['status']=='observed' for x in observation['capabilityObservations'])
    (folder/'macos').mkdir();docs=folder/'docs/macos-delivery';docs.mkdir()
    files=[]
    for name,record in meta['packages'].items():
        assert record=={k:app_audit['packages'][name][k] for k in ('bytes','sha256')}
        assert sig(source/name)==record
        link(source/name,folder/'macos'/name)
        files.append(dict(file='macos/'+name,**record))
    link(source/'build-manifest.json',docs/'original-build-manifest.json')
    link(Path(__file__),docs/'executed-delivery-materialization.py')
    sums=''.join(f['sha256']+'  '+f['file']+'\n' for f in files)
    (folder/'SHA256SUMS.txt').write_text(sums)
    intel_status={'status':'unverified','originalGameQaStatus':'failed','originalInitializationBoundary':'blocked_by_initialization_boundary',
        'originalFullCoverageAssessmentReclassified':False,'sameRunIndependentProbeStatus':'observed_context_loss','gameFailureCauseProven':False,
        'evidence':'../../../../docs/racing-nine/native-readiness/ci-44615880581-attempt-1/intel-findings.json'}
    policy='Universal original bytes may be distributed with three Apple Silicon native/occupied/Rosetta modes verified and explicit Intel graphics unverified. This delivery scope is separate from the original classifier; original failed reports and blocked initialization boundary remain unchanged, and probe context loss does not prove the game failure cause.'
    verification={'schemaVersion':1,'game':game,'status':'original_package_and_apple_silicon_runtime_verified_intel_unverified',
        'sourceCommit':SOURCE,'buildRunId':RUN,'qaSourceCommit':SOURCE,'runtimeRunId':RUN,'runAttempt':1,
        'runtimeExportCommit':ARM_EXPORT,'intelEvidenceExportCommit':INTEL_EXPORT,'originalRunConclusion':'failure',
        'originalPackageBytesUnchanged':True,'binarySha256':binary,'originalInputFilesVerified':app_audit['inputFiles'],
        'currentDistFilesVerified':len(actual_dist),'currentDistMatches':True,'files':files,'runtimeReports':runtime,
        'runtimeReportPathBase':'repository root','packageAudit':'../../../../docs/racing-nine/native-readiness/ci-44615880581-attempt-1/package-source-audit/audit.json',
        'packageAuditManifest':'../../../../docs/racing-nine/native-readiness/ci-44615880581-attempt-1/package-source-audit-manifest.json',
        'originalBuildManifest':'original-build-manifest.json','originalBuildManifestSha256':sig(docs/'original-build-manifest.json')['sha256'],
        'visualReview':'../macos-ci-44615880581-visual-review.json','visualReviewSha256':sig(visual_path)['sha256'],
        'imagesActuallyViewedByNativeAgent':9,'nativeScreenshotPixelSizes':sorted({tuple(x['pngPixels']) for x in visual['observations']}),
        'notNew960x540Or1280x720MacCaptureSet':True,'knownVisualFindings':visual['findings'],
        'deliveryPolicy':policy,'intelNative':intel_status,'realStorageRestartVerified':game=='kart-royale',
        'storageScope':'No declared save keys; storage was not exercised. Only empty-state rehydration and relaunch at a different origin were checked.' if game=='turbo-kart-rush' else 'Actual kr.controls.v1 settings persisted and rehydrated after native quit/relaunch at a different origin.',
        'physicalEsp32Tested':False,'physicalControllerTested':False,'fullGameCompletionTested':False,
        'appleNotarized':False,'signature':'ad-hoc','gameOrClassifierModifiedForDelivery':False,'nativeRerunForDelivery':False}
    write(docs/'verification.json',verification)
    mac={'version':meta['version'],'buildVersion':meta['buildVersion'],'status':'verified_on_apple_silicon_intel_unverified','files':files,
        'sourceCommit':SOURCE,'buildRunId':RUN,'qaSourceCommit':SOURCE,'runtimeRunId':RUN,'runAttempt':1,
        'runtimeExportCommit':ARM_EXPORT,'intelEvidenceExportCommit':INTEL_EXPORT,'architectures':['arm64','x86_64'],
        'minimumMacOS':'11.0','requiredRenderer':'webgl2','signature':'ad-hoc','appleNotarized':False,
        'originalPackageBytesUnchanged':True,'currentDistMatches':True,'originalRunConclusion':'failure',
        'verificationCoverage':{'appleSiliconNative':'passed','appleSiliconOccupiedPort':'passed','appleSiliconRosetta':'passed','intelNative':'unverified'},
        'originalIntelGameQaStatus':'failed','originalIntelInitializationBoundary':'blocked_by_initialization_boundary','gameFailureCauseProven':False,
        'verification':'docs/macos-delivery/verification.json','realStorageRestartVerified':game=='kart-royale',
        'storageStatus':'passed' if game=='kart-royale' else 'not_exercised','physicalEsp32Tested':False,'fullGameCompletionTested':False}
    write(folder/'packages.json',{'schemaVersion':1,'game':game,'android':{'status':'pending'},'macos':mac,'windows':{'status':'pending'},
        'physicalTvTested':False,'physicalEsp32Tested':False,'physicalControllerTested':False})
    zip_file=next(f for f in files if f['file'].endswith('.zip'));dmg=next(f for f in files if f['file'].endswith('.dmg'))
    storage_text='本游戏没有声明持久存档字段；原测试只验证无存档状态下重启与换本地地址后的恢复一致，没有宣称实际存档保存已验。' if game=='turbo-kart-rush' else '原控制设置 `kr.controls.v1` 已完成真实保存、退出和换本地地址重启恢复验证。'
    visual_text='已知界面限制：原三种模式的赛中帮助卡遮住右下小地图上部，暂停展开卡也会盖住背景地图；圈数、计时、完整手柄 ID 和三个暂停按钮仍可见。三张赛中截图均显示 0 km/h，实际驾驶依据原运行记录，不能由静态图推断。' if game=='turbo-kart-rush' else '原三种模式的菜单、手柄 ID、比赛 HUD 和四个暂停按钮清楚可见；Rosetta 的赛中原图有近处赛道墙遮挡部分车身，属于原镜头中的场景遮挡。'
    section=f'''## macOS 下载

0.1.0 Universal：[DMG]({dmg['file']})（{dmg['bytes']:,} 字节）· [ZIP]({zip_file['file']})（{zip_file['bytes']:,} 字节）· [SHA256 校验](SHA256SUMS.txt)。DMG 内应用可拖入 Applications；ZIP 解压后提供相同应用。需要 **macOS 11 或更新版本及 WebGL 2**，包包含 arm64 / x86_64，采用 ad-hoc 签名，未经过 Apple 公证。

Apple Silicon 原生、默认端口占用回退及 Rosetta 三种模式各通过 9 项原 SDK 和实际游戏检查。**Intel Mac 图形运行仍未验证**；Intel 原失败和初始化分类结果保留，独立探针的 context-loss 不能证明游戏失败原因。{storage_text} 未做实体手柄或完整通关测试。

{visual_text} 本次 Mac 原截图为 1024×642／1024×645，浏览器的 960×540／1280×720 布局检查是另一组证据。详情见 [Mac 交付核验](docs/macos-delivery/) 与 [逐张目视记录](docs/macos-ci-44615880581-visual-review.json)。安装文件沿用源码 `6c7cb4fdb99dce236b634c842326bae6aed5f232`、原流程 [44615880581](https://github.com/ecojust/pureTV/actions/runs/44615880581) 的原始字节，未重新打包；Android、Windows 仍待各自验收。

'''
    readme=(folder/'README.md').read_text();position=readme.index('\n| ');readme=readme[:position]+'\n\n'+section+readme[position+1:]
    if game=='turbo-kart-rush':
        readme=readme.replace('当前源码/浏览器验证不代表 Android 4.4 或未测电视可用，也不代表 Android、macOS、Windows 正式安装包已经验收。','macOS 安装包的验证范围见上方；源码/浏览器结果不代表 Android 4.4 或未测电视可用，Android、Windows 仍待各自验收。')
        readme=readme.replace('这些结果不代表平台安装包已经通过。','这些源码检查与上方 macOS 原生结果分别记录，不能据此推断其他平台已通过。')
    else:
        readme=readme.replace('当前是源码适配/浏览器验收阶段，尚无本目录的正式 Android、macOS、Windows 安装包或实体电视验收。原 SDK TCP、三平台原生与浏览器模拟桥接结果将分别保存。','已提供上方 macOS 原包和限定验证范围；Android、Windows 仍待各自验收，实体电视尚未测试。原 SDK TCP、各平台原生与浏览器模拟桥接结果分别保存。')
    (folder/'README.md').write_text(readme)
    (docs/'README.md').write_text(f'''# macOS 0.1.0 原包交付

本目录提供 [交付核验](verification.json) 和逐字节保留的 [原构建清单](original-build-manifest.json)。下载、系统要求与已知界面限制见 [游戏说明](../../README.md)；[包清单](../../packages.json) 和 [校验值](../../SHA256SUMS.txt) 给出相同原件。

原构建及实际游戏流程为 `{RUN}` attempt 1，源码与 QA 源均为 `{SOURCE}`；Apple Silicon 原生、端口占用回退及 Rosetta 各 9 项原检查通过。原包完整闭包审核覆盖本款 {app_audit['inputFiles']} 个输入、ZIP 内 {app_audit['zipAppFiles']} 个应用文件和实际 arm64/x86_64 两个 Mach-O slice。当前 {len(actual_dist)} 个 dist 文件逐字节对应原包资源。没有为本次交付重新编译或运行游戏。

ARM 原证据完整导出为 `{ARM_EXPORT}`（同批 516 文件），Intel 原证据为 `{INTEL_EXPORT}`（同批 309 文件），原流程整体和 Intel 游戏报告仍是 failure。Intel 前后独立探针实际记录 context-loss，但不证明本游戏失败原因；原初始化分类仍 blocked。本次只按三个 Apple Silicon 模式通过且明确 Intel 未验证的范围分发 Universal 原件，不把原分类器判定改为通过。

{storage_text}

原图已由 native-readiness 逐张查看，详见 [九张原图记录](../macos-ci-44615880581-visual-review.json)。{visual_text} 图像尺寸是 1024×642／1024×645，不能把旧浏览器分辨率检查当成本次 Mac 截图或把 FPS 标签当作设备性能实测。

原包从既有 Actions artifact `14575925502` 转存到未发布草稿附件后完整 GET，wrapper 和各包 SHA 保持相同；[原回执](../../../../docs/racing-nine/native-readiness/ci-44615880581-attempt-1/original-package-transfer/original-transfer-receipt.json) 保留完整传递关系。草稿没有发布，游戏根下载采用这里列明的原包；这不是新的 GitHub Release。原始包与完整源码审计见 [审核记录](../../../../docs/racing-nine/native-readiness/ci-44615880581-attempt-1/package-source-audit/audit.json)，原运行摘要见 [ARM 记录](../../../../docs/racing-nine/native-readiness/ci-44615880581-attempt-1/arm-findings.json) 与 [Intel 记录](../../../../docs/racing-nine/native-readiness/ci-44615880581-attempt-1/intel-findings.json)。

未经过 Apple 公证；未做实体手柄或完整通关验证。Android、Windows 的状态单独记录。本次仅建立原包硬链接和交付元数据，没有修改游戏、原报告、截图或分类器。
''')
    for path in [folder/'README.md',docs/'README.md']:
        for dest in re.findall(r'\]\(([^)]+)\)',path.read_text()):
            if '://' not in dest and not dest.startswith('#'):assert (path.parent/dest.split('#')[0]).exists(),(path,dest)
    owned=[folder/'README.md',folder/'packages.json',folder/'SHA256SUMS.txt',*(folder/f['file'] for f in files),*sorted(p for p in docs.rglob('*') if p.is_file())]
    records={p.relative_to(ROOT).as_posix():sig(p) for p in owned}
    preparation={'status':'prepared_in_worktree_not_committed_or_pushed','preparedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'game':game,'sourceRunId':RUN,'sourceCommit':SOURCE,'originalReportsModified':False,'originalClassifierModified':False,
        'packagesHardlinked':True,'packageRecordsAndChecksumsMatchOriginal':True,'currentDistMatchesOriginal':True,
        'readmeLinksExist':True,'threeOriginalArmModesPassed':True,'actualSavedDataExercised':game=='kart-royale',
        'intelGraphicsVerified':False,'gameFailureCauseProven':False,'visualReviewSha256':sig(visual_path)['sha256'],
        'sourceClosureAuditRepeated':False,'nativeRerun':False,'files':records,'scope':'Prepared files only, excluding this preparation record itself. Existing game source and independent evidence are unchanged.'}
    write(docs/'delivery-preparation.json',preparation)
    records[(docs/'delivery-preparation.json').relative_to(ROOT).as_posix()]=sig(docs/'delivery-preparation.json')
    freeze.update(records)
write(Path('/dev/shm/windows-host-tmp/macos-two-freeze.json'),{'status':'stable_for_root_review_commit','games':list(GAMES),'sourceCommit':SOURCE,'sourceRunId':RUN,'files':freeze})
print(json.dumps({'files':len(freeze),'bytes':sum(v['bytes'] for v in freeze.values()),'freeze':'/dev/shm/windows-host-tmp/macos-two-freeze.json','manifestSha256':sig(Path('/dev/shm/windows-host-tmp/macos-two-freeze.json'))['sha256']},indent=2))

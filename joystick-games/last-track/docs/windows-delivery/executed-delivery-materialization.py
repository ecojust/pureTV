from pathlib import Path
import copy, datetime, hashlib, json, os

ROOT=Path('/dev/shm/puretv-submit')
ORIGINAL=Path('/dev/shm/root-windows-four')
SHARED=ROOT/'joystick-games/shared/windows/docs/attempts/44615299245'
SOURCE='6c7cb4fdb99dce236b634c842326bae6aed5f232'
EXPORT='6dc14b79a364dc8679f370f17099e0636acef356'
RUN=44615299245
GAMES=['night-racer','penguintrack','last-track','dirt-crown']

def sig(p):
    b=p.read_bytes()
    return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}

def write(p,v):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def link(src,dst,expected=None):
    assert src.is_file() and not src.is_symlink() and not dst.exists(),str(dst)
    if expected is not None:assert sig(src)==expected
    dst.parent.mkdir(parents=True,exist_ok=True)
    os.link(src,dst)
    assert os.path.samefile(src,dst)

summary=json.loads((ORIGINAL/'summary.json').read_text())
export=json.loads((SHARED/'original-bounded-export/export-manifest.json').read_text())
visual=json.loads((ROOT/'docs/racing-nine/native-readiness/windows-four-independent-visual-review.json').read_text())
materialized={}
for game in GAMES:
    folder=ROOT/'joystick-games'/game
    docs=folder/'docs/windows-delivery'
    assert not docs.exists()
    docs.mkdir()
    audit=summary['games'][game]
    assert audit['sourceCommit']==SOURCE and audit['immutableExportCommit']==EXPORT
    manifest_path=folder/'packages.json'
    before=json.loads(manifest_path.read_text()) if manifest_path.exists() else None
    packages=copy.deepcopy(before) if before else {'schemaVersion':1,'game':game,'android':{'status':'pending'},'macos':{'status':'pending'},'physicalTvTested':False,'physicalEsp32Tested':False,'physicalControllerTested':False}
    release={'schemaVersion':1,'game':game,'version':'0.1.0','sourceCommit':SOURCE,'qaSourceCommit':SOURCE,
        'buildRunId':str(RUN),'runtimeRunId':str(RUN),'runAttempt':1,'exportCommit':EXPORT,
        'packages':audit['packages'],'architecture':'x86_64','minimumWindows':'10 1903',
        'webView2Runtime':'Microsoft Edge WebView2 Evergreen, must be installed','requiredRenderer':'webgl2',
        'authenticodeSigned':False,'payloadMatchesCurrentDist':True,'runtimeChecks':20,
        'runtimeModes':['normal','default-port-occupied'],'realStorageRestartVerified':True,
        'nativeInstallationUninstallationVerified':True,'uninstallPreservesUnrelatedFiles':True,
        'dpiScalesTested':[96],'additionalDpiScalesTested':False,'evidence':'docs/windows-delivery/independent-verification.json',
        'physicalControllerTested':False,'fullGameCompletionTested':False,'originalRunConclusion':'failure',
        'selectedOriginalVerifyJobConclusion':'success','originalExportJobConclusion':'success','packagesRebuilt':False}
    write(folder/'windows-release.json',release)
    packages['windows']=dict(release,files=[dict(file=n,**item) for n,item in audit['packages'].items()],status='verified',verification='docs/windows-delivery/')
    if before:
        assert {k:v for k,v in packages.items() if k!='windows'}=={k:v for k,v in before.items() if k!='windows'}
    write(manifest_path,packages)
    for name,item in audit['packages'].items():
        link(ORIGINAL/'original-files'/('joystick-windows-packages-'+game)/name,folder/name,item)
    sums=folder/'SHA256SUMS.txt'
    old_sums=sums.read_text() if sums.exists() else ''
    if not old_sums and before:
        old_sums=''.join(item['sha256']+'  '+item['file']+'\n' for item in before.get('macos',{}).get('files',[]))
    sums.write_text(old_sums+''.join(item['sha256']+'  '+name+'\n' for name,item in audit['packages'].items()))
    link(ORIGINAL/'audit.py',docs/'executed-original-package-audit.py')
    link(ORIGINAL/(game+'-audit.json'),docs/'original-package-audit.json')
    evidence_name='joystick-windows-evidence-'+game
    evidence=SHARED/'original-bounded-export'/evidence_name
    retained=[]
    for name in ['build-manifest.json','package-verification.json','evidence-manifest.json','runtime-bootstrap/report.json','runtime-normal/report.json','runtime-occupied/report.json']:
        source=evidence/name
        record=sig(source)
        assert record==export['files'][evidence_name+'/'+name]
        target=docs/'original-evidence'/name
        link(source,target,record)
        retained.append(dict(path=target.relative_to(docs).as_posix(),originalExportPath=evidence_name+'/'+name,**record))
    for mode in ['normal','occupied']:
        for item in json.loads((evidence/f'runtime-{mode}/report.json').read_text())['screenshots']:
            name=evidence_name+'/runtime-'+mode+'/'+item['path']
            record={k:item[k] for k in ('bytes','sha256')}
            assert record==export['files'][name]
            target=docs/'original-evidence'/f'runtime-{mode}'/item['path']
            link(ORIGINAL/'original-files'/name,target,record)
            retained.append(dict(path=target.relative_to(docs).as_posix(),originalExportPath=name,**record))
    write(docs/'retained-original-files.json',{'schemaVersion':1,'sourceCommit':SOURCE,'sourceRunId':RUN,'immutableExportCommit':EXPORT,
        'scope':'Selected byte-identical original reports and all twelve original screenshots. This is a subset, not every file listed by evidence-manifest.json.',
        'completeEvidenceIndex':'../../../shared/windows/docs/attempts/44615299245/bounded-report-verification.json',
        'originalExportManifestUrl':'https://raw.githubusercontent.com/ecojust/pureTV/'+EXPORT+'/export-manifest.json',
        'files':retained})
    review_shots=[s for s in visual['screenshots'] if s['path'].startswith(evidence_name+'/')]
    review={'status':'reviewed' if review_shots else 'awaiting_parent_image_review','originalScreenshotsActuallyViewed':review_shots,
            'minimumWindowIsPreconnectionMenu':True,'connectedIdentityImageDimensions':[1280,720],
            'staticImageDoesNotProveMotionOrTemporalLifecycle':True}
    write(docs/'visual-review.json',review)
    verification={'status':'passed','scope':'Original package/source/runtime audit; image review recorded separately.',
        'sourceCommit':SOURCE,'sourceRunId':RUN,'runAttempt':1,'immutableExportCommit':EXPORT,'originalRunConclusion':'failure',
        'selectedOriginalVerifyJobConclusion':'success','originalExportJobConclusion':'success',
        'originalSourceFilesVerifiedAgainstGit':audit['sourceFilesVerified'],'originalPortableAppFilesVerified':audit['portableAppFilesVerified'],
        'binarySha256':audit['binarySha256'],'binaryPeMachine':'AMD64','payloadMatchesCurrentDist':True,'runtimeChecks':20,
        'runtimeModes':['normal','default-port-occupied'],'realStorageRestartVerified':True,'packages':audit['packages'],
        'authenticodeSigned':False,'physicalControllerTested':False,'fullGameCompletionTested':False,'packagesRebuilt':False,
        'gamesRerunForDelivery':False,'dpiScalesTested':[96],'additionalDpiScalesTested':False,
        'sourceAudit':'original-package-audit.json','executedAuditSource':'executed-original-package-audit.py',
        'executedAuditSourceSha256':sig(docs/'executed-original-package-audit.py')['sha256'],
        'retainedEvidence':'retained-original-files.json','visualReview':'visual-review.json',
        'independentAuditReview':'../../../../docs/racing-nine/native-readiness/windows-four-independent-visual-review.json',
        'originalReportsUnchanged':True,'otherPlatformsMetadataUnchanged':True if before else 'no_previous_packages_manifest'}
    write(docs/'independent-verification.json',verification)
    zip_name=next(n for n in audit['packages'] if n.endswith('.zip'))
    exe_name=next(n for n in audit['packages'] if n.endswith('.exe'))
    intro=f"""## Windows 下载

0.1.0 x64：[安装 EXE]({exe_name})（{audit['packages'][exe_name]['bytes']:,} 字节）· [便携 ZIP]({zip_name})（{audit['packages'][zip_name]['bytes']:,} 字节）· [SHA256 校验](SHA256SUMS.txt)。需要 **Windows 10 1903 或更新版本／Windows 11 x64、Microsoft Edge WebView2 Runtime 和可用的 WebGL 2**；便携版请完整解压后运行 `PureTVGame.exe`。安装包未做 Authenticode 签名。

原 Windows CI 的正常端口与占用回退两种模式各通过 10 项检查，包含实际游戏、原 SDK 手柄、失焦／断线取消、存档重启与窗口检查；安装／卸载／重装及无关文件保留也通过。检查覆盖 96 DPI 下 960×540、1280×720，未做其他 DPI 缩放、实体手柄或完整通关测试。同批其他四款失败仍保留，以上结论仅针对本游戏。安装文件沿用原始字节，未重新编译，详见 [Windows 交付记录](docs/windows-delivery/) 和 [版本清单](windows-release.json)。

"""
    readme=folder/'README.md';text=readme.read_text()
    if game=='night-racer':
        old='**目前为源码适配阶段，尚无完成三平台验收的安装包。** 画面比较与来源见[赛车评审](../../docs/racing-nine/reviews/driving/comparison.json)，当前实际输入与画面检查见[验证记录](docs/VERIFICATION.md)。'
        assert old in text
        text=text.replace(old,'已提供下方 Windows 安装包；Android TV 和 macOS 仍待各自验收。画面比较与来源见[赛车评审](../../docs/racing-nine/reviews/driving/comparison.json)，浏览器实际输入与画面检查见[验证记录](docs/VERIFICATION.md)。\n\n'+intro.rstrip())
        text=text.replace('Android TV、macOS 两架构和 Windows 的原 SDK、原生图形、存档与安装包验证仍待完成','Windows 的原 SDK、原生图形、存档与安装包验证见上方；Android TV 与 macOS 仍待各自验收')
    else:
        assert '\n## macOS 下载\n' in text
        text=text.replace('\n## macOS 下载\n','\n'+intro+'## macOS 下载\n',1)
        if game=='penguintrack':text=text.replace('macOS 安装包及有限覆盖范围见上方；Android、Windows 的包与验证分别记录。','macOS、Windows 安装包及各自验证范围见上方；Android 仍待独立验收。')
        if game=='last-track':text=text.replace('macOS 安装包与有限覆盖范围见上方。浏览器、真实 TCP、其他平台安装包及实体设备结果分别记录。','macOS、Windows 安装包与各自验证范围见上方。Android 仍待独立验收；浏览器、真实 TCP 与实体设备结果分别记录。')
        if game=='dirt-crown':text=text.replace('Android、macOS 安装包及验证范围见上方；Windows 仍以独立验收结果为准。','Android、macOS、Windows 安装包及各自验证范围见上方。')
    readme.write_text(text)
    (docs/'README.md').write_text(f"""# Windows 0.1.0 原包交付

[安装 EXE](../../{exe_name})（{audit['packages'][exe_name]['bytes']:,} 字节）与 [便携 ZIP](../../{zip_name})（{audit['packages'][zip_name]['bytes']:,} 字节）均为原始 Windows CI 产物，未重新编译或打包。来源与哈希见 [Windows 清单](../../windows-release.json) 和 [SHA256](../../SHA256SUMS.txt)。需要 Windows 10 1903+／Windows 11 x64、Microsoft Edge WebView2 Runtime 及 WebGL 2；未做 Authenticode 签名。

构建与实际运行来自 [流程 {RUN}](https://github.com/ecojust/pureTV/actions/runs/{RUN})，源码 `{SOURCE}`。本款 `verify ({game})` 成功，正常端口 63485 与占用回退两种模式各 10 项通过，包含原 SDK、实际游戏、暂停/断线/失焦取消、重连不自动继续、真实存档重启。原安装、卸载、重装与无关文件保留检查也通过。96 DPI 下实际窗口为 960×540、1280×720，结束后恢复显示模式。

同批 Ponpoko Kart、Backroad Rally、Turbo Kart Rush、Kart Royale 的原运行仍为失败，整批结论仍为 failure。本次原导出任务成功，四款成功游戏分别保留，不把整批失败改成通过；不可变导出为 `{EXPORT}`。更早 Windows 失败也保留在共享 attempts 目录，本次没有重新运行原包。

原包审计检查本款 {audit['sourceFilesVerified']} 个固定 Git 输入、ZIP 内全部 {audit['portableAppFilesVerified']} 个应用文件、AMD64 PE 身份与当前 dist 对应字节，并绑定原安装和两份运行报告。实际审计脚本为 [executed-original-package-audit.py](executed-original-package-audit.py)，执行结果为 [original-package-audit.json](original-package-audit.json)；独立检查见 [independent-verification.json](independent-verification.json)。脚本中的 scratch 路径记录当时实际执行环境，不能把本文当作新执行结果。

本目录的 [原文件索引](retained-original-files.json) 保存逐字节相同的构建、安装、bootstrap、两模式报告和全部 12 张原截图，是完整证据的子集；原 evidence-manifest 中其余文件可由共享 [原证据核验索引](../../../shared/windows/docs/attempts/44615299245/bounded-report-verification.json) 和固定导出查找。目视范围及具体布局观察见 [visual-review.json](visual-review.json)。960×540 截图为连接前菜单，完整 ID 的目视检查来自 1280×720 赛中、暂停和重连图，未把首屏菜单视为 960 连接卡验证。

尚未测试其他 DPI 缩放、实体手柄或完整通关。Android、macOS 的原包、签名和各自限制保持原记录。开发环境通过硬链接放置原包与证据，Git 提交中的文件字节保持相同。
""")
    materialized[game]={'otherPlatformsBefore':{k:v for k,v in before.items() if k!='windows'} if before else None,'rootFiles':[n for n in audit['packages']]+['packages.json','windows-release.json','SHA256SUMS.txt','README.md'],'hardlinkedPackages':list(audit['packages']),'retainedEvidenceFiles':len(retained)}
write(Path('/dev/shm/windows-host-tmp/windows-four-materialization.json'),materialized)
print(json.dumps({g:{k:v for k,v in x.items() if k!='otherPlatformsBefore'} for g,x in materialized.items()},indent=2))

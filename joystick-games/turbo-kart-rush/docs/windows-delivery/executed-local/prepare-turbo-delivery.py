from pathlib import Path
import hashlib,json,os,struct,datetime
ROOT=Path('/dev/shm/puretv-submit');B=Path(__file__).resolve().parent;G=ROOT/'joystick-games/turbo-kart-rush';D=G/'docs/windows-delivery';D.mkdir(parents=True,exist_ok=True)
def rec(p):data=p.read_bytes();return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def put(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def link(src,dst):
 dst.parent.mkdir(parents=True,exist_ok=True)
 if dst.exists():assert dst.read_bytes()==src.read_bytes()
 else:os.link(src,dst)
for p in (B/'original-turbo-export').rglob('*'):
 if p.is_file():link(p,D/'original-export'/p.relative_to(B/'original-turbo-export'))
for n in ['audit-turbo-package.py','recover-turbo.py','collect-completed.py','frozen-windows-inputs.py','prepare-turbo-delivery.py']:link(B/n,D/'executed-local'/n)
for p in (B/'frozen-reader').rglob('*.py'):link(p,D/'executed-local/frozen-reader'/p.relative_to(B/'frozen-reader'))
for n in ['turbo-export-recovery.json','turbo-independent-package-runtime-verification.json','success-only-selection.json','original-artifacts.json','original-export-ref.json','original-export-tree.json','original-export-manifest.json','completed.json','original-job-log-recovery.json','turbo-kart-rush-original-job.log','export-original-job.log']:
 link(B/n,D/'recovery'/n)
audit=json.loads((B/'turbo-independent-package-runtime-verification.json').read_text());assert audit['status']=='passed';imgs=[]
findings={
 'minimum-window.png':'Actual960x540 initial menu; complete start prompt and connection instructions visible. No controller ID expected before SDK connection.',
 'connected-menu.png':'Actual1280x720 connected title; gamepad icon,1P and full controller ID wrap visibly. Original Start prompt remains unobstructed; TCP63485(normal) or57873(occupied) is displayed.',
 'playing.png':'Actual1280x720 race: player kart, lap1/3, timer, position8th and speed3km/h visible. Full ID wraps to a final single character without clipping. Expanded help overlaps the upper border of the minimap panel; the visible track outline remains readable. Actual acceleration is independently confirmed by original held-state speed/progress and SDK wire.',
 'paused.png':'Pause overlay and Resume/Restart race/Quit to menu remain fully visible. Expanded right connection/help card obscures the background minimap. HUD lap/time/position remain readable.',
 'disconnected.png':'Pause overlay remains. The connected ID row disappears and connection instructions appear; buttons remain visible. Background minimap remains obscured by right help card.',
 'reconnected.png':'Original same ID returns with gamepad icon. The game remains paused and timer matches disconnected image; the three buttons remain visible. Background minimap remains obscured.'}
E=D/'original-export/joystick-windows-evidence-turbo-kart-rush'
for mode in ['normal','occupied']:
 r=json.loads((E/('runtime-'+mode)/'report.json').read_text())
 for s in r['screenshots']:
  p=E/('runtime-'+mode)/s['path'];data=p.read_bytes();w,h=struct.unpack('>II',data[16:24]);imgs.append({'mode':mode,'path':str(p.relative_to(D)),**rec(p),'pixels':[w,h],'actuallyOpenedWithViewImage':True,'finding':findings[p.name]})
visual={'status':'passed_with_known_nonblocking_overlap','reviewer':'racing_review_arcade','reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Individually opened all12 original PNGs with view_image; no image edits or GPU rerun.','images':imgs,'scope':{'minimumMenuPixels':[960,540],'connectedAndGameplayPixels':[1280,720],'windowsDpi':96,'additionalDpiScalesTested':False,'physicalControllerTested':False},'limitations':['Expanded right help card overlaps upper minimap panel border during driving; actual circuit outline remains visible in these two images.','Expanded connection/help card obscures background minimap while paused/disconnected/reconnected; three actionable pause buttons remain clear.','No dedicated real game-save lifecycle was exercised: storageKeys are empty and original storageRestart status is not_exercised.','No full race, full career, other DPI scale, physical Windows controller or television was tested.']}
put(D/'visual-review.json',visual)
verification=dict(audit,visualReview='visual-review.json',visualReviewStatus=visual['status'],originalEvidenceRecovery='recovery/turbo-export-recovery.json',originalReportBytesUnchanged=True,sourceAuditScript='executed-local/audit-turbo-package.py',packagesRebuilt=False,gamesRerunForDelivery=False,dpiScalesTested=[96],additionalDpiScalesTested=False)
put(D/'independent-verification.json',verification)
# Preserve earlier cross-platform metadata before the small Windows-only delivery update.
prior=D/'before-delivery'
for n in ['README.md','packages.json','SHA256SUMS.txt']:
 p=prior/n;p.parent.mkdir(parents=True,exist_ok=True);assert not p.exists();p.write_bytes((G/n).read_bytes())
original_packages=json.loads((G/'packages.json').read_text());original_mac=original_packages['macos'];original_android=original_packages['android']
files=[]
for n,meta in audit['packages'].items():
 src=B/'original-turbo-export/joystick-windows-packages-turbo-kart-rush'/n;assert rec(src)==meta;target=G/'windows'/n;link(src,target);files.append({'file':'windows/'+n,**meta})
release={'schemaVersion':1,'game':'turbo-kart-rush','version':'0.1.0','status':'verified','sourceCommit':audit['sourceCommit'],'qaSourceCommit':audit['sourceCommit'],'buildRunId':str(audit['sourceRunId']),'runtimeRunId':str(audit['sourceRunId']),'runAttempt':1,'exportCommit':audit['immutableExportCommit'],'packages':audit['packages'],'files':files,'architecture':'x86_64','minimumWindows':audit['minimumWindows'],'webView2Runtime':audit['webView2Runtime'],'requiredRenderer':'webgl2','authenticodeSigned':False,'payloadMatchesCurrentDist':True,'runtimeChecks':20,'runtimeModes':['normal','default-port-occupied'],'realStorageRestartVerified':False,'storageStatus':'not_exercised','nativeInstallationUninstallationVerified':True,'uninstallPreservesUnrelatedFiles':True,'dpiScalesTested':[96],'additionalDpiScalesTested':False,'evidence':'docs/windows-delivery/independent-verification.json','physicalControllerTested':False,'fullGameCompletionTested':False,'originalRunConclusion':'failure','selectedOriginalVerifyJobConclusion':'success','originalExportJobConclusion':'success','packagesRebuilt':False}
put(G/'windows-release.json',release);original_packages['windows']=release;put(G/'packages.json',original_packages);now=json.loads((G/'packages.json').read_text());assert now['macos']==original_mac and now['android']==original_android
s=(G/'SHA256SUMS.txt').read_text();assert 'windows/' not in s;s+=''.join(x['sha256']+'  '+x['file']+'\n' for x in files);(G/'SHA256SUMS.txt').write_text(s)
text=(G/'README.md').read_text();assert '## Windows 下载' not in text
section='''## Windows 下载

0.1.0 x64：[安装版 EXE](windows/TurboKartRush-0.1.0-windows-x64-setup.exe)（646,837 字节）· [便携 ZIP](windows/TurboKartRush-0.1.0-windows-x64.zip)（563,888 字节）· [SHA256 校验](SHA256SUMS.txt)。需要 **Windows 10 1903 或更新版本、已安装 Microsoft Edge WebView2 Evergreen 和 WebGL 2**。安装包未作 Authenticode 签名。

原安装、卸载及文件完整性验证通过；默认端口和端口占用回退两种模式各通过10项原 SDK 检查，包括真实加速、转向、暂停、三次最小化恢复和断线重连。**没有验证实际游戏存档保存与恢复**：本游戏没有声明持久存档字段，原报告明确记为 `not_exercised`。未做实体手柄、其他 DPI 缩放或完整通关测试。

12张原截图已逐张核对：最小菜单为960×540，其余为1280×720、96 DPI；两张赛中图显示3 km/h，原始状态和消息记录另证实按住油门后速度、位置变化。展开的帮助卡会叠到赛中小地图面板上沿，路线仍可见；暂停时右侧连接卡会遮住背景地图，但完整 ID、圈数、计时和三个暂停按钮可读。详见 [Windows 交付核验](docs/windows-delivery/independent-verification.json) 与 [原图目视记录](docs/windows-delivery/visual-review.json)。包沿用源码 `039d210cfa4cc65f59adf0859a777f3591853a70`、原流程 [44621752383](https://github.com/ecojust/pureTV/actions/runs/44621752383) 的原始字节，未重新打包；同批其他游戏失败没有改变本游戏原成功结果。

'''
text=text.replace('## macOS 下载',section+'## macOS 下载',1);text=text.replace('Android、Windows 仍待各自验收。','Android 仍待验收；Windows 验证范围见上方。');(G/'README.md').write_text(text)
(D/'README.md').write_text('''# Turbo Kart Rush Windows 原包交付核验

原生产源 `039d210cfa4cc65f59adf0859a777f3591853a70`，run `44621752383` / attempt1，成功任务 `135905037968`；不可变导出 `f559a71e99ff27c8f262ed2a82a70674ee90f9dc`。本地未重建、执行安装包或重跑游戏。

[独立核验](independent-verification.json)核对180个固定源输入、16个便携文件、AMD64可执行文件、当前dist，以及原两模式各10项检查、各205条消息与唯一ACK。原油门步骤在真实语义UP仍按住时达到速度2.61和位置进展，约8秒墙钟后释放，再核两帧全松；没有改游戏时钟或用滑行样本代替输入消费。

[目视记录](visual-review.json)记录实际逐张查看的12张原图和已知地图遮挡。存档状态是 `not_exercised`；空存储重启一致不能当作真实游戏存档通过。原报告、旧失败与此批其他游戏的失败保持原样。普通端口63485，原占用回退57873。

`original-export/`保留完整116个原证据及包文件；`recovery/`保留原API、导出树与SHA核验、实际CLI日志和来源选择；`executed-local/`是本次执行的恢复及只读审核脚本。`before-delivery/`记录修改前跨平台元数据。Windows包仍未Authenticode签名，未做实体手柄或完整通关测试。
''')
changed=[G/'README.md',G/'packages.json',G/'windows-release.json',G/'SHA256SUMS.txt']+[G/x['file'] for x in files];records={str(p.relative_to(ROOT)):rec(p) for p in changed}
put(D/'delivery-preparation.json',{'status':'ready_for_root_review','originalWindowsPackagesUnchanged':True,'rootDeliveryFiles':records,'otherPlatformMetadataPreserved':{'macos':True,'android':True},'originalSourceInputsVerified':180,'originalAppFilesVerified':16,'runtimeChecks':20,'realStorageRestartVerified':False,'visualImagesActuallyViewed':12,'originalRunConclusion':'failure','selectedGameConclusion':'success','originalExportConclusion':'success','rootCommitOrPushPerformed':False})
freeze={str(p.relative_to(ROOT)):rec(p) for p in D.rglob('*') if p.is_file()};freeze.update(records);put(B/'turbo-delivery-freeze.json',{'status':'frozen_ready_for_review','files':freeze});print(json.dumps({'rootFiles':len(records),'allFiles':len(freeze),'bytes':sum(x['bytes'] for x in freeze.values())}))

from pathlib import Path
import json,hashlib,os,datetime
ROOT=Path('/dev/shm/puretv-submit');G=ROOT/'joystick-games/penguintrack';D=G/'docs/android-delivery';S=Path(__file__).parent
QA='3cf2452db9853a3a189c47342a291f046e411b5a';SRC='c5ad63e8c6a0ccfada5f763d1d26afa27f45002e';EXP='111c827624d21b4149079a4d9b453d29d7d4a7b6';OLD='35fca55f5a05d38785fb531004eca9add6913f04'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text())
def write(p,text):
 tmp=p.with_name(p.name+'.pending');tmp.write_text(text);tmp.replace(p)
def save(p,j):write(p,json.dumps(j,ensure_ascii=False,indent=2)+'\n')
def link(a,b):
 b.parent.mkdir(parents=True,exist_ok=True)
 if b.exists():assert a.read_bytes()==b.read_bytes()
 else:os.link(a,b)
for name in ['prepare-delivery.py','finalize-delivery.py']:link(S/name,D/name)
for name in ['20261119T232319Z-run.json','20261119T232319Z-jobs.json','export-ref.json','latest.json']:
 link(S/name,D/'recovery'/name)
run=read(S/'20261119T232319Z-run.json');jobs=read(S/'20261119T232319Z-jobs.json');assert run['id']==44634808045 and run['run_attempt']==1 and run['head_sha']==QA and run['conclusion']=='success'
assert {j['id'] for j in jobs['jobs']}=={135950471714,135950911514,135958044881} and all(j['conclusion']=='success' for j in jobs['jobs'])
audit=read(D/'verification.json')
visual={'scope':'All 14 original PNGs were individually displayed and visually reviewed; video scope is eight separately extracted original frames plus full decode, not continuous human playback.','originalImages':[],'videoSamples':[], 'resolution':{'pngPixels':[1920,1080],'observedWebPageCss':[960,540],'separate1280CssAndroidRunPerformed':False},'limitations':['Original Android touch Brake control overlaps part of the speedometer and gear display; bottom controller legend crosses lower touch controls. Central driving view and full controller ID remain legible.','Paused overlays show retained speed values; only the original read-only repeated tick/time/position observations establish paused model stability.','Videos are limited to about 180 seconds by the original screenrecord command and do not cover the late busy/focus/disconnect/reconnect checks; those use original reports and PNGs.','No full career/track completion, storage restart, physical TV or physical ESP32 was verified.'],'manualPixelReviewRequired':False,'noMaterialBlockForControllerAcceptance':True}
notes={
'connected.png':'Original menu and Play button visible. Full primary controller ID wraps inside its card with readable port. No clipped ID.',
'playing.png':'First Flakes A01 race visibly renders red kart, snowy road/trees/mountains and minimap; full controller ID below minimap. Original touch Brake overlaps part of speedometer. Screenshot alone is not a motion/performance measurement.',
'paused.png':'Paused panel and Resume/Restart/Settings/Quit plus ghost choices are readable; primary full ID remains visible. Inactive minimap partly covered by expanded controller panel.',
'second-rejected.png':'Paused screen retains only original primary ID/card; no second client card. Actual rejection is independently established by original busy wire response.',
'focus-restored-paused.png':'Actual paused screen after focus return; primary full ID visible and menu legible.',
'disconnected.png':'ID card is absent, discovery instruction and host port remain visible, paused panel remains open.',
'reconnected.png':'Same full original primary ID returns; paused panel remains open.'}
for mode in audit['modes']:
 for c in mode['captures']:
  visual['originalImages'].append({'path':'original-export/evidence/joystick-android-runtime-penguintrack/penguintrack-'+mode['mode']+'/'+c['path'],'mode':mode['mode'],'bytes':c['bytes'],'sha256':c['sha256'],'width':1920,'height':1080,'actuallyViewed':True,'observation':notes[c['path']],'controllerId':mode['controllerId'] if c['path']!='disconnected.png' else None})
for mode,observations in {'normal':{5:'Connected original menu, Controller focus outlined; full ID/TCP63485.',60:'Actual First Flakes driving view; red kart/road/checkpoint/minimap visible; HUD109km/h, timer0:24.39. Touch Brake overlaps lower speedometer.',120:'Paused First Flakes, Resume focus, full primary ID, retained HUD70km/h.',175:'Paused original ghost control Best AI focused, primary ID; HUD44km/h retained.'},'occupied':{5:'Connected original menu, Controller focus outlined; full ID/TCP41323 fallback.',60:'First Flakes driving view visibly renders red kart/snowroad; HUD70km/h, timer0:31.71; minimap/fullID visible.',120:'Paused First Flakes, Resume focus, full primary ID and fallback port; HUD8km/h retained.',175:'Paused First Flakes, Resume focus, full primary ID and fallback port; HUD1km/h retained.'}}.items():
 for sec,note in observations.items():
  p=D/'video-review'/f'{mode}-{sec}s.png';visual['videoSamples'].append({'path':str(p.relative_to(D)),'mode':mode,'requestedSeconds':sec,'sha256':sha(p),'bytes':p.stat().st_size,'actuallyViewed':True,'observation':note})
save(D/'visual-review.json',visual)
android={'file':'penguintrack-0.1.0.apk','bytes':2342332,'sha256':'e1f9aa255413819bda917543c2d2258dd685a8eff61f982f26a98dfcfc827827','packageName':'com.ecojust.joystick.penguintrack','versionName':'0.1.0','versionCode':1,'status':'verified','sourceCommit':SRC,'buildRunId':44606071748,'runAttempt':1,'exportCommit':OLD,'certificateSha256':'eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23','minAndroidApi':26,'requiredRenderer':'webgl2','nativeRuntimePassed':True,'qaSourceCommit':QA,'qaRunId':44634808045,'qaRunAttempt':1,'qaExportCommit':EXP,'originalSignedApkUnchanged':True,'modes':['normal','default-port-occupied'],'checksPerMode':56,'acceptedSdkMessagesAndUniqueAcks':{'normal':602,'occupied':598},'verification':'docs/android-delivery/README.md','videoScope':'Original ~180-second recordings include menu, actual first-track driving and pause/ghost control; late busy/focus/disconnect/reconnect are outside the recording and retained as original reports/PNGs.','storagePersistenceScenarioTested':False,'savedPreferenceObserved':True,'fullCareerCompleted':False,'physicalTvTested':False,'physicalEsp32Tested':False,'oldProductionRuntimeFailurePreserved':True,'visualLimitations':['Original touch Brake partly overlaps speedometer; controller driving view and full ID remain visible.']}
meta=read(D/'previous-packages.json');meta['android']=android;save(G/'packages.json',meta);assert all(meta[x]==read(D/'previous-packages.json')[x] for x in ['macos','windows'])
save(G/'android-release.json',{'schemaVersion':1,'game':'penguintrack',**android,'packageAudit':'docs/android-original-packages-44606071748-44606074787/report.json','runtimeAudit':'docs/android-delivery/verification.json','visualReview':'docs/android-delivery/visual-review.json','packageRebuilt':False,'packageResigned':False,'githubReleaseCreated':False,'marketUploaded':False})
oldread=(D/'previous-README.md').read_text();section='''## Android TV 下载

0.1.0：[签名 APK](penguintrack-0.1.0.apk)（2,342,332 字节）· [SHA256 校验](SHA256SUMS.txt) · [包与验收记录](android-release.json)。需要 **Android 8.0 / API 26 或更新版本，以及支持 WebGL 2 的系统 WebView**；不支持 Android 4.4/6 的旧 WebView。

正常端口和端口占用回退两种 Android 模式各通过 56 项原生检查，包括实际首条赛道驾驶、九键原 SDK 输入、客户端 ID、暂停、失焦和断线取消、重连后手动恢复；两模式分别核对 602 / 598 条唯一 ACK。安装包沿用原固定证书字节，未重新构建或签名。原菜单路线失败记录保留，见 [Android 交付说明及原始录像](docs/android-delivery/)。

原生检查在模拟器完成，未验证实体电视／ESP32、完整通关或退出应用后的存档恢复。原版触屏 Brake 按钮会遮住部分速度表；手柄操控和中央赛道画面可见。

'''
assert '## Android TV 下载' not in oldread
newread=oldread.replace('## Windows 下载',section+'## Windows 下载',1).replace('macOS、Windows 安装包及各自验证范围见上方；Android 仍待独立验收。','Android、macOS、Windows 安装包及各自验证范围见上方。')
write(G/'README.md',newread)
oldsum=(D/'previous-SHA256SUMS.txt').read_text();assert 'penguintrack-0.1.0.apk' not in oldsum;write(G/'SHA256SUMS.txt',oldsum+android['sha256']+'  penguintrack-0.1.0.apk\n')
readme='''# Penguintrack Android 原包交付核验

本次原流程 [44634808045](https://github.com/ecojust/pureTV/actions/runs/44634808045) 的 `normal`、`occupied` 两种模式各 **56 项检查全部通过**。QA 源 `3cf2452db9853a3a189c47342a291f046e411b5a`，attempt 1，原导出 `111c827624d21b4149079a4d9b453d29d7d4a7b6`。未写模型、改时钟或重签游戏。

安装包来自原源 `c5ad63e8c6a0ccfada5f763d1d26afa27f45002e`、原构建/签名流程 `44606071748` attempt 1、原导出 `35fca55f5a05d38785fb531004eca9add6913f04`。APK 2,342,332 字节，SHA256 `e1f9aa255413819bda917543c2d2258dd685a8eff61f982f26a98dfcfc827827`。既有[原包独立审计](../android-original-packages-44606071748-44606074787/report.json)覆盖固定证书、442 源输入和 156 资产；本次原生 preflight 再确认 422 个生产输入不变、包和 Observer 原字节复用。当前交付核对实际本地 APK 的 Git blob、全部 162 内容条目与签名回执，并对当前 151 个直接 dist 文件逐字节核验。没有重跑签名工具，也未重新下载完整大导出。

正常端口为 63485，占用回退为 41323。原 wire 分别含 602 / 598 条被接纳 SDK 消息及同连接唯一 ACK，第二客户端的 10 条消息分别以明确 busy 响应单列。唯一新增短菜单操作 DOWN 的实际 wire 持键为 17.149778 / 15.758334 ms，随后全松并在同会话取得两个后续新鲜 Play 样本；UP 顶部归一化与驾驶长按保持原样。18 个计划步骤的原 before/after 谓词重新核对通过。

真实驾驶覆盖 First Flakes 首条赛道油门、左右转向、制动、镜头、检查点重生、暂停、正常偏好写入、明确恢复与继续驾驶。九键独立观察、第二客户端拒绝、失焦/断线取消、相同 ID 重连和旧 START 同步不恢复亦通过。虽然计划写有 storageRestartRequired，旧 c5 Android runner **没有执行存档重启场景**；只观察到自然保存偏好，不能声称退出应用后恢复通过。未完整通关、未测试实体电视或实体 ESP32。

已逐张查看 14 张原 PNG（1920×1080，原网页 CSS 960×540）；比赛雪地/赛车/小地图可见，完整 ID 换行显示在卡片内。暂停画面可能保留非零速度 HUD，模型冻结依据原连续只读快照。原版 Android 触屏 Brake 覆盖部分速度表，底部操作提示与触控区域相交；手柄 ID 与中央驾驶画面仍可读。未新增独立 1280 CSS Android 测试。

[正常模式原录像](original-export/evidence/joystick-android-runtime-penguintrack/penguintrack-normal/controller-gameplay.mp4) 与 [占用回退原录像](original-export/evidence/joystick-android-runtime-penguintrack/penguintrack-occupied/controller-gameplay.mp4) 均完整解码通过，分别约 180.005 / 180.057 秒。实际查看每段 5 / 60 / 120 / 175 秒抽帧，包含菜单、真实首赛道驾驶及暂停/ghost 控件；并未逐帧人工播放。原 screenrecord 限制 180 秒，因此 **不覆盖后段 busy、失焦、断线和重连检查**，后段由原 PNG、wire 和报告证明。录像容器帧率不作为游戏/电视性能结论。

- [交付核验与原谓词/ACK](verification.json)
- [逐图及录像抽帧观察](visual-review.json) · [完整录像解码记录](video-review/verification.json)
- [正常原报告](original-export/evidence/joystick-android-runtime-penguintrack/penguintrack-normal/report.json) · [占用回退原报告](original-export/evidence/joystick-android-runtime-penguintrack/penguintrack-occupied/report.json)
- [原包复用 preflight](original-export/evidence/joystick-android-runtime-penguintrack/penguintrack/verified-inputs/input-verification.json)
- [前次 v1 失败](../android-runtime-44630032256/) · [DOWN 修正来源及独审](../android-down-menu-tap-attempt-1/)

`original-export/` 仅保留本次所需 52 个原导出文件，35,194,745 字节，全部逐 Git blob、SHA256 与原 manifest 验证。未复制原1008项大归档，也未改变原报告。首次媒体恢复因合法零字节 screenrecord.log 被工具拒绝，失败日志保留；第二次严格验证成功。初次原 job log 获取尚未可用的失败也保留，流程完成后另取成功原日志。Mac、Windows 元数据及已有包不变；本步骤不创建 GitHub Release、不上架市场，公开提交由主任务完成。
'''
write(D/'README.md',readme)
# The package metadata objects and every existing platform checksum line remain unchanged.
assert read(G/'packages.json')['macos']==read(D/'previous-packages.json')['macos'] and read(G/'packages.json')['windows']==read(D/'previous-packages.json')['windows']
assert (G/'SHA256SUMS.txt').read_text().startswith((D/'previous-SHA256SUMS.txt').read_text())
assert (D/'previous-README.md').read_text()==oldread
print('metadata and visual scope prepared')

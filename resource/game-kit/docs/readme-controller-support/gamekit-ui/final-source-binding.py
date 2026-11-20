from pathlib import Path
import importlib.util,hashlib,json,difflib
ROOT=Path('/dev/shm/puretv-controller-games');OUT=Path('/dev/shm/controller-gamekit-ui');sha=lambda b:hashlib.sha256(b).hexdigest()
spec=importlib.util.spec_from_file_location('builder',ROOT/'resource/game-kit/build.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
old_runtime=(OUT/'attempt-3/twenty-four/assets/runtime.js').read_text();current_runtime=(ROOT/'resource/game-kit/web/runtime.js').read_text()
expected=old_runtime.replace("text('已连接 · START 开始或暂停','Connected · START starts or pauses'):wifi.state==='available'?text('同网，按搜索键连接','Same Wi-Fi · press Search'):wifi.port>0?text('自动发现暂不可用，可填写下方地址直连。','Discovery unavailable; connect directly using the address below.'):text('手柄服务暂不可用，仍可扫码或使用遥控器。','Controller service unavailable; QR and TV remote remain available.')", "text('已连接 · START 开始或暂停','Connected · START: play/pause'):wifi.state==='available'?text('同网，按搜索键连接','Same Wi-Fi · press Search'):wifi.port>0?(wifi.state==='registering'?text('正在发布，可用地址直连','Publishing · direct IP ready'):text('发现不可用，请用地址直连','No discovery · use IP below')):text('服务未启动，请用扫码/遥控','Offline · use QR or remote')")
assert expected==current_runtime,'Runtime changed beyond reviewed status rendering'
old_css=(OUT/'attempt-3/twenty-four/assets/tv.css').read_text();current_css=(ROOT/'resource/game-kit/web/tv.css').read_text()
anchor='.wifi-help code{display:block;font-size:10px;overflow-wrap:anywhere;margin-top:3px;color:#f2f8fb}\n'
assert old_css.replace(anchor,anchor+'/* Vertical rails may scroll their extra tips without hiding connection help. */\nbody .app .workspace>aside:not(.controller-strip){overflow-y:auto}\n')==current_css,'CSS changed beyond vertical scroll correction'
(OUT/'targeted-followup-runtime.diff').write_text(''.join(difflib.unified_diff(old_runtime.splitlines(True),current_runtime.splitlines(True),fromfile='18-case-ui/runtime.js',tofile='final/runtime.js')))
(OUT/'targeted-followup-tv-css.diff').write_text(''.join(difflib.unified_diff(old_css.splitlines(True),current_css.splitlines(True),fromfile='18-case-ui/tv.css',tofile='final/tv.css')))
rows=[]
for slug in ['twenty-four','torch-bridge','tower-overlap','packing-sculptor','conveyor-window','glass-fold','tension-span','prism-relay','neon-rush']:
 source='attempt-4' if slug=='glass-fold' else 'attempt-3';prior=OUT/source/slug/'assets';current=m.payload(ROOT/'resource/apps'/slug);final=OUT/'final-payload'/slug;final.mkdir(parents=True)
 assert set(current)=={p.name for p in prior.iterdir() if p.is_file()}
 changed=[]
 for name,data in current.items():
  (final/name).write_bytes(data)
  if (prior/name).read_bytes()!=data:changed.append(name)
 assert set(changed)=={'runtime.js','tv.css'},(slug,changed)
 rows.append({'game':slug,'ordinaryInputAndScreenshots':source+'/'+slug,'changedSinceThatUiRun':changed,'allOtherPayloadBytesMatch':True,'finalPayloadSha256':{name:sha(data) for name,data in sorted(current.items())}})
files=['resource/game-kit/build.py','resource/game-kit/web/runtime.js','resource/game-kit/web/tv.css','resource/game-kit/web/tv.html','resource/game-kit/android/src/main/java/com/ecojust/gamekit/MainActivity.java','resource/game-kit/android/src/main/java/com/ecojust/gamekit/WifiControllerServer.java','resource/game-kit/android/src/main/java/com/ecojust/gamekit/WifiControllerDiscovery.java','resource/apps/glass-fold/src/main/assets/game-theme.css','resource/apps/neon-rush/source/game.mjs','resource/apps/neon-rush/src/main/assets/game.js','resource/game-kit/qa/common.mjs','resource/game-kit/qa/readme-controller-ui.mjs']
report={'passed':True,'scope':'9 ordinary-input UI cases reused at exact payload bytes except two explicitly asserted display-only changes; targeted follow-ups validate short intermediate/error status messages and actual vertical scrolling. No claim that the 18-case raw report ran the final byte-for-byte runtime/CSS.','sourceSha256':{f:sha((ROOT/f).read_bytes()) for f in files},'games':rows,'scriptSha256':sha(Path(__file__).read_bytes())}
(OUT/'final-source-binding.json').write_text(json.dumps(report,indent=2)+'\n');print('Bound all 9 payloads; only reviewed display-only changes differ from normal-input runs')

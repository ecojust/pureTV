from pathlib import Path
import shutil,json,hashlib,datetime
root=Path('/dev/shm/puretv-controller-games');src=Path('/dev/shm/controller-gamekit-ui');out=root/'resource/game-kit/docs/readme-controller-support/gamekit-ui';out.mkdir(parents=True,exist_ok=False)
items=['setup-attempt-1','attempt-1.log','attempt-2','attempt-2.log','attempt-3','attempt-3.log','attempt-4','attempt-4.log','scroll-and-visibility','scroll-and-visibility.log','scroll-and-visibility-attempt-2','scroll-and-visibility-attempt-2.log','wifi-status-layout','wifi-status-layout.log','final-scroll-assets','final-payload','QrFixture.java','qr-fixture.png','model-reuse-audit.py','model-reuse.json','final-source-binding.py','final-source-binding.json','targeted-followup-runtime.diff','targeted-followup-tv-css.diff']
for item in items:
 p=src/item
 if p.is_dir():shutil.copytree(p,out/item)
 else:shutil.copy2(p,out/item)
shutil.copy2(__file__,out/'archive-evidence.py')
source=json.loads((src/'final-source-binding.json').read_text())['sourceSha256']
for rel in source:
 target=out/'final-sources'/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/rel,target)
menus=[]
for game in ['twenty-four','torch-bridge','tower-overlap','packing-sculptor','conveyor-window','glass-fold','tension-span','prism-relay','neon-rush']:
 attempt='attempt-4' if game=='glass-fold' else 'attempt-3'
 menus.extend([f'{attempt}/{game}/{size}-menu.png' for size in [960,1280]])
representative=['attempt-3/twenty-four/960-playing.png','attempt-3/torch-bridge/960-paused.png','attempt-3/tower-overlap/960-playing.png','attempt-3/packing-sculptor/960-paused.png','attempt-3/conveyor-window/960-playing.png','attempt-3/glass-fold/960-playing.png','attempt-3/glass-fold/1280-playing.png','attempt-3/tension-span/960-paused.png','attempt-3/prism-relay/960-playing.png','attempt-3/neon-rush/960-playing.png','attempt-3/neon-rush/960-paused.png']
review={'passed':True,'method':'Screenshots individually inspected in view_image; bounding rectangles and text ranges checked by browser scripts. No screenshot edits.','reviewedFinalMenuScreenshots':menus,'reviewedRepresentativePlayingOrPaused':representative,'notes':['All 9 themes preserve their distinct original layout. New connection help and START/A/B aliases are readable at both resolutions.','Glass full-screen menu backdrop in attempt-3 was rejected because it blurred connection and QR help; attempt-4 restricts the backdrop to the arena and leaves connection instructions visible.','Packing and Prism 960 initially had 11px and 32px of clipped tip content. First actual wheel test exposed overflow:hidden. Final scoped vertical overflow-y:auto correction is proven with mouse wheel in scroll-and-visibility-attempt-2. Primary controls and Wi-Fi address remain visible before scrolling.','Neon intentionally hides its sidebar during racing; the menu and pause panel expose QR and Wi-Fi help.','Four long-status screenshots also visually reviewed: twenty-four/en-unavailable, twenty-four/en-stopped, prism-relay/en-registering and prism-relay/zh-unavailable in wifi-status-layout. All 12 status cases include strict card text vertical and horizontal boundary assertions.']}
(out/'visual-review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
failed={'passed':False,'scope':'Partial visual rejection of attempt-3; not a rewrite of its automated report.','cases':['glass-fold 960x540 menu','glass-fold 1280x720 menu'],'finding':'The inherited full-screen blur obscured QR and Wi-Fi instructions in the menu. Corrected theme and 2-case normal-input rerun are in attempt-4.'}
(out/'attempt-3'/'visual-review-glass-failed.json').write_text(json.dumps(failed,ensure_ascii=False,indent=2)+'\n')
verify={'status':'passed','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'physicalTvTested':False,'physicalEsp32Tested':False,'gameStateWrites':False,'clockWrites':False,'ordinaryInputUniqueCases':18,'ordinaryInputGames':9,'ordinaryInputResolutions':['960x540','1280x720'],'ordinaryInputReports':['attempt-3/report.json','attempt-4/report.json'],'finalSelection':'attempt-3 except glass-fold, for which attempt-4 supersedes its menu/playing/paused cases','targetedNativeStatusCases':12,'targetedNativeStatusReport':'wifi-status-layout/report.json','scrollAndOverlayCases':3,'scrollAndOverlayReport':'scroll-and-visibility-attempt-2/report.json','unchangedRuleModels':9,'ruleReuseReport':'model-reuse.json','sourceBinding':'final-source-binding.json','limits':['Native metadata and connection are browser fixtures. The separate official SDK/TCP suite covers actual wire transport.','The final status-string and vertical-scroll changes occurred after the 18 normal-input UI cases; final-source-binding asserts their exact limited diff, and targeted reports cover them.','Native MainActivity lifecycle tests still require Android/Robolectric CI; this UI evidence does not claim they ran.','Old preflight source snapshots and receipts retain their original hashes; they are not rewritten to imply final source coverage.']}
for report in ['attempt-3/report.json','attempt-4/report.json','wifi-status-layout/report.json','scroll-and-visibility-attempt-2/report.json','model-reuse.json','final-source-binding.json']:assert json.loads((out/report).read_text())['passed'] is True
(out/'verification.json').write_text(json.dumps(verify,ensure_ascii=False,indent=2)+'\n')
(out/'README.md').write_text('''# Game Kit controller UI regression

Nine README games were checked in Chromium at 960×540 and 1280×720. All 18 final cases select level 2, start, and pause through normal keyboard input. No game model, clock, renderer, or gameplay state was written by these tests. Native connection metadata is an explicit fixture, not physical television or ESP32 evidence.

- `attempt-3/` contains the 18-case ordinary-input run and unedited screenshots. Glass Fold menu blur was rejected after visual review; its two final cases come from `attempt-4/`.
- `wifi-status-layout/` contains 12 Chinese/English registering, discovery-unavailable, and stopped states on one horizontal and one vertical rail at 960×540. Text ranges must stay within the visible card; stopped services show no stale address.
- `scroll-and-visibility-attempt-2/` proves actual mouse-wheel scrolling in Packing Sculptor and Prism Relay, and proves Glass Fold's connection help is above the menu backdrop. Corresponding final assets are in `final-scroll-assets/`.
- `model-reuse.json` binds the eight unchanged puzzle rule models to their previous signed APKs and prior verification. Neon rules match the already verified macOS 0.1.3 steering fix; the older Android 0.1.1 model is not reused.
- `final-source-binding.json` binds all nine current payloads to the ordinary-input run. The only later differences are the reviewed status wording and one vertical scrolling rule; their exact diffs and targeted tests are included. `final-payload/` and `final-sources/` preserve the final bytes.

Failure history is retained: setup attempt 1 imported a nonexistent helper; attempt 2's first assertions missed a clipped Wi-Fi card; attempt 3's Glass Fold fullscreen backdrop blurred connection help; the first actual scroll check found inherited `overflow:hidden`. Raw reports are unchanged, with separate visual-rejection supplements where appropriate.

`visual-review.json` lists the screenshots actually inspected. `verification.json` summarizes coverage and limits. Each run includes its executed script, asset hashes, and stdout. The ordinary-input runner is also maintained at `resource/game-kit/qa/readme-controller-ui.mjs`.

Reproduction uses Chromium plus the Node dependencies exposed through `PURETV_PACKAGE`, for example:

```sh
TMPDIR=/dev/shm/neon-chrome-temp PURETV_PACKAGE=/dev/shm/puretv-market-sync/desktop/package.json node resource/game-kit/qa/readme-controller-ui.mjs --output /dev/shm/new-gamekit-ui-attempt --qr /path/to/qr-fixture.png
```

All build/test output was written under `/dev/shm`; scripts retain the original execution paths for provenance. `QrFixture.java` generated the actual QR from its documented fixture URL. The archive's scripts are evidence of the original invocation, not promises of portable absolute paths. Native TCP/lifecycle preflight is documented separately in `../preflight/` and final Android validation belongs to the release CI.
''')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
(out/'artifacts.json').write_text(json.dumps({str(p.relative_to(out)):sha(p) for p in sorted(out.rglob('*')) if p.is_file() and p.name!='artifacts.json'},indent=2)+'\n')
print(out)

from pathlib import Path
import json,hashlib,shutil
R=Path('/dev/shm/puretv-controller-games');S=Path('/dev/shm/gamekit-english-preview-final');O=R/'resource/game-kit/docs/readme-controller-support/gamekit-ui/english-preview-final';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
r=json.loads((S/'report.json').read_text());assert r['passed'] and len(r['cases'])==9 and all(x['passed'] for x in r['cases']);assert r['scriptSha256']==sha(S/'capture.mjs')
review={'passed':True,'method':'Each of the nine original 1280x720 screenshots was individually inspected with view_image after capture. No image edits or overlays.','scope':'Menu preview only, not new gameplay or Android execution acceptance.','checks':['Primary action and level choices visible','Complete QR and actual-shaped Wi-Fi address/status visible','No cropped control text or overflow in the displayed menu','Distinct game themes retained','Eight Chinese game UIs remain Chinese; only their existing Wi-Fi instructions are English','Neon English selected via two normal language-button clicks (English to Chinese to English)'],'reviewed':[{'file':x['screenshot'],'sha256':x['screenshotSha256'],'passed':True} for x in r['cases']]}
(S/'visual-review.json').write_text(json.dumps(review,indent=2)+'\n')
manifest={'sourceSha':r['sourceSha'],'nativeBridge':'synthetic browser fixture, available on 192.168.1.50:63485; not a physical TV','allBrowserAssetsEqualReleaseSignedApks':True,'binding':'apk-asset-binding.json','report':'report.json','visualReview':'visual-review.json','images':[{'id':x['game'],'version':x['version'],'file':x['screenshot'],'sha256':x['screenshotSha256'],'languageScope':x['languageScope']} for x in r['cases']]}
(S/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(S/'README.md').write_text('''# Final English-gallery menu previews

Nine 1280×720 Chromium menu screenshots use the exact assets from the release-signed APKs built from `a657ce24fc4c0c5adb07a671adabb3ce604f68f8`. `apk-asset-binding.json` compares every served asset byte with each APK and links its existing signing-verification receipt. The browser receives an explicitly synthetic native bridge in the ordinary available/disconnected state. These are browser previews, not Android or physical-TV execution evidence.

Eight puzzle games retain their actual Chinese title, rules, controls, and game content. Their existing pureTV Wi-Fi instruction card uses English. Neon Rush provides a full English UI; the script exercises its normal language button (English → Chinese → English) before capture. No screenshot text is replaced or translated after rendering.

This is a menu-only capture: all games remain at level 0, phase menu, tick 0. No model or clock writes occur, and gameplay acceptance is not repeated. `report.json` preserves the raw capture result, source/asset hashes, geometry, snapshots, and inputs; `visual-review.json` records individual inspection of all nine unedited images. `manifest.json` lists the image paths and SHA256 values for the gallery update.

The exact scripts and common helper are included. They retain the original `/dev/shm` execution paths for provenance. The served assets are archived in `../final-payload/<game>/`; the QR fixture is genuine but points to the synthetic LAN example. Chromium and all page contexts exited normally after capture. Existing gameplay/UI evidence remains unchanged.
''')
shutil.copytree(S,O)
artifacts={str(p.relative_to(O)):sha(p) for p in sorted(O.rglob('*')) if p.is_file()}
(O/'artifacts.json').write_text(json.dumps(artifacts,indent=2)+'\n')
for n,h in artifacts.items():assert sha(O/n)==h,n
print('Archived',len(artifacts),'files to',O)

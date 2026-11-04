import hashlib, json, subprocess
from pathlib import Path
P=Path('/workspace/scratch/physics-021/final-qa/tension-span')
A=P/'executed-source-01'
F=Path('/workspace/scratch/physics-021/frozen/tension-span/assets')
R=Path('/workspace/pureTV')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p): return json.loads((P/p).read_text())
def write(p,d): (P/p).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
s=read('executed-source-01/source-hashes.json'); b=read('browser-01/report.json'); q=read('shared-01/report.json'); r=read('recording-01/recording.json'); v=read('recording-01/video-validation.json'); g=read('recorded-goals-01.json'); frames=read('video-review-01/frames.json')
assert s['sourceCommit']=='71677da57aa00c3dbcb140a2812c0f801338365d'
actual={str(p.relative_to(F)):sha(p) for p in sorted(F.rglob('*')) if p.is_file()}
assert len(actual)==12
assert actual==s['assetHashes']==b['assets']==q['sourceAssetHashes']==r['sourceAssetHashes']
for path,h in s['files'].items():
 assert sha(A/path)==h,path
 assert hashlib.sha256(subprocess.check_output(['git','show',s['sourceCommit']+':'+path],cwd=R)).hexdigest()==h,path
 assert sha(R/path)==h,path
post=read('executed-source-01/postchecks-source-hashes.json')
for path,h in post['files'].items(): assert sha(A/path)==h,path
assert b['passed'] and len(b['checks'])==2 and all(x['passed'] for x in b['checks'])
assert len(q['tests'])==10 and all(x['passed'] for x in q['tests']) and q['sharedRegressionPassed']
assert all(v['checks'].values()) and not r['errors'] and not r['consoleErrors'] and not r['network']
assert sha(P/'recording-01/gameplay.mp4')==r['videoSha256']==v['video']['sha256']==frames['sourceVideoSha256']
assert sha(P/'recording-01/recording.json')==g['recordingSha256']
assert g['passed'] and g['recordedWonLevelsZeroBased']==list(range(6))
for f in frames['frames']: assert sha(Path(f['file']))==f['sha256']
failed=any(x['state']['model']['difficulty']==0 and x['state']['model']['mode']=='test-failed' for x in r['states'])
repaired=any(x['state']['model']['difficulty']==0 and x['state']['model']['phase']=='won' and x['state']['model']['attempts']==2 for x in r['states'])
assert failed and repaired
review={
 'sourceCommit':s['sourceCommit'],'kind':'manual-encoded-frame-visual-review','accepted':True,
 'sourceVideoSha256':r['videoSha256'],'reviewed':frames['frames'],
 'findings':[
  'All six active campaign views are legible; truck, cable state, HUD, controls and connection instructions remain visible.',
  'Level 4 and level 6 fixed tower piers and rock footings are visible; FIXED labels do not overlap the deflection readout.',
  'The ordinary weak bridge trial visibly breaks its cable and deck. The extracted sequence shows a complete truck descending and rotating, followed by the failure state; fall-02 is the clearest airborne review frame.',
  'The repaired first bridge shows TESTS 2, and the final encoded victory frame shows the sixth bridge selected, 130 kg load, and 190 / 270 material usage.'
 ],
 'scope':'Manually viewed all 16 extracted encoded frames. This is a static visual review, not continuous-motion metrology or a claim to have manually watched every video frame. Velocity/pose continuity and gravity are verified separately by model regressions; ordinary-input recording states prove six actual model wins.',
 'recommendedFrames':{'active':'frame-02.png','level4Foundations':'frame-05.png','level6Foundations':'frame-07.png','firstFall':'fall-02.png','finalWin':'frame-08.png'},
 'physicalTvTested':False,'physicalPhoneTested':False
}
write('video-review-01/review.json',review)
reportpaths=['browser-01/report.json','shared-01/report.json','recording-01/recording.json','recording-01/video-validation.json','recorded-goals-01.json','visual-review-01.json','video-review-01/frames.json','video-review-01/review.json','executed-source-01/source-hashes.json','executed-source-01/postchecks-source-hashes.json','executed-source-01/finalize-qa-executed.py']
summary={
 'sourceCommit':s['sourceCommit'],'version':'0.2.1','versionCode':3,'passed':True,
 'browserViewports':[x['viewport'] for x in b['checks']],'sharedChecks':len(q['tests']),
 'recordedModelWinsZeroBased':g['recordedWonLevelsZeroBased'],'recordedWinTimesSeconds':{k:x['seconds'] for k,x in g['wins'].items()},
 'firstBridgeIncludesFailedTrialAndRepair':failed and repaired,
 'videoBytes':r['videoBytes'],'videoSha256':r['videoSha256'],'capturedSeconds':r['capturedSeconds'],'rawFrames':r['frames'],'fullVideoDecodePassed':v['checks']['videoFullDecode'],
 'reviewedEncodedFrames':len(review['reviewed']),'productionChanged':False,'testsChanged':False,
 'allTwelveAssetHashesMatchAcrossFrozenBrowserSharedRecording':True,'allExecutedArchiveScriptHashesUnchanged':True,'allFrozenTestAndModelSourceHashesUnchanged':True,
 'physicalTvTested':False,'physicalPhoneTested':False,
 'qaStatus':'FROZEN; browser and FFmpeg complete; browser slot handed to polish_optics. No source, model state or elapsed time overrides were used.',
 'reportSha256':{path:sha(P/path) for path in reportpaths}
}
write('final-summary-01.json',summary)
print(json.dumps(summary,indent=2))

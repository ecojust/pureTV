import json,subprocess,re,hashlib
from pathlib import Path
repo=Path('/dev/shm/puretv-submit');source='ea7854ca06ed53967aed00fe160034185f2906b3';slugs=['backroad-rally','ponpoko-kart','night-racer','penguintrack','last-track','dirt-crown','turbo-kart-rush','kart-rush','kart-royale']
result={'sourceSha':source,'scope':'Static sample of all frozen dist JavaScript/HTML/CSS for explicit query URL literals or navigation construction; absence of these patterns is not proof of no computed query URL. No game executed.','games':{}}
pattern=re.compile(r'\?v=|\?mode=|\?menu=|location\.(?:assign|replace)\(|location\.href\s*=|(?:src|href)=["\'][^"\']*\?')
for slug in slugs:
 names=subprocess.check_output(['git','ls-tree','-r','--name-only',source,'--','joystick-games/'+slug+'/dist'],cwd=repo,text=True).splitlines();names=[n for n in names if Path(n).suffix in ['.js','.html','.css']]
 row={'filesScanned':len(names),'matches':[]}
 for name in names:
  b=subprocess.check_output(['git','show',source+':'+name],cwd=repo);text=b.decode();hits=list(pattern.finditer(text))
  if hits:row['matches'].append({'path':name,'sha256':hashlib.sha256(b).hexdigest(),'matchCount':len(hits),'contexts':[text[max(0,m.start()-50):m.end()+100] for m in hits[:8]]})
 result['games'][slug]=row
Path('/dev/shm/racing-review-rally/backroad-mac-query/other-games-query-scan.json').write_text(json.dumps(result,indent=2)+'\n')
print({s:{'files':v['filesScanned'],'matchingFiles':len(v['matches'])} for s,v in result['games'].items()})

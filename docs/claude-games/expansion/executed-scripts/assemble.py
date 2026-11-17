from pathlib import Path
from urllib.parse import urlsplit,unquote
from collections import Counter,defaultdict
import json,hashlib,re
ROOT=Path('/dev/shm/puretv-joystick-games');WORK=Path('/dev/shm/claude-game-research');OUT=WORK/'expansion-audit'
base=json.loads((ROOT/'docs/claude-games/porting-baseline-93.json').read_text())
new=[];groups=[]
label_overrides=json.loads((OUT/'runtime-labels.json').read_text())
for file in ['expansion-3d-action.json','expansion-strategy-puzzle.json','expansion-casual-collections.json']:
 d=json.loads((WORK/file).read_text());rows=d.get('games',d.get('candidates',[]));groups.append({'file':file,'sha256':hashlib.sha256((WORK/file).read_bytes()).hexdigest(),'count':len(rows),'status':d.get('status')})
 for original in rows:
  g=dict(original);g.setdefault('researchGroup',file.removesuffix('.json'));g.setdefault('sourceFilesReviewed',[]);g.setdefault('controllerNotes','后续需逐项评估焦点菜单、核心操作、分辨率与运行环境。')
  g.setdefault('recommendation','具备独立规则与实际游戏源码，可作为进一步选型参考。')
  lic=g['license'];g.setdefault('licenseLabel',lic.get('label',lic.get('name',lic.get('status','未明确'))))
  g.setdefault('notes','');g.setdefault('genre',g['category']);g.setdefault('runtimeLabel','网页')
  g['demo'].setdefault('label','演示');g['demo']['playtested']=False
  if 'sourceReview' not in g:g['sourceReview']={'sourcePath':g.get('sourcePath'),'sourceSha256':g.get('sourceSha256'),'sourceBytes':g.get('sourceBytes'),'observations':g.get('sourceObservations',[]),'scope':g.get('reviewScope')}
  for k in ['id','title','repository','commit','sourceUrl','summary','runtime','stars','pushedAt','claudeEvidence','license','category']:assert k in g,(file,g['title'],k)
  assert re.fullmatch(r'[a-f0-9]{40}',g['commit'])
  assert g['category'] in base['categoryCounts'],g['category']
  assert isinstance(g['stars'],int) and g['stars']>=0
  if g['runtimeLabel']=='网页 / 构建产物':
   g['runtimeLabel']='网页 / Vite' if 'Vite' in g['runtime'] else '网页 / Three.js' if 'Three.js' in g['runtime'] else '网页 / 构建后运行'
  if g['title'] in label_overrides:g['runtimeLabel']=label_overrides[g['title']]
  new.append(g)
def source_key(g):
 p=unquote(urlsplit(g['sourceUrl']).path).strip('/').split('/');assert '/'.join(p[:2]).lower()==g['repository'].lower() and p[3]==g['commit'],g['title'];return (g['repository'].lower(),'/'.join(p[4:]).rstrip('/'))
def title_key(g):return g['repository'].lower(),re.sub(r'\W+','',g['title'].lower())
seen={source_key(g):g for g in base['games']};names={title_key(g):g for g in base['games']};ids={g['id'] for g in base['games']};duplicates=[]
accepted=[]
for g in new:
 key=source_key(g);nk=title_key(g)
 if key in seen or nk in names or g['id'] in ids:
  duplicates.append({'candidate':g['title'],'repository':g['repository'],'group':g['researchGroup'],'existing':(seen.get(key) or names.get(nk) or {}).get('title'),'sourceKey':key});continue
 seen[key]=g;names[nk]=g;ids.add(g['id']);accepted.append(g)
assert not duplicates,duplicates
allgames=accepted+base['games'];counts=Counter(g['category'] for g in allgames)
out={**base,'scope':'GitHub Claude-assisted game references, statically reviewed; not a tested quality ranking or pureTV release catalog. Expanded from the separately retained original 93-entry porting baseline.','count':len(allgames),'countUnit':'reference entries; some multi-game collections and closely related rule variants are grouped into a single entry; not APK count','repositoryCount':len({g['repository'].lower() for g in allgames}),'categoryCounts':{k:counts[k] for k in base['categoryCounts']},'expansion':{'checkedAt':'2026-11-17','previousCount':93,'addedCount':len(accepted),'previousRepositoryCount':61,'originalPortingBaseline':'porting-baseline-93.json'},'games':allgames}
(OUT/'catalog-candidate.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
(OUT/'assembly-inputs.json').write_text(json.dumps({'groups':groups,'duplicates':duplicates,'count':len(allgames),'added':len(accepted),'repositories':out['repositoryCount'],'categories':out['categoryCounts']},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'count':len(allgames),'added':len(accepted),'repositories':out['repositoryCount'],'categories':out['categoryCounts']},ensure_ascii=False))

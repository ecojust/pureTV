from pathlib import Path
import json,hashlib,datetime
root=Path(__file__).resolve().parents[2];out=root/'docs/racing-nine';groups=['existing','rally','driving','karts','arcade'];rows=[];sources={}
for group in groups:
 path=out/'reviews'/group/'comparison.json';data=path.read_bytes();sources[path.relative_to(root).as_posix()]=hashlib.sha256(data).hexdigest();d=json.loads(data);games=d if isinstance(d,list) else d['games']
 for game in games:
  row=dict(game);row['reviewGroup']=group;row['reviewFile']=path.relative_to(root).as_posix();row['portSlug']={'night':'night-racer','backroad':'backroad-rally','lasttrack':'last-track'}.get(game['slug'],game['slug']);row['selected']=False
  if row['totalScore'] is not None:assert row['totalScore']==row['graphicsScore']+row['gameplayScore']
  for name in row.get('reviewEvidencePaths',[]):assert (root/name).is_file(),name
  image=row.get('bestGameplayImage') or row.get('bestObservedImage')
  if image:row['comparisonImage']=image;row['comparisonImageSha256']=hashlib.sha256((root/image).read_bytes()).hexdigest()
  rows.append(row)
assert len(rows)==31 and len({r['slug']for r in rows})==31
rows.sort(key=lambda r:(-(r['totalScore'] if r['totalScore'] is not None else -1),-(r['graphicsScore'] or 0),r['slug']))
expected={'backroad','ponpoko-kart','night','penguintrack','lasttrack','dirt-crown','turbo-kart-rush','kart-rush','kart-royale'}
assert {r['slug']for r in rows[:9]}==expected
for index,row in enumerate(rows):row['rank']=index+1 if row['totalScore'] is not None else None;row['selected']=index<9
report={'schemaVersion':1,'sourceCatalogCommit':'5fea0827394dd4c289193f8f3502cb0a44f8ab7d','selectedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'candidateCount':31,'scoredCount':30,'selectedCount':9,'status':'selection_complete_adaptation_in_progress','weights':{'graphics':50,'gameplay':50},'tieBreak':'Equal total scores: higher graphics score first. Kart Royale also has a clear fixed gameplay image; Poly GT only has a menu scene and a provisional score.','limitations':['These are bounded review estimates, not outside ratings or GitHub stars.','F1 remains unscored after no adequate unobstructed gameplay image; do not infer poor quality from a harness timeout.','Poly GT 79 is provisional from its observed menu scenery and source, not a driving verdict.','Author captures, actual short driving, countdown views, prior archive reviews and source-derived features remain distinct.','No claim that the nine have completed native packaging or physical device tests.'],'groupInputs':sources,'games':rows}
(out/'comparison.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
reasons={'backroad':'林间光照与密集植被、拉力驾驶、车辆损伤和多赛段。','ponpoko-kart':'灯会、角色与和风赛道风格完整，漂移和道具竞速。','night':'雨夜灯光、原车型和多场景，车库改装与本地幽灵。','penguintrack':'清晰冰雪赛道与企鹅车辆，35关计时、奖牌与编辑器。','lasttrack':'武装赛车、武器和伤害HUD，多赛道与改装成长。','dirt-crown':'泥地赛事、20条赛道定义、26个生涯赛事和升级。','turbo-kart-rush':'八车道具竞速、四赛道、大奖赛与漂移加速。','kart-rush':'动物车手、八条赛道、七站大奖赛与多种道具。','kart-royale':'赛道材质、光照和漂移特效突出；同分时画面优先。'}
lines=['# 九款赛车对比与三平台适配','', '已检查扩充前 README 中的 **31 个赛车候选**，以画面与玩法各 **50 分**选出以下 **9 款**。30款有分，F1因缺少足够清晰的赛中画面暂不评分；分数是本次有范围限制的评审估计，不是外部评分或 GitHub 星标。','', '**当前已确定九款，正在适配；尚未新增完成验收的安装包。** 目标是 Android TV、macOS 通用包（Apple Silicon／Intel）与 Windows x64，支持 pureTV 九键手柄、默认 TCP 63485、真实连接 ID、断线／失焦取消和手动恢复。','', '## 入选九款','', '| 游戏 | 画面 /50 | 玩法 /50 | 合计 /100 | 选择理由 |','| --- | ---: | ---: | ---: | --- |']
for r in rows[:9]:lines.append(f"| [{r['title']}]({r['reviewFile'].removeprefix('docs/racing-nine/')}) | {r['graphicsScore']} | {r['gameplayScore']} | **{r['totalScore']}** | {reasons[r['slug']]} |")
lines+=['','## 画面对比','','下列为评审所用图片；作者原图和本轮实际运行画面分别注明。起跑图不代表已完成驾驶验证。','', '<table>']
for i in range(0,9,4):
 lines.append('<tr>')
 for r in rows[i:i+4]:
  image=r['comparisonImage'].removeprefix('docs/racing-nine/');kind='作者固定原图' if 'author-' in image else ('本轮短时驾驶' if r['slug'] in ['penguintrack','kart-rush'] else '本轮起跑／倒计时')
  lines.append(f'<td width="25%" align="center"><a href="{image}"><img src="{image}" width="360" alt="{r["title"]}"></a><br><b>{r["title"]}</b><br>{kind}</td>')
 lines.append('</tr>')
lines+=['</table>','','## 全部候选','','| 排名 | 游戏 | 画面 | 玩法 | 合计 | 结果与证据范围 |','| ---: | --- | ---: | ---: | ---: | --- |']
for r in rows:
 label='入选' if r['selected'] else ('未评分；仅模糊菜单背景，原观察失败保留' if r['totalScore'] is None else '暂估；菜单场景＋源码，未驾驶' if r['slug']=='poly-gt' else '候选')
 lines.append(f"| {r['rank'] or '—'} | [{r['title']}]({r['reviewFile'].removeprefix('docs/racing-nine/')}) | {r['graphicsScore'] if r['graphicsScore'] is not None else '—'} | {r['gameplayScore'] if r['gameplayScore'] is not None else '—'} | {r['totalScore'] if r['totalScore'] is not None else '—'} | {label} |")
lines+=['','画面考察场景与美术15、车辆10、光照特效10、可读性10、动态表现5；玩法考察驾驶15、竞赛反馈10、赛道模式10、成长重玩10、完整比赛流程5。软件 GPU 的慢速和排队时间不计为游戏画面质量，也不冒称电视帧率。','', '同分时优先画面分。Kart Royale 与 Poly GT 同为79分；前者画面44分且有清晰的固定赛中原图，后者39分仅为菜单场景暂估，因此选择 Kart Royale。F1未评分是证据不足，不能解读为低质量。','', '多款尚未完成整场比赛：玩法内容由固定源码核实，作者图片、线上版本和固定源码的差异均在原分组报告中保留。许可、外部服务、音频支持与资源体积另列，不暗中折算成画面分。','', '完整字段、证据类型、局限与图片哈希见 [comparison.json](comparison.json)，固定来源见 [候选清单](candidate-catalog.json)，root逐图复核见 [画面复核](root-visual-crosscheck.json)。原93款批量适配仍暂停；新增79项参考不会自动加入这9款任务。工作记录见 [2026-11-19-002](../../history/2026-11-19-002.md)。','']
(out/'README.md').write_text('\n'.join(lines))
print('Selected', [r['portSlug']for r in rows[:9]])

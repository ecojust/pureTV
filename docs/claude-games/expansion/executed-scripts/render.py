from pathlib import Path
import json
root=Path('/dev/shm/puretv-joystick-games');data=json.loads((root/'docs/claude-games/catalog.json').read_text());games=data['games']
def esc(s):return str(s).replace('|','&#124;').replace('\n',' ').replace('\r',' ')
def link(name,url):return '['+esc(name)+']('+url+')'
count=data['count'];repos=data['repositoryCount']
lines=['<!-- claude-games:start -->','<a id="claude-游戏参考清单"></a>',f'## Claude 游戏参考清单（{count} 项 / {repos} 个仓库）','',
'截至 **2026-11-17**，从 GitHub 按玩法完整度、实际源码、可运行入口和项目维护情况筛选。每项均核对了作者的 Claude 制作说明，或确实涉及游戏源码的 Claude 署名提交；这说明 Claude 参与开发，不表示全部代码和素材均由 Claude 独立完成。',
'',
f'本轮新增 **{data.get("expansion",{}).get("addedCount",0)} 项**。点击分类展开完整清单，每项列出源码、实际玩法、试玩或下载入口、Claude 依据和许可。相近棋类变体按家族合并，镜像和同一游戏的多个版本不重复计数；合集中的独立玩法可以分列。**⭐ 是所在仓库的当日星标数**。'
,'',
'这是一份源码与资料初筛清单，尚未逐款完整试玩；HTTP 可达不等于已验证游戏运行。原93项的电视端与macOS适配正在推进，见[逐项评估](docs/claude-games/tv-assessment.md)。新增候选不计入已发布数量，已适配的运输船 CF、QQ 飞车不重复列入。完整依赖、操作难点和核查记录见[来源说明](docs/claude-games/README.md)。','',
'优先关注 **Ponpoko Kart、Sky Rings、PHOENIX ∞、Loop Clear、Kart Royale、Nova Lancer、Sugarplum Drop、CELADON**：分别涵盖地面与空中竞速、弹幕、管线解谜、飞行射击、物理合成和经营。更多低门槛作品见单键、益智和休闲分类。','']
for category,n in data['categoryCounts'].items():
 lines+=[('<details open>' if category=='竞速与体育' else '<details>'),f'<summary><strong>{category}（{n}）</strong></summary>','','| 游戏与源码 | 玩法与看点 | 运行方式 / 入口 | Claude 依据 / 许可 |','| --- | --- | --- | --- |']
 for g in [g for g in games if g['category']==category]:
  title=link(g['title'],g['sourceUrl'])+f' · ⭐ {g["stars"]}'
  run=esc(g['runtimeLabel']);demo=g['demo']
  if demo.get('url') and demo.get('httpStatus')==200:run+=' · '+link(demo['label'],demo['url'])
  else:run+=' · 从源码运行'
  evidence=link('Claude 依据',g['claudeEvidence']['url'])+' · '
  evidence+=link(g['licenseLabel'],g['license']['url']) if g['license'].get('url') else esc(g['licenseLabel'])
  lines.append('| '+title+' | '+esc(g['summary'])+' | '+run+' | '+evidence+' |')
 lines+=['','</details>','']
lines+=['继续发现候选可参考 [Awesome AI-Built Games](https://github.com/lappemic/awesome-ai-built-games)、[Frontier Games](https://github.com/theolundqvist/frontier-games) 和 [Opus 5.5 Games](https://github.com/gamingnews5/awesome-opus-5.5-games)。这些聚合目录可能混有其他模型、重复项目或未核实作品，不计入上述数量。','<!-- claude-games:end -->','']
block='\n'.join(lines)
p=root/'README.md';s=p.read_text()
if '<!-- claude-games:start -->' in s:
 a=s.index('<!-- claude-games:start -->');b=s.index('<!-- claude-games:end -->')+len('<!-- claude-games:end -->');s=s[:a]+block.rstrip()+s[b:]
else:
 assert s.count('## MCP / Agent')==1;s=s.replace('## MCP / Agent',block+'\n## MCP / Agent',1)
p.write_text(s)
en=['<!-- claude-games:start -->','## Claude-assisted game references', '',f'The [Chinese README contains {count} game references from {repos} GitHub repositories](README.md#claude-游戏参考清单), grouped into racing/sports, 3D action/exploration, platform/shooter arcade games, strategy/cards, puzzles, simulation/casual games, rhythm, and one-button arcade games. The list includes source links, gameplay notes, runtime requirements, demo/download links, Claude attribution and license status.','',
'Checked on **2026-11-17** using original author statements or Claude-signed commits that affect game code, plus static source review. Stars are a dated repository snapshot. These are candidates for further evaluation; HTTP-accessible demos are not gameplay tests or pureTV compatibility claims. The original 93-entry porting scope is retained separately in the [baseline and TV assessment](docs/claude-games/tv-assessment.md); additional references do not increase published game counts. The already adapted CF and QQ Speed games are excluded from the new-reference count. See the [source catalog and review scope](docs/claude-games/README.md).','',
'Examples worth examining include **Ponpoko Kart, Sky Rings, PHOENIX ∞, Loop Clear, Kart Royale, Nova Lancer, Sugarplum Drop, and CELADON**. Runtime and license differences are recorded explicitly: Tidewater requires WebGPU, GalaxyQuest targets Meta Quest and needs original game data, and MAINSPRING has a noncommercial license.','<!-- claude-games:end -->','']
p=root/'README.en.md';s=p.read_text();eb='\n'.join(en)
if '<!-- claude-games:start -->' in s:
 a=s.index('<!-- claude-games:start -->');b=s.index('<!-- claude-games:end -->')+len('<!-- claude-games:end -->');s=s[:a]+eb.rstrip()+s[b:]
else:s=s.replace('## MCP / Agent',eb+'\n## MCP / Agent',1)
p.write_text(s)
print('Rendered',count,'rows in',len(data['categoryCounts']),'categories')

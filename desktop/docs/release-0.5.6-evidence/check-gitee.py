import datetime,json,urllib.request
from pathlib import Path
base='https://gitee.com/api/v5/repos/juzisang331/pure-tv-store'
def get(path=''):
 with urllib.request.urlopen(urllib.request.Request(base+path,headers={'User-Agent':'pureTV-release-verification'}),timeout=30) as response:
  return json.load(response)
repo=get();branch=get('/branches/'+repo['default_branch']);revision=branch['commit']['sha']
tree=get('/git/trees/'+revision+'?recursive=1');assert not tree.get('truncated',False)
files=[{'path':item['path'],'sha':item['sha'],'bytes':item.get('size')} for item in tree['tree'] if item['path'].startswith('client/') and item['type']=='blob']
record={'revision':revision,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':files,'uploadPerformed':False}
Path('/workspace/scratch/market-inline-provider-20261108/release/gitee-after-release.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(record,ensure_ascii=False,indent=2))

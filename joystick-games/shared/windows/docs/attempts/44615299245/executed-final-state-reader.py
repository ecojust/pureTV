import concurrent.futures,hashlib,json,pathlib,urllib.request
root=pathlib.Path('/dev/shm/puretv-submit');folder=root/'joystick-games/shared/windows/docs/attempts/44615299245';out=folder/'original-bounded-export';commit='6dc14b79a364dc8679f370f17099e0636acef356';tree=json.loads((folder/'original-export-tree.json').read_text());blobs={b['path']:b for b in tree['tree'] if b['type']=='blob'};manifest=json.loads((out/'export-manifest.json').read_text());names=[f'joystick-windows-evidence-{game}/runtime-{mode}/diagnostics/state.json' for game in ['backroad-rally','ponpoko-kart','turbo-kart-rush','kart-royale'] for mode in ['normal','occupied']]
def fetch(name):
 b=blobs[name];assert b['size']<2_000_000
 with urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+commit+'/'+name,timeout=30) as r:data=r.read(2_000_001)
 assert len(data)==b['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==b['sha'];h={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()};assert h==manifest['files'][name]
 p=out/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);s=json.loads(data);g=s.get('game') or {};return name,{'file':h,'timestamp':s.get('timestamp'),'ready':s.get('ready'),'nativeEpoch':s.get('documentEpoch'),'documentEpoch':s.get('document',{}).get('epoch'),'url':s.get('document',{}).get('url'),'renderer':g.get('renderer'),'frames':g.get('frames'),'pollCount':g.get('controller',{}).get('pollCount'),'stage':g.get('stage'),'paused':g.get('paused'),'gameplay':g.get('gameplay'),'diagnosticError':s.get('diagnosticError'),'lastJavaScriptError':s.get('lastJavaScriptError')}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:states=dict(pool.map(fetch,names))
(folder/'original-final-state-verification.json').write_text(json.dumps({'sourceRunId':44615299245,'exportCommit':commit,'files':states},indent=2)+'\n')
for name,state in states.items():print(name,json.dumps(state))

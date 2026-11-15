from pathlib import Path
import json,hashlib,subprocess,zipfile
ROOT=Path('/dev/shm/puretv-controller-games');BASE='bf58393ba8fa8bb3bdf731ab24f9ab09d90f5075';OUT=Path('/dev/shm/controller-gamekit-ui/model-reuse.json')
sha=lambda b:hashlib.sha256(b).hexdigest()
def frozen(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
rows=[]
for slug in ['twenty-four','torch-bridge','tower-overlap','packing-sculptor','conveyor-window','glass-fold','tension-span','prism-relay']:
 rel='resource/apps/'+slug;game=ROOT/rel;meta=json.loads(frozen(rel+'/resource.json'));path=game/meta['apk'];data=path.read_bytes();assert sha(data)==meta['sha256'] and len(data)==meta['apkBytes']
 current=(game/'src/main/assets/game-model.js').read_bytes()
 with zipfile.ZipFile(path) as z:assert z.read('assets/game-model.js')==current
 assert frozen(rel+'/src/main/assets/game-model.js')==current
 report=frozen(rel+'/docs/verification.json');verification=json.loads(report);assert verification['passed'] is True and verification['version']==meta['version']
 model_evidence=meta.get('verification',{}).get('modelEvidence','docs/releases/'+meta['version']+'/model')
 evidence=game/model_evidence
 if not evidence.exists():evidence=game/'docs/model-verification.json'
 assert evidence.exists(),str(evidence)
 files=[evidence] if evidence.is_file() else sorted(p for p in evidence.rglob('*') if p.is_file())
 assert files
 rows.append({'game':slug,'scope':'Rules reused only: current game-model.js is byte-identical to the last release-signed APK and baseline source; new shared runtime/UI require separate new checks.','previousVersion':meta['version'],'apk':str(path.relative_to(ROOT)),'apkSha256':meta['sha256'],'modelSha256':sha(current),'priorVerification':rel+'/docs/verification.json','priorVerificationSha256':sha(report),'previousModelEvidence':{str(p.relative_to(ROOT)):sha(p.read_bytes()) for p in files},'ruleTestsRerun':False})
# Neon rules already fixed and validated in delivered macOS0.1.3; Android0.1.1 is not reused.
rel='resource/apps/neon-rush';p=ROOT/rel/'src/main/assets/game-model.js';current=p.read_bytes();assert frozen(rel+'/src/main/assets/game-model.js')==current
with zipfile.ZipFile(ROOT/rel/'macos/NeonRush-0.1.3-macos-universal.zip') as z:assert z.read('Neon Rush.app/Contents/Resources/Web/game-model.js')==current
prior=frozen(rel+'/macos/docs/verification-0.1.3/verification.json');assert json.loads(prior)['status']=='passed'
rows.append({'game':'neon-rush','scope':'Rule-only reuse from delivered macOS0.1.3 steering fix; Android0.1.1 is not a baseline for the corrected model. UI differs and is checked anew.','modelSha256':sha(current),'priorVerification':rel+'/macos/docs/verification-0.1.3/verification.json','priorVerificationSha256':sha(prior),'ruleTestsRerun':False})
OUT.write_text(json.dumps({'passed':True,'baselineCommit':BASE,'scriptSha256':sha(Path(__file__).read_bytes()),'games':rows},ensure_ascii=False,indent=2)+'\n');print('Rule-only reuse validated for',len(rows),'unchanged models')

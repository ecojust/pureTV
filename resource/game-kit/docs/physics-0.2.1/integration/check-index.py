#!/usr/bin/env python3
"""Generate README indexes and verify only the expected English name changes."""
from pathlib import Path
import hashlib,json,subprocess,datetime
repo=Path('/workspace/pureTV');out=Path('/workspace/scratch/physics-021/index-check-01.json');assert not out.exists()
files=['README.md','README.en.md','resource/README.md'];before={n:(repo/n).read_bytes() for n in files};runs=[]
for _ in range(2):
 r=subprocess.run(['python3','tools/update-resource-index.py'],cwd=repo,check=True,capture_output=True,text=True);runs.append({'stdout':r.stdout,'stderr':r.stderr})
 current={n:(repo/n).read_bytes() for n in files}
 if len(runs)==1:first=current
 else:assert current==first,'Generator is not idempotent'
for n in files:
 expected=before[n].replace(b'Prism Relay (Chinese UI)',b'Light Relay (Chinese UI)') if n=='README.en.md' else before[n]
 assert current[n]==expected,'Unexpected gallery/count/order/layout change: '+n
sha=lambda raw:hashlib.sha256(raw).hexdigest()
report={'passed':True,'idempotent':True,'recordedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'expectedOnlyChange':'README.en.md caption: Prism Relay (Chinese UI) → Light Relay (Chinese UI)','beforeSha256':{n:sha(v) for n,v in before.items()},'afterSha256':{n:sha(v) for n,v in current.items()},'changedFiles':[n for n in files if before[n]!=current[n]],'generationRuns':runs,'generatorSha256':sha((repo/'tools/update-resource-index.py').read_bytes()),'checkerSha256':sha(Path(__file__).read_bytes()),'note':'All four-column layout, selected-game membership, creation-order sorting and category totals are byte-identical to the previously validated galleries except for this single caption.'}
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':True,'idempotent':True,'changedFiles':report['changedFiles']}))

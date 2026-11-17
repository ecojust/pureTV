#!/usr/bin/env python3
"""Archive already successful final checks; does not execute or fabricate them."""
from pathlib import Path
import json,hashlib,shutil,subprocess
repo=Path('/workspace/pureTV');scratch=Path('/workspace/scratch/game-polish');out=repo/'resource/game-kit/docs/featured-0.2.0/integration'
assert not out.exists(), 'Preserve any previous archive'
read=lambda p:json.loads(p.read_text())
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report=read(scratch/'final-integration-audit-01.json');catalog=read(scratch/'catalog-0.2.0.json');index=read(scratch/'readme-index-check.json')
assert report['passed'] and len(report['checks'])==10 and not report['errors']
assert len(catalog)==125 and all(x['signatureVerified'] for x in catalog)
assert index['passed'] and index['idempotent']
assert digest(scratch/'publication-review/final-audit.py')==report['auditScriptSha256']
assert digest(scratch/'publication-review/win_audit.py')==report['winAuditScriptSha256']
files={
'final-integration-audit.json':scratch/'final-integration-audit-01.json',
'resource-catalog.json':scratch/'catalog-0.2.0.json',
'readme-index-check.json':scratch/'readme-index-check.json',
'final-audit.py':scratch/'publication-review/final-audit.py',
'win_audit.py':scratch/'publication-review/win_audit.py',
'archive-final.py':Path(__file__)}
out.mkdir(parents=True)
for name,source in files.items():shutil.copyfile(source,out/name)
games={}
for slug,check in report['checks'].items():
 if 'levelsWon' not in check:continue
 app=repo/'resource/apps'/slug;info=read(app/'resource.json');verification=read(app/'docs/verification.json');record=read(app/verification['evidence']['recording']['file'])
 games[slug]={'name':info['name'],'version':info['version'],'levelCount':6,'newLevels':3,'recordedModelWins':verification['actualGameplay']['recordedWonLevelsZeroBased'],'apkBytes':info['apkBytes'],'videoBytes':record['videoBytes'],'videoSha256':record['videoSha256'],'recordingAttempt':check['actualEvidenceAttempts']['recording'],'testSourceCommit':check['testProvenance']['sourceCommit'],'supplementaryBrowserChecksPassed':verification['supplementaryBrowserChecksPassed'],'sharedBrowserChecksPassed':verification['sharedBrowserChecksPassed'],'verification':'../../../../apps/'+slug+'/docs/verification.json'}
assert len(games)==8
summary={'productionSourceSha':report['productionSourceSha'],'auditedRepositoryHead':report['repositoryHead'],'version':'0.2.0','gameCount':8,'totalLevels':48,'newLevels':24,'allGamesSixRecordedModelWins':True,'games':games,'galleries':report['checks']['readmeGalleries'],'officialSignedCatalogCount':len(catalog),'officialCatalogCommand':'JAVA_HOME=/absolute/jdk17 python3 tools/resource_catalog.py --build-tools /absolute/android-sdk/build-tools/34.0.0','officialCatalogToolSha256':digest(repo/'tools/resource_catalog.py'),'readmeGeneratorSha256':digest(repo/'tools/update-resource-index.py'),'physicalTvTested':False,'physicalPhoneTested':False,'limitations':['Actual ordinary-input Chromium checks and recorded gameplay; no physical TV or phone execution.','Model fixtures, shared protocol tests, browser gameplay, signature tooling and video decode remain separate raw evidence.','Glass Fold attempts 01 and 02 failed; attempt03 is adopted. Production assets are unchanged; later commits only correct test input acknowledgements and recording duration.','No GitHub Release or Gitee marketplace publication is claimed.']}
(out/'release-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
manifest={'auditedRepositoryHead':report['repositoryHead'],'files':[{'file':p.name,'bytes':p.stat().st_size,'sha256':digest(p)} for p in sorted(out.iterdir()) if p.is_file()]}
(out/'archive-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'archivedFiles':len(manifest['files']),'games':len(games),'totalLevels':48,'catalogResources':len(catalog)},ensure_ascii=False))

from pathlib import Path
import hashlib,json,os,subprocess,sys
ROOT=Path('/dev/shm/puretv-submit');OUT=ROOT/'joystick-games/ponpoko-kart/docs/macos-ci-44602407034';BASE=ROOT/'docs/racing-nine/native-readiness/ci-44602407034-attempt-1';VIEW=Path('/dev/shm/racing-review-rally/pon-evidence-views');assert not VIEW.exists();VIEW.mkdir()
roots={};mapping={}
for kind in ['arm','intel']:
 original=BASE/f'original-{kind}-export/artifact';view=VIEW/f'pon-{kind}-44602407034';view.mkdir();files={}
 for source in sorted(original.rglob('*')):
  assert not source.is_symlink();target=view/source.relative_to(original)
  if source.is_dir():target.mkdir();continue
  assert source.is_file();os.link(source,target);assert (source.stat().st_dev,source.stat().st_ino)==(target.stat().st_dev,target.stat().st_ino)
  files[source.relative_to(original).as_posix()]={'bytes':source.stat().st_size,'sha256':hashlib.sha256(source.read_bytes()).hexdigest()}
 roots[kind]=view;mapping[view.name]={'originalArtifact':str(original.relative_to(ROOT)),'exportCommit':json.loads((BASE/f'readonly-{kind}-export-verification.json').read_text())['exportCommit'],'files':files}
report=OUT/'per-game-coverage-attempt-3.json';assert not report.exists();tool=ROOT/'joystick-games/tools/macos-coverage.py';toolhash=hashlib.sha256(tool.read_bytes()).hexdigest();assert toolhash=='5b491adba2b684d0c9a5d941da0f73798a04ecb08893628ece205510d6ee0bd6'
args=[sys.executable,str(tool),'--game','ponpoko-kart','--meta',str(OUT/'original-build-manifest.json'),'--plan',str(OUT/'original-plan-export/artifact/plan.json'),'--entry',str(OUT/'original-registry-entry.json'),'--arm',str(roots['arm']),'--intel',str(roots['intel']),'--output',str(report),'--per-game']
completed=subprocess.run(args,capture_output=True,timeout=120);(OUT/'per-game-attempt-3-stdout.log').write_bytes(completed.stdout);(OUT/'per-game-attempt-3-stderr.log').write_bytes(completed.stderr);assert completed.returncode==0
new=json.loads(report.read_text());old=json.loads((OUT/'per-game-coverage-attempt-2.json').read_text());assert {k:v for k,v in new.items() if k!='evidenceFiles'}=={k:v for k,v in old.items() if k!='evidenceFiles'}
for prefix,record in mapping.items():
 assert prefix+'/batch-report.json' in new['evidenceFiles'] and prefix+'/ponpoko-kart/native/report.json' in new['evidenceFiles']
 for name,expected in record['files'].items():
  p=ROOT/record['originalArtifact']/name;assert p.stat().st_size==expected['bytes'] and hashlib.sha256(p.read_bytes()).hexdigest()==expected['sha256']
for name,expected in new['evidenceFiles'].items():
 prefix,relative=name.split('/',1);assert expected==mapping[prefix]['files'][relative]
(OUT/'evidence-view-mapping.json').write_text(json.dumps({'method':'Hard links to immutable original files with distinct root basenames; no package or evidence content copy/rewrite','roots':mapping},indent=2)+'\n')
record={'assessmentSourceSha256':toolhash,'command':args,'returncode':completed.returncode,'distinctEvidenceRootBasenames':True,'allOriginalArtifactFilesUnchanged':True,'originalFilesLinked':sum(len(r['files']) for r in mapping.values()),'previousEvidenceReferences':len(old['evidenceFiles']),'completeDistinctEvidenceReferences':len(new['evidenceFiles']),'allNonReferenceVerdictFieldsIdentical':True,'nativeRerun':False,'previousAssessmentReportsPreserved':True}
(OUT/'assessment-execution-attempt-3.json').write_text(json.dumps(record,indent=2)+'\n')
manifest=ROOT/'joystick-games/ponpoko-kart/packages.json';before=json.loads(manifest.read_text());after=json.loads(manifest.read_text());after['macos']['coverageReport']='docs/macos-ci-44602407034/per-game-coverage-attempt-3.json';restored=json.loads(json.dumps(after));restored['macos']['coverageReport']=before['macos']['coverageReport'];assert restored==before;manifest.write_text(json.dumps(after,ensure_ascii=False,indent=2)+'\n')
audit=ROOT/'docs/racing-nine/native-readiness/four-mac-deliveries-preparation.json';a=json.loads(audit.read_text());a['validation']['allTwentyDeliveryFiles'][str(manifest.relative_to(ROOT))]={'bytes':manifest.stat().st_size,'sha256':hashlib.sha256(manifest.read_bytes()).hexdigest()};a['ponDistinctEvidenceReferenceRepair']='joystick-games/ponpoko-kart/docs/macos-ci-44602407034/assessment-execution-attempt-3.json';audit.write_text(json.dumps(a,indent=2)+'\n')
print(json.dumps({k:v for k,v in record.items() if k!='command'}));print('Pon packages manifest SHA256 '+hashlib.sha256(manifest.read_bytes()).hexdigest())

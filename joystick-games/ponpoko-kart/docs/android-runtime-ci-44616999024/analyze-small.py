from pathlib import Path
import json,hashlib,subprocess,datetime
here=Path(__file__).resolve().parent
repo=Path('/dev/shm/puretv-submit')
original=here/'original-export'; verified=json.loads((here/'selected-blob-verification.json').read_text()); manifest=json.loads((original/'export-manifest.json').read_text()); tree=json.loads((here/'original-tree.json').read_text()); entries={r['path']:r for r in tree['tree'] if r['type']=='blob'}
for f in verified['selectedFiles']:
 raw=(original/f['path']).read_bytes();assert len(raw)==f['bytes'] and hashlib.sha256(raw).hexdigest()==f['sha256']
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==f['gitBlob']
prefix='evidence/joystick-android-runtime-ponpoko-kart/ponpoko-kart/';base=original/prefix;qa=manifest['qaSourceSha'];artifact=manifest['artifactSourceSha'];sources={}
for name,item in manifest['files'].items():
 relative=None;commit=qa
 for marker in [prefix+'executed-source/',prefix+'source/',prefix.rstrip('/')+'-normal/source/',prefix.rstrip('/')+'-occupied/source/']:
  if name.startswith(marker):relative=name[len(marker):]
 if name.startswith(prefix+'verified-inputs/artifact-source/'):
  relative=name[len(prefix+'verified-inputs/artifact-source/'):];commit=artifact
 if relative is None:continue
 raw=subprocess.check_output(['git','show',commit+':'+relative],cwd=repo)
 digest=hashlib.sha256(raw).hexdigest();oid=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
 assert item=={'bytes':len(raw),'sha256':digest} and entries[name]['sha']==oid
 sources[name]={'sourceCommit':commit,'sourcePath':relative,'bytes':len(raw),'sha256':digest,'gitBlob':oid}
source_check={'method':'Exact Git source bytes versus original export manifest SHA256/length and export-tree Git blob; no source duplicate download','entriesVerified':len(sources),'files':sources,'fullNonSourceExportDownloadedOrVerified':False,'newApkDownloaded':False}
(here/'source-tree-verification.json').write_text(json.dumps(source_check,indent=2)+'\n')
d=base/'environment-diagnostics';report=json.loads((d/'report.json').read_text());samples=[json.loads(line) for line in (d/'samples.jsonl').read_text().splitlines()]
assert report['qaSourceSha']==qa and report['qaRunId']=='44616999024' and report['qaRunAttempt']=='1'
raw=(d/report['source']['path']).read_bytes();assert len(raw)==report['source']['bytes'] and hashlib.sha256(raw).hexdigest()==report['source']['sha256']
assert raw==subprocess.check_output(['git','show',qa+':joystick-games/tools/android-environment-diagnostics.py'],cwd=repo)
seen=[{'at':s['at'],**p} for s in samples for p in s.get('emulator',{}).get('observed',[])]
gone=[{'at':s['at'],**p} for s in samples for p in s.get('emulator',{}).get('gone',[])]
modes=[]
for mode in ['normal','occupied']:
 path=original/(prefix.rstrip('/')+'-'+mode+'/report.json');r=json.loads(path.read_text())
 assert r['apk']['sha256']=='a1c9a0f6de56fd5ec87e25d4a6b5be541c9a04686e76b31484d99cc890b86e22' and r['apk']['bytes']==1602736
 modes.append({'mode':mode,'status':r['status'],'passedChecks':sum(t['status']=='passed' for t in r['tests']),
               'checkNames':[t['name'] for t in r['tests']],'lastSnapshotLabel':r['snapshots'][-1]['label'] if r['snapshots'] else None,
               'failure':r.get('error','').strip().splitlines()[-1] if r.get('error') else None,'apk':{k:r['apk'][k] for k in ['bytes','sha256']}})
observed_groups=[g for p in seen for g in p.get('cgroupAncestors',{}).get('groups',[])]+[g for p in gone for g in p.get('cgroupAfterDisappearance',{}).get('groups',[])]
read_events=[g['files'][name]['fields'] for g in observed_groups for name in ['memory.events','memory.events.local'] if g['files'][name]['status']=='read']
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'runId':44616999024,'attempt':1,'qaSourceSha':qa,'originalArtifactSourceSha':artifact,'exportCommit':verified['exportCommit'],
 'actualGuestMemoryMiB':2048,'actualEmulatorVersion':'37.3.10.0','actualEmulatorBuild':'16970787','configurationEvidence':'original-runtime-job.log lines 2314-2315: actual launch command and version',
 'samples':len(samples),'sampleRowsOmitted':report['log']['rowsOmittedByBudget'],'minimumMemAvailableKiB':min(s['memory']['fields']['MemAvailable']['value'] for s in samples if s.get('memory',{}).get('fields',{}).get('MemAvailable')),
 'lastObservedEmulator':seen[-1],'maximumObservedRssKiB':max(p['memory']['VmRSS']['value'] for p in seen),'goneEvents':gone,
 'allReadableQemuGroupAndAncestorOomCountersZero':all(all(fields.get(k)==0 for k in ['oom','oom_kill','oom_group_kill']) for fields in read_events),
 'cgroupScope':'Actual QEMU membership plus ancestors, including one fresh reread after disappearance. Leaf and parent readable; namespace root memory files unavailable (ENOENT), not treated as zero.',
 'kernelBefore':report['kernelBefore'],'kernelAfter':report['kernelAfter'],'systemdOomd':report['systemdOomdAfter'],'crashMetadata':json.loads((d/'crash-report.json').read_text()),
 'modes':modes,'runtimeAccepted':manifest['runtimeAccepted'],'emulatorExitCode':None,'rootCauseProven':False,
 'conclusions':['Guest RAM reduction lowered QEMU observed RSS to about 3.61 GiB, but the PID still disappeared before initialization completed.',
 'Readable per-process limits are unlimited for resident/data/address space; readable QEMU group/parent limits are max, OOM counters remain zero before and after disappearance. This run does not support the proposed approximately 4.9 GiB memory ceiling explanation.',
 'Successful kernel and systemd-oomd queries retained no corresponding event; no eligible current-PID minidump was found within the bounded inspected path. These observations do not prove a particular exit cause or absence of all possible crash evidence.',
 'Both original runtime failures remain failures; no gameplay/input acceptance was reached. No new dispatch or APK rebuild/signing occurred during evidence recovery.']}
(here/'environment-findings.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'sourceEntriesVerified':len(sources),'samples':len(samples),'lastSeenAt':seen[-1]['at'],'firstGoneAt':gone[0]['at'],'maxRssKiB':result['maximumObservedRssKiB'],'runtimeAccepted':result['runtimeAccepted']}))

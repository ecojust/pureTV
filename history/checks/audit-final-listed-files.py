#!/usr/bin/env python3
"""Read-only, targeted post-publication checksum and QA-source audit."""
from pathlib import Path
from datetime import datetime, timezone
import argparse, hashlib, json, re, subprocess

ROOT = Path('/workspace/pureTV-publish').resolve()

def sha(data):
    return hashlib.sha256(data).hexdigest()

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])

def digest(path):
    return sha(path.read_bytes())

def parse(line):
    # Current manifests use GNU text form; unsupported syntax must fail explicitly.
    match = re.fullmatch(r'([0-9a-fA-F]{64}) ([ *])(.+)', line)
    if not match:
        raise ValueError('Unsupported checksum line; no silent skip')
    return match[1].lower(), match[3], 'gnu-text' if match[2] == ' ' else 'gnu-binary'

def main():
    global ROOT
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', default=str(ROOT), help='Temporary original default; specify the repository path in a new environment')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    ROOT = Path(args.root).resolve()
    output = Path(args.output).resolve()
    assert ROOT not in output.parents and output != ROOT, 'Output must be outside the audited tree'
    head = git('rev-parse', 'HEAD').decode().strip()
    status = git('status', '--porcelain').decode()
    assert not status, 'Wait for a clean completed publication tree'
    progress_path = ROOT / 'resource/game-kit/progress.json'
    progress_bytes = progress_path.read_bytes()
    progress = json.loads(progress_bytes)
    assert progress['completed'] == 100 and len(progress['games']) == 100, 'Only run after game 100 is published'
    selected = [g for g in progress['games'] if 96 <= g['number'] <= 100]
    assert [g['number'] for g in selected] == [96,97,98,99,100]
    findings = []
    prior_path = ROOT / 'history/checks/sha256sums-audit-through-95.json'
    prior_expected = '9b6ed3c8301b9d6105def15ab387721f38455898e7051f361b097881b2e0f9f9'
    prior_actual = digest(prior_path)
    if prior_actual != prior_expected:
        findings.append({'category':'prior-report-identity','actual':prior_actual,'expected':prior_expected})
    games = []
    count = total_bytes = 0
    for game in selected:
        app = ROOT / game['path']
        manifest = app / 'SHA256SUMS.txt'
        row = {'number':game['number'], 'id':game['id'], 'manifest':str(manifest.relative_to(ROOT)), 'entries':[]}
        games.append(row)
        if not manifest.is_file():
            findings.append({'number':game['number'], 'field':'manifest', 'error':'missing'})
            continue
        row['manifestSha256'] = digest(manifest)
        row['manifestBytes'] = manifest.stat().st_size
        lines = manifest.read_text().splitlines()
        if not lines:
            findings.append({'number':game['number'], 'field':'manifest', 'error':'empty checksum manifest'})
        for number, line in enumerate(lines, 1):
            try:
                expected, filename, syntax = parse(line)
                relative = Path(filename)
                path = (app / relative).resolve()
                if relative.is_absolute() or ROOT not in path.parents:
                    raise ValueError('Path must resolve inside the publication repository')
                data = path.read_bytes()
                actual = sha(data)
                record = {'line':number, 'filename':filename, 'syntax':syntax, 'resolved':str(path.relative_to(ROOT)), 'bytes':len(data), 'expectedSha256':expected, 'actualSha256':actual, 'passed':actual == expected}
                row['entries'].append(record)
                count += 1
                total_bytes += len(data)
                if not record['passed']:
                    findings.append({'number':game['number'], 'field':'checksum', **record})
            except (ValueError, OSError) as error:
                findings.append({'number':game['number'], 'field':'checksum-line', 'line':number, 'error':str(error)})
        row['passed'] = not any(f.get('number') == game['number'] for f in findings)
    configs = [
        {'number':95,'id':'star-formation','testCommit':'5c19637a88e423a7f0cb91d77b2219da3e973ceb','productionCommit':'35d5c7e6f177992cfec5b6687dd21767c52378bb','provenance':'docs/qa-sources/execution-provenance.json','originalArchive':'docs/qa-sources/automation-frozen.mjs','files':[('tests/automation.mjs','docs/qa-sources/automation-executed.mjs','7dd6e501c994dc900f31e53ea084a49ec79e8575990b431211e1cd018a83036f'),('tests/retry-check.mjs','docs/qa-sources/retry-check-executed.mjs','c513749d1b17d85bc303e1a36ce17cf489f1e881777a87e5246ad74624524aa0')]},
        {'number':96,'id':'river-hopper','testCommit':'49956f7a51993214ac8c09e401cfa2ace6f315fa','productionCommit':'af1870a403d12d2b05d47e81d3cc637c9e9e699b','provenance':'docs/final-browser-summary.json','originalArchive':'docs/qa-harness-source/automation-before-retry-fix.mjs','files':[('tests/automation.mjs','docs/qa-harness-source/automation-tested.mjs','2a1a30a93e94e68b6912ede60b5a2d7e42fd02f47967ae9c298b3ff93a430f2e'),('tests/retry-assertion-test.mjs','docs/qa-harness-source/retry-assertion-test.mjs','330f5a7e2d2b6b864c3382ee1253d3eb1aa77616743d7f490c293c7a9f626487')]}
    ]
    dual = []
    for config in configs:
        app = ROOT / 'resource/apps' / config['id']
        result = {k:v for k,v in config.items() if k != 'files'}
        result['checks'] = []
        result['testFiles'] = []
        dual.append(result)
        def check(field, actual, expected):
            entry = {'field':field, 'actual':actual, 'expected':expected, 'passed':actual == expected}
            result['checks'].append(entry)
            if not entry['passed']:
                findings.append({'number':config['number'], 'category':'dual-test-source', **entry})
        for path, archive, expected in config['files']:
            blob = git('show', config['testCommit'] + ':' + str((app / path).relative_to(ROOT)))
            hs = {'published':digest(app/path), 'executedArchive':digest(app/archive), 'testCommitBlob':sha(blob), 'expectedExecutedSha256':expected}
            result['testFiles'].append({'path':path, 'archive':archive, **hs})
            for location in ['published', 'executedArchive', 'testCommitBlob']:
                check(path+':'+location, hs[location], expected)
        resource = json.loads((app/'resource.json').read_text())
        receipt = json.loads((app/'docs/signing-receipt.json').read_text())
        provenance = json.loads((app/config['provenance']).read_text())
        check('resource.sourceCommit',resource['sourceCommit'],config['productionCommit'])
        check('signingReceipt.sourceSha',receipt['sourceSha'],config['productionCommit'])
        check('executionProvenance.testExecutionCommit',provenance['testExecutionCommit'],config['testCommit'])
        original = git('show',config['productionCommit']+':'+str((app/'tests/automation.mjs').relative_to(ROOT)))
        check('originalAutomationArchiveMatchesSigningSource',digest(app/config['originalArchive']),sha(original))
        check('testAndProductionCommitsDiffer',config['testCommit'] != config['productionCommit'],True)
        check('correctedAdapterDiffersFromOriginal',digest(app/'tests/automation.mjs') != sha(original),True)
        result['sourceRecordHashes'] = {p:digest(app/p) for p in ['resource.json','docs/signing-receipt.json',config['provenance'],config['originalArchive']]}
        result['passed'] = all(c['passed'] for c in result['checks'])
    ending_head = git('rev-parse','HEAD').decode().strip()
    ending_status = git('status','--porcelain').decode()
    stable = head == ending_head and progress_bytes == progress_path.read_bytes() and not ending_status
    if not stable:
        findings.append({'category':'snapshot-stability','error':'HEAD, progress or worktree changed during audit'})
    report = {
        'schema':1,'kind':'final-listed-checksums-and-dual-test-source-audit','createdAt':datetime.now(timezone.utc).isoformat(),
        'scope':{'root':str(ROOT),'listedChecksumNumbers':[96,97,98,99,100],'dualTestSourceNumbers':[95,96],'capturedCompleted':100,'capturedHead':head,'endingHead':ending_head,'progressSha256':sha(progress_bytes),'progressUnchangedDuringAudit':progress_bytes == progress_path.read_bytes(),'worktreeCleanAtStart':not status,'worktreeCleanAtEnd':not ending_status,'stable':stable},
        'auditorScriptSha256':digest(Path(__file__).resolve()),
        'method':{'readOnlyExceptScratchOutput':True,'listedFileSha256Recomputed':True,'requireCompleteInventory':False,'checksumSyntax':'Strict unescaped GNU text/binary format; every unsupported line is a failure. No blank or comment lines are silently skipped.','testIdentity':'Published tests compared byte hashes with preserved executed source and exact git testCommit blobs; original adapter archive compared with production source git blob.','productionSource':'Stored resource and signing receipt production identifiers checked; no new APK verification claim.','browserRun':False,'modelTestsRun':False,'buildOrSigningRun':False,'cryptographicSignatureVerificationRun':False,'videoDecodeRun':False,'physicalDeviceTestRun':False},
        'summary':{'checksumGames':len(games),'manifestsPresent':sum('manifestSha256' in g for g in games),'listedEntriesChecked':count,'uniqueResolvedFilesHashed':len({entry['resolved'] for game in games for entry in game['entries']}),'bytesHashedAcrossEntries':total_bytes,'dualSourceGames':len(dual),'testFilesCompared':sum(len(x['testFiles']) for x in dual),'findingCount':len(findings),'passed':not findings},
        'findings':findings,'games':games,'dualTestSources':dual,
        'priorDisjointChecksumAudit':{'path':'history/checks/sha256sums-audit-through-95.json','sha256':prior_actual,'expectedSha256':prior_expected,'reportHashMatched':prior_actual == prior_expected,'numbers':'1-95','notRerunHere':True},
        'limitations':['Only explicitly listed checksum files are checked; this is not a complete application inventory audit.','Original 1-95 checksum audit is referenced, not rerun or retroactively claimed to use this script.','Test source identity and archived metadata do not alone prove a test run; existing canonical QA reports remain the execution evidence.','No game replay, model test rerun, video decode, cryptographic signature validation, or physical TV/phone test was performed.'],
        'reproduce':f'python3 {Path(__file__).resolve()} --root {ROOT} --output {output}'
    }
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'report':str(output),'sha256':digest(output),'bytes':output.stat().st_size,**report['summary']},ensure_ascii=False))
    return 0 if report['summary']['passed'] else 1

if __name__ == '__main__':
    raise SystemExit(main())

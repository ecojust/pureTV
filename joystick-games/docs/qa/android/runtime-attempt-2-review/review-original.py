#!/usr/bin/env python3
"""Read-only audit of original failed run 44115154856; never changes its verdict."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import subprocess

p = argparse.ArgumentParser()
p.add_argument('--export', type=Path, required=True)
p.add_argument('--repo', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
a = p.parse_args()
assert not a.output.exists()
qa = '8d6475980ce2312df8839a38dd724794eb59b83b'
def meta(path):
    return {'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
rows = []
for path in sorted(a.export.rglob('report.json')):
    r = json.loads(path.read_text())
    if 'apk' not in r: continue
    base = path.parent
    assert r['sourceCommit'] == qa and r['status'] == 'failed'
    assert 'two-identities timed out' in r['error'] and r['defaultPortOccupiedFixture'] is False
    for source, expected in r['sourceFiles'].items():
        assert meta(base/'source'/source) == expected
        committed = subprocess.check_output(['git', 'show', qa+':'+source], cwd=a.repo)
        assert hashlib.sha256(committed).hexdigest() == expected['sha256']
    wire_path = base/'wire.jsonl'
    wire = [json.loads(line) for line in wire_path.read_text().splitlines()]
    assert all(json.loads(row['line']) == row['message'] for row in wire)
    primary = [row for row in wire if row['connection'] == 1]
    sent = [row for row in primary if row['direction'] == 'sdk-to-game']
    replies = [row for row in primary if row['direction'] == 'game-to-sdk']
    assert all(row['message']['type'] == 'ack' for row in replies)
    expected = Counter(row['message']['seq'] for row in sent)
    actual = Counter(row['message']['seq'] for row in replies)
    assert expected == actual and all(n == 1 for n in actual.values())
    rejected = [row for row in wire if row['connection'] == 2]
    rejected_replies = [row['message'] for row in rejected if row['direction'] == 'game-to-sdk']
    assert rejected_replies == [{'type': 'error', 'message': 'controller_busy', 'seq': 1}]
    assert {row['connection'] for row in wire} == {1, 2}
    assert all(x['afterPollCount'] >= x['beforePollCount']+x['minimumFrames'] for x in r['freshnessChecks'])
    images = []
    for image in r['captures']:
        actual = meta(base/image['path'])
        assert all(image[k] == v for k, v in actual.items())
        images.append({'path': str((base/image['path']).relative_to(a.export)), **actual})
    assert {image['path'] for image in r['captures']} == {'connected.png', 'playing.png', 'paused.png'}
    video = base/r['video']['path']
    assert all(r['video'][k] == v for k, v in meta(video).items())
    probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,width,height', '-of', 'json', str(video)], capture_output=True, text=True, check=True)
    decode = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(video), '-vsync', '0', '-enc_time_base', '-1', '-f', 'null', '-'], capture_output=True, text=True, check=True)
    assert not decode.stderr
    rows.append({'game': r['game'], 'originalStatus': r['status'], 'originalReport': {'path': str(path.relative_to(a.export)), **meta(path)},
                 'originalWire': {'path': str(wire_path.relative_to(a.export)), **meta(wire_path)},
                 'partialTestsPassed': len(r['tests']), 'freshnessChecks': len(r['freshnessChecks']),
                 'primarySdkMessages': len(sent), 'primaryActualAcks': len(replies),
                 'secondSdkMessages': sum(row['direction'] == 'sdk-to-game' for row in rejected),
                 'secondActualResponse': rejected_replies[0], 'secondResponseIsAck': False,
                 'primaryIdentity': sent[0]['message']['controller_id'],
                 'service': r['controllerService'], 'targetPid': r['targetPid'], 'apk': r['apk'], 'observer': r['observer'],
                 'images': images, 'video': {'path': str(video.relative_to(a.export)), **meta(video), 'probe': json.loads(probe.stdout), 'fullDecodePassed': True},
                 'unreached': ['disconnect/reconnect', 'held-sync suppression', 'final same-PID/port assertion', 'occupied-port runtime']})
assert len(rows) == 2
a.output.write_text(json.dumps({'sourceRun': 44115154856, 'sourceQaCommit': qa,
    'sourceArtifactCommit': 'd30e1ce26abbf27d07d149b708c6a491abb105b3',
    'sourceExportCommit': '1163ce4f6f0d902b302ffd5e4730aa192ba39fe2',
    'classification': 'QA expected two simultaneous seats, but unchanged Android host has one seat and correctly returned controller_busy.',
    'originalVerdictPreserved': 'failed', 'productionChangesRequiredForThisFailure': False,
    'manualPixelReview': 'See visual-review.json; automated PNG hashes do not prove visible pixels.',
    'runtimeReports': rows, 'executedVerifier': meta(Path(__file__)),
    'physicalTvTested': False, 'physicalPhoneTested': False, 'physicalEsp32Tested': False}, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'failedReportsReviewed': len(rows), 'primarySdkMessagesAndAcks': sum(row['primaryActualAcks'] for row in rows), 'explicitBusyResponses': 2, 'pngHashesVerified': 6, 'videosFullyDecoded': 2}))

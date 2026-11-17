import assert from 'node:assert/strict';
import test from 'node:test';
import { createFrameStream } from './frame-stream.mjs';

test('ACK and explicitly log nonfinite, backward and duplicate timestamps without changing retained times', () => {
  const acks = [], stream = createFrameStream({ acknowledge:id => acks.push(id) });
  const times = [100, NaN, 99.5, 100, Infinity, undefined, 100.25];
  const accepted = times.map((timestamp, i) => stream.observe({ timestamp, receivedAt:1000+i, sha256:'hash-'+i, sessionId:i })).filter(Boolean);
  assert.deepEqual(acks, [0,1,2,3,4,5,6]);
  assert.deepEqual(accepted.map(f => f.timestamp), [100,100.25]);
  assert.deepEqual(accepted.map(f => f.file), ['frame-00000.jpg','frame-00001.jpg']);
  const stats = stream.stats();
  assert.equal(stats.rawCdpFrames, 7); assert.equal(stats.acceptedCdpFrames, 2); assert.equal(stats.droppedCdpFrames, 5);
  assert.deepEqual(stats.droppedFrames.map(f => f.reason), ['nonfinite-timestamp','backward-timestamp','duplicate-timestamp','nonfinite-timestamp','nonfinite-timestamp']);
  assert.deepEqual(stats.droppedFrames[1], { rawIndex:2,timestamp:99.5,priorTimestamp:100,receivedAt:1002,reason:'backward-timestamp',sha256:'hash-2' });
  assert.equal(stats.droppedFrames[0].timestamp, 'NaN'); assert.equal(stats.droppedFrames[3].timestamp, 'Infinity'); assert.equal(stats.droppedFrames[4].timestamp, 'undefined');
});

test('a stale callback after stopping is ACKed and cannot write or reuse the final screenshot filename', () => {
  const acks = [], stream = createFrameStream({ acknowledge:id => acks.push(id) });
  const first = stream.observe({ timestamp:1,receivedAt:10,sha256:'first',sessionId:1 });
  stream.stop();
  const finalFile = stream.finalFilename();
  assert.equal(stream.observe({ timestamp:2,receivedAt:20,sha256:'late',sessionId:2 }), null);
  const otherFinalFile = stream.finalFilename();
  assert.deepEqual(acks, [1,2]);
  assert.equal(new Set([first.file,finalFile,otherFinalFile]).size, 3);
  assert.deepEqual(stream.stats().droppedFrames[0], { rawIndex:1,timestamp:2,priorTimestamp:1,receivedAt:20,reason:'after-stream-stop',sha256:'late' });
});

test('invalid leading frames do not invent coverage or a timestamp baseline', () => {
  const stream = createFrameStream();
  assert.equal(stream.observe({ timestamp:NaN,receivedAt:1,sha256:'bad',sessionId:1 }), null);
  assert.equal(stream.stats().acceptedCdpFrames, 0);
  const frame = stream.observe({ timestamp:7.123456,receivedAt:2,sha256:'good',sessionId:2 });
  assert.equal(frame.timestamp, 7.123456);
  assert.equal(stream.stats().droppedFrames[0].priorTimestamp, null);
  const copy = stream.stats(); copy.droppedFrames[0].reason = 'tampered';
  assert.equal(stream.stats().droppedFrames[0].reason, 'nonfinite-timestamp');
});

/* Lantern Rhythm: observed phrases, actual onset/hold timing, cancellable input. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 60, EPS = 1e-9;
  var DIRECTIONS = { U: 'up', R: 'right', D: 'down', L: 'left' };
  var LEVELS = [
    { name: '港口三拍', phrases: ['Us Rl Ls', 'Dl Ls Us', 'Rs Dl Ul'] },
    { name: '海湾四拍', phrases: ['Us Ll Ds Rl', 'Rl Us Ls Dl', 'Ds Rs Ul Ll'] },
    { name: '远礁五拍', phrases: ['Ls Ul Rs Dl Ls', 'Ul Ds Rl Ls Ds', 'Rs Ll Us Rl Dl'] }
  ];
  function finite(n, fallback) { return typeof n === 'number' && Number.isFinite(n) ? n : fallback; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function direction(input) {
    var x = clamp(finite(input.x, 0), -1, 1), y = clamp(finite(input.y, 0), -1, 1);
    if (Math.max(Math.abs(x), Math.abs(y)) < 0.25) return null;
    return Math.abs(x) >= Math.abs(y) ? x > 0 ? 'right' : 'left' : y > 0 ? 'down' : 'up';
  }
  function emit(s, type, data) { if (s.events.length < 32) s.events.push(Object.assign({ type: type, tick: s.tick }, data || {})); }
  function feedback(s, type, reason, duration, holdDuration) {
    s.feedback = { type: type, reason: reason || null, index: s.answered, at: s.elapsed, expiresAt: s.elapsed + duration };
    if (holdDuration !== undefined) s.feedback.holdDuration = holdDuration;
  }
  function refresh(s) {
    s.remaining = Math.max(0, s.timeLimit - s.elapsed);
    s.litCount = s.beacons.filter(function (b) { return b.lit; }).length;
    var prefix = s.beacons[s.phraseIndex].lit ? 0 : s.answered;
    s.correctNotes = s.litCount * s.phraseLength + prefix; s.score = s.litCount * 1000 + prefix * 100;
    s.nextOnset = (s.mode === 'count-in' || s.mode === 'respond') && s.answered < s.phraseLength ? s.onsets[s.answered] : null;
    s.countInRemaining = s.nextOnset === null ? 0 : Math.max(0, s.nextOnset - s.elapsed);
    if (s.activeHold) s.activeHold.duration = Math.max(0, s.elapsed - s.activeHold.startedAt);
    if (s.feedback && s.elapsed >= s.feedback.expiresAt - EPS) s.feedback = null;
    s.visibleCue = null;
    if (s.mode === 'listen') {
      var index = Math.floor((s.elapsed - s.listenStartedAt + EPS) / s.beatPeriod);
      if (index >= 0 && index < s.phraseLength) {
        var start = s.listenStartedAt + index * s.beatPeriod, age = s.elapsed - start;
        if (age >= -EPS && age < s.cueDisplayDuration - EPS) {
          var note = s._phrases[s.phraseIndex][index], duration = note.kind === 'short' ? s.shortDuration : s.longDuration;
          s.visibleCue = { index: index, direction: note.direction, kind: note.kind, duration: duration, startedAt: start, active: age < duration - EPS };
        }
      }
    }
  }
  function finish(s, phase, reason) {
    refresh(s); s.phase = phase; s.lostReason = reason || null; s._remainder = 0;
    s.activeHold = null; s._heldKind = null; s.visibleCue = null;
    if (phase === 'won') {
      s.score += Math.floor(s.remaining) * 10 + s.replaysRemaining * 100 + (s.maxMistakes - s.mistakes) * 50;
      s.message = '沿岸三座灯塔全部点亮！';
    } else s.message = reason === 'timeout' ? '90 秒作业窗口结束 · 按 R 再试' : '失误次数已用完 · 先记方向，再按节拍长短复现';
    emit(s, phase, { reason: reason || null });
  }
  function beginListen(s) {
    s.mode = 'listen'; s.answered = 0; s.activeHold = null; s._heldKind = null;
    s.listenSerial += 1; s.listenStartedAt = s.elapsed + 0.8; s.listenEndsAt = s.listenStartedAt + s.phraseLength * s.beatPeriod;
    s.onsets = []; s.responseStartAt = null; s.nextOnset = null; s.visibleCue = null;
    s.message = '观察当前灯号 · 记住方向与短拍 / 长拍';
  }
  function countIn(s, firstOnset) {
    s.mode = 'count-in'; s.responseStartAt = firstOnset;
    for (var i = s.answered; i < s.phraseLength; i += 1) s.onsets[i] = firstOnset + (i - s.answered) * s.beatPeriod;
    s.visibleCue = null; s.message = '准备复现 · 每个拍点按方向并真实按住 A，再松开';
  }
  function advanceMode(s) {
    if (s.mode === 'feedback' && s.elapsed >= s._feedbackEndsAt - EPS) {
      if (s._feedbackNext === 'next') s.phraseIndex += 1;
      beginListen(s);
    }
    if (s.mode === 'listen' && s.elapsed >= s.listenEndsAt - EPS) countIn(s, s.listenEndsAt + s.countInDuration);
    if (s.mode === 'count-in' && s.elapsed >= s.onsets[s.answered] - s.onsetTolerance - EPS) s.mode = 'respond';
  }
  function mistake(s, reason, held) {
    var index = s.answered;
    s.mistakes += 1; s.lastError = reason; s.answered = 0; s.activeHold = null; s._heldKind = null; s.requiresNeutral = true;
    s.mode = 'feedback'; s._feedbackNext = 'retry'; s._feedbackEndsAt = s.elapsed + 0.8; s.onsets = []; s.responseStartAt = null;
    feedback(s, 'mistake', reason, 0.8, held); s.feedback.index = index;
    var messages = { early: '起拍太早', late: '起拍太迟', missed: '错过拍点', direction: '方向不匹配', 'too-short': '按住时间太短', 'wrong-duration': '按住时长不匹配', overhold: '按住时间过长' };
    s.message = (messages[reason] || '灯号未匹配') + ' · 松开 A 后重听本段';
    emit(s, 'mistake', { reason: reason, index: index }); refresh(s);
    if (s.mistakes >= s.maxMistakes) finish(s, 'lost', 'mistakes');
  }
  function accept(s, duration) {
    var index = s.answered, actualDirection = s.activeHold.direction;
    s.activeHold = null; s._heldKind = null; s.answered += 1; s.acceptedCount += 1;
    feedback(s, 'accepted', null, 0.5, duration); s.feedback.index = index;
    emit(s, 'accepted', { index: index, direction: actualDirection, holdDuration: duration });
    if (s.answered === s.phraseLength) {
      s.beacons[s.phraseIndex].lit = true; refresh(s);
      feedback(s, 'phrase-complete', null, 0.8); s.message = '本段匹配，灯塔点亮！'; emit(s, 'beacon', { id: s.phraseIndex + 1 });
      if (s.litCount === s.phraseCount) { finish(s, 'won'); return; }
      s.mode = 'feedback'; s._feedbackNext = 'next'; s._feedbackEndsAt = s.elapsed + 0.8;
    } else s.message = '第 ' + s.answered + ' 拍匹配 · 等待下一拍点';
  }
  function replay(s) {
    if (s.mode === 'feedback') { s.message = '请等本次反馈结束再请求重播'; return false; }
    if (s.replaysRemaining <= 0) { s.message = '重播机会已用完 · 继续按记忆复现'; return false; }
    s.replaysRemaining -= 1; s.replayCount += 1; s.requiresNeutral = true;
    beginListen(s); feedback(s, 'replay', 'requested', 0.8); s.message = '重听本段 · 剩余重播 ' + s.replaysRemaining + ' 次';
    emit(s, 'replay', { phraseIndex: s.phraseIndex }); return true;
  }
  function cancel(s) {
    var resume = s.mode === 'count-in' || s.mode === 'respond';
    s._pendingCancel = false; s._pendingA = false; s._pendingB = false;
    s.activeHold = null; s._heldKind = null; s.requiresNeutral = true; s.cancelCount += 1;
    if (resume) { countIn(s, s.elapsed + s.countInDuration); s.resumeCount += 1; }
    feedback(s, 'cancel', resume ? 'recount' : 'input-cleared', s.countInDuration);
    s.message = resume ? '输入已取消 · 先松开 A，再按新倒数继续未答拍点' : '输入已取消 · 先松开 A，观察播放继续';
    emit(s, 'cancel', { resumed: resume, answered: s.answered });
  }
  function judge(s, input, edge) {
    if (s.mode !== 'count-in' && s.mode !== 'respond') {
      if (edge && input.a) s.requiresNeutral = true;
      return;
    }
    if (s.activeHold) {
      var duration = s.elapsed - s.activeHold.startedAt;
      var minimum = s._heldKind === 'short' ? s.shortMin : s.longMin, maximum = s._heldKind === 'short' ? s.shortMax : s.longMax;
      if (!input.a) {
        if (duration < minimum - EPS) mistake(s, 'too-short', duration);
        else if (duration > maximum + EPS) mistake(s, 'wrong-duration', duration);
        else accept(s, duration);
      } else if (duration > maximum + EPS) mistake(s, 'overhold', duration);
      return;
    }
    var onset = s.onsets[s.answered];
    if (edge) {
      if (s.elapsed < onset - s.onsetTolerance - EPS) { mistake(s, 'early'); return; }
      if (s.elapsed > onset + s.onsetTolerance + EPS) { mistake(s, 'late'); return; }
      var expected = s._phrases[s.phraseIndex][s.answered];
      if (s.playerDirection !== expected.direction) { mistake(s, 'direction'); return; }
      s.activeHold = { index: s.answered, direction: s.playerDirection, startedAt: s.elapsed, duration: 0 }; s._heldKind = expected.kind;
      emit(s, 'press', { index: s.answered, direction: s.playerDirection });
      if (!input.a) mistake(s, 'too-short', 0);
    } else if (s.elapsed > onset + s.onsetTolerance + EPS) mistake(s, 'missed');
  }
  function advance(s, input) {
    s.tick += 1; s.elapsed = s.tick * DT; s.remaining = Math.max(0, s.timeLimit - s.elapsed); s.playerDirection = direction(input);
    if (s.remaining <= EPS) { finish(s, 'lost', 'timeout'); return; }
    var wasCancelled = s._pendingCancel;
    if (wasCancelled) cancel(s);
    advanceMode(s);
    if (wasCancelled || input.cancelled) {
      s._pendingA = false; s._pendingB = false; refresh(s); return;
    }
    var aEdge = s._pendingA, bEdge = s._pendingB; s._pendingA = false; s._pendingB = false;
    if (bEdge && replay(s)) { refresh(s); return; }
    if (s.requiresNeutral) {
      aEdge = false;
      if (!input.a) s.requiresNeutral = false;
    }
    judge(s, input, aEdge);
    if (s.phase === 'playing') refresh(s);
  }
  function create(seed, difficulty) {
    var index = clamp(Math.floor(finite(difficulty, 0)), 0, 2), level = LEVELS[index];
    var phrases = level.phrases.map(function (phrase) { return phrase.split(' ').map(function (note) { return { direction: DIRECTIONS[note[0]], kind: note[1] === 's' ? 'short' : 'long' }; }); });
    var s = { seed: finite(seed, 1) >>> 0, difficulty: index, level: index + 1, levelName: level.name, width: 960, height: 540,
      phase: 'playing', mode: 'listen', lostReason: null, tick: 0, elapsed: 0, remaining: 90, timeLimit: 90, score: 0,
      phraseIndex: 0, phraseCount: 3, phraseLength: phrases[0].length, answered: 0, litCount: 0, correctNotes: 0,
      beacons: [{ id: 1, x: 280, y: 438, lit: false }, { id: 2, x: 480, y: 456, lit: false }, { id: 3, x: 680, y: 438, lit: false }],
      beatPeriod: 1.5, onsetTolerance: 0.22, countInDuration: 1.8, cueDisplayDuration: 1.05,
      shortDuration: 0.30, shortMin: 0.14, shortMax: 0.46, longDuration: 0.72, longMin: 0.56, longMax: 0.88,
      visibleCue: null, listenSerial: 0, listenStartedAt: 0, listenEndsAt: 0, onsets: [], nextOnset: null, responseStartAt: null, countInRemaining: 0,
      playerDirection: null, activeHold: null, feedback: null, lastError: null, requiresNeutral: false,
      mistakes: 0, maxMistakes: 4, replaysRemaining: 2, maxReplays: 2, replayCount: 0, acceptedCount: 0, cancelCount: 0, resumeCount: 0,
      message: '', events: [], _phrases: phrases, _heldKind: null, _feedbackNext: null, _feedbackEndsAt: 0,
      _remainder: 0, _aDown: false, _bDown: false, _pendingA: false, _pendingB: false, _cancelEpoch: null, _pendingCancel: false };
    beginListen(s); refresh(s); return s;
  }
  function step(s, dt, input) {
    if (!s || s.phase !== 'playing') return s;
    dt = clamp(finite(dt, 0), 0, 0.25); if (!dt) return s;
    input = input || {}; s.events = [];
    var epoch = finite(input.cancelEpoch, -1);
    if (epoch >= 0) {
      epoch = Math.floor(epoch);
      if (s._cancelEpoch === null) s._cancelEpoch = epoch;
      else if (epoch > s._cancelEpoch) { s._cancelEpoch = epoch; s._pendingCancel = true; }
    }
    if (!input.cancelled && !s._pendingCancel) {
      if (input.aPressed || (input.a && !s._aDown)) s._pendingA = true;
      if (input.bPressed || (input.b && !s._bDown)) s._pendingB = true;
    }
    s._aDown = !!input.a; s._bDown = !!input.b; s._remainder += dt;
    while (s._remainder >= DT - EPS && s.phase === 'playing') { s._remainder = Math.max(0, s._remainder - DT); advance(s, input); }
    return s;
  }
  return { create: create, step: step, TICK_HZ: 60 };
});

// Autopilot tutor: while the autopilot flies, say what it is doing and why, in words a
// first-timer (or a kid) can follow, so watching it is a lesson. Pure: no THREE, no DOM;
// tested in tests/unit/apTutor.test.js. main.js shows the caption, speaks it when sound is
// on, lights the stick and throttle the autopilot is moving, and offers "Your turn".

// The tutor's on/off flag and its blank state live in tutorPrefs.js (boot: the start screen's
// checkbox); this module is a lazy chunk main.js loads after boot (0091, boot JS budget).
import { TUTOR_KEY, createTutor, tutorOn, setTutorOn } from './tutorPrefs.js';
export { TUTOR_KEY, createTutor, tutorOn, setTutorOn };
// A same-or-lower-rank caption waits until its condition has held this long, and the
// caption on screen stays at least TUTOR_MIN_READ_S so it can be read.
export const TUTOR_MIN_HOLD_S = 1.5;
export const TUTOR_MIN_READ_S = 3.5;

// v: { targetKts, hdgDeg, altFt } filled in by the caller when the text is shown.
export const TUTOR_TEXT = {
  intercept: () => '正在转向跑道，留意操纵杆和机翼的倾斜方向。',
  high: () => "高度稍高，略微低头回到 3° 下滑道。",
  low: () => '高度稍低，略微抬头并加推力，回到下滑道。',
  slow: (v) => `空速低于 ${v.targetKts} 节，正在加推力。`,
  fast: (v) => `空速高于 ${v.targetKts} 节，正在收油门。`,
  onpath: () => '已在下滑道上，跑道旁的 PAPI 灯显示两白两红。',
  flare: () => '正在拉平，轻轻抬头，让主轮平顺接地。',
  retard: () => '即将接地，油门收至慢车。',
  rollout: () => '已接地！保持跑道中线，刹车停稳。',
  cruise: (v) => `保持航向 ${v.hdgDeg}°、高度 ${v.altFt} 英尺，用小幅操纵保持稳定。`,
  heading: (v) => `保持航向 ${v.hdgDeg}°，通过倾斜机翼转向，再恢复平飞。`,
  altitude: (v) => `保持 ${v.altFt} 英尺，通过俯仰调整高度。`,
};
const RANK = { onpath: 1, cruise: 1, heading: 1, altitude: 1, high: 2, low: 2, slow: 2, fast: 2, intercept: 2, flare: 4, retard: 4, rollout: 5 };

// s: { apMaster, apApproach, apHdgHold, apAltHold, onGround, aglFt (radio altitude, 0122), crossM,
//      heightAbovePathM, iasKts, targetKts }
export function tutorTarget(s) {
  if (!s.apMaster) return null;
  if (s.apApproach) {
    if (s.onGround) return 'rollout';
    if (s.aglFt <= 20) return 'retard'; // radio altitude, with the GPWS "retard" (0122)
    if (s.aglFt < 50) return 'flare';
    if (Math.abs(s.crossM) > 30) return 'intercept';
    if (s.heightAbovePathM > 8) return 'high';
    if (s.heightAbovePathM < -8) return 'low';
    if (s.iasKts < s.targetKts - 4) return 'slow';
    if (s.iasKts > s.targetKts + 4) return 'fast';
    return 'onpath';
  }
  if (s.apHdgHold && s.apAltHold) return 'cruise';
  if (s.apHdgHold) return 'heading';
  if (s.apAltHold) return 'altitude';
  return null;
}

// Advances the tutor one frame; mutates and returns t (no per-frame allocation).
export function stepTutor(t, s, dt) {
  const target = tutorTarget(s);
  t.shownS += dt;
  if (target === t.caption) { t.pending = null; t.pendingS = 0; return t; }
  // Autopilot off clears at once; an urgent phase (flare, idle, touchdown) interrupts.
  // Everything else must persist, so a speed blip doesn't flash a caption.
  const urgent = target !== null && RANK[target] >= 4 && (t.caption === null || RANK[target] > RANK[t.caption]);
  if (target === null || t.caption === null || urgent) {
    t.caption = target; t.shownS = 0; t.pending = null; t.pendingS = 0;
    return t;
  }
  if (target !== t.pending) { t.pending = target; t.pendingS = 0; }
  t.pendingS += dt;
  if (t.pendingS >= TUTOR_MIN_HOLD_S && t.shownS >= TUTOR_MIN_READ_S) {
    t.caption = target; t.shownS = 0; t.pending = null; t.pendingS = 0;
  }
  return t;
}

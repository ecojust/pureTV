// Captions for the spoken callouts (0117): the words audio.js says (GPWS altitudes, sink
// rate / pull up, retard, the stabilized gate, gear, windshear) on one line of text, shown
// for CAPTION_HOLD_S whether or not sound is on. Pure: `show(text)` is the only side effect,
// called when the line changes ('' clears it), never per frame.
// Preserve the original call signs for sequencing and prioritisation.
const ZH_CALLOUTS = {
  'one thousand': '一千', 'five hundred': '五百', 'four hundred': '四百', 'three hundred': '三百',
  'two hundred': '两百', 'one hundred': '一百', fifty: '五十', forty: '四十', thirty: '三十',
  twenty: '二十', ten: '十', retard: '收油门', 'throttle idle': '油门慢车',
  'sink rate': '下降率过大', 'too fast down': '下降过快', 'pull up': '拉起',
  'sink rate · too fast down': '下降率过大，请减缓下降',
  'too low, gear · gear down': '高度过低，请放起落架', 'overspeed · slow down': '已超速，请减速',
  'too low, gear': '高度过低，检查起落架', 'gear down': '放起落架',
  overspeed: '超速', 'slow down': '减速', 'unstabilized, go around': '进近不稳定，复飞',
  'windshear, windshear, windshear': '风切变，风切变，风切变', 'windshear ×3': '风切变 ×3',
  minimums: '到达决断高度', 'eighty knots': '八十节', rotate: '抬轮', 'positive rate': '正爬升率',
};
export const localizedCallout = (words) => ZH_CALLOUTS[words] ?? words;

export const CAPTION_HOLD_S = 1.2;
// Kid and Learner read plain words where the call is jargon (like TAKEOFF_CALLOUT_HUD_PLAIN).
// The triple windshear call reads as one word and a count (it fits the line).
const SHORT = { 'windshear, windshear, windshear': 'windshear ×3' };
export const captionWords = (words) => SHORT[words] || words;
const PLAIN = { retard: 'throttle idle', 'sink rate': 'sink rate · too fast down', 'too low, gear': 'too low, gear · gear down', overspeed: 'overspeed · slow down' };
export const plainCaption = (words) => PLAIN[words] || words;

// A height count (GPWS's "five hundred" … "ten", "retard") yields its place on a full line to a
// warning or the gate's call (0137).
const COUNT = /^(\w+ (thousand|hundred)|\w+ty|ten|retard|throttle idle)$/;

export function createCaption(show, holdS = CAPTION_HOLD_S) {
  let text = '';
  let last = '';
  let kept = ''; // the call before `last` still on the line, or ''
  let until = -1;
  return {
    // A call that queues behind the one being said (interrupt false in audio.js) joins it on
    // the line, two calls at most (two lines on a phone, 0137): the newest always shows, and of
    // the two before it a warning outlasts a height count (else the later one stays), so a burst
    // at the gate keeps "unstabilized, go around". One that cuts it off replaces it. The same
    // words again inside the window are ignored, so a repeated call doesn't keep the line up.
    // holdS: a longer line keeps itself up while it is said (the tower's clearance, 0145).
    say(words, now, queued = false, hold = holdS) {
      if (!words || (words === last && now < until)) return;
      const on = queued && now < until;
      const prev = on ? (kept && COUNT.test(last) && !COUNT.test(kept) ? kept : last) : '';
      text = prev ? `${prev} · ${words}` : words;
      kept = prev;
      last = words;
      until = now + hold;
      show(text);
    },
    update(now) {
      if (text && now >= until) { text = ''; kept = ''; show(''); }
    },
    get text() { return text; },
  };
}

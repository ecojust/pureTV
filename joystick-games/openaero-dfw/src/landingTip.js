// The one thing to fix next time (ticket 0061): a sentence under the grade on the results
// card, naming a number the card showed. Pure; part of the lazy results chunk (results.js),
// so it costs the boot budget nothing. Reads gradeLanding's own factor values and reasons
// (src/landing.js); tests/unit/landingTip.test.js feeds it real gradeLanding outputs, so a
// change to that wording fails there first.
// ctx: { kid (the Kid assist flies power, flare and line-up), noEngine (dead-stick) }.

// Ties go to the first in this order (the grade's own factor order).
const ORDER = ['rate', 'centreline', 'zone', 'flare', 'speed'];
const num = (s, i = 0) => Number((String(s).match(/-?\d+(\.\d+)?/g) || [])[i]);
const SMOOTH_FPM = 240; // where the grade's touchdown-rate bar starts to drop

const TIPS = {
  rate: (f) => (num(f.value) <= SMOOTH_FPM
    ? `接地下降率为 ${f.value}。拉平姿态再保持片刻，会更平稳。`
    : `接地下降率为 ${f.value}。下次稍早柔和抬头拉平，争取低于 ${SMOOTH_FPM} 英尺／分。`),
  centreline: (f) => `中线偏差为 ${f.value}。提前对正，让中线条纹一直保持在机头下方。`,
  zone: (f) => (num(f.value) < 150
    ? `接地点距入口仅 ${f.value}。瞄准再远一些的两条白色宽标线。`
    : `接地点为 ${f.value}。瞄准两条白色宽标线，避免长时间飘飞。`),
  flare: (f) => {
    const pitch = num(f.value), bank = num(f.value, 1);
    if (pitch < 0) return `接地时机头过低（${pitch.toFixed(1)}°）。请稍稍抬头，让主轮先接地。`;
    if (pitch < 1) return `接地姿态过平（仰角 ${pitch.toFixed(1)}°）。拉平时再抬高一点机头。`;
    if (pitch > 7) return `接地时仰角为 ${pitch.toFixed(1)}°。下次拉平时减少一些抬头量。`;
    return bankTip(bank);
  },
  speed: (f, ctx) => {
    const ias = num(f.value), vref = num(f.value, 1), d = Math.round(Math.abs(ias - vref));
    if (ias < vref) return `接地空速 ${ias} 节，比目标低 ${d} 节。拉平前请保持 ${vref} 节。`;
    return `接地空速 ${ias} 节，比目标（${vref} 节）高 ${d} 节。请提前减速${ctx.noEngine ? '' : '，飞至跑道上方时收至慢车'}。`;
  },
};
// Gentle bank is how a crosswind is landed (one wheel first): only the excess is the fault.
const bankTip = (bank) => `接地时坡度为 ${Math.abs(bank).toFixed(1)}°。只需用足够保持中线的倾角。`;
// The worst-scoring of keys (ties in ORDER); null when nothing lost points.
function worstOf(result, keys) {
  let worst = null;
  for (const f of result.factors) {
    if (keys.includes(f.key) && f.score < 100 && (!worst || f.score < worst.score)) worst = f;
  }
  return worst;
}

export function landingTip(result, ctx = {}) {
  // Drills with their own cards and a greaser get none.
  if (result.kind || result.grade === 'S') return null;
  if (result.shortField || result.noFlap || result.wingLow) return result.tip ?? null; // the lesson's own: 0181 (zone, roll, brakes), 0210 (speed, float), 0188 (the crab, the wing, the wheel)
  const by = (key) => result.factors.find((f) => f.key === key);
  const reason = result.reason || '';
  const settle = ctx.noEngine ? '保持着陆姿态，等待飞机下沉' : '保持着陆姿态，稍加推力或复飞';
  if (result.grade === 'CRASH') {
    if (/弹跳后/.test(reason)) return `弹跳后，${settle}。`;
    if (/^起落架未放下/.test(reason)) return '起落架未放下。最后进近时按 G 或「起落架」，确认显示已放下。';
    if (/^重着陆/.test(reason) && by('rate')) return `接地下降率 ${by('rate').value} 过大。下次提前拉平，争取低于 ${SMOOTH_FPM} 英尺／分。`;
    if (/^翼尖触地/.test(reason) && by('flare')) return bankTip(num(by('flare').value, 1));
    return null;
  }
  if (result.madeRunway === false) return null; // the dead-stick miss: its reason is the advice
  if (/^Should have gone around/.test(reason)) return '收到复飞提示时，将推力加至最大，爬升后再尝试进近。';
  // Kid flies the power, the flare and the line-up: the one thing left is letting it.
  if (ctx.kid) return '儿童模式下，短五边时松开操纵杆，飞机会自动对正和拉平。';
  if (/接地点在跑道入口之前/.test(reason)) return '接地点过早。在进近过程中保持 PAPI 灯两白两红。';
  if (/接地点偏出跑道/.test(reason)) return by('centreline').score <= 40 ? TIPS.centreline(by('centreline')) : TIPS.zone(by('zone'));
  if (result.bounces) {
    // Name what made it bounce, not what to do in the air (the coach said that).
    const f = worstOf(result, ['rate', 'speed', 'flare']);
    if (!f) return `飞机发生弹跳：${settle}。`;
    return `飞机发生弹跳。${TIPS[f.key](f, ctx)}`;
  }
  const f = worstOf(result, ORDER);
  return f ? TIPS[f.key](f, ctx) : null;
}

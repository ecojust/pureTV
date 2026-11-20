import { h, button, screenHeader, fmtMoney, attachMenuKeys, clear } from '../dom.js';
import { finalStats } from '../../data/career.js';

const signedMoney = (n) => (n < 0 ? '−' : '') + fmtMoney(Math.abs(n));
const points = (n) => (n < 0 ? '−' : '') + Math.round(Math.abs(n)).toLocaleString('en-US');

/** The final stats after the last track is passed: total money, the score and what it is made of, and the career counts. */
export function createFinalStatsScreen({ game, flow }) {
  const big = h('div.fs-big');
  const breakdown = h('div.res-table');
  const counts = h('div.fs-counts');
  let detach = null;
  const el = h('section.screen.screen-final', screenHeader('FINAL STATS', 'Every track passed.'),
    h('div.screen-body', h('div.results-wrap',
      h('div.panel', h('div.panel-title', 'TOTAL'), big),
      h('div', h('div.panel', h('div.panel-title', 'SCORE'), breakdown), h('div.panel', { style: { marginTop: '12px' } }, h('div.panel-title', 'CAREER'), counts)))),
    h('footer.screen-foot', h('p.muted.small.fs-note', 'Score = prize money + kill bonuses + contract net.'), button('TO THE GARAGE', () => flow.transition('garage'), 'btn-primary btn-garage')));
  return {
    el,
    show() {
      detach = attachMenuKeys(el);
      clear(big); clear(breakdown); clear(counts);
      const s = finalStats(game.getSave());
      big.append(h('div.fs-stat', h('span', 'MONEY'), h('b', fmtMoney(s.cash))), h('div.fs-stat', h('span', 'SCORE'), h('b', points(s.score))));
      const rows = [['PRIZE MONEY', s.earned.prize, fmtMoney], ['KILL BONUSES', s.earned.killBonus, fmtMoney], ['CONTRACT NET', s.earned.contractNet, signedMoney]];
      for (const [label, v, fmt] of rows) breakdown.append(h('div.pay-row', h('span', label), h('b', fmt(v))));
      breakdown.append(h('div.pay-row.total', h('span', 'SCORE'), h('b', points(s.score))));
      counts.append(
        h('div.pay-row', h('span', 'TRACKS PASSED'), h('b', `${s.tracksPassed}/${s.tracksTotal}`)),
        h('div.pay-row', h('span', 'RACES'), h('b', String(s.races))),
        h('div.pay-row', h('span', 'WINS'), h('b', String(s.wins))),
        h('div.pay-row', h('span', 'KILLS'), h('b', String(s.kills))));
    },
    hide() { detach?.(); },
  };
}

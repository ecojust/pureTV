import { h, button, screenHeader, fmtMoney, ordinal, attachMenuKeys, clear, animateCount } from '../dom.js';
import { finalStats } from '../../data/career.js';
import { getTrack } from '../../data/tracks/index.js';

/** The score is in the same units as the prize money, but is not cash, so it shows without the '$'. */
const signedPoints = (n) => (n < 0 ? '−' : '') + Math.round(Math.abs(n)).toLocaleString('en-US');

/** The winning lap: the player's car drives its lap behind the panel (TV view, fireworks), and the money and score are shown. */
export function createWinScreen({ game, flow }) {
  const head = h('div.res-head.win-head');
  const chips = h('div.win-chips');
  let detach = null, stops = [];
  const el = h('section.screen.screen-win.screen-3d', screenHeader('WINNING LAP'),
    h('div.screen-body', h('div.win-wrap', h('div.panel.win-panel', head, chips))),
    h('footer.screen-foot', button('FINAL STATS', () => flow.transition('finalStats'), 'btn-primary')));
  return {
    el,
    show(p) {
      detach = attachMenuKeys(el);
      stops.forEach((s) => s()); stops = [];
      clear(head); clear(chips);
      const stats = finalStats(game.getSave());
      const trackName = p?.result ? getTrack(p.result.trackId)?.name : null;
      const place = p?.summary ? ordinal(p.summary.position) : null;
      head.append(h('h2', 'CHAMPION'),
        h('p.muted', `All ${stats.tracksTotal} tracks passed${trackName ? ` · ${place} at ${trackName} to pass the last one` : ''}.`));
      const money = h('b', fmtMoney(0)), score = h('b', '0');
      chips.append(h('div.win-chip', h('span', 'MONEY'), money), h('div.win-chip', h('span', 'SCORE'), score));
      stops.push(animateCount(money, stats.cash, { fmt: fmtMoney, delay: 400, ms: 1200 }));
      stops.push(animateCount(score, stats.score, { fmt: signedPoints, delay: 600, ms: 1200 }));
    },
    hide() { detach?.(); stops.forEach((s) => s()); stops = []; },
  };
}


// Six real rounds, advanced only through the public result-screen keyboard controls.
import {keys as buildKeys,budgets} from './automation.mjs';
export {budgets};
let terminalLevel = null, terminalAt = 0;
export function keys(state,{elapsed=0}={}) {
  if (state.paused) return [];
  if (state.phase === 'lost') throw Error('Bridge campaign timed out at level '+state.model.level);
  if (state.phase === 'won') {
    if (state.model.level === 6) return [];
    if (terminalLevel !== state.model.level) {terminalLevel=state.model.level;terminalAt=elapsed;}
    if (elapsed-terminalAt < 2) return [];
    if (state.level === state.model.level-1) return ['ArrowRight'];
    return elapsed-terminalAt < 2.7 ? [] : ['Enter'];
  }
  return buildKeys(state,{elapsed,mode:state.model.level===1?'record':'qa'});
}

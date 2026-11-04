// Six real work orders, using observed receipts and normal result-screen input.
import {keys as assemblyKeys,budgets} from './automation.mjs';
export {budgets};
let terminalLevel = null, terminalAt = 0;
export function keys(state,{elapsed=0}={}) {
  if (state.paused) return [];
  if (state.phase === 'lost') throw Error('Assembly campaign failed at level '+state.model.level+': '+state.model.lostReason);
  if (state.phase === 'won') {
    if (state.model.level === 6) return [];
    if (terminalLevel !== state.model.level) {terminalLevel=state.model.level;terminalAt=elapsed;}
    if (elapsed-terminalAt < 2) return [];
    if (state.level === state.model.level-1) return ['ArrowRight'];
    return elapsed-terminalAt < 2.7 ? [] : ['Enter'];
  }
  return assemblyKeys(state,{elapsed,mode:'record'});
}

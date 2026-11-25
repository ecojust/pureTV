// Hint search off the main thread. Request: { seq, level, states (newest
// first; states[0] is the current one), cap, totalCap }.
// Reply: { seq, result: 'move' | 'back' | 'unknown', move, index }.
import { hintSearch } from './hint.js';

self.onmessage = e => {
  const { seq, level, states, cap, totalCap } = e.data;
  self.postMessage({ seq, ...hintSearch(level, states, cap, totalCap) });
};

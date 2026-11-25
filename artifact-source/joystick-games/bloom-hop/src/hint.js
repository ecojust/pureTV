// What the Hint button should do from here: the next move of a solution, or
// how far to hop back to a state that isn't proven dead.
import { solve } from './solver.js';

export function hintSearch(level, states, cap = 300000, totalCap = 1000000) {
  const now = solve(level, states[0], { cap, power: true });
  if (now.solvable === true) return { result: 'move', move: now.path[0] };
  if (now.solvable === null) return { result: 'unknown' };
  // Dead: walk back through the history, newest first.
  let spent = now.nodes;
  for (let i = 1; i < states.length; i++) {
    if (states[i].status !== 'play') continue;
    const left = totalCap - spent;
    if (left <= 0) return { result: 'back', index: i };
    const r = solve(level, states[i], { cap: Math.min(cap, left), power: true });
    spent += r.nodes;
    if (r.solvable !== false) return { result: 'back', index: i };
  }
  return { result: 'back', index: states.length - 1 };
}

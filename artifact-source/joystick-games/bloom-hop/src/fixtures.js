// Tiny debug-only levels for the play-test (never in level select).
// Each has a short key sequence in design/solutions/fixtures.json.
const base = { w: 5, h: 5, turtles: [], beetles: [], fish: [], reeds: [], area: 'morning', hint: '' };

export const FIXTURES = {
  // Get a Long Leap from a fish, arm it, pick a target, cancel, then leap.
  't-leap': { ...base, name: 'Test: Leap', pads: [[0, 0, 1], [1, 0, 2], [2, 0, 1], [4, 0, 1]],
    fish: [[1, 1, 'leap']], solution: 'R E JR2 L' },
  // A turtle that dives right after you land: warning, then dunk, then undo.
  't-dunk': { ...base, name: 'Test: Dunk', pads: [[0, 0, 2], [3, 0, 1], [0, 2, 1]],
    turtles: [[2, 0, 2, 2, 1]], solution: 'D' },
  // One hop to the Stuck card.
  't-stuck': { ...base, name: 'Test: Stuck', pads: [[0, 0, 1], [1, 0, 1], [4, 4, 1]], solution: '' },
  // One hop (U) into a pond that can't be finished; Hint hops back.
  't-dead': { ...base, name: 'Test: Dead end', pads: [[1, 3, 1], [4, 1, 2], [1, 1, 1], [2, 3, 2], [2, 1, 1]],
    solution: 'R U L R' },
  // A fish gift with a full slot (it waits), then with an empty one.
  't-fish': { ...base, w: 6, h: 6, name: 'Test: Fish', pads: [[0, 0, 1], [1, 0, 2], [2, 0, 1], [3, 0, 2], [5, 5, 1]],
    fish: [[1, 1, 'mend'], [2, 1, 'leap']], solution: 'R R M L R' },
};

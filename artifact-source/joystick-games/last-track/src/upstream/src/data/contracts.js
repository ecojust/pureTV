// Side contracts: bids from two patrons on the board. Pure data (no DOM, no three).
// A bid is offered once a track is chosen: each patron names racers from that track's field, the racers on the grid.
// A contract is accepted for the next race and settles when that race ends: wrecking every named racer pays the bounty,
// missing any of them costs the patron's penalty. Settlement lives in economy.js; this file is the terms.

export const CONTRACT_MAX_QUOTA = 3;

export const CONTRACT_PATRONS = [
  { id: 'military', name: 'Maj. Dana Holt', org: 'Federal Motor Corps', icon: 'target', perKill: 1000, penalty: 300,
    line: 'Clean work. Paid on the flag, cash, no paperwork.' },
  { id: 'mafia', name: 'Nico Varga', org: 'Lantern Street', icon: 'skull', perKill: 1400, penalty: 500,
    line: 'Nobody saw anything, and nobody will. Do the job and the family pays for the trouble.' },
];

export const getPatron = (id) => CONTRACT_PATRONS.find((p) => p.id === id) || null;

/** How many racers a patron names for the next race: 1..3, rotating with races run so the board changes. */
export function quotaFor(save, patron) {
  const i = Math.max(0, CONTRACT_PATRONS.indexOf(patron));
  const races = Math.max(0, Math.floor(Number(save?.races) || 0));
  return 1 + ((races + i) % CONTRACT_MAX_QUOTA);
}

/**
 * The racers a patron names from this track's field: quota of them (never more than the field has), rotating with races run
 * and with the patron, so the two patrons do not always name the same racers. Pure: same save and field, same names.
 */
export function targetsFor(save, patron, field = []) {
  const n = field.length, quota = Math.min(quotaFor(save, patron), n);
  if (quota < 1) return [];
  const i = Math.max(0, CONTRACT_PATRONS.indexOf(patron));
  const races = Math.max(0, Math.floor(Number(save?.races) || 0));
  const start = (races * 2 + i * 3) % n;
  return Array.from({ length: quota }, (_, k) => field[(start + k) % n]);
}

/** The board for the track just chosen: one bid per patron, naming racers from its field. Empty until there is a field. */
export function offersFor(save, field = []) {
  if (!field || !field.length) return [];
  return CONTRACT_PATRONS.map((p) => {
    const targets = targetsFor(save, p, field);
    return { patron: p.id, quota: targets.length, targets, bounty: targets.length * p.perKill, penalty: p.penalty };
  });
}

/** How many of the contract's named racers are among `wrecked` (driver ids the player wrecked). */
export function contractHits(contract, wrecked = []) {
  const targets = contract?.targets || [];
  return targets.filter((t) => wrecked.includes(t)).length;
}

/** HUD tally: named racers wrecked out of named, e.g. 'WRECK 1/2'. */
export function contractProgress(contract, wrecked = []) {
  if (!contract) return '';
  return `WRECK ${contractHits(contract, wrecked)}/${(contract.targets || []).length}`;
}

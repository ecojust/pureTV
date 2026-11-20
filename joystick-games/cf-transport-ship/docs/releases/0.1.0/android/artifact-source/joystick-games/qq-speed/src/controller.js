// pureTV-specific integration; original vehicle/track physics remain upstream.
export const PAD_KEYS = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'START', 'A', 'B', 'X', 'Y'];
export function drivingInput(pad = {}) {
  const b = pad.buttons || {}, p = pad.pressed || {};
  return { up: !!b.UP, down: !!b.DOWN, left: !!b.LEFT, right: !!b.RIGHT,
    shift: !!b.A, upPressed: !!p.UP, wPressed: !!p.X, nitroPressed: !!p.B,
    swapPressed: false, resetPressed: !!p.Y };
}
export function cancelDrift(player) {
  if (!player) return;
  player.endDrift(false);
  player.smallWindow = 0;
  player.windowKind = '';
}
export function focusables(screen) {
  return [...screen.querySelectorAll('button,.map,.opt,.skin')].filter(e => !e.disabled && e.getClientRects().length);
}
export function focusIn(screen, direction) {
  const items = focusables(screen);
  if (!items.length) return;
  let current = items.includes(document.activeElement) ? document.activeElement : null;
  if (!current) { (screen.querySelector('.sel') || items[0]).focus(); return; }
  const r = current.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const horizontal = direction === 'LEFT' || direction === 'RIGHT';
  const positive = direction === 'RIGHT' || direction === 'DOWN';
  const choices = items.filter(e => e !== current).map(e => {
    const b = e.getBoundingClientRect(), dx = b.left + b.width / 2 - x, dy = b.top + b.height / 2 - y;
    const along = horizontal ? dx : dy, across = horizontal ? dy : dx;
    return { e, along: positive ? along : -along, across: Math.abs(across) };
  }).filter(c => c.along > 2).sort((a, b) => (a.along + a.across * 3) - (b.along + b.across * 3));
  if (choices.length) { choices[0].e.focus(); choices[0].e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}

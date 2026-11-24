/** D-pad navigation over the current upstream menu (including sliders). */
export function navigateMenu(frame, menu, defaultButton, back) {
  if (!menu) return;
  const items = [...menu.querySelectorAll('button:not([disabled]), input:not([disabled])')].filter(el =>
    el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && el.closest('[hidden]') === null);
  if (!items.length) return;
  const p = frame.pressed;
  if (p.B) { back?.(); return; }
  let current = items.includes(document.activeElement) ? document.activeElement : defaultButton;
  if (!items.includes(current)) current = items[0];
  const index = items.indexOf(current);
  if (current.matches('input[type=range]') && (p.LEFT || p.RIGHT)) {
    if (p.LEFT) current.stepDown(); else current.stepUp();
    current.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (p.UP || p.DOWN || p.LEFT || p.RIGHT) {
    items[(index + (p.UP || p.LEFT ? -1 : 1) + items.length) % items.length].focus();
  } else if (p.A || p.START) {
    (p.START && items.includes(defaultButton) ? defaultButton : current).click();
  }
}

/** Handle the upstream accessibility dialog before its underlying game menu. */
export function navigateAccessibility(frame) {
  const modal = document.querySelector('.arena-modal');
  if (!modal) return false;
  const close = modal.querySelector('.arena-secondary');
  navigateMenu(frame, modal, close, () => close?.click());
  return true;
}

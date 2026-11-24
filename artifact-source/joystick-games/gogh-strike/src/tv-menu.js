const byId = id => document.getElementById(id);
const visibleControls = panel => [...panel.querySelectorAll('button:not(:disabled),input,summary')]
  .filter(control => control.getClientRects().length);
const direction = pressed => Number(pressed.RIGHT || pressed.DOWN) - Number(pressed.LEFT || pressed.UP);

function modalInput(panel, pressed, back, start) {
  if (pressed.B) { back(); return; }
  if (pressed.START) { start(); return; }
  const controls = visibleControls(panel);
  const active = document.activeElement;
  if (active?.type === 'range' && (pressed.LEFT || pressed.RIGHT)) {
    if (pressed.RIGHT) active.stepUp(); else active.stepDown();
    active.dispatchEvent(new Event('input', {bubbles:true}));
    return;
  }
  const step = direction(pressed);
  if (step && controls.length) {
    const index = controls.indexOf(active);
    controls[(index + step + controls.length) % controls.length].focus();
  } else if (pressed.A) {
    (controls.includes(active) ? active : controls[0])?.click();
  }
}

export function menuInput(ui, pressed) {
  if (!ui.isReady) return;
  const inspector = document.querySelector('dialog[open]');
  if (inspector) {
    modalInput(inspector, pressed, () => ui.artistInspector.close(), () => ui.artistInspector.close());
    return;
  }
  if (!byId('settings-panel').hidden) {
    modalInput(byId('settings-panel'), pressed, () => ui.closeSettings(), () => ui.closeSettings());
    return;
  }
  if (ui.screen === 'paused') {
    const resume = () => byId('resume-button').click();
    modalInput(byId('pause-panel'), pressed, resume, resume);
    return;
  }
  if (ui.screen === 'results') {
    modalInput(byId('results-panel'), pressed, () => ui.returnToMenu(), () => byId('rematch-button').click());
    return;
  }
  if (ui.screen !== 'menu') return;
  if (pressed.START || pressed.A) { ui.launch(); return; }
  if (pressed.X) { byId('inspect-artist').click(); return; }
  if (pressed.Y) { document.querySelector('.menu-brand .settings-open').click(); return; }
  if (pressed.UP || pressed.DOWN) {
    document.querySelector(`[data-team="${1 - ui.config.team}"]`).click();
    return;
  }
  const next = Number(pressed.RIGHT) - Number(pressed.LEFT);
  if (next) {
    const cards = [...byId('artist-options').querySelectorAll('button')];
    const selected = cards.findIndex(card => card.dataset.role === ui.config.role);
    cards[(selected + next + cards.length) % cards.length].click();
  }
}

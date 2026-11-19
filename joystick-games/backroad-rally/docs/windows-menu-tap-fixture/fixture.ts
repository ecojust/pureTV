// DOM/input contract fixture only. No rally renderer, model, storage or clock.
import { configurePureTv } from '../../src/upstream/src/puretv';
import { MenuController, Row } from '../../src/upstream/src/menu/ui';
const w = window as any;
const keys = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'START', 'A', 'B', 'X', 'Y'];
let revision = 0;
const counts = Object.fromEntries(keys.map(key => [key, 0]));
const events: any[] = [], confirmations: string[] = [], checks: any[] = [];
window.addEventListener('keydown', e => events.push({ code: e.code, repeat: e.repeat, at: performance.now() }), true);
const root = document.createElement('div'); root.className = 'menu-root'; document.body.append(root);
const ctl = new MenuController(root); ctl.active = true;
const content = document.createElement('div');
const rows = ['car', 'livery', 'choose stage', 'back'].map(text => new Row(ctl, content, { text, onPress: () => confirmations.push(text) }));
ctl.show({ el: content, rows });
configurePureTv({ phase: () => 'menu', ready: () => true, pause() {}, clear() {}, paused: () => false, audio: () => 'fixture', observe: () => ({ phase: 'menu' }) });
function receive(buttons: Record<string, boolean>) {
  w.JoystickDesktop.receive({ wifiController: { inputEnabled: true, port: 63485 } }, {
    revision: ++revision, inputEnabled: true, players: [{ id: 1, connected: true, transport: 'wifi', controllerId: 'fixture-only', session: 'fixture-session', cancelSeq: 0,
      buttons: Object.fromEntries(keys.map(key => [key, !!buttons[key]])), buttonCounters: { ...counts } }],
  });
}
const frames = async (n = 3) => { for (let i = 0; i < n; i++) await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); };
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const focus = () => document.querySelector('.menu-root .row.focus .text')?.textContent;
function check(name: string, passed: boolean) { checks.push({ name, passed }); if (!passed) throw new Error(name); }
async function tap(key: string, coalesced: boolean) {
  counts[key]++; receive({ [key]: true });
  if (!coalesced) await delay(16);
  receive({}); await frames(4);
}
(async () => {
  const result: any = { scope: 'Actual Windows bridge, Backroad pureTV adapter and original MenuController/Row; synthesized native transport input in DOM-only fixture, not native SDK or gameplay acceptance.', checks, passed: false, errors: [], clockOverrides: false, gameModelLoaded: false };
  try {
    receive({}); await frames();
    const pollBefore = w.JoystickGameQA.snapshot().controller.pollCount;
    await tap('DOWN', true);
    check('Counter-preserved down/release between polls moves original menu exactly one row', focus() === 'livery');
    check('Coalesced short tap emits one nonrepeat ArrowDown', events.filter(e => e.code === 'ArrowDown').length === 1 && events[0].repeat === false);
    check('Cached semantic keys released after real frame polls', !Object.values(w.JoystickGameQA.snapshot().controller.buttons).some(Boolean));
    await delay(650); await frames();
    check('Released tap does not repeat after original 420ms repeat delay', focus() === 'livery' && events.filter(e => e.code === 'ArrowDown').length === 1);
    await tap('DOWN', false);
    check('Ordinary 16ms down/release reaches choose stage once', focus() === 'choose stage' && events.filter(e => e.code === 'ArrowDown').length === 2);
    await tap('A', true);
    check('Coalesced confirm invokes original selected row once', confirmations.length === 1 && confirmations[0] === 'choose stage');
    await delay(650); await frames();
    check('Selection and released semantic input remain stable', focus() === 'choose stage' && !Object.values(w.JoystickGameQA.snapshot().controller.buttons).some(Boolean));
    check('Normal adapter frame polling continues', w.JoystickGameQA.snapshot().controller.pollCount > pollBefore + 8);
    result.passed = true;
  } catch (error) { result.errors.push(String(error)); }
  result.events = events; result.confirmations = confirmations; result.finalFocus = focus(); result.finalSnapshot = w.JoystickGameQA.snapshot();
  w.menuTapFixtureResult = result;
})();

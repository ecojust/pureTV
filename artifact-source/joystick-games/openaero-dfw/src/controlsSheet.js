// Controls cheat sheet (ticket 0049): keyboard, gamepad and touch, one "?" or one Controls button
// away. A lazy chunk: main.js imports it on the first open. The rows are data so a unit test can hold
// them to the bindings (tests/unit/controlsSheet.test.js fails when a bound key has no row).
// codes: KeyboardEvent.code values (main.js e.code / keys[], input.js), keys: KeyboardEvent.key values,
// buttons: gamepad.js BUTTON names, ids: the touch deck's element ids (index.html).
// acts (0171): keyMap.js actions; the sheet prints the player's own keys for those rows (codes stay the
// defaults, which is what every handler reads through input.js keyCode).
import { setKeyMap } from './input.js';
import { DEFAULT_KEYS, ACTION_WORDS, defaultMap, keyTable, rebindKey, keyLabel, keyNames, pressedLabel, saveKeys, clearKeys, loadKeys } from './keyMap.js';

export const KEYBOARD = [
  { input: 'W or ↓', does: '低头', codes: ['KeyW', 'ArrowDown'], acts: ['pitchDown'] },
  { input: 'S or ↑', does: '抬头', codes: ['KeyS', 'ArrowUp'], acts: ['pitchUp'] },
  { input: 'A or ←  /  D or →', does: '向左／向右倾斜', codes: ['KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight'], acts: ['bankLeft', 'bankRight'] },
  { input: 'Q / E', does: '踩方向舵，让机头向左／向右偏转', codes: ['KeyQ', 'KeyE'], acts: ['yawLeft', 'yawRight'] },
  { input: 'Shift / Ctrl (hold)', does: '加大／减小推力', codes: ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight'], acts: ['powerUp', 'powerDown'], hold: true },
  { input: '[ / ]  (Num 7 / Num 1)', does: '低头／抬头配平，使飞机保持目标姿态（飞行员模式，F-16 除外）', codes: ['BracketLeft', 'BracketRight', 'Numpad7', 'Numpad1'], acts: ['trimDown', 'trimUp'] },
  { input: '空格', does: '操纵杆回中，停止转动（模拟辅助）', codes: ['Space'], acts: ['center'] },
  { input: 'G', does: '收放起落架（仅限空中，塞斯纳除外）', codes: ['KeyG'], acts: ['gear'] },
  { input: 'F', does: '襟翼切换至下一挡', codes: ['KeyF'], acts: ['flaps'] },
  { input: 'B', does: '施加／松开刹车', codes: ['KeyB'], acts: ['brakes'] },
  { input: 'K', does: '切换自动刹车档位（737）', codes: ['KeyK'], acts: ['autobrake'] },
  { input: 'R', does: '地面打开反推（737，推力降至慢车）', codes: ['KeyR'], acts: ['reverse'] },
  { input: 'Z', does: '开关自动驾驶', codes: ['KeyZ'], acts: ['autopilot'] },
  { input: 'C', does: '切换视角', codes: ['KeyC'], acts: ['camera'] },
  { input: 'M', does: '开关鼠标操纵杆', codes: ['KeyM'], acts: ['mouseYoke'] },
  { input: 'H', does: '显示／隐藏仪表面板', codes: ['KeyH'], acts: ['panels'] },
  { input: 'L', does: '开关着陆灯，夜间可照亮前方地面', codes: ['KeyL'], acts: ['landingLight'] },
  { input: '?', does: '查看操作说明', keys: ['?'] },
  { input: 'Esc', does: '关闭菜单、机场通播或操作说明', keys: ['Escape'] },
  { input: 'Tab', does: '在菜单按钮间切换', keys: ['Tab'] },
  { input: '拖动鼠标／滚轮', does: '环顾四周／缩放外部视角' },
];

export const GAMEPAD = [
  { input: '左摇杆', does: '控制俯仰和倾斜（向后拉可抬头）' },
  { input: 'LB / RB', does: '踩方向舵，让机头向左／向右偏转' },
  { input: 'RT / LT', does: '加大／减小推力' },
  { input: '右摇杆向前／向后', does: '低头／抬头配平，使飞机保持目标姿态（飞行员模式，F-16 除外）' },
  { input: 'A', does: '襟翼切换至下一挡', buttons: ['A'] },
  { input: 'B', does: '收放起落架（仅限空中，塞斯纳除外）', buttons: ['B'] },
  { input: 'X', does: '施加／松开刹车', buttons: ['X'] },
  { input: 'Y', does: '切换视角', buttons: ['Y'] },
  { input: 'Start', does: '暂停／继续', buttons: ['START'] },
  { input: '方向键 ↑', does: 'ILS 自动着陆', buttons: ['DPAD_UP'] },
];

export const TOUCH = [
  { input: '右摇杆', does: '向上拖动可抬头，左右拖动可倾斜（飞行员模式在地面时可转向）', ids: ['touchStick'] },
  { input: '左侧滑杆', does: '油门：顶部为最大推力，底部为慢车', ids: ['touchThrottle'] },
  { input: '机头抬高／降低', does: '长按调节配平（飞行员模式，F-16 除外）', ids: ['touchTrimUp', 'touchTrimDn'] },
  { input: '起落架', does: '收放起落架（仅限空中，塞斯纳除外）', ids: ['touchGear'] },
  { input: '襟翼', does: '襟翼切换至下一挡', ids: ['touchFlaps'] },
  { input: '刹车', does: '施加／松开刹车', ids: ['touchBrakes'] },
  { input: 'ILS 自动／反推', does: 'ILS 自动着陆；737 在地面时此按钮控制反推', ids: ['touchIls'] },
  { input: '☰ 菜单', does: '暂停、视角、声音、任务和重置' },
  { input: '💡 开／关（在 ☰ 菜单中）', does: '着陆灯：夜间照亮前方跑道' },
];

// The left-handed layout (0221) swaps the stick's and slider's sides: name them where they are.
const swapSides = (rows) => rows.map((r) => r.ids?.[0] === 'touchStick' ? { ...r, input: '左摇杆' }
  : r.ids?.[0] === 'touchThrottle' ? { ...r, input: '右侧滑杆' } : r);

// A touch screen reads its own controls first.
export function sheetSections(touch, left = false) {
  const kb = { title: '键盘与鼠标', rows: KEYBOARD };
  const pad = { title: '手柄', rows: GAMEPAD };
  const t = { title: '触控', rows: left ? swapSides(TOUCH) : TOUCH };
  return touch ? [t, kb, pad] : [kb, pad, t];
}

// --- The player's keys (0171). bound: the map in use and the names keys printed when bound. ---
let bound = loadKeys() ?? { map: defaultMap(), labels: {} };
let layout = null; // Chromium's keyboard layout map: an AZERTY "A" on KeyQ reads A
try { navigator.keyboard?.getLayoutMap?.().then((m) => { layout = m; labelKeys(); }, () => {}); } catch { /* no layout API */ }
const label = (code) => keyLabel(code, bound.labels, layout);
// A row's keys as the player has them: each action's keys (one name once: Shift, not "Shift or Shift").
export function keysText(acts, map = bound.map, name = label) {
  return acts.map((a) => keyNames(map[a], name).join(' 或 ')).join(' / ');
}
// The in-flight key strip (index.html #keyHints, kbd data-k = an action) prints the player's key.
export function labelKeys() {
  for (const k of document.querySelectorAll('#keyHints kbd[data-k]')) k.textContent = label(bound.map[k.dataset.k][0]);
}
// main.js at boot when a map is stored: use it.
export function useStoredKeys() {
  setKeyMap(keyTable(bound.map));
  labelKeys();
}

// --- The sheet itself (DOM). The shell is #controlsSheet in index.html. ---
let filled = false;
let opener = null;
let resume = null; // undoes the pause on close, if the sheet made it
let lastTouch = false;
let capturing = null; // the action whose key the next keypress binds (Keys view)
let inKeys = false; // the Keys view is up: Escape goes back to the sheet
const el = (id) => document.getElementById(id);
const isOpen = () => !el('controlsSheet').classList.contains('hidden');
const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const H3 = 'text-[11px] font-bold uppercase tracking-wider text-sky-300 mb-1';

function fill(touch) {
  capturing = null;
  inKeys = false;
  const body = el('controlsBody');
  body.textContent = '';
  for (const s of sheetSections(touch, document.documentElement.classList.contains('lefty'))) {
    const sec = make('section');
    const dl = make('dl', 'controls-list');
    for (const r of s.rows) dl.append(make('dt', null, r.acts ? keysText(r.acts) + (r.hold ? '（按住）' : '') : r.input), make('dd', null, r.does));
    sec.append(make('h3', H3, s.title), dl);
    if (s.rows === KEYBOARD) {
      const b = make('button', 'hud-btn mt-2 min-h-[44px] px-3 rounded-lg text-xs font-bold text-slate-200', '⌨ 更改按键');
      b.id = 'btnKeys';
      b.addEventListener('click', () => showKeys('btnKeys_' + Object.keys(DEFAULT_KEYS)[0]));
      sec.append(b);
    }
    body.append(sec);
  }
}

// The Keys view: each action, its key on a button; press the button, then the key. Escape cancels a
// capture; a key another action has is refused, naming it; Reset to defaults; Back to the sheet.
function showKeys(focusId, msg = '') {
  capturing = null;
  inKeys = true;
  const body = el('controlsBody');
  body.textContent = '';
  const sec = make('section', 'col-span-full');
  sec.append(make('h3', H3, '自定义按键'),
    make('p', 'text-xs text-slate-300 mb-2', '选择动作按钮，再按下新键。Esc 可取消，再按一次返回。设置保存在本机。方向键、数字小键盘 7／1 和右侧 Shift／Ctrl 为固定快捷键。'));
  const dl = make('dl', 'controls-list keys-list');
  for (const a in DEFAULT_KEYS) {
    const first = bound.map[a][0];
    const b = make('button', 'hud-btn min-h-[44px] min-w-[64px] px-3 rounded-lg text-xs font-bold font-mono text-white', label(first));
    b.id = 'btnKeys_' + a;
    b.dataset.act = a;
    b.setAttribute('aria-label', `${ACTION_WORDS[a]}：${label(first)}，点击更改`);
    b.addEventListener('click', () => {
      if (capturing === a) return showKeys(b.id, '未更改。'); // a second tap cancels (a phone has no Esc)
      if (capturing) showKeys(b.id); // another button was waiting: that one is off
      capturing = a;
      el(b.id).textContent = '请按键…';
      el(b.id).setAttribute('aria-label', `${ACTION_WORDS[a]}：请按键`);
      el('txtKeysMsg').textContent = `请按「${ACTION_WORDS[a]}」的新键。按 Esc 或再次点此按钮可取消。`;
    });
    const dd = make('dd', 'flex items-center gap-2');
    dd.append(b);
    const alt = keyNames(bound.map[a], label).filter((n) => n !== label(first));
    if (alt.length) dd.append(make('span', 'text-xs text-slate-300', '另可用 ' + alt.join(', ')));
    dl.append(make('dt', null, ACTION_WORDS[a]), dd);
  }
  const status = make('p', 'text-xs text-amber-200 min-h-[1.25rem] mt-2');
  status.id = 'txtKeysMsg';
  status.setAttribute('role', 'status');
  // A live region inserted with its text already in it is often not read out: put the words in after.
  if (msg) setTimeout(() => { if (status.isConnected) status.textContent = msg; }, 60);
  const row = make('div', 'flex flex-wrap gap-2 mt-1');
  const reset = make('button', 'hud-btn min-h-[44px] px-3 rounded-lg text-xs font-bold text-slate-200', '恢复默认按键');
  reset.id = 'btnKeysReset';
  reset.addEventListener('click', () => {
    bound = { map: defaultMap(), labels: {} };
    clearKeys();
    useStoredKeys();
    showKeys('btnKeysReset', '已恢复默认按键。');
  });
  const back = make('button', 'hud-btn min-h-[44px] px-3 rounded-lg text-xs font-bold text-slate-200', '← 返回');
  back.id = 'btnKeysBack';
  back.addEventListener('click', () => { fill(lastTouch); focusIn('btnKeys'); });
  row.append(reset, back);
  sec.append(dl, status, row);
  body.append(sec);
  if (focusId === 'btnKeys_' + Object.keys(DEFAULT_KEYS)[0]) body.scrollTop = 0; // in from the sheet: the top
  focusIn(focusId);
}
const focusIn = (id) => { const n = el(id); n?.focus({ preventScroll: true }); n?.scrollIntoView({ block: 'nearest' }); };

// A key pressed while a Keys button waits for one.
function capture(e) {
  const a = capturing;
  if (e.key === 'Escape') return showKeys('btnKeys_' + a, '未更改。');
  const r = rebindKey(bound.map, a, e.code);
  const name = pressedLabel(e) || '该按键';
  const again = '请再按一次按钮，选择其他键。';
  if (r.reserved) return showKeys('btnKeys_' + a, `${name} 为浏览器保留键。请再点一次按钮，选择字母或数字。`);
  if (r.fixed) return showKeys('btnKeys_' + a, `${name} 是「${ACTION_WORDS[r.fixed]}」的固定按键。${again}`);
  if (r.conflict) return showKeys('btnKeys_' + a, `${name} 已用于「${ACTION_WORDS[r.conflict]}」，请先修改该动作或换一个键。`);
  const labels = { ...bound.labels, [e.code]: name };
  for (const c in labels) if (!Object.values(r.map).some((l) => l.includes(c))) delete labels[c];
  bound = { map: r.map, labels };
  const saved = saveKeys(bound.map, bound.labels);
  useStoredKeys();
  showKeys('btnKeys_' + a, `「${ACTION_WORDS[a]}」已设为 ${name}。` + (saved ? '' : "（刷新后需要重新设置。）"));
}

export function closeControls(restoreFocus = true) {
  if (!isOpen()) return;
  capturing = null;
  el('controlsSheet').classList.add('hidden');
  resume?.();
  resume = null;
  if (restoreFocus && opener?.offsetParent) opener.focus({ preventScroll: true });
  else document.activeElement?.blur();
  opener = null;
}

// pause(): pauses the flight and returns a function that undoes it (or null if it was already paused).
export function openControls({ from, touch, pause }) {
  if (isOpen()) return;
  lastTouch = !!touch;
  fill(lastTouch); // every open: the rows print the player's keys as they are now
  if (!filled) {
    filled = true;
    el('btnCloseControls').addEventListener('click', (e) => closeControls(e.detail === 0));
    // A tap on the dimmed backdrop closes it on click, not pointerdown: closing on pointerdown let the
    // tap's click land on the control behind (GEAR, ☰ Menu).
    el('controlsSheet').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeControls(false); });
    // While open the sheet owns the keyboard: no flight key, nor the start screen's Escape or Tab
    // trap, reaches anything behind it. Escape and "?" close it; Tab cycles inside.
    document.addEventListener('keydown', (e) => {
      if (!isOpen()) return;
      e.stopImmediatePropagation();
      if (e.repeat) { e.preventDefault(); return; } // a held "?" must not flicker it
      if (capturing) { e.preventDefault(); capture(e); return; } // the Keys view waits for a key (0171)
      if (inKeys && e.key === 'Escape') { e.preventDefault(); fill(lastTouch); focusIn('btnKeys'); return; }
      if (e.key === 'Escape' || e.key === '?') { e.preventDefault(); closeControls(); return; }
      if (e.key !== 'Tab') return;
      const panel = el('controlsPanel');
      const items = [...panel.querySelectorAll('button, a[href], [tabindex="0"]')];
      const i = items.indexOf(document.activeElement), n = items.length;
      e.preventDefault();
      if (n) items[i < 0 ? (e.shiftKey ? n - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + n) % n].focus();
    }, true);
  }
  opener = from ?? null;
  resume = pause();
  // On the start screen there is no flight to pause yet: don't say there is.
  el('txtControlsPaused').classList.toggle('hidden', !el('onboardingModal').classList.contains('hidden'));
  el('controlsSheet').classList.remove('hidden');
  el('controlsPanel').focus({ preventScroll: true });
}

(() => {
  // src/src/campaign.js
  var CHAPTER_PUZZLES = { 2: ["route", "lamps", "bridge"], 3: ["mirrors", "growth", "specimens"], 4: ["causality", "shutters", "origin"] };
  var REEFS = [1, 2];
  var MIRROR_CELLS = [11, 1, 3, 18, 15, 20];
  var SPECIMEN_GIVENS = { 0: 1, 1: 2, 4: 3, 11: 1, 14: 4 };
  var SHUTTER_MASKS = [[1, 0, 0, 0, 1, 0, 0, 0, 0], [0, 1, 0, 0, 0, 1, 0, 0, 1], [1, 1, 0, 0, 0, 0, 1, 0, 0]];
  var SHUTTER_TARGET = [0, 1, 1, 1, 1, 0, 0, 1, 1];
  var ORIGIN_SOLUTION = [6, 3, 2, 5];
  var same = (a, b) => Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i]);
  var wrap = (n, m) => (n % m + m) % m;
  var ints = (a, n, max) => Array.isArray(a) && a.length === n && a.every((v) => Number.isInteger(v) && v >= 0 && v <= max);
  var adjacent = (a, b, size = 4) => Math.abs(a % size - b % size) + Math.abs(Math.floor(a / size) - Math.floor(b / size)) === 1;
  function toggleBridge(values, cell) {
    if (!Number.isInteger(cell) || cell < 0 || cell > 8) return [...values];
    return values.map((v, i) => i === cell || adjacent(i, cell, 3) ? 1 - v : v);
  }
  var BRIDGE_INITIAL = [0, 1, 4, 6, 8].reduce(toggleBridge, Array(9).fill(0));
  function bridgePlan(values) {
    let best = null;
    for (let mask = 0; mask < 512; mask++) {
      let v = [...values];
      const presses = [];
      for (let i = 0; i < 9; i++) if (mask & 1 << i) {
        v = toggleBridge(v, i);
        presses.push(i);
      }
      if (v.every((n) => n === 0) && (!best || presses.length < best.length)) best = presses;
    }
    return best;
  }
  function extendRoute(path, cell) {
    if (!Number.isInteger(cell) || cell < 0 || cell > 15 || REEFS.includes(cell)) return [...path];
    const previous = path.indexOf(cell);
    if (previous >= 0) return path.slice(0, previous + 1);
    if (path.length >= 11 || !adjacent(path.at(-1), cell)) return [...path];
    return [...path, cell];
  }
  function lampClaims(values) {
    const [a, b, c, d] = values.map(Boolean);
    return [!b, c, a !== d, !a && b].map(Number);
  }
  function traceLight(mirrors) {
    let x = -1, y = 2, dx = 1, dy = 0;
    const points = [[-0.5, 2.5]], visited = [], seen = /* @__PURE__ */ new Set();
    for (let step = 0; step < 100; step++) {
      x += dx;
      y += dy;
      if (x < 0 || y < 0 || x >= 5 || y >= 5) {
        points.push([x + 0.5, y + 0.5]);
        return { points, visited, success: x === 5 && y === 4 && new Set(visited).size === MIRROR_CELLS.length, loop: false };
      }
      points.push([x + 0.5, y + 0.5]);
      const key = `${x},${y},${dx},${dy}`;
      if (seen.has(key)) return { points, visited, success: false, loop: true };
      seen.add(key);
      const mirror = MIRROR_CELLS.indexOf(y * 5 + x);
      if (mirror >= 0) {
        visited.push(mirror);
        [dx, dy] = mirrors[mirror] ? [dy, dx] : [-dy, -dx];
      }
    }
    return { points, visited, success: false, loop: true };
  }
  function grow(sequence) {
    const history = [[1, 0, 0]];
    for (const climate of sequence) {
      if (!Number.isInteger(climate) || climate < 0 || climate > 2) return { history, valid: false };
      let [root, leaf, flower] = history.at(-1);
      if (climate === 0) leaf += root;
      if (climate === 1) root += 1;
      if (climate === 2) {
        if (root === 0) return { history, valid: false };
        flower += leaf;
        root -= 1;
      }
      history.push([root, leaf, flower]);
      if (Math.max(root, leaf, flower) > 6) return { history, valid: false };
    }
    return { history, valid: true };
  }
  function rotateMask(mask, turns) {
    let result = [...mask];
    for (let t2 = 0; t2 < wrap(turns, 4); t2++) result = Array.from({ length: 9 }, (_, i) => result[(2 - i % 3) * 3 + Math.floor(i / 3)]);
    return result;
  }
  var overlayShutters = (turns) => SHUTTER_MASKS.map((m, i) => rotateMask(m, turns[i])).reduce((a, b) => a.map((v, i) => v ^ b[i]), Array(9).fill(0));
  function initialPuzzle(id) {
    const values = { route: [0], lamps: [0, 0, 0, 0], bridge: BRIDGE_INITIAL, mirrors: [1, 1, 1, 1, 1, 1], growth: [0, 0, 0, 0, 0], specimens: Array.from({ length: 16 }, (_, i) => SPECIMEN_GIVENS[i] ?? 0), causality: [0, 1, 2, 3, 4], shutters: [0, 0, 0], origin: [0, 0, 0, 0] };
    return [...values[id]];
  }
  function freshChapter(id) {
    return { started: false, phase: "present", inspected: [], puzzles: Object.fromEntries(CHAPTER_PUZZLES[id].map((k) => [k, initialPuzzle(k)])), solved: Object.fromEntries(CHAPTER_PUZZLES[id].map((k) => [k, false])), hints: Object.fromEntries(CHAPTER_PUZZLES[id].map((k) => [k, 0])), complete: false, choice: null };
  }
  var freshCampaign = () => ({ active: 1, chapters: { 2: freshChapter(2), 3: freshChapter(3), 4: freshChapter(4) } });
  function validateChapterPuzzle(chapter, id) {
    const v = chapter.puzzles[id];
    if (id === "route") return v.length === 11 && v[0] === 0 && v.at(-1) === 15 && new Set(v).size === 11 && !v.some((n) => REEFS.includes(n)) && v.every((n, i) => i === 0 || adjacent(v[i - 1], n)) && v.includes(6) && v.includes(12) && v.indexOf(6) < v.indexOf(12);
    if (id === "lamps") return same(v, lampClaims(v));
    if (id === "bridge") return v.every((n) => n === 0);
    if (id === "mirrors") return traceLight(v).success;
    if (id === "growth") {
      const r = grow(v);
      return r.valid && same(r.history.at(-1), [2, 5, 5]);
    }
    if (id === "specimens") return Object.entries(SPECIMEN_GIVENS).every(([i, n]) => v[i] === n) && [0, 1, 2, 3].every((r) => new Set(v.slice(r * 4, r * 4 + 4)).size === 4 && new Set([0, 1, 2, 3].map((c) => v[c * 4 + r])).size === 4) && v.every((n) => n >= 1 && n <= 4);
    if (id === "causality") {
      const ix = (n) => v.indexOf(n) + 1;
      return new Set(v).size === 5 && ix(4) === ix(1) + 1 && ix(2) === 2 * ix(1) && ix(0) > ix(2);
    }
    if (id === "shutters") return same(overlayShutters(v), SHUTTER_TARGET);
    if (id === "origin") return chapter.solved.causality && chapter.solved.shutters && same(v, ORIGIN_SOLUTION);
    return false;
  }
  function unlockedChapter(state2) {
    if (!state2.ending) return 1;
    if (!state2.campaign.chapters[2].complete) return 2;
    return state2.campaign.chapters[3].complete ? 4 : 3;
  }
  function selectChapter(state2, id) {
    if (!Number.isInteger(id) || id < 1 || id > unlockedChapter(state2)) return false;
    state2.campaign.active = id;
    if (id > 1) state2.campaign.chapters[id].started = true;
    return true;
  }
  function submitChapterPuzzle(state2, id) {
    const active = state2.campaign.active;
    if (active === 1 || active > unlockedChapter(state2) || !CHAPTER_PUZZLES[active].includes(id)) return false;
    const chapter = state2.campaign.chapters[active];
    if (!validateChapterPuzzle(chapter, id)) return false;
    chapter.solved[id] = true;
    return true;
  }
  function completeChapter(state2, choice = "continue") {
    const active = state2.campaign.active;
    if (active === 1 || active > unlockedChapter(state2)) return false;
    const chapter = state2.campaign.chapters[active];
    if (!CHAPTER_PUZZLES[active].every((id) => chapter.solved[id]) || chapter.phase !== "present") return false;
    if (!(active === 4 ? ["carry", "quiet"] : ["continue"]).includes(choice)) return false;
    chapter.complete = true;
    chapter.choice = choice;
    return true;
  }
  function changeChapterPuzzle(state2, id, index, direction = 1) {
    const active = state2.campaign.active;
    if (active === 1 || active > unlockedChapter(state2) || !CHAPTER_PUZZLES[active].includes(id)) return false;
    const chapter = state2.campaign.chapters[active], v = chapter.puzzles[id];
    if (chapter.solved[id] || !Number.isInteger(index) || ![-1, 1].includes(direction)) return false;
    if (id === "route") chapter.puzzles[id] = extendRoute(v, index);
    else if (id === "bridge") chapter.puzzles[id] = toggleBridge(v, index);
    else if (index < 0 || index >= v.length) return false;
    else if (id === "specimens") {
      if (index in SPECIMEN_GIVENS) return false;
      v[index] = v[index] === 0 ? direction === 1 ? 1 : 4 : wrap(v[index] - 1 + direction, 4) + 1;
    } else if (id === "causality") {
      const next = index + direction;
      if (next < 0 || next >= v.length) return false;
      [v[index], v[next]] = [v[next], v[index]];
    } else v[index] = wrap(v[index] + direction, { lamps: 2, mirrors: 2, growth: 3, shutters: 4, origin: 10 }[id]);
    return true;
  }
  function resetChapterPuzzle(state2, id) {
    const c = state2.campaign.chapters[state2.campaign.active];
    if (!c || !(id in c.puzzles) || c.solved[id]) return false;
    c.puzzles[id] = initialPuzzle(id);
    return true;
  }
  function hydrateCampaign(raw, firstComplete) {
    const campaign = freshCampaign();
    let previousComplete = firstComplete;
    for (const id of [2, 3, 4]) {
      const source = raw?.chapters?.[id], target = campaign.chapters[id];
      if (!source || !previousComplete) break;
      if (["present", "echo"].includes(source.phase)) target.phase = source.phase;
      target.inspected = Array.isArray(source.inspected) ? [...new Set(source.inspected.filter((v) => ["present", "echo"].includes(v)))] : [];
      for (const k of CHAPTER_PUZZLES[id]) {
        const v = source.puzzles?.[k];
        const valid = k === "route" ? Array.isArray(v) && v.length > 0 && v.length <= 11 && v[0] === 0 && v.every((n, i) => Number.isInteger(n) && n >= 0 && n <= 15 && !REEFS.includes(n) && (i === 0 || adjacent(n, v[i - 1]))) && new Set(v).size === v.length : ints(v, target.puzzles[k].length, { lamps: 1, bridge: 1, mirrors: 1, growth: 2, specimens: 4, causality: 4, shutters: 3, origin: 9 }[k]);
        if (valid && (k !== "causality" || new Set(v).size === 5) && (k !== "specimens" || Object.entries(SPECIMEN_GIVENS).every(([i, n]) => v[i] === n))) target.puzzles[k] = [...v];
        target.solved[k] = source.solved?.[k] === true && validateChapterPuzzle(target, k);
        if (Number.isInteger(source.hints?.[k])) target.hints[k] = Math.min(3, Math.max(0, source.hints[k]));
      }
      target.started = source.started === true || target.inspected.length > 0 || CHAPTER_PUZZLES[id].some((k) => target.solved[k] || !same(target.puzzles[k], initialPuzzle(k)));
      target.complete = source.complete === true && CHAPTER_PUZZLES[id].every((k) => target.solved[k]) && (id === 4 ? ["carry", "quiet"] : ["continue"]).includes(source.choice);
      if (target.complete) target.choice = source.choice;
      previousComplete = target.complete;
    }
    const shell = { ending: firstComplete, campaign };
    if (Number.isInteger(raw?.active)) campaign.active = Math.min(unlockedChapter(shell), Math.max(1, raw.active));
    return campaign;
  }

  // src/src/game.js
  var VERSION = 2;
  var SAVE_KEY = "silent-meridian.v1";
  var ROOM_IDS = ["observatory", "archive", "radio", "cistern"];
  var SYMBOL_IDS = ["diamond", "wave", "peak", "sun", "star"];
  var ARRIVAL_ORDER = ["wave", "star", "sun", "peak", "diamond"];
  var RADIO_SOLUTION = [2, 4, 6];
  var MERIDIAN_SOLUTION = [0, 3, 6];
  var TIDE_INITIAL = [1, 1, 1, 6];
  var COUPLINGS = [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [1, 0, 0, 2]];
  var NOTE_IDS = ["welcome", "meridian-rule", "last-letter", "arrival-a", "arrival-b", "archive-result", "radio-a", "radio-b", "radio-result", "tide-a", "tide-b", "tide-result"];
  var equal = (a, b) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);
  var mod = (n, m) => (n % m + m) % m;
  function freshState(lang = "zh") {
    return { version: VERSION, lang: lang === "en" ? "en" : "zh", started: false, room: "observatory", phase: "present", notes: [], solved: { archive: false, radio: false, tide: false }, archive: [null, null, null, null, null], radio: [0, 0, 0], tide: [...TIDE_INITIAL], meridian: [0, 0, 0], anchor: false, ending: null, hints: { archive: 0, radio: 0, tide: 0, meridian: 0 }, sound: false, depth: true, showHotspots: true, visits: [], personalNote: "", moves: 0, campaign: freshCampaign() };
  }
  function addNote(state2, id) {
    if (!NOTE_IDS.includes(id) || state2.notes.includes(id)) return false;
    state2.notes.push(id);
    return true;
  }
  function placeSymbol(order, slot, symbol) {
    if (!Number.isInteger(slot) || slot < 0 || slot > 4 || !SYMBOL_IDS.includes(symbol)) return [...order];
    const next = [...order];
    const previous = next.indexOf(symbol);
    if (previous !== -1 && previous !== slot) next[previous] = next[slot];
    next[slot] = symbol;
    return next;
  }
  function turnTide(dials, control, direction = 1) {
    if (!Number.isInteger(control) || control < 0 || control > 3 || ![-1, 1].includes(direction)) return [...dials];
    return dials.map((value, i) => mod(value + COUPLINGS[control][i] * direction, 8));
  }
  function tidePlan(dials) {
    let best = null;
    for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) for (let c = 0; c < 8; c++) for (let d = 0; d < 8; d++) {
      const presses = [a, b, c, d];
      if (dials.every((value, i) => mod(value + presses.reduce((sum, n, j) => sum + n * COUPLINGS[j][i], 0), 8) === 0)) {
        const signed = presses.map((n) => n > 4 ? n - 8 : n);
        const cost = signed.reduce((sum, n) => sum + Math.abs(n), 0);
        if (!best || cost < best.cost) best = { presses: signed, cost };
      }
    }
    return best;
  }
  function validatePuzzle(state2, puzzle) {
    if (puzzle === "archive") return equal(state2.archive, ARRIVAL_ORDER);
    if (puzzle === "radio") return equal(state2.radio, RADIO_SOLUTION);
    if (puzzle === "tide") return equal(state2.tide, [0, 0, 0, 0]);
    if (puzzle === "meridian") return allCalibrated(state2) && state2.phase === "echo" && equal(state2.meridian, MERIDIAN_SOLUTION);
    return false;
  }
  function solvePuzzle(state2, puzzle) {
    if (!validatePuzzle(state2, puzzle)) return false;
    if (puzzle === "meridian") state2.anchor = true;
    else {
      state2.solved[puzzle] = true;
      addNote(state2, `${puzzle}-result`);
    }
    return true;
  }
  var allCalibrated = (state2) => ["archive", "radio", "tide"].every((k) => state2.solved[k]);
  var canFinish = (state2) => allCalibrated(state2) && state2.anchor && state2.phase === "present";
  function finish(state2, choice) {
    if (!canFinish(state2) || !["keep", "release"].includes(choice)) return false;
    state2.ending = choice;
    return true;
  }
  function hydrate(raw, lang = "zh") {
    const state2 = freshState(lang);
    if (!raw || ![1, VERSION].includes(raw.version)) return state2;
    if (["zh", "en"].includes(raw.lang)) state2.lang = raw.lang;
    for (const key of ["started", "sound", "depth", "showHotspots"]) if (typeof raw[key] === "boolean") state2[key] = raw[key];
    if (ROOM_IDS.includes(raw.room)) state2.room = raw.room;
    if (["present", "echo"].includes(raw.phase)) state2.phase = raw.phase;
    state2.notes = Array.isArray(raw.notes) ? [...new Set(raw.notes.filter((id) => NOTE_IDS.includes(id)))] : [];
    state2.visits = Array.isArray(raw.visits) ? [...new Set(raw.visits.filter((id) => ROOM_IDS.includes(id)))] : [];
    state2.personalNote = typeof raw.personalNote === "string" ? raw.personalNote.slice(0, 4e3) : "";
    state2.moves = Number.isSafeInteger(raw.moves) && raw.moves >= 0 ? raw.moves : 0;
    for (const [key, length, maximum] of [["radio", 3, 9], ["tide", 4, 7], ["meridian", 3, 7]]) {
      if (Array.isArray(raw[key]) && raw[key].length === length && raw[key].every((n) => Number.isInteger(n) && n >= 0 && n <= maximum)) state2[key] = [...raw[key]];
    }
    if (Array.isArray(raw.archive) && raw.archive.length === 5 && raw.archive.every((s) => s === null || SYMBOL_IDS.includes(s)) && new Set(raw.archive.filter(Boolean)).size === raw.archive.filter(Boolean).length) state2.archive = [...raw.archive];
    for (const puzzle of ["archive", "radio", "tide"]) {
      state2.solved[puzzle] = raw.solved?.[puzzle] === true && validatePuzzle(state2, puzzle);
      if (state2.solved[puzzle]) addNote(state2, `${puzzle}-result`);
    }
    state2.anchor = raw.anchor === true && allCalibrated(state2) && equal(state2.meridian, MERIDIAN_SOLUTION);
    if (state2.anchor && ["keep", "release"].includes(raw.ending)) {
      state2.ending = raw.ending;
      state2.phase = "present";
    }
    for (const puzzle of Object.keys(state2.hints)) if (Number.isInteger(raw.hints?.[puzzle])) state2.hints[puzzle] = Math.max(0, Math.min(raw.hints[puzzle], 3));
    state2.campaign = hydrateCampaign(raw.campaign, Boolean(state2.ending));
    return state2;
  }
  function loadState(storage2, lang) {
    try {
      return { state: hydrate(JSON.parse(storage2.getItem(SAVE_KEY)), lang), available: true };
    } catch {
      return { state: freshState(lang), available: false };
    }
  }
  function saveState(storage2, state2) {
    try {
      storage2.setItem(SAVE_KEY, JSON.stringify(state2));
      return true;
    } catch {
      return false;
    }
  }

  // src/src/chapters.js
  var campaignWords = {
    chapterToPresent: ["\u8FD4\u56DE\u73B0\u5728", "Return to the Present"],
    chapterPassage: ["\u901A\u8DEF", "Passage"],
    chapterPassageReady: ["\u901A\u8DEF\u5DF2\u7ECF\u7A33\u5B9A\uFF0C\u53EF\u4EE5\u79BB\u5F00\u8FD9\u91CC\u4E86\u3002", "The passage is stable. You can leave this place."],
    chapterControls: ["\u70B9\u51FB\u573A\u666F\u4E2D\u7684\u53D1\u5149\u7269\u4EF6\uFF0C\u6216\u4F7F\u7528\u4E0B\u65B9\u5165\u53E3\u8C03\u67E5\u673A\u5173\u3002\u53F3\u4E0A\u65B9\u7684\u8BB0\u5F55\u5728\u201C\u73B0\u5728\u201D\u548C\u201C\u56DE\u58F0\u201D\u4E2D\u5185\u5BB9\u4E0D\u540C\u3002\u7A7A\u683C\u5207\u6362\u65F6\u95F4\uFF0CJ \u6253\u5F00\u624B\u8BB0\u3002", "Inspect glowing objects or use the mechanism shortcuts below. The record at the upper right changes between Present and Echo. Space shifts time; J opens the journal."],
    chapters: ["\u7AE0\u8282\u76EE\u5F55", "Chapters"],
    chapterLabel: ["\u7B2C", "CHAPTER"],
    chapterLocked: ["\u5B8C\u6210\u4E0A\u4E00\u7AE0\u540E\u89E3\u9501", "Complete the previous chapter to unlock"],
    chapterOpen: ["\u8FDB\u5165\u7AE0\u8282", "Enter chapter"],
    chapterComplete: ["\u5DF2\u5B8C\u6210\uFF0C\u53EF\u91CD\u8BBF", "Complete \xB7 revisit anytime"],
    chapterInProgress: ["\u8C03\u67E5\u4E2D", "In progress"],
    chapterUnstarted: ["\u5C1A\u672A\u5F00\u59CB", "Not yet started"],
    campaignSubtitle: ["\u56DB\u4E2A\u7AE0\u8282 \xB7 \u5341\u4E09\u9053\u8C1C\u9898 \xB7 \u4E00\u4E2A\u9010\u6E10\u663E\u9732\u7684\u79D8\u5BC6", "FOUR CHAPTERS \xB7 THIRTEEN PUZZLES \xB7 ONE UNFOLDING SECRET"],
    nextChapter: ["\u524D\u5F80\u4E0B\u4E00\u7AE0", "Continue to the next chapter"],
    chapterReturn: ["\u8FD4\u56DE\u8FD9\u4E2A\u5730\u70B9", "Revisit this place"],
    chapterExit: ["\u79BB\u5F00\u8FD9\u4E2A\u5730\u70B9", "Leave this place"],
    chapterExitLocked: ["\u4E09\u5904\u673A\u5173\u4ECD\u672A\u5168\u90E8\u4FEE\u590D\u3002", "Three mechanisms must be restored before you can leave."],
    chapterEchoExit: ["\u56DE\u58F0\u91CC\u6CA1\u6709\u51FA\u53E3\u3002\u56DE\u5230\u73B0\u5728\uFF0C\u518D\u6253\u5F00\u901A\u8DEF\u3002", "There is no exit in the Echo. Return to the Present to open the passage."],
    chapterExplore: ["\u8C03\u67E5\u4E09\u4E2A\u88C5\u7F6E\uFF0C\u5728\u4E24\u4E2A\u65F6\u95F4\u91CC\u5BFB\u627E\u8BB0\u5F55\u3002", "Inspect three mechanisms. Search for records in both moments."],
    chapterReady: ["\u88C5\u7F6E\u5DF2\u4FEE\u590D\u3002\u56DE\u5230\u73B0\u5728\uFF0C\u68C0\u67E5\u8FDC\u5904\u7684\u51FA\u53E3\u3002", "The mechanisms are restored. Return to the Present and inspect the exit."],
    chapterRecords: ["\u6B64\u5730\u7559\u4E0B\u7684\u8BB0\u5F55", "Records left here"],
    readRecords: ["\u8C03\u67E5\u8BB0\u5F55", "Inspect records"],
    chapterClues: ["\u5DF2\u627E\u5230\u7684\u7EBF\u7D22", "Recovered evidence"],
    missingPhase: ["\u5C1A\u672A\u8C03\u67E5\u8FD9\u4E2A\u65F6\u95F4\u7684\u8BB0\u5F55", "Records in this moment have not been inspected"],
    chapterMap: ["\u6B64\u5730\u7684\u8C03\u67E5\u70B9", "Investigation points"],
    verifyMechanism: ["\u9A8C\u8BC1\u673A\u5173", "Test mechanism"],
    mechanismRestored: ["\u673A\u5173\u5DF2\u4FEE\u590D", "MECHANISM RESTORED"],
    travelNotes: ["\u968F\u8EAB\u643A\u5E26\u7684\u8BB0\u5F55", "Records carried with you"],
    travelIntro: ["\u5DF2\u5B8C\u6210\u7AE0\u8282\u7559\u4E0B\u7684\u7ED3\u679C\u4F1A\u4FDD\u7559\u5728\u8FD9\u91CC\u3002", "Results from completed chapters remain here."],
    noTravelNotes: ["\u8FD8\u6CA1\u6709\u79BB\u5F00\u7B2C\u4E00\u4E2A\u5730\u70B9\u3002", "You have not yet left the first location."],
    chapterOneRecord: ["\u89C2\u6D4B\u7AD9 \xB7 \u7B2C\u4E09\u9891\u6BB5", "Observatory \xB7 third frequency"],
    chapterOneResult: ["\u7B2C\u4E09\u9891\u6BB5\u662F 6\u3002\u4F60\u8BA9 00:17 \u8D70\u5411\u4E86 00:18\u3002", "The third frequency was 6. You carried 00:17 forward to 00:18."],
    resetAllBody: ["\u8FD9\u4F1A\u6E05\u9664\u5168\u90E8\u56DB\u7AE0\u5728\u6B64\u6D4F\u89C8\u5668\u4E2D\u7684\u8FDB\u5EA6\u3001\u624B\u8BB0\u4E0E\u7ED3\u5C40\u3002\u7AE0\u8282\u76EE\u5F55\u53EF\u4EE5\u5207\u6362\u7AE0\u8282\u5E76\u4FDD\u7559\u8FDB\u5EA6\u3002", "This clears progress, journals, and endings for all four chapters in this browser. Use Chapters to change locations while keeping progress."],
    routeSteps: ["\u822A\u7A0B", "Moves"],
    routeInstruction: ["\u70B9\u51FB\u4E0E\u8DEF\u7EBF\u672B\u7AEF\u76F8\u90BB\u7684\u683C\u5B50\uFF1B\u70B9\u51FB\u5DF2\u8D70\u8FC7\u7684\u683C\u5B50\u53EF\u4EE5\u9000\u56DE\u3002\u7070\u683C\u4E3A\u6697\u7901\u3002", "Choose a cell next to the route\u2019s end. Select a visited cell to backtrack. Grey cells are reefs."],
    lampsInstruction: ["\u70B9\u51FB\u5207\u6362\u56DB\u76CF\u706F\u3002\u53D1\u5149\u4EE3\u8868\u4FE1\u53F7\u771F\u5B9E\uFF0C\u7184\u706D\u4EE3\u8868\u4FE1\u53F7\u865A\u5047\u3002", "Toggle the four lamps. Lit means truthful; dark means false."],
    lampLit: ["\u4EAE", "Lit"],
    lampDark: ["\u706D", "Dark"],
    bridgeInstruction: ["\u70B9\u51FB\u4E00\u683C\uFF0C\u4F1A\u540C\u65F6\u7FFB\u8F6C\u5B83\u4E0E\u4E0A\u4E0B\u5DE6\u53F3\u76F8\u90BB\u7684\u706F\u3002\u8BA9\u6240\u6709\u706F\u7184\u706D\u3002", "Pressing a cell flips it and its orthogonal neighbors. Extinguish every lamp."],
    bridgeAdaptive: ["\u4ECE\u5F53\u524D\u72B6\u6001\uFF0C\u4F9D\u6B21\u6309\uFF1A", "From the current state, press: "],
    bridgeReady: ["\u6240\u6709\u706F\u5DF2\u7184\u706D\uFF0C\u53EF\u4EE5\u9A8C\u8BC1\u3002", "Every lamp is dark. Test the mechanism."],
    mirrorsInstruction: ["\u70B9\u51FB\u955C\u9762\u5728 / \u4E0E \\ \u4E4B\u95F4\u5207\u6362\u3002\u5149\u8DEF\u5B9E\u65F6\u663E\u793A\uFF0C\u5FC5\u987B\u7ECF\u8FC7\u5168\u90E8\u516D\u9762\u955C\u5B50\u3002", "Click a mirror to switch between / and \\. The live beam must visit all six mirrors."],
    mirror: ["\u955C\u9762", "Mirror"],
    lightTarget: ["\u63A5\u6536\u5668", "Receiver"],
    lightLoop: ["\u5149\u88AB\u56F0\u5728\u5FAA\u73AF\u4E2D", "The beam is trapped in a loop"],
    lightMiss: ["\u5149\u5C1A\u672A\u62B5\u8FBE\u63A5\u6536\u5668", "The beam has not reached the receiver"],
    lightReady: ["\u5149\u5DF2\u7ECF\u8FC7\u516D\u9762\u955C\u5B50\u62B5\u8FBE\u63A5\u6536\u5668", "The beam reaches the receiver through all six mirrors"],
    climateSun: ["\u65E5\u7167", "Sun"],
    climateRain: ["\u964D\u96E8", "Rain"],
    climateMist: ["\u96FE\u5316", "Mist"],
    growthRoot: ["\u6839", "Root"],
    growthLeaf: ["\u53F6", "Leaf"],
    growthFlower: ["\u82B1", "Flower"],
    growthDay: ["\u5468\u671F", "Cycle"],
    growthTarget: ["\u76EE\u6807\uFF1A\u6839 2 \xB7 \u53F6 5 \xB7 \u82B1 5", "TARGET: ROOT 2 \xB7 LEAF 5 \xB7 FLOWER 5"],
    growthInvalid: ["\u57F9\u517B\u5728\u6B64\u5904\u4E2D\u6B62\uFF1A\u6570\u503C\u8D85\u8FC7 6\uFF0C\u6216\u65E0\u6839\u53EF\u4F9B\u96FE\u5316\u3002", "Cultivation stops here: a value exceeded 6, or no root remained for mist."],
    growthInstruction: ["\u70B9\u51FB\u4E94\u5F20\u5468\u671F\u5361\uFF0C\u5FAA\u73AF\u9009\u62E9\u6C14\u5019\u3002\u4E0B\u65B9\u6309\u4ECE\u5DE6\u5230\u53F3\u7684\u6B21\u5E8F\u9884\u6F14\u751F\u957F\u3002", "Click each of the five cycle cards to change its climate. The preview applies them from left to right."],
    specimensInstruction: ["\u70B9\u51FB\u7A7A\u683C\u5FAA\u73AF\u9009\u62E9 1\u20144\u3002\u5E26\u94C6\u9489\u7684\u6570\u5B57\u65E0\u6CD5\u6539\u53D8\u3002", "Click an empty cell to cycle through 1\u20134. Riveted numbers are fixed."],
    specimenCell: ["\u6807\u672C\u683C", "Specimen cell"],
    fixed: ["\u56FA\u5B9A", "Fixed"],
    eventGate: ["\u95E8\u5F00\u542F", "Door opens"],
    eventLight: ["\u706F\u4EAE\u8D77", "Lamp lights"],
    eventBell: ["\u949F\u54CD", "Bell rings"],
    eventLetter: ["\u4FE1\u9001\u8FBE", "Letter arrives"],
    eventShadow: ["\u5F71\u5B50\u51FA\u73B0", "Shadow appears"],
    causalityInstruction: ["\u4F7F\u7528\u6BCF\u6761\u8BB0\u5F55\u53F3\u4FA7\u7684\u7BAD\u5934\uFF0C\u6309\u771F\u5B9E\u53D1\u751F\u987A\u5E8F\u6392\u5217\u4E94\u4E2A\u4E8B\u4EF6\u3002", "Use the arrows on each record to arrange the five events in their actual order."],
    moveEarlier: ["\u5411\u524D\u79FB\u52A8", "Move earlier"],
    moveLater: ["\u5411\u540E\u79FB\u52A8", "Move later"],
    overlay: ["\u5F53\u524D\u53E0\u5F71", "Current overlay"],
    targetPattern: ["\u5899\u4E0A\u7684\u6B8B\u5F71", "Pattern on the wall"],
    shutter: ["\u5E37\u5E55", "Shutter"],
    rotate: ["\u65CB\u8F6C", "Rotate"],
    shuttersInstruction: ["\u6BCF\u6B21\u65CB\u8F6C 90\xB0\u3002\u540C\u4E00\u683C\u88AB\u5947\u6570\u5C42\u8986\u76D6\u65F6\u4EAE\uFF0C\u5076\u6570\u5C42\u8986\u76D6\u65F6\u6697\u3002", "Each turn rotates 90\xB0. A cell glows under an odd number of layers and is dark under an even number."],
    originSlot: ["\u5750\u6807\u4F4D", "Coordinate"],
    originLocked: ["\u5148\u6062\u590D\u56E0\u679C\u6863\u6848\u4E0E\u5E37\u5E55\uFF0C\u5750\u6807\u53F0\u624D\u80FD\u63A5\u53D7\u8F93\u5165\u3002", "Restore the causal archive and shutters before the coordinate console can respond."],
    finalPassage: ["\u6700\u540E\u4E00\u9053\u95E8", "The final door"],
    finalPassageBody: ["\u95E8\u540E\u4E0D\u662F\u53E6\u4E00\u4E2A\u673A\u5173\uFF0C\u662F\u6B63\u5728\u9192\u6765\u7684\u6D77\u5CB8\u3002\n\n\u4F60\u53EF\u4EE5\u5E26\u7740\u8FD9\u4E9B\u8BB0\u5F55\u79BB\u5F00\uFF0C\u8BA9\u540E\u6765\u7684\u4EBA\u77E5\u9053\u5B88\u591C\u4EBA\u66FE\u7ECF\u505A\u8FC7\u4EC0\u4E48\u3002\u4E5F\u53EF\u4EE5\u5C01\u5B58\u88C5\u7F6E\uFF0C\u53EA\u628A\u8DEF\u7559\u5728\u706F\u5149\u91CC\u3002", "Beyond the door is a coast waking up, not another instrument.\n\nCarry the records out so the next keeper can know what happened. Or seal the instruments and leave only a path of light."],
    finalCarry: ["\u5E26\u7740\u8BB0\u5F55\u79BB\u5F00", "Carry the records out"],
    finalQuiet: ["\u5C01\u5B58\u88C5\u7F6E\uFF0C\u7559\u4E0B\u706F\u5149", "Seal the instruments, leave the light"],
    campaignFinished: ["\u56DB\u7AE0\u8C03\u67E5\u5B8C\u6210", "ALL FOUR CHAPTERS COMPLETE"],
    endingCarryTitle: ["\u6D77\u5CB8\u8BB0\u5F97\u4F60\u7684\u540D\u5B57", "The coast remembers your name"],
    endingQuietTitle: ["\u5929\u4EAE\u4EE5\u540E\uFF0C\u4E0D\u5FC5\u5B88\u591C", "After dawn, no one has to keep watch"],
    endingCarry: ["\u4F60\u628A\u56DB\u4E2A\u5730\u70B9\u7684\u8BB0\u5F55\u88C5\u8FDB\u7BB1\u5B50\uFF0C\u63A8\u5F00\u6700\u540E\u4E00\u9053\u95E8\u3002\u6D77\u5CB8\u4E0A\u7684\u4EBA\u7B2C\u4E00\u6B21\u77E5\u9053\uFF0C\u90A3\u4E00\u5206\u949F\u91CC\u6709\u4EBA\u8D70\u8FC7\u4E86\u591A\u4E48\u6F2B\u957F\u7684\u591C\u665A\u3002\n\n\u4E0B\u4E00\u4F4D\u5B88\u591C\u4EBA\u4F1A\u62E5\u6709\u4E00\u5F20\u5730\u56FE\uFF0C\u4E0D\u5FC5\u518D\u9760\u9057\u5FD8\u5BFB\u627E\u56DE\u53BB\u7684\u8DEF\u3002", "You pack the records from all four places and open the final door. For the first time, the coast learns how long a night someone walked inside that minute.\n\nThe next keeper will have a map. They will not have to lose their memory to find the way home."],
    endingQuiet: ["\u4F60\u8BA9\u56DB\u5EA7\u88C5\u7F6E\u4F9D\u6B21\u7761\u53BB\u3002\u6D77\u5CB8\u4E0D\u518D\u9700\u8981\u6709\u4EBA\u53CD\u590D\u501F\u51FA\u81EA\u5DF1\u7684\u4E00\u5206\u949F\u3002\n\n\u96FE\u6563\u4E86\uFF0C\u6E29\u5BA4\u7684\u73BB\u7483\u91CC\u6620\u51FA\u771F\u6B63\u7684\u592A\u9633\u3002\u4F60\u6CBF\u7740\u706F\u5149\u5F80\u5BB6\u8D70\uFF0C\u5F71\u5B50\u7EC8\u4E8E\u4E0E\u4F60\u5E76\u80A9\u3002", "You let the four instruments fall asleep. The coast no longer needs someone to lend the same minute again and again.\n\nThe fog lifts. A real sun appears in the conservatory glass. You follow the lights home, your shadow finally beside you."],
    tapeKept: ["\u5F88\u8FDC\u7684\u89C2\u6D4B\u7AD9\u91CC\uFF0C\u90A3\u53E5\u201C\u4E0D\u8981\u5BB3\u6015\u201D\u4ECD\u88AB\u597D\u597D\u4FDD\u5B58\u7740\u3002", "Far away in the observatory, the words \u201Cdo not be afraid\u201D remain safe on tape."],
    tapeReleased: ["\u4F60\u66FE\u8BA9\u65E7\u78C1\u5E26\u5B89\u9759\u4E0B\u6765\u3002\u73B0\u5728\uFF0C\u8FD9\u7247\u6D77\u5CB8\u4E5F\u7EC8\u4E8E\u5B89\u9759\u4E86\u3002", "You once let the old tape fall silent. Now the coast can rest as well."]
  };
  var chapters = {
    1: { numeral: "I", title: ["\u672A\u7ADF\u4E4B\u591C", "The Unfinished Night"], subtitle: ["\u89C2\u6D4B\u7AD9 / 00:17", "OBSERVATORY / 00:17"], summary: ["\u8BA9\u505C\u6EDE\u7684\u4E00\u5206\u949F\u7EE7\u7EED\u3002\u56DB\u4E2A\u623F\u95F4\uFF0C\u56DB\u9053\u76F8\u4E92\u5173\u8054\u7684\u8C1C\u9898\u3002", "Release a suspended minute. Four rooms and four connected puzzles."], art: "observatory" },
    2: {
      numeral: "II",
      title: ["\u65E0\u540D\u6E21\u7AD9", "The Nameless Ferry"],
      subtitle: ["\u96FE\u6D77\u6E21\u53E3 / 00:18", "THE FOG TERMINAL / 00:18"],
      summary: ["\u6E21\u8239\u6CA1\u6709\u4E58\u5BA2\u540D\u5355\u3002\u96FE\u706F\u5728\u4E92\u76F8\u4F5C\u8BC1\uFF0C\u4E00\u6761\u88AB\u5220\u53BB\u7684\u822A\u8DEF\u6B63\u5728\u663E\u73B0\u3002", "The ferry has no passenger list. Its fog lamps testify against each other. An erased route begins to appear."],
      art: "ferry",
      time: ["00:18", "00:17"],
      points: [[23, 59], [46, 49], [83, 57]],
      intro: ["\u6D77\u6C34\u6062\u590D\u6D41\u52A8\u540E\uFF0C\u89C2\u6D4B\u7AD9\u540E\u65B9\u51FA\u73B0\u4E86\u4E00\u5EA7\u6E21\u53E3\u3002\u8239\u8237\u4E0A\u6CA1\u6709\u5730\u540D\uFF0C\u53EA\u6709\u4F60\u7684\u7B14\u8FF9\uFF1A\u201C\u5148\u786E\u8BA4\u54EA\u4E9B\u5149\u662F\u771F\u7684\u3002\u201D\n\n\u822A\u8DEF\u53F0\u3001\u96FE\u706F\u4E0E\u7535\u6865\u5171\u540C\u63A7\u5236\u6E21\u8239\u3002\u5728\u4E24\u4E2A\u65F6\u95F4\u91CC\u68C0\u67E5\u53F3\u4FA7\u7684\u8BB0\u5F55\uFF0C\u518D\u51B3\u5B9A\u5982\u4F55\u542F\u822A\u3002", "When the sea moves again, a ferry terminal appears behind the observatory. No destination is painted on the boat. Only your handwriting: \u201CFirst, find out which lights are telling the truth.\u201D\n\nThe chart, lamps, and electrical bridge control the ferry. Inspect the records in both moments before setting out."],
      records: [
        ["\u73B0\u5728 \xB7 \u7801\u5934\u7EF4\u4FEE\u9875", "Present \xB7 terminal service sheet", "\u822A\u8DEF\u53F0\uFF1A\u4ECE A1 \u51FA\u53D1\uFF0C\u5230 D4 \u9760\u5CB8\u3002B1\u3001C1 \u662F\u4E0D\u53EF\u901A\u8FC7\u7684\u6697\u7901\u3002\u6BCF\u6B21\u53EA\u80FD\u8D70\u4E0A\u4E0B\u5DE6\u53F3\u4E00\u683C\uFF0C\u4E0D\u80FD\u91CD\u590D\u7ECF\u8FC7\u540C\u4E00\u683C\u3002\n\n\u96FE\u706F\uFF1A\u4EAE\u7740\u7684\u706F\uFF0C\u5176\u8BC1\u8BCD\u4E3A\u771F\uFF1B\u7184\u706D\u7684\u706F\uFF0C\u5176\u8BC1\u8BCD\u4E3A\u5047\u3002\nA\uFF1A\u201CB \u706D\u7740\u3002\u201D\nB\uFF1A\u201CC \u4EAE\u7740\u3002\u201D\n\n\u7535\u6865\uFF1A\u6309\u4E0B\u4E00\u683C\uFF0C\u4F1A\u7FFB\u8F6C\u672C\u683C\u4E0E\u4E0A\u4E0B\u5DE6\u53F3\u76F8\u90BB\u706F\u7684\u72B6\u6001\u3002\u5BF9\u89D2\u7EBF\u4E0D\u53D7\u5F71\u54CD\u3002", "Chart: depart A1 and dock at D4. B1 and C1 are impassable reefs. Move one cell horizontally or vertically at a time. Never revisit a cell.\n\nFog lamps: a lit lamp tells the truth; a dark lamp lies.\nA: \u201CB is dark.\u201D\nB: \u201CC is lit.\u201D\n\nBridge: pressing a cell flips itself and its orthogonal neighbors. Diagonal cells are unaffected."],
        ["\u56DE\u58F0 \xB7 \u822A\u6D77\u5458\u7684\u80CC\u9875", "Echo \xB7 the navigator\u2019s reverse page", "\u822A\u8DEF\u53F0\uFF1A\u5148\u7ECF\u8FC7 C2 \u7684\u7A7A\u5FC3\u6D6E\u6807\uFF0C\u518D\u7ECF\u8FC7 A4 \u7684\u5B9E\u5FC3\u6D6E\u6807\u3002\u71C3\u6599\u53EA\u591F\u5341\u6B21\u79FB\u52A8\uFF0C\u5230\u8FBE D4 \u65F6\u5FC5\u987B\u521A\u597D\u7528\u5B8C\u3002\n\n\u96FE\u706F\u7684\u5269\u4F59\u8BC1\u8BCD\uFF1A\nC\uFF1A\u201CA \u548C D \u7684\u660E\u6697\u76F8\u53CD\u3002\u201D\nD\uFF1A\u201CA \u706D\u7740\uFF0C\u5E76\u4E14 B \u4EAE\u7740\u3002\u201D\n\n\u7535\u6865\uFF1A\u6E21\u8239\u9700\u8981\u7684\u662F\u96F6\u7535\u52BF\u3002\u53EA\u6709\u4E5D\u683C\u5168\u706D\uFF0C\u63A5\u5730\u624D\u4F1A\u6210\u529F\u3002", "Chart: pass the hollow buoy at C2 before the solid buoy at A4. Fuel allows exactly ten moves; use the last one when reaching D4.\n\nThe remaining fog-lamp statements:\nC: \u201CA and D have opposite states.\u201D\nD: \u201CA is dark AND B is lit.\u201D\n\nBridge: the ferry needs zero potential. Grounding succeeds only when all nine lamps are dark."]
      ],
      endTitle: ["\u6E21\u8239\u9A76\u5411\u6C34\u4E0B\u7684\u5149", "A ferry toward the light below"],
      endBody: ["\u4E09\u76CF\u8BDA\u5B9E\u7684\u706F\u7167\u4EAE\u4E86\u822A\u9053\u3002\u6E21\u8239\u6CA1\u6709\u9A76\u5411\u5BF9\u5CB8\uFF0C\u800C\u662F\u6CBF\u7740\u6D77\u9762\u7684\u4E00\u9053\u88C2\u7F1D\u7F13\u7F13\u4E0B\u964D\u3002\n\n\u96FE\u91CC\u6D6E\u51FA\u4E00\u884C\u65E7\u5B57\uFF1A\u201C\u5982\u679C\u8BB0\u5FC6\u4F1A\u67AF\u840E\uFF0C\u5C31\u7ED9\u5B83\u5EFA\u4E00\u5EA7\u6E29\u5BA4\u3002\u201D", "Three truthful lamps illuminate the channel. The ferry does not cross to the other shore. It descends slowly through a seam in the sea.\n\nOld writing emerges in the fog: \u201CIf memories can wither, build them a conservatory.\u201D"],
      travelTitle: ["\u6E21\u7AD9 \xB7 \u771F\u5B9E\u7684\u96FE\u706F", "Ferry \xB7 truthful fog lamps"],
      travelResult: ["A \u706D\uFF0CB\u3001C\u3001D \u4EAE\u3002\u771F\u5B9E\u96FE\u706F\u5171 3 \u76CF\u3002", "A is dark; B, C, and D are lit. There are 3 truthful fog lamps."]
    },
    3: {
      numeral: "III",
      title: ["\u73BB\u7483\u6E29\u5BA4", "The Glass Conservatory"],
      subtitle: ["\u6D77\u5E8A\u690D\u7269\u56ED / 00:19", "THE SEABED GARDEN / 00:19"],
      summary: ["\u5728\u6CA1\u6709\u592A\u9633\u7684\u6E29\u5BA4\u91CC\uFF0C\u5149\u3001\u690D\u7269\u4E0E\u6807\u672C\u66FF\u4F60\u4FDD\u5B58\u4E86\u53E6\u4E00\u6BB5\u8BB0\u5FC6\u3002", "In a garden without a sun, light, plants, and specimens hold another part of your memory."],
      art: "garden",
      time: ["00:19", "00:18"],
      points: [[23, 61], [50, 60], [77, 63]],
      intro: ["\u6E21\u8239\u505C\u5728\u73BB\u7483\u7A79\u9876\u5916\u3002\u6D77\u6C34\u60AC\u5728\u5934\u9876\uFF0C\u690D\u7269\u6839\u987B\u5374\u4F38\u5411\u4E00\u9897\u4EBA\u9020\u592A\u9633\u3002\n\n\u4F60\u8BA4\u51FA\u4E86\u8FD9\u4E9B\u6807\u672C\uFF1A\u5B83\u4EEC\u4FDD\u5B58\u7684\u4E0D\u662F\u690D\u7269\uFF0C\u800C\u662F\u90A3\u4E9B\u88AB\u501F\u8D70\u7684\u4E00\u5206\u949F\u3002\u6062\u590D\u5149\u8DEF\uFF0C\u57F9\u80B2\u4E00\u4EFD\u5B8C\u6574\u7684\u8BB0\u5FC6\uFF0C\u6700\u540E\u6253\u5F00\u6807\u672C\u67DC\u3002", "The ferry stops outside a glass dome. The sea hangs overhead, while the roots reach toward an artificial sun.\n\nYou recognize the specimens. They preserve minutes that were borrowed, not plants. Restore the light, cultivate one complete memory, then read the specimen cabinet."],
      records: [
        ["\u73B0\u5728 \xB7 \u6E29\u5BA4\u64CD\u4F5C\u89C4\u7A0B", "Present \xB7 conservatory operating sheet", "\u5149\u8DEF\uFF1A\u5149\u4ECE\u5DE6\u4FA7\u7B2C 3 \u884C\u5C04\u5165\uFF0C\u5FC5\u987B\u7ECF\u8FC7\u516D\u9762\u955C\u5B50\uFF0C\u4ECE\u53F3\u4FA7\u7B2C 5 \u884C\u8FDB\u5165\u63A5\u6536\u5668\u3002\u955C\u5B50\u53EA\u80FD\u5728 / \u4E0E \\ \u4E24\u79CD\u65B9\u5411\u4E4B\u95F4\u5207\u6362\u3002\n\n\u57F9\u517B\uFF1A\u521D\u59CB\u4E3A\u6839 1\u3001\u53F6 0\u3001\u82B1 0\u3002\u65E5\u7167\u8BA9\u201C\u53F6\u589E\u52A0\u5F53\u524D\u6839\u6570\u201D\uFF1B\u964D\u96E8\u8BA9\u201C\u6839\u589E\u52A0 1\u201D\u3002\u4E94\u4E2A\u5468\u671F\u4F9D\u6B21\u6267\u884C\u3002\n\n\u6807\u672C\u67DC\uFF1A\u6BCF\u884C\u3001\u6BCF\u5217\u90FD\u5FC5\u987B\u6070\u597D\u51FA\u73B0\u4E00\u6B21 1\u30012\u30013\u30014\u3002\u94C6\u6B7B\u7684\u6570\u5B57\u6765\u81EA\u539F\u59CB\u6863\u6848\uFF0C\u4E0D\u80FD\u6539\u52A8\u3002", "Light enters from the left in row 3. It must visit all six mirrors and reach the receiver on the right in row 5. Mirrors can face / or \\.\n\nCultivation starts at root 1, leaf 0, flower 0. Sun adds the current root count to leaves. Rain adds 1 root. Apply five cycles in order.\n\nCabinet: each row and column must contain 1, 2, 3, and 4 exactly once. Riveted numbers are original records and cannot change."],
        ["\u56DE\u58F0 \xB7 \u6700\u540E\u4E00\u4F4D\u56ED\u4E01", "Echo \xB7 the last gardener", "\u57F9\u517B\u4E2D\u552F\u4E00\u88AB\u5212\u6389\u7684\u89C4\u5219\uFF1A\u96FE\u5316\u5148\u8BA9\u201C\u82B1\u589E\u52A0\u5F53\u524D\u53F6\u6570\u201D\uFF0C\u518D\u6D88\u8017 1 \u6839\u3002\u6CA1\u6709\u6839\u65F6\u4E0D\u80FD\u96FE\u5316\uFF1B\u4EFB\u4F55\u6570\u503C\u8D85\u8FC7 6\uFF0C\u57F9\u517B\u4FBF\u4F1A\u4E2D\u6B62\u3002\n\n\u5B8C\u6574\u8BB0\u5FC6\u5728\u7B2C\u4E94\u5468\u671F\u7ED3\u675F\u65F6\u5E94\u4E3A\uFF1A\u6839 2\uFF0C\u53F6 5\uFF0C\u82B1 5\u3002\n\n\u6807\u672C\u67DC\u4E0D\u68C0\u67E5\u5BF9\u89D2\u7EBF\uFF0C\u4E5F\u4E0D\u68C0\u67E5\u5C0F\u65B9\u5757\u3002\u53EA\u68C0\u67E5\u6BCF\u4E00\u6574\u884C\u4E0E\u6BCF\u4E00\u6574\u5217\u3002\n\n\u5149\u8DEF\u4E0D\u4F1A\u9500\u6BC1\u8BB0\u5FC6\u3002\u4F60\u53EF\u4EE5\u53CD\u590D\u8F6C\u52A8\u955C\u5B50\uFF0C\u76F4\u5230\u6240\u6709\u955C\u9762\u90FD\u88AB\u7167\u5230\u3002", "The erased cultivation rule: Mist adds the current leaf count to flowers, then consumes 1 root. Mist requires a root. If any count exceeds 6, cultivation stops.\n\nAfter cycle five, a complete memory has root 2, leaf 5, flower 5.\n\nThe cabinet does not check diagonals or smaller boxes. It checks each full row and each full column only.\n\nThe beam cannot destroy a memory. Turn the mirrors as often as needed until every mirror is illuminated."]
      ],
      endTitle: ["\u8BB0\u5FC6\u4E0D\u662F\u4E3A\u4E86\u91CD\u6765", "A memory is not a command to repeat"],
      endBody: ["\u6807\u672C\u91CC\u7684\u753B\u9762\u7EC8\u4E8E\u5B8C\u6574\uFF1A\u90A3\u4E00\u591C\u6709\u8BB8\u591A\u4EBA\u7B49\u5F85\u64A4\u79BB\uFF0C\u800C\u4F60\u628A\u6D77\u5CB8\u7684\u6700\u540E\u4E00\u5206\u949F\u5206\u5B58\u4E8E\u56DB\u4E2A\u5730\u70B9\u3002\n\n\u57F9\u517B\u74F6\u5E95\u7559\u4E0B\u4E24\u6761\u6839\u3002\u4F60\u6284\u4E0B\u8FD9\u4E2A\u6570\uFF0C\u6CBF\u7740\u73BB\u7483\u4E0A\u7684\u5149\u8D70\u5411\u7B2C\u96F6\u5EA7\u706F\u5854\u3002", "The specimen finally shows a whole scene: people waiting to evacuate, while you divided the coast\u2019s final minute among four places.\n\nTwo roots remain at the bottom of the vessel. You record the number and follow a thread of light toward the zeroth lighthouse."],
      travelTitle: ["\u6E29\u5BA4 \xB7 \u5B8C\u6574\u8BB0\u5FC6\u7684\u6839", "Conservatory \xB7 roots of a complete memory"],
      travelResult: ["\u7B2C\u4E94\u5468\u671F\u7ED3\u675F\uFF1A\u6839 2\uFF0C\u53F6 5\uFF0C\u82B1 5\u3002\u5E26\u8D70\u7684\u6839\u6570\u662F 2\u3002", "After cycle five: root 2, leaf 5, flower 5. The root count you carry forward is 2."]
    },
    4: {
      numeral: "IV",
      title: ["\u7B2C\u96F6\u5EA7\u706F\u5854", "The Zeroth Lighthouse"],
      subtitle: ["\u6D77\u5CB8\u8D77\u70B9 / 00:20", "THE BEGINNING OF THE COAST / 00:20"],
      summary: ["\u706F\u5854\u4E0D\u5728\u5730\u56FE\u4E0A\u3002\u5B83\u4FDD\u5B58\u7740\u4E8B\u4EF6\u53D1\u751F\u4E4B\u524D\uFF0C\u6240\u6709\u4EBA\u90FD\u5FD8\u8BB0\u7684\u4E00\u6B21\u9009\u62E9\u3002", "The lighthouse is absent from every map. It preserves a choice made before the events everyone remembers."],
      art: "lighthouse",
      time: ["00:20", "00:19"],
      points: [[24, 65], [77, 65], [50, 72]],
      intro: ["\u6D77\u56FE\u4ECE\u7B2C 1 \u5EA7\u706F\u5854\u5F00\u59CB\u7F16\u53F7\u3002\u4F60\u7AD9\u7740\u7684\u5730\u65B9\uFF0C\u5374\u523B\u7740\u4E00\u4E2A 0\u3002\n\n\u8FD9\u91CC\u6CA1\u6709\u65B0\u7684\u5B88\u591C\u4EBA\uFF0C\u53EA\u6709\u88AB\u62C6\u6563\u7684\u4E8B\u4EF6\u3001\u91CD\u53E0\u7684\u5F71\u5B50\uFF0C\u4EE5\u53CA\u56DB\u4E2A\u5730\u70B9\u5171\u540C\u5199\u4E0B\u7684\u5750\u6807\u3002\u628A\u5148\u540E\u8FD8\u7ED9\u4E8B\u4EF6\uFF0C\u628A\u5149\u8FD8\u7ED9\u5E37\u5E55\uFF0C\u6700\u540E\u628A\u5E26\u6765\u7684\u8BB0\u5F55\u63A5\u5728\u4E00\u8D77\u3002", "The charts begin with lighthouse 1. The stone beneath your feet is marked 0.\n\nNo new keeper waits here. Only scattered events, overlapping shadows, and coordinates written by four places. Restore the order of events, align the shutters, then connect the records you carried here."],
      records: [
        ["\u73B0\u5728 \xB7 \u6CA1\u6709\u65E5\u671F\u7684\u56E0\u679C\u8868", "Present \xB7 the undated causal ledger", "\u4E94\u4E2A\u4E8B\u4EF6\u5404\u53D1\u751F\u4E00\u6B21\uFF0C\u771F\u5B9E\u4F4D\u6B21\u4ECE 1 \u6570\u5230 5\u3002\u706F\u4EAE\u8D77\u4E4B\u540E\uFF0C\u5F71\u5B50\u7D27\u63A5\u7740\u51FA\u73B0\u3002\u95E8\u5F00\u542F\u53D1\u751F\u5728\u949F\u54CD\u4E4B\u540E\u3002\n\n\u4E09\u5C42\u5E37\u5E55\uFF1A\u65CB\u8F6C\u4E0D\u4F1A\u6539\u53D8\u5F62\u72B6\u3002\u4E00\u4E2A\u683C\u5B50\u88AB\u5947\u6570\u5C42\u8986\u76D6\u5C31\u4EAE\uFF0C\u88AB\u5076\u6570\u5C42\u8986\u76D6\u5C31\u706D\u3002\u8BA9\u53E0\u5F71\u4E0E\u5899\u4E0A\u6B8B\u5F71\u5B8C\u5168\u76F8\u540C\u3002\n\n\u5750\u6807\u53F0\u7684\u56DB\u4F4D\u8BFB\u6570\uFF0C\u6309\u4F60\u8D70\u8FC7\u7684\u5730\u70B9\u6392\u5217\u3002", "Five events occur once each; count their actual positions from 1 to 5. The shadow appears immediately after the lamp lights. The door opens after the bell rings.\n\nThree shutters: rotation preserves their shapes. A cell glows under an odd number of layers and is dark under an even number. Match the overlay exactly to the pattern on the wall.\n\nThe four coordinate digits follow the order of the places you visited."],
        ["\u56DE\u58F0 \xB7 \u5199\u5728\u95E8\u5185\u4FA7\u7684\u8BF4\u660E", "Echo \xB7 instructions inside the door", "\u949F\u54CD\u7684\u771F\u5B9E\u4F4D\u6B21\uFF0C\u6070\u597D\u662F\u706F\u4EAE\u8D77\u4F4D\u6B21\u7684\u4E24\u500D\u3002\u201C\u4FE1\u9001\u8FBE\u201D\u4E0D\u518D\u9644\u52A0\u5176\u4ED6\u6761\u4EF6\u3002\n\n\u5750\u6807\u7531\u5DE6\u5230\u53F3\uFF1A\n\u89C2\u6D4B\u7AD9\u7684\u7B2C\u4E09\u9891\u6BB5\uFF1B\n\u6E21\u7AD9\u771F\u5B9E\u96FE\u706F\u7684\u6570\u91CF\uFF1B\n\u6E29\u5BA4\u5B8C\u6574\u8BB0\u5FC6\u7684\u6839\u6570\uFF1B\n\u4FEE\u590D\u5E37\u5E55\u540E\u663E\u51FA\u7684\u95E8\u724C\u6570\u5B57\u3002\n\n\u524D\u9762\u4E09\u4E2A\u7ED3\u679C\u90FD\u7559\u5728\u201C\u968F\u8EAB\u643A\u5E26\u7684\u8BB0\u5F55\u201D\u91CC\u3002\u56E0\u679C\u6863\u6848\u4E0E\u5E37\u5E55\u5FC5\u987B\u5148\u4FEE\u590D\uFF0C\u5750\u6807\u53F0\u624D\u4F1A\u54CD\u5E94\u3002", "The bell\u2019s actual position is exactly twice the lamp\u2019s position. No extra constraint applies to the letter\u2019s arrival.\n\nCoordinates from left to right:\nThe observatory\u2019s third frequency;\nThe ferry\u2019s number of truthful lamps;\nThe complete memory\u2019s root count;\nThe door number revealed behind the repaired shutters.\n\nThe first three results remain in Records carried with you. Restore the causal archive and shutters before the coordinate console can respond."]
      ]
    }
  };
  var chapterPuzzles = {
    route: { title: ["\u5341\u6B65\u822A\u8DEF", "The ten-move crossing"], intro: ["\u6D77\u56FE\u53EA\u7559\u4E0B\u6697\u7901\u4E0E\u4E24\u4E2A\u6D6E\u6807\u3002\u627E\u51FA\u4E00\u6761\u521A\u597D\u8017\u5C3D\u71C3\u6599\u7684\u822A\u7EBF\u3002", "Only reefs and two buoys remain on the chart. Trace a crossing that uses exactly the available fuel."], result: ["\u822A\u8DEF\u5B8C\u6574\u4E86\u3002\u4F60\u7ECF\u8FC7\u7684\u4E0D\u662F\u964C\u751F\u6C34\u57DF\uFF0C\u800C\u662F\u90A3\u4E00\u5206\u949F\u5C1A\u672A\u53D1\u751F\u7684\u6D6A\u3002", "The crossing is complete. These are not unfamiliar waters, but waves that had not yet happened inside that minute."], hints: [["\u4E24\u4E2A\u65F6\u95F4\u7684\u8BB0\u5F55\u5171\u540C\u89C4\u5B9A\u8D77\u70B9\u3001\u7EC8\u70B9\u3001\u6D6E\u6807\u6B21\u5E8F\u4E0E\u603B\u6B65\u6570\u3002", "The two records together specify endpoints, buoy order, and the exact move count."], ["\u5148\u53BB C2\uFF0C\u518D\u7ED5\u5411 A4\u3002\u4E0D\u80FD\u4E3A\u4E86\u51D1\u6B65\u6570\u91CD\u590D\u7ECF\u8FC7\u683C\u5B50\u3002", "Reach C2 first, then work around to A4. You cannot revisit cells to spend fuel."], ["A1 \u2192 A2 \u2192 B2 \u2192 C2 \u2192 C3 \u2192 B3 \u2192 A3 \u2192 A4 \u2192 B4 \u2192 C4 \u2192 D4\u3002", "A1 \u2192 A2 \u2192 B2 \u2192 C2 \u2192 C3 \u2192 B3 \u2192 A3 \u2192 A4 \u2192 B4 \u2192 C4 \u2192 D4."]] },
    lamps: { title: ["\u96FE\u706F\u8BC1\u8BCD", "The lamps\u2019 testimony"], intro: ["\u6BCF\u76CF\u706F\u90FD\u5BF9\u5176\u4ED6\u706F\u4F5C\u4E86\u8BC1\u8BCD\u3002\u4F60\u8981\u6062\u590D\u4E00\u7EC4\u6CA1\u6709\u81EA\u76F8\u77DB\u76FE\u7684\u660E\u6697\u72B6\u6001\u3002", "Each lamp testifies about the others. Restore a set of states in which none contradicts its own truthfulness."], result: ["A \u706D\uFF0CB\u3001C\u3001D \u4EAE\u3002\u771F\u5B9E\u4FE1\u53F7\u5171 3 \u76CF\u3002\u6E21\u53E3\u7B2C\u4E00\u6B21\u627F\u8BA4\u4E86\u81EA\u5DF1\u7684\u540D\u5B57\uFF1A\u5F52\u9014\u3002", "A is dark; B, C, and D are lit. There are 3 truthful signals. The terminal finally reveals its name: Homeward."], hints: [["\u706F\u4EAE\uFF0C\u8BC1\u8BCD\u5FC5\u987B\u6210\u7ACB\uFF1B\u706F\u706D\uFF0C\u8BC1\u8BCD\u5FC5\u987B\u4E0D\u6210\u7ACB\u3002\u56DB\u6761\u89C4\u5219\u8981\u540C\u65F6\u6EE1\u8DB3\u3002", "A lit lamp must speak truth; a dark lamp must speak falsely. All four rules apply simultaneously."], ["B \u4E0E C \u5FC5\u987B\u540C\u4EAE\u540C\u706D\u3002\u8BD5\u7740\u5047\u8BBE\u5B83\u4EEC\u90FD\u706D\uFF0C\u518D\u68C0\u67E5 A\u3001D \u7684\u8BC1\u8BCD\u3002", "B and C must have the same state. Suppose both are dark, then check A and D for contradictions."], ["\u53EA\u6709 A \u7184\u706D\u3002\u8BA9 B\u3001C\u3001D \u5168\u90E8\u4EAE\u8D77\u3002", "Only A is dark. Light B, C, and D."]] },
    bridge: { title: ["\u96F6\u7535\u52BF\u7535\u6865", "The zero-potential bridge"], intro: ["\u4E5D\u76CF\u6307\u793A\u706F\u76F8\u4E92\u7275\u52A8\u3002\u6E21\u8239\u9700\u8981\u6240\u6709\u6B8B\u4F59\u7535\u52BF\u4E00\u8D77\u5F52\u96F6\u3002", "Nine indicators affect their neighbors. The ferry needs every residual potential to reach zero."], result: ["\u7535\u6865\u63A5\u5730\uFF0C\u96FE\u4E2D\u7684\u8239\u5F00\u59CB\u547C\u5438\u3002\u4F60\u7EC8\u4E8E\u53EF\u4EE5\u79BB\u5F00\u8FD9\u5EA7\u6E21\u7AD9\u3002", "The bridge grounds itself. The boat begins to breathe in the fog. The terminal will let you leave."], hints: [["\u6BCF\u4E00\u683C\u53EA\u5F71\u54CD\u81EA\u5DF1\u548C\u4E0A\u4E0B\u5DE6\u53F3\u7684\u90BB\u683C\u3002\u76EE\u6807\u662F\u5168\u706D\u3002", "Each cell affects itself and its orthogonal neighbors. The target is all dark."], ["\u540C\u4E00\u683C\u6309\u4E24\u6B21\u4F1A\u62B5\u6D88\u3002\u53EF\u4EE5\u4ECE\u7B2C\u4E00\u884C\u5411\u4E0B\u6D88\u706F\uFF0C\u6700\u540E\u4E00\u884C\u4F1A\u68C0\u9A8C\u524D\u9762\u7684\u9009\u62E9\u3002", "Two presses on the same cell cancel. Chase lights downward from the top row; the last row tests your earlier choices."], ["\u7B2C\u4E09\u5C42\u63D0\u793A\u4F1A\u6839\u636E\u5F53\u524D\u706F\u9635\u8BA1\u7B97\u6240\u9700\u6309\u952E\u3002", "The third hint computes the required presses for the current board."]] },
    mirrors: { title: ["\u65E0\u65E5\u4E4B\u5149", "Light without a sun"], intro: ["\u5149\u4E0D\u9700\u8981\u65B0\u7684\u65B9\u5411\uFF0C\u53EA\u9700\u8981\u4F9D\u6B21\u8BB0\u8D77\u81EA\u5DF1\u7A7F\u8FC7\u7684\u516D\u9762\u955C\u5B50\u3002", "The light needs no new direction, only to remember all six mirrors it once crossed."], result: ["\u63A5\u6536\u5668\u4EAE\u8D77\u3002\u4E00\u9053\u5149\u7A7F\u8FC7\u5168\u90E8\u516D\u9762\u955C\u5B50\uFF0C\u843D\u5728\u6CA1\u6709\u592A\u9633\u7684\u690D\u7269\u4E0A\u3002", "The receiver lights. A beam has passed through all six mirrors and reached plants that have never seen a sun."], hints: [["\u770B\u5DE6\u4FA7\u7B2C 3 \u884C\u7684\u5149\u6E90\uFF0C\u4EE5\u53CA\u53F3\u4FA7\u7B2C 5 \u884C\u7684\u63A5\u6536\u5668\u3002", "Locate the source in row 3 on the left, and the receiver in row 5 on the right."], ["\u4ECE\u5165\u5C04\u7684\u7B2C\u4E00\u9762\u955C\u5B50\u51FA\u53D1\uFF0C\u9010\u6BB5\u8FFD\u5149\u3002\u5411\u5317\u3001\u5411\u4E1C\u3001\u5411\u5357\u3001\u5411\u897F\u3001\u5411\u5357\uFF0C\u6700\u540E\u5411\u4E1C\u3002", "Follow one segment at a time: north, east, south, west, south, then east."], ["\u6309\u955C\u9762\u7F16\u53F7\u8BBE\u7F6E\uFF1A\u2160 /\uFF0C\u2161 /\uFF0C\u2162 \\\uFF0C\u2163 /\uFF0C\u2164 /\uFF0C\u2165 \\\u3002", "By mirror number: I /, II /, III \\, IV /, V /, VI \\."]] },
    growth: { title: ["\u4E00\u5206\u949F\u7684\u751F\u957F", "One minute of growth"], intro: ["\u4E94\u4E2A\u5468\u671F\u8DB3\u4EE5\u957F\u6210\u4E00\u6BB5\u8BB0\u5FC6\u3002\u6BCF\u4E00\u6B65\u6C14\u5019\u90FD\u4F1A\u6539\u53D8\u4E0B\u4E00\u6B65\u7684\u6761\u4EF6\u3002", "Five cycles can grow one memory. Each climate changes the conditions for the next cycle."], result: ["\u6839 2\uFF0C\u53F6 5\uFF0C\u82B1 5\u3002\u8BB0\u5FC6\u5B8C\u6574\uFF0C\u74F6\u5E95\u7684\u4E24\u6761\u6839\u4F1A\u966A\u4F60\u8D70\u5411\u6700\u540E\u4E00\u4E2A\u5730\u70B9\u3002", "Root 2, leaf 5, flower 5. The memory is complete. Its two roots will accompany you to the final place."], hints: [["\u65E5\u7167\u589E\u52A0\u53F6\uFF0C\u964D\u96E8\u589E\u52A0\u6839\uFF0C\u96FE\u5316\u589E\u52A0\u82B1\u5E76\u6D88\u8017\u6839\u3002\u6CE8\u610F\u4F7F\u7528\u7684\u662F\u5F53\u65F6\u7684\u6570\u503C\u3002", "Sun adds leaves, rain adds roots, and mist adds flowers while consuming a root. Each uses the counts at that moment."], ["\u6700\u540E\u4E00\u6B65\u7528\u96FE\u5316\u3002\u6B64\u524D\u5E94\u79EF\u7D2F 3 \u6839\u30015 \u53F6\u30010 \u82B1\uFF1B\u8FD8\u5269\u56DB\u4E2A\u5468\u671F\u6765\u505A\u5230\u3002", "Use mist last. Before it you need root 3, leaf 5, flower 0, reached in the preceding four cycles."], ["\u964D\u96E8 \u2192 \u65E5\u7167 \u2192 \u964D\u96E8 \u2192 \u65E5\u7167 \u2192 \u96FE\u5316\u3002", "Rain \u2192 Sun \u2192 Rain \u2192 Sun \u2192 Mist."]] },
    specimens: { title: ["\u65E0\u540D\u6807\u672C\u67DC", "The unnamed specimens"], intro: ["\u540D\u5B57\u5DF2\u7ECF\u892A\u8272\u3002\u6BCF\u884C\u6BCF\u5217\u7684\u56DB\u4E2A\u7F16\u53F7\uFF0C\u5374\u4ECD\u7136\u4E92\u76F8\u8FA8\u8BA4\u3002", "The names have faded, but the four numbers in each row and column still recognize one another."], result: ["\u67DC\u95E8\u6253\u5F00\uFF0C\u6240\u6709\u6807\u672C\u6620\u51FA\u540C\u4E00\u7247\u6D77\u5CB8\u3002\u5B83\u4EEC\u4FDD\u5B58\u7740\u4EBA\u4EEC\u66FE\u7ECF\u4EE5\u4E3A\u4E0D\u503C\u5F97\u8BB0\u4F4F\u7684\u4E00\u5206\u949F\u3002", "The cabinet opens. Every specimen shows the same coast, preserving a minute people once thought too small to remember."], hints: [["\u8FD9\u91CC\u53EA\u9650\u5236\u6574\u884C\u548C\u6574\u5217\u5404\u5305\u542B\u4E00\u6B21 1\u20144\uFF0C\u4E0D\u9650\u5236\u5BF9\u89D2\u7EBF\u548C\u5C0F\u65B9\u5757\u3002", "Only full rows and columns must contain 1\u20134 once each. Diagonals and smaller boxes do not count."], ["\u7B2C\u4E00\u884C\u662F 1\u30012\u30013\u30014\u3002\u7B2C\u4E09\u884C\u7684\u672B\u5C3E\u5DF2\u7ECF\u662F 1\uFF0C\u53EF\u7EE7\u7EED\u6309\u5217\u6392\u9664\u3002", "The first row is 1, 2, 3, 4. Row three already ends in 1; continue eliminating candidates by column."], ["\u4ECE\u4E0A\u5230\u4E0B\uFF1A1234 / 3412 / 4321 / 2143\u3002", "From top to bottom: 1234 / 3412 / 4321 / 2143."]] },
    causality: { title: ["\u5012\u56E0\u6863\u6848", "The causal archive"], intro: ["\u8BB0\u5F55\u7EB8\u88AB\u6253\u4E71\u4E86\u3002\u4E8B\u4EF6\u7684\u5148\u540E\u5FC5\u987B\u540C\u65F6\u7B26\u5408\u4E24\u4E2A\u65F6\u95F4\u91CC\u7684\u8BC1\u8BCD\u3002", "The records have been scattered. Their order must satisfy testimony from both moments."], result: ["\u4FE1\u9001\u8FBE \u2192 \u706F\u4EAE\u8D77 \u2192 \u5F71\u5B50\u51FA\u73B0 \u2192 \u949F\u54CD \u2192 \u95E8\u5F00\u542F\u3002\u4F60\u4EE5\u4E3A\u662F\u949F\u58F0\u5524\u9192\u4E86\u706F\u5854\uFF0C\u5176\u5B9E\u5148\u6765\u7684\u662F\u4E00\u5C01\u4FE1\u3002", "Letter arrives \u2192 Lamp lights \u2192 Shadow appears \u2192 Bell rings \u2192 Door opens. You thought the bell woke the lighthouse. A letter came first."], hints: [["\u4F4D\u6B21\u4ECE 1 \u5F00\u59CB\u3002\u201C\u4E24\u500D\u201D\u8BF4\u7684\u662F\u5E8F\u53F7\uFF0C\u4E0D\u662F\u76F8\u9694\u4E24\u4E2A\u4E8B\u4EF6\u3002", "Positions start at 1. \u201CTwice\u201D refers to the position number, not a two-event gap."], ["\u706F\u4E0D\u80FD\u6392\u7B2C 1\uFF0C\u5426\u5219\u949F\u548C\u5F71\u5B50\u90FD\u88AB\u8981\u6C42\u5360\u636E\u7B2C 2\u3002\u706F\u4E5F\u4E0D\u80FD\u6392\u7B2C 3 \u6216\u66F4\u540E\u3002", "The lamp cannot be first: bell and shadow would both occupy position 2. It cannot be third or later either."], ["\u4FE1\u9001\u8FBE \u2192 \u706F\u4EAE\u8D77 \u2192 \u5F71\u5B50\u51FA\u73B0 \u2192 \u949F\u54CD \u2192 \u95E8\u5F00\u542F\u3002", "Letter arrives \u2192 Lamp lights \u2192 Shadow appears \u2192 Bell rings \u2192 Door opens."]] },
    shutters: { title: ["\u4E09\u91CD\u5E37\u5E55", "The three shutters"], intro: ["\u8FD9\u91CC\u7684\u9634\u5F71\u4E0D\u53EA\u662F\u906E\u6321\u3002\u91CD\u53E0\u5076\u6570\u6B21\u7684\u5149\uFF0C\u4F1A\u628A\u81EA\u5DF1\u62B9\u53BB\u3002", "Shadows here do more than block light. An even number of overlapping layers erases itself."], result: ["\u4E09\u5C42\u53E0\u5F71\u5B8C\u5168\u543B\u5408\u3002\u5E37\u5E55\u540E\u9762\u7684\u95E8\u724C\u663E\u9732\u51FA\u6765\uFF1A5\u3002\u628A\u5B83\u8BB0\u5728\u6700\u540E\u4E00\u4F4D\u5750\u6807\u3002", "The three layers align. A number is revealed behind the shutters: 5. Carry it to the final coordinate digit."], hints: [["\u5404\u5C42\u53EA\u80FD\u65CB\u8F6C\uFF0C\u4E0D\u80FD\u79FB\u52A8\u3002\u76EE\u6807\u4F7F\u7528\u5947\u6570\u4EAE\u3001\u5076\u6570\u6697\u7684\u53E0\u52A0\u89C4\u5219\u3002", "Layers rotate but never translate. The overlay uses odd coverage for light and even coverage for darkness."], ["\u5148\u6BD4\u8F83\u4E2D\u5FC3\u683C\u548C\u56DB\u89D2\u3002\u4E0D\u8981\u628A\u4E24\u5C42\u91CD\u53E0\u8BEF\u8BA4\u4E3A\u66F4\u4EAE\uFF1A\u4E24\u5C42\u4F1A\u62B5\u6D88\u3002", "Compare the center and corners first. Two overlapping layers cancel instead of making a cell brighter."], ["\u4ECE\u590D\u4F4D\u72B6\u6001\u5F00\u59CB\uFF0CA \u987A\u65F6\u9488 1 \u6B21\uFF0CB \u987A\u65F6\u9488 3 \u6B21\uFF0CC \u987A\u65F6\u9488 2 \u6B21\u3002", "From reset: rotate A clockwise once, B three times, and C twice."]] },
    origin: { title: ["\u6E90\u70B9\u5750\u6807", "Coordinates of the origin"], intro: ["\u56DB\u4E2A\u5730\u70B9\u7559\u4E0B\u56DB\u4E2A\u6570\u5B57\u3002\u5B83\u4EEC\u6309\u4F60\u8D70\u8FC7\u7684\u987A\u5E8F\uFF0C\u628A\u6700\u540E\u4E00\u9053\u95E8\u8FDE\u63A5\u5230\u73B0\u5728\u3002", "Four places left four digits. In the order you visited them, they connect the final door to the Present."], result: ["6 \xB7 3 \xB7 2 \xB7 5\u3002\u56DB\u4E2A\u5730\u70B9\u91CD\u65B0\u63A5\u6210\u4E00\u6BB5\u5B8C\u6574\u7684\u65F6\u95F4\u3002\u95E8\u5DF2\u7ECF\u53EF\u4EE5\u6253\u5F00\u3002", "6 \xB7 3 \xB7 2 \xB7 5. Four places become one continuous moment. The door can open now."], hints: [["\u5148\u4FEE\u590D\u672C\u7AE0\u7684\u56E0\u679C\u6863\u6848\u4E0E\u5E37\u5E55\uFF0C\u518D\u9605\u8BFB\u56DE\u58F0\u4E2D\u7684\u5750\u6807\u8BF4\u660E\u3002", "Restore this chapter\u2019s archive and shutters, then read the coordinate instructions in the Echo."], ["\u6309\u987A\u5E8F\u53D6\u7B2C\u4E09\u9891\u6BB5\u3001\u771F\u5B9E\u96FE\u706F\u6570\u3001\u5B8C\u6574\u8BB0\u5FC6\u7684\u6839\u6570\uFF0C\u4EE5\u53CA\u5E37\u5E55\u540E\u9762\u7684\u95E8\u724C\u3002\u624B\u8BB0\u4FDD\u7559\u4E86\u7ED3\u679C\u3002", "Take the third frequency, truthful lamp count, complete memory\u2019s roots, and number behind the shutters. Your journal preserves these results."], ["\u4ECE\u5DE6\u5230\u53F3\uFF1A6\u30013\u30012\u30015\u3002", "From left to right: 6, 3, 2, 5."]] }
  };

  // src/src/content.js
  var words = {
    ...campaignWords,
    title: ["\u9759\u9ED8\u5B50\u5348\u7EBF", "Silent Meridian"],
    subtitle: ["\u4E00\u5EA7\u89C2\u6D4B\u7AD9\u3002\u4E00\u4E2A\u6CA1\u6709\u7ED3\u675F\u7684\u591C\u665A\u3002", "One observatory. One night that never ended."],
    tagline: ["\u4E16\u754C\u505C\u5728 00:17\u3002\n\u53EA\u6709\u4F60\u7684\u5F71\u5B50\uFF0C\u8FD8\u5728\u5F80\u524D\u8D70\u3002", "The world stopped at 00:17.\nYour shadow kept moving."],
    enter: ["\u8FDB\u5165\u89C2\u6D4B\u7AD9", "Enter the observatory"],
    resume: ["\u7EE7\u7EED\u8C03\u67E5", "Continue investigation"],
    newGame: ["\u91CD\u65B0\u5F00\u59CB", "Begin again"],
    prologue: ["\u6D77\u5CB8\u89C2\u6D4B\u8BA1\u5212 / \u7B2C 09 \u53F7\u7AD9", "COASTAL OBSERVATION / STATION 09"],
    original: ["\u539F\u521B\u4EA4\u4E92\u89E3\u8C1C", "AN ORIGINAL PUZZLE EXPERIENCE"],
    credit: ["\u9759\u9ED8\u5B50\u5348\u7EBF \xB7 \u7B2C\u4E00\u7AE0\uFF1A\u672A\u7ADF\u4E4B\u591C", "SILENT MERIDIAN \xB7 CHAPTER I: THE UNFINISHED NIGHT"],
    soundOn: ["\u5173\u95ED\u58F0\u97F3", "Mute sound"],
    soundOff: ["\u5F00\u542F\u58F0\u97F3", "Enable sound"],
    depthEnable: ["\u5F00\u542F 3D \u89C6\u6548", "Enable 3D effects"],
    depthDisable: ["\u5173\u95ED 3D \u89C6\u6548", "Disable 3D effects"],
    depthDescription: ["\u79FB\u52A8\u9F20\u6807\u611F\u53D7\u666F\u6DF1\uFF1B\u89E6\u5C4F\u4E0B\u955C\u5934\u8F7B\u7F13\u6F02\u79FB\u3002\u8C03\u67E5\u673A\u5173\u65F6\u753B\u9762\u4F1A\u505C\u7A33\u3002", "Move the pointer to explore the depth; touch screens use a gentle camera drift. The view settles while inspecting an instrument."],
    depthStill: ["\u5DF2\u8DDF\u968F\u7CFB\u7EDF\u7684\u201C\u51CF\u5C11\u52A8\u6001\u6548\u679C\u201D\u8BBE\u7F6E\uFF1A\u4FDD\u7559\u7ACB\u4F53\u5149\u5F71\uFF0C\u5173\u95ED\u955C\u5934\u79FB\u52A8\u4E0E\u52A8\u753B\u3002", "Following your reduced-motion preference: dimensional lighting remains, with no camera movement or animation."],
    depthUnavailable: ["\u6B64\u8BBE\u5907\u4F7F\u7528\u57FA\u7840\u753B\u9762\uFF0C\u6240\u6709\u8C1C\u9898\u4ECD\u53EF\u6B63\u5E38\u6E38\u73A9\u3002", "This device uses the basic view. Every puzzle remains playable."],
    journal: ["\u8C03\u67E5\u624B\u8BB0", "Field journal"],
    map: ["\u89C2\u6D4B\u7AD9\u5E73\u9762\u56FE", "Station map"],
    present: ["\u73B0\u5728", "Present"],
    echo: ["\u56DE\u58F0", "Echo"],
    shift: ["\u5207\u6362\u65F6\u95F4 \xB7 \u7A7A\u683C", "Shift time \xB7 Space"],
    presentTime: ["\u65F6\u95F4\u9759\u6B62", "TIME SUSPENDED"],
    echoTime: ["\u524D\u4E00\u5206\u949F\u7684\u6B8B\u5F71", "THE MINUTE BEFORE"],
    back: ["\u8FD4\u56DE\u573A\u666F", "Back to the room"],
    close: ["\u5173\u95ED", "Close"],
    inspect: ["\u8C03\u67E5", "Inspect"],
    mechanisms: ["\u5DF2\u6821\u51C6", "CALIBRATED"],
    saved: ["\u8FDB\u5EA6\u5DF2\u4FDD\u5B58", "Progress saved"],
    noSave: ["\u672C\u6B21\u6D4F\u89C8\u5668\u65E0\u6CD5\u4FDD\u5B58\u8FDB\u5EA6\uFF0C\u8BF7\u4FDD\u6301\u9875\u9762\u6253\u5F00\u3002", "Saving is unavailable in this browser. Keep this page open."],
    noNotes: ["\u5C1A\u672A\u6536\u96C6\u5230\u7EBF\u7D22\u3002\u8BD5\u7740\u68C0\u67E5\u623F\u95F4\u91CC\u53D1\u5149\u7684\u7269\u4EF6\u3002", "No evidence yet. Inspect the glowing objects in each room."],
    recorded: ["\u7EBF\u7D22\u5DF2\u6536\u5165\u624B\u8BB0", "Evidence added to your journal"],
    fieldNotes: ["\u6211\u7684\u63A8\u7406", "My deductions"],
    notesPlaceholder: ["\u8BB0\u4E0B\u7B26\u53F7\u3001\u6570\u5B57\u6216\u4F60\u7684\u731C\u60F3\u2026\u2026", "Record symbols, numbers, or a theory\u2026"],
    personalSaved: ["\u6587\u5B57\u968F\u8FDB\u5EA6\u81EA\u52A8\u4FDD\u5B58\u5728\u6B64\u6D4F\u89C8\u5668", "Your writing saves with your progress in this browser"],
    evidence: ["\u7EBF\u7D22\u6863\u6848", "Evidence archive"],
    allEvidence: ["\u5168\u90E8\u7EBF\u7D22", "All evidence"],
    collected: ["\u5DF2\u6536\u96C6", "COLLECTED"],
    optional: ["\u53EF\u9009", "OPTIONAL"],
    help: ["\u64CD\u4F5C\u8BF4\u660E", "How to play"],
    settings: ["\u6682\u505C\u4E0E\u8BBE\u7F6E", "Pause & settings"],
    controls: ["\u70B9\u51FB\u573A\u666F\u7269\u4EF6\u8C03\u67E5\uFF1B\u4E0B\u65B9\u5207\u6362\u623F\u95F4\u3002\u7A7A\u683C\u5207\u6362\u65F6\u95F4\uFF0CJ \u6253\u5F00\u624B\u8BB0\uFF0CEsc \u8FD4\u56DE\u3002", "Inspect objects in the scene. Travel using the rooms below. Space shifts time, J opens the journal, and Esc goes back."],
    touchControls: ["\u70B9\u51FB\u53D1\u5149\u7269\u4EF6\u8C03\u67E5\uFF0C\u5207\u6362\u623F\u95F4\u5BFB\u627E\u7EBF\u7D22\u3002\u540C\u4E00\u4E2A\u5730\u65B9\uFF0C\u5728\u201C\u73B0\u5728\u201D\u548C\u201C\u56DE\u58F0\u201D\u91CC\u4F1A\u7559\u4E0B\u4E0D\u540C\u7684\u8BB0\u5F55\u3002", "Tap glowing objects and explore every room. The same place holds different records in the Present and in the Echo."],
    briefingTitle: ["\u4F60\u6765\u8FC7\u8FD9\u91CC\u3002\u53EA\u662F\u4E0D\u8BB0\u5F97\u4E86\u3002", "You have been here. You just do not remember."],
    briefingBody: ["\u6D77\u6C34\u60AC\u5728\u534A\u7A7A\uFF0C\u7A79\u9876\u4E0A\u7684\u949F\u505C\u5728 00:17\u3002\u53E3\u888B\u91CC\u7684\u76F8\u4F4D\u4EEA\u5374\u4ECD\u5728\u5DE5\u4F5C\u2014\u2014\u5B83\u80FD\u8BA9\u4F60\u770B\u89C1\u524D\u4E00\u5206\u949F\u7559\u4E0B\u7684\u56DE\u58F0\u3002\n\n\u627E\u5230\u4E09\u5904\u5931\u51C6\u7684\u88C5\u7F6E\uFF0C\u518D\u56DE\u5230\u4E3B\u661F\u76D8\u3002\u8FD9\u91CC\u7684\u6BCF\u4E00\u9053\u9501\uFF0C\u90FD\u6709\u7559\u4E0B\u7684\u7B54\u6848\u3002", "The sea hangs motionless. The clock above the dome reads 00:17. Only the phase instrument in your pocket still works: it reveals an echo of the preceding minute.\n\nRestore three instruments, then return to the meridian. Every lock here has left its answer somewhere."],
    beginInvestigation: ["\u5F00\u59CB\u8C03\u67E5", "Begin investigation"],
    noTimer: ["\u81EA\u7531\u63A2\u7D22 \xB7 \u65E0\u5012\u8BA1\u65F6 \xB7 \u81EA\u52A8\u5B58\u6863", "EXPLORE FREELY \xB7 NO TIMER \xB7 AUTOSAVE"],
    resetTitle: ["\u91CD\u65B0\u5F00\u59CB\u8FD9\u4E00\u4E2A\u591C\u665A\uFF1F", "Begin this night again?"],
    resetBody: ["\u8FD9\u4F1A\u6E05\u9664\u672C\u6E38\u620F\u5728\u6B64\u6D4F\u89C8\u5668\u4E2D\u7684\u8C1C\u9898\u8FDB\u5EA6\u3001\u624B\u8BB0\u4E0E\u7ED3\u5C40\u3002", "This clears this game\u2019s puzzle progress, journal, and ending in this browser."],
    cancel: ["\u4FDD\u7559\u8FDB\u5EA6", "Keep progress"],
    confirmReset: ["\u6E05\u9664\u5E76\u91CD\u65B0\u5F00\u59CB", "Clear and restart"],
    showMarkers: ["\u663E\u793A\u8C03\u67E5\u70B9", "Show investigation points"],
    hideMarkers: ["\u9690\u85CF\u8C03\u67E5\u70B9", "Hide investigation points"],
    titleScreen: ["\u8FD4\u56DE\u6807\u9898\u753B\u9762", "Return to title"],
    hint: ["\u9700\u8981\u4E00\u70B9\u63D0\u793A", "A little help"],
    nextHint: ["\u518D\u591A\u4E00\u70B9\u63D0\u793A", "Reveal another hint"],
    hintLevel: ["\u63D0\u793A\u5C42\u7EA7", "HINT LEVEL"],
    lastHint: ["\u5168\u90E8\u63D0\u793A\u5DF2\u5C55\u5F00", "All hints revealed"],
    resetPuzzle: ["\u590D\u4F4D\u673A\u5173", "Reset instrument"],
    check: ["\u9A8C\u8BC1\u6392\u5217", "Check sequence"],
    tune: ["\u9501\u5B9A\u9891\u6BB5", "Lock frequencies"],
    calibrate: ["\u6821\u51C6\u6F6E\u6C50", "Calibrate tide"],
    align: ["\u951A\u5B9A\u4E3B\u955C", "Anchor the meridian"],
    wrong: ["\u673A\u5173\u6CA1\u6709\u54CD\u5E94\u3002\u8FD8\u6709\u7EBF\u7D22\u6CA1\u6709\u543B\u5408\u3002", "The instrument remains silent. A clue still does not fit."],
    solved: ["\u6821\u51C6\u5B8C\u6210", "CALIBRATION COMPLETE"],
    returnExplore: ["\u7EE7\u7EED\u63A2\u7D22", "Continue exploring"],
    alreadySolved: ["\u8FD9\u53F0\u88C5\u7F6E\u5DF2\u7ECF\u6821\u51C6\u3002\u7ED3\u679C\u5DF2\u8BB0\u5F55\u5728\u624B\u8BB0\u4E2D\u3002", "This instrument is calibrated. Its result is in your journal."],
    relatedNotes: ["\u968F\u624B\u67E5\u9605\u7EBF\u7D22", "Evidence at hand"],
    missingNote: ["\u5C1A\u672A\u627E\u5230\uFF1A", "Not yet found: "],
    archiveTitle: ["\u5230\u7AD9\u8005\u6863\u6848", "The arrivals archive"],
    archiveIntro: ["\u4E94\u4F4D\u89C2\u6D4B\u5458\uFF0C\u4E94\u679A\u6807\u8BB0\u3002\u628A\u4ED6\u4EEC\u6309\u62B5\u8FBE\u5148\u540E\uFF0C\u4ECE\u5DE6\u81F3\u53F3\u6392\u5217\u3002", "Five observers, five emblems. Arrange them from first arrival to last, left to right."],
    archiveInstruction: ["\u5148\u9009\u69FD\u4F4D\uFF0C\u518D\u9009\u7B26\u53F7\u3002\u5DF2\u653E\u5165\u7684\u7B26\u53F7\u4F1A\u4E0E\u5F53\u524D\u69FD\u4F4D\u4EA4\u6362\u3002", "Select a slot, then an emblem. Placed emblems swap with the selected slot."],
    slot: ["\u69FD\u4F4D", "Slot"],
    selected: ["\u5DF2\u9009", "Selected"],
    empty: ["\u7A7A\u69FD", "Empty"],
    radioTitle: ["\u56DE\u58F0\u63A5\u6536\u5668", "The echo receiver"],
    radioIntro: ["\u8FD9\u6BB5\u4FE1\u53F7\u4E0D\u662F\u4ECE\u8FDC\u65B9\u4F20\u6765\u3002\u4E09\u4E2A\u9891\u6BB5\uFF0C\u6307\u5411\u540C\u4E00\u4E2A\u65F6\u95F4\u3002", "The signal is not coming from somewhere far away. Three frequencies point to a single moment."],
    radioInstruction: ["\u8C03\u6574\u4E09\u4E2A\u9891\u6BB5\u7684\u6570\u503C\u3002\u78C1\u5E26\u4E0A\u7684\u7EBF\u7D22\u4E0E\u5230\u7AD9\u6863\u6848\u6709\u5173\u3002", "Tune all three bands. The tape refers to the order in the arrivals archive."],
    band: ["\u9891\u6BB5", "BAND"],
    playSignal: ["\u76D1\u542C\u4FE1\u53F7", "Listen to signal"],
    signalVisual: ["\u6CE2\u5F62\u4E0E\u6570\u503C\u5747\u4E3A\u53EF\u89C6\u7EBF\u7D22\uFF0C\u65E0\u9700\u4F9D\u8D56\u58F0\u97F3\u3002", "All information is visible in the values and waveform; audio is optional."],
    tideTitle: ["\u505C\u6F6E\u673A", "The stillwater engine"],
    tideIntro: ["\u56DB\u6839\u6307\u9488\u4E92\u76F8\u7275\u52A8\u3002\u4F60\u8F6C\u52A8\u7684\uFF0C\u4ECE\u6765\u4E0D\u53EA\u6709\u4E00\u679A\u9F7F\u8F6E\u3002", "Four hands pull against each other. No wheel ever turns alone."],
    tideInstruction: ["\u6BCF\u5708\u516B\u683C\uFF0C\u987A\u65F6\u9488\u9012\u589E\u3002\uFF0B\u987A\u8F6C\u4E00\u683C\uFF0C\u2212\u9006\u8F6C\u4E00\u683C\uFF1B\u56DB\u9488\u5F52\u96F6\u624D\u4F1A\u505C\u6F6E\u3002", "Eight marks per circle, increasing clockwise. + advances and \u2212 reverses. Bring all four hands to zero."],
    coupling: ["\u4F20\u52A8\u5173\u7CFB", "COUPLING SCHEMATIC"],
    tideReset: ["\u590D\u4F4D\u540E\u6062\u590D\u521D\u59CB\u523B\u5EA6\uFF0C\u4E0D\u5F71\u54CD\u5176\u4ED6\u88C5\u7F6E\u3002", "Reset restores the original positions without affecting other instruments."],
    tidePlan: ["\u4ECE\u5F53\u524D\u523B\u5EA6\u51FA\u53D1\uFF1A", "From the current positions: "],
    tideHintReady: ["\u56DB\u9488\u5DF2\u5F52\u96F6\uFF0C\u73B0\u5728\u53EF\u4EE5\u6821\u51C6\u3002", "All hands are at zero. Calibrate now."],
    turnPlus: ["\u987A\u8F6C", "Forward"],
    turnMinus: ["\u9006\u8F6C", "Backward"],
    meridianTitle: ["\u9759\u9ED8\u5B50\u5348\u7EBF", "The silent meridian"],
    meridianIntro: ["\u6F6E\u6C50\u3001\u5230\u7AD9\u8005\u3001\u65E0\u7EBF\u7535\u3002\u4E09\u6761\u770B\u4F3C\u65E0\u5173\u7684\u8BB0\u5F55\uFF0C\u5728\u8FD9\u91CC\u6C47\u5408\u3002", "The tide, the arrivals, the radio. Three unrelated records meet here."],
    inner: ["\u5185\u8F68", "INNER"],
    middle: ["\u4E2D\u8F68", "MIDDLE"],
    outer: ["\u5916\u8F68", "OUTER"],
    meridianInstruction: ["\u4E09\u6761\u8F68\u9053\u5747\u6709\u516B\u683C\uFF0C\u4ECE 0 \u5F00\u59CB\u3002\u6309\u955C\u67B6\u94ED\u6587\uFF0C\u7531\u5185\u5411\u5916\u8BBE\u5B9A\u523B\u5EA6\u3002", "Each orbit has eight marks, starting at 0. Read the lens inscription from the inner orbit outward."],
    stillLocked: ["\u4E09\u5904\u88C5\u7F6E\u5C1A\u672A\u5168\u90E8\u6821\u51C6\u3002\u4E3B\u955C\u7F3A\u5C11\u7A33\u5B9A\u7684\u53C2\u7167\u3002", "The three instruments are not yet calibrated. The meridian has no stable reference."],
    requireEcho: ["\u4E3B\u955C\u53EA\u63A5\u53D7\u56DE\u58F0\u4E2D\u7684\u951A\u5B9A\u3002\u5207\u6362\u81F3\u201C\u56DE\u58F0\u201D\uFF0C\u518D\u5BF9\u9F50\u8F68\u9053\u3002", "The meridian can only be anchored in the Echo. Shift there to align its orbits."],
    toEcho: ["\u5207\u6362\u81F3\u56DE\u58F0", "Shift to the Echo"],
    toPresent: ["\u5E26\u7740\u951A\u70B9\u56DE\u5230\u73B0\u5728", "Carry the anchor to the Present"],
    anchored: ["\u951A\u70B9\u5DF2\u7ECF\u7559\u5728\u524D\u4E00\u5206\u949F\u3002\u73B0\u5728\uFF0C\u56DE\u53BB\u8BA9\u65F6\u949F\u7EE7\u7EED\u3002", "Your anchor is in the preceding minute. Return to the Present and let the clock move."],
    releaseTime: ["\u8BA9\u65F6\u95F4\u7EE7\u7EED", "Let time move"],
    finishTitle: ["\u65E0\u7EBF\u7535\u91CC\uFF0C\u662F\u4F60\u81EA\u5DF1\u7684\u58F0\u97F3\u3002", "The voice on the radio is yours."],
    finishBody: ["\u8FD9\u5EA7\u7AD9\u5E76\u6CA1\u6709\u56F0\u4F4F\u4F60\u3002\u5B83\u5728\u66FF\u6D77\u5CB8\u4E0A\u7684\u4EBA\u4EEC\u7559\u4F4F\u6700\u540E\u4E00\u5206\u949F\u3002\n\n\u73B0\u5728\uFF0C\u4FE1\u53F7\u5DF2\u7ECF\u9001\u8FBE\uFF0C\u6D77\u5824\u7684\u706F\u4E5F\u5DF2\u7ECF\u4EAE\u8D77\u3002\u4F60\u53EF\u4EE5\u677E\u5F00\u8FD9\u6839\u6307\u9488\u4E86\u3002\n\n\u90A3\u6BB5\u5F15\u5BFC\u4F60\u8D70\u5230\u8FD9\u91CC\u7684\u56DE\u58F0\uFF0C\u8981\u7559\u4E0B\u5417\uFF1F", "The station was not keeping you prisoner. It was holding the coast\u2019s last minute open.\n\nNow the signal has arrived. The seawall lights are on. You can let go of the clock\u2019s hand.\n\nWill you leave the echo that guided you here?"],
    keepEcho: ["\u7559\u4E0B\u56DE\u58F0", "Leave the echo"],
    releaseEcho: ["\u8BA9\u56DE\u58F0\u6D88\u6563", "Let it fade"],
    endKeepTitle: ["\u81F4\u4E0B\u4E00\u4F4D\u5B88\u591C\u4EBA", "For the next keeper"],
    endReleaseTitle: ["\u7EC8\u4E8E\uFF0C\u660E\u5929", "Tomorrow, at last"],
    endKeep: ["\u4F60\u628A\u90A3\u53E5\u8BDD\u5F55\u8FDB\u78C1\u5E26\u3002\n\u201C\u5982\u679C\u4F60\u542C\u5230\u4E86\uFF0C\u4E0D\u8981\u5BB3\u6015\u3002\u201D\n\n\u65F6\u949F\u8D70\u5230\u4E86 00:18\u3002\u6D77\u98CE\u7B2C\u4E00\u6B21\u7A7F\u8FC7\u7A79\u9876\u3002\n\u5F88\u4E45\u4EE5\u540E\uFF0C\u4E5F\u8BB8\u4F1A\u6709\u53E6\u4E00\u4E2A\u4EBA\uFF0C\u542C\u89C1\u4F60\u7684\u58F0\u97F3\u3002", "You press record.\n\u201CIf you can hear this, do not be afraid.\u201D\n\nThe clock turns to 00:18. Sea air passes through the dome for the first time.\nSomeday, someone else may hear your voice."],
    endRelease: ["\u4F60\u6309\u4E0B\u62B9\u9664\u952E\uFF0C\u6C99\u6C99\u58F0\u6E10\u6E10\u9000\u53BB\u3002\n\u8FD9\u4E00\u6B21\uFF0C\u4E0D\u518D\u6709\u4EBA\u91CD\u590D\u6628\u5929\u3002\n\n\u65F6\u949F\u8D70\u5230\u4E86 00:18\u3002\u6D77\u9762\u5347\u8D77\u7B2C\u4E00\u9053\u771F\u6B63\u7684\u6D6A\u3002\n\u5728\u8FD9\u5EA7\u7AD9\u4E4B\u5916\uFF0C\u8FD8\u6709\u4E00\u4E2A\u660E\u5929\u3002", "You erase the tape. The static slowly disappears.\nThis time, no one has to repeat yesterday.\n\nThe clock turns to 00:18. The first real wave rises on the sea.\nOutside the station, there is a tomorrow."],
    finished: ["\u8C03\u67E5\u5B8C\u6210", "INVESTIGATION COMPLETE"],
    endingLabel: ["\u7ED3\u5C40", "ENDING"],
    reviewJournal: ["\u91CD\u8BFB\u624B\u8BB0", "Read the journal"],
    exploreAfter: ["\u56DE\u5230\u89C2\u6D4B\u7AD9", "Revisit the observatory"],
    objectiveStart: ["\u8C03\u67E5\u4E09\u4E2A\u623F\u95F4\uFF0C\u8BA9\u88C5\u7F6E\u91CD\u65B0\u5F52\u4F4D\u3002", "Explore the three rooms. Restore their instruments."],
    objectiveFinal: ["\u4E09\u5904\u88C5\u7F6E\u5DF2\u7ECF\u6821\u51C6\u3002\u56DE\u5230\u7A79\u9876\uFF0C\u89E3\u5F00\u4E3B\u661F\u76D8\u3002", "Three instruments restored. Return to the dome and align the meridian."],
    objectiveAnchor: ["\u951A\u70B9\u5DF2\u7559\u5728\u56DE\u58F0\u4E2D\u3002\u56DE\u5230\u73B0\u5728\uFF0C\u542F\u52A8\u4E3B\u955C\u3002", "The Echo holds your anchor. Return to the Present and release the meridian."],
    objectiveDone: ["00:18\u3002\u6D77\u6C34\u7EC8\u4E8E\u5F00\u59CB\u6D41\u52A8\u3002", "00:18. The sea moves again."],
    phaseHint: ["\u540C\u4E00\u95F4\u623F\u95F4\uFF0C\u5728\u53E6\u4E00\u6BB5\u65F6\u95F4\u91CC\u85CF\u7740\u4E0D\u540C\u7684\u7EBF\u7D22\u3002", "The same room holds different evidence in the other moment."],
    settingsBody: ["\u6E38\u620F\u968F\u6BCF\u6B21\u64CD\u4F5C\u81EA\u52A8\u4FDD\u5B58\u3002\u58F0\u97F3\u53EA\u7528\u4E8E\u8425\u9020\u6C1B\u56F4\uFF1B\u6240\u6709\u8C1C\u9898\u90FD\u80FD\u4F9D\u9760\u89C6\u89C9\u7EBF\u7D22\u5B8C\u6210\u3002", "Progress saves after every action. Sound is atmospheric; every puzzle can be solved using visual evidence."],
    progress: ["\u8C03\u67E5\u8FDB\u5EA6", "Investigation progress"]
  };
  var symbols = {
    diamond: { glyph: "\u25C7", name: ["\u68F1", "Diamond"] },
    wave: { glyph: "\u224B", name: ["\u6F6E", "Tide"] },
    peak: { glyph: "\u25B3", name: ["\u5CF0", "Peak"] },
    sun: { glyph: "\u2299", name: ["\u65E5", "Sun"] },
    star: { glyph: "\u2736", name: ["\u661F", "Star"] }
  };
  var rooms = {
    observatory: { number: "01", name: ["\u89C2\u6D4B\u7A79\u9876", "The dome"], sub: ["\u5B50\u5348\u7EBF\u89C2\u6D4B\u5BA4", "MERIDIAN OBSERVATORY"], description: ["\u4E00\u6574\u7247\u591C\u7A7A\uFF0C\u88AB\u60AC\u5728\u4E00\u6839\u4E0D\u52A8\u7684\u6307\u9488\u4E0A\u3002", "An entire night balances on a motionless hand."], puzzle: "meridian", point: [64, 44], notePoint: [17, 84], echoPoint: [91, 65], note: ["welcome", "last-letter"] },
    archive: { number: "02", name: ["\u6863\u6848\u5BA4", "The archive"], sub: ["\u5230\u7AD9\u8005\u8BB0\u5F55\u5E93", "ARRIVALS & RECORDS"], description: ["\u4E94\u4E2A\u4EBA\u6765\u8FC7\u8FD9\u91CC\u3002\u6709\u4EBA\u64E6\u6389\u4E86\u4ED6\u4EEC\u7684\u540D\u5B57\u3002", "Five people arrived. Someone erased their names."], puzzle: "archive", point: [55, 60], notePoint: [19, 75], echoPoint: [87, 45], note: ["arrival-a", "arrival-b"] },
    radio: { number: "03", name: ["\u4FE1\u53F7\u5BA4", "The signal room"], sub: ["\u8FDC\u5CB8\u4FE1\u53F7\u4E2D\u7EE7", "COASTAL SIGNAL RELAY"], description: ["\u6CA1\u6709\u4EBA\u8BF4\u8BDD\uFF0C\u65E0\u7EBF\u7535\u5374\u4ECE\u672A\u505C\u6B62\u547C\u5438\u3002", "No one speaks. The radio has never stopped breathing."], puzzle: "radio", point: [57, 58], notePoint: [22, 56], echoPoint: [84, 65], note: ["radio-a", "radio-b"] },
    cistern: { number: "04", name: ["\u6F6E\u6C50\u4E95", "The tidal well"], sub: ["\u6C34\u4F4D\u4E0E\u65F6\u95F4\u8C03\u8282", "TIDAL REGULATION"], description: ["\u8FD9\u4E00\u6EF4\u6C34\uFF0C\u5DF2\u7ECF\u4E0B\u843D\u4E86\u5F88\u591A\u5E74\u3002", "This drop has been falling for years."], puzzle: "tide", point: [58, 46], notePoint: [17, 75], echoPoint: [86, 68], note: ["tide-a", "tide-b"] }
  };
  var notes = {
    welcome: { room: "observatory", phase: "present", title: ["\u6CA1\u6709\u7F72\u540D\u7684\u65E5\u5FD7", "The unsigned log"], body: ["00:17\u3002\n\n\u5982\u679C\u4F60\u6B63\u5728\u8BFB\u8FD9\u6BB5\u8BDD\uFF0C\u8BF4\u660E\u89C2\u6D4B\u7AD9\u4ECD\u5728\u7B49\u5F85\u3002\u6863\u6848\u5BA4\u8BB0\u5F55\u201C\u8C01\u201D\uFF0C\u4FE1\u53F7\u5BA4\u8BB0\u5F55\u201C\u4F55\u65F6\u201D\uFF0C\u6F6E\u6C50\u4E95\u8D1F\u8D23\u8BA9\u4E00\u5207\u505C\u4E0B\u6765\u3002\u4E09\u5904\u5F52\u4F4D\uFF0C\u4E3B\u955C\u624D\u4F1A\u91CD\u65B0\u54CD\u5E94\u3002\n\n\u76F8\u4F4D\u4EEA\u80FD\u8BA9\u4F60\u89E6\u78B0\u524D\u4E00\u5206\u949F\u7559\u4E0B\u7684\u56DE\u58F0\u3002\u540C\u4E00\u4E2A\u623F\u95F4\uFF0C\u8BF7\u770B\u4E24\u904D\u3002\n\n\u4E0D\u8981\u5BB3\u6015\u90A3\u9053\u58F0\u97F3\u3002", "00:17.\n\nIf you are reading this, the observatory is still waiting. The archive remembers who. The radio remembers when. The tidal well keeps everything still. Restore all three and the meridian will respond.\n\nYour phase instrument reveals the preceding minute. Look at every room twice.\n\nDo not be afraid of the voice."] },
    "meridian-rule": { room: "observatory", phase: "present", title: ["\u955C\u67B6\u94ED\u6587", "The lens inscription"], body: ["\u7531\u5185\u5411\u5916\uFF0C\u4E09\u4E2A\u8F68\u9053\u4F9D\u6B21\u8BB0\u4F4F\uFF1A\n\n\u2160 \xB7 \u6C34\u9762\u4F11\u6B62\u65F6\uFF0C\u6F6E\u6C50\u6307\u9488\u7684\u523B\u5EA6\u3002\n\u2161 \xB7 \u65E5\u6807\u89C2\u6D4B\u5458\u7684\u5230\u7AD9\u4F4D\u6B21\u3002\n\u2162 \xB7 \u7B2C\u4E09\u9891\u6BB5\u7684\u8BFB\u6570\u3002\n\n\u4E3B\u955C\u5C5E\u4E8E\u524D\u4E00\u5206\u949F\u3002\u5FC5\u987B\u5728\u56DE\u58F0\u4E2D\u951A\u5B9A\uFF0C\u518D\u56DE\u5230\u73B0\u5728\u91CA\u653E\u3002", "From the inner orbit outward, remember:\n\nI \xB7 The tide\u2019s resting dial mark.\nII \xB7 The Sun observer\u2019s place in the arrivals.\nIII \xB7 The reading of the third radio band.\n\nThe meridian belongs to the preceding minute. Anchor it in the Echo, then release it in the Present."] },
    "last-letter": { room: "observatory", phase: "echo", title: ["\u8FD8\u6CA1\u6709\u5199\u5B8C\u7684\u4FE1", "The unfinished letter"], body: ["\u4ED6\u4EEC\u8BF4\u6D77\u5824\u53EA\u5DEE\u4E00\u5206\u949F\u5C31\u80FD\u5173\u95ED\u3002\n\n\u6240\u4EE5\u6211\u628A\u8FD9\u4E00\u5206\u949F\u6298\u8D77\u6765\uFF0C\u653E\u8FDB\u89C2\u6D4B\u7AD9\u3002\u6F6E\u6C50\u3001\u8BB0\u5FC6\u3001\u58F0\u97F3\u2014\u2014\u4E09\u4E2A\u53C2\u7167\u8DB3\u4EE5\u8BA9\u5B83\u4E0D\u518D\u6D41\u901D\u3002\n\n\u5982\u679C\u6211\u5FD8\u8BB0\u4E86\u56DE\u53BB\u7684\u8DEF\uFF0C\u5C31\u8BA9\u8FD9\u5C01\u4FE1\u3001\u8FD9\u6BB5\u58F0\u97F3\uFF0C\u518D\u5E26\u6211\u8D70\u4E00\u6B21\u3002\n\n\u5B57\u8FF9\u4E0E\u4F60\u624B\u8BB0\u4E0A\u7684\uFF0C\u4E00\u6A21\u4E00\u6837\u3002", "They said the seawall needed one more minute to close.\n\nSo I folded that minute into the observatory. Tide, memory, sound: three references to keep it from passing.\n\nIf I forget the way back, let this letter and this voice guide me through it again.\n\nThe handwriting is exactly the same as yours."] },
    "arrival-a": { room: "archive", phase: "present", title: ["\u88AB\u6C34\u6D78\u8FC7\u7684\u5230\u7AD9\u7C3F", "The waterlogged register"], body: ["\u540D\u5B57\u5DF2\u7ECF\u65E0\u6CD5\u8FA8\u8BA4\uFF0C\u6807\u8BB0\u5374\u4ECD\u6E05\u6670\uFF1A\n\u25C7 \u68F1\u3000\u224B \u6F6E\u3000\u25B3 \u5CF0\u3000\u2299 \u65E5\u3000\u2736 \u661F\n\n\u201C\u65E5\u6807\u89C2\u6D4B\u5458\u6070\u597D\u662F\u7B2C\u4E09\u4F4D\u3002\u201D\n\u201C\u68F1\u6807\u89C2\u6D4B\u5458\u6700\u540E\u5230\u7AD9\u3002\u201D\n\n\u9875\u8FB9\u6CE8\uFF1A\u4ECE\u6700\u65E9\u5230\u6700\u665A\uFF0C\u6BCF\u4EBA\u5360\u636E\u4E00\u4E2A\u4F4D\u7F6E\uFF0C\u6807\u8BB0\u4E0D\u53EF\u91CD\u590D\u3002", "The names have washed away. The emblems remain:\n\u25C7 Diamond  \u224B Tide  \u25B3 Peak  \u2299 Sun  \u2736 Star\n\n\u201CThe Sun observer arrived exactly third.\u201D\n\u201CThe Diamond observer arrived last.\u201D\n\nMargin note: earliest to latest; one person in each place, no repeated emblems."] },
    "arrival-b": { room: "archive", phase: "echo", title: ["\u5899\u4E0A\u7684\u672A\u5E72\u7B14\u8FF9", "Writing still wet on the wall"], body: ["\u56DE\u58F0\u91CC\uFF0C\u7A7A\u767D\u7684\u5899\u9762\u6D6E\u51FA\u4E24\u53E5\u8BDD\uFF1A\n\n\u201C\u661F\u6807\u7D27\u6328\u5728\u65E5\u6807\u4E4B\u524D\u3002\u201D\n\u201C\u6F6E\u6807\u6BD4\u5CF0\u6807\u66F4\u65E9\u5230\u7AD9\u3002\u201D\n\n\u5899\u811A\u8FD8\u7559\u7740\u4E00\u679A\u65B0\u9C9C\u7684\u811A\u5370\u3002\u5B83\u4E0E\u4F60\u7684\u978B\u5E95\u543B\u5408\u3002", "Two sentences emerge on the wall in the Echo:\n\n\u201CThe Star observer arrived immediately before the Sun.\u201D\n\u201CThe Tide observer arrived before the Peak.\u201D\n\nA fresh footprint remains beneath the writing. It matches your shoe."] },
    "archive-result": { room: "archive", phase: "present", title: ["\u6062\u590D\u7684\u5230\u7AD9\u987A\u5E8F", "The restored arrivals"], body: ["\u2160 \u224B \u6F6E\u3000\u2192\u3000\u2161 \u2736 \u661F\u3000\u2192\u3000\u2162 \u2299 \u65E5\u3000\u2192\u3000\u2163 \u25B3 \u5CF0\u3000\u2192\u3000\u2164 \u25C7 \u68F1\n\n\u62BD\u5C49\u7F13\u7F13\u6253\u5F00\u3002\u91CC\u9762\u6CA1\u6709\u4E94\u4EFD\u6863\u6848\uFF0C\u53EA\u6709\u540C\u4E00\u4F4D\u89C2\u6D4B\u5458\u7684\u4E94\u5F20\u7167\u7247\u3002\u4E0D\u540C\u7684\u5E74\u4EFD\uFF0C\u540C\u4E00\u5F20\u8138\u3002\n\n\u8BB0\u5FC6\u53C2\u7167\u5DF2\u7ECF\u6062\u590D\u3002", "I \u224B Tide \u2192 II \u2736 Star \u2192 III \u2299 Sun \u2192 IV \u25B3 Peak \u2192 V \u25C7 Diamond\n\nThe drawers open. There are no five separate files, only five photographs of the same observer. Different years. The same face.\n\nThe memory reference is restored."] },
    "radio-a": { room: "radio", phase: "present", title: ["\u63A5\u6536\u5668\u63A5\u7EBF\u7EB8", "The receiver wiring slip"], body: ["\u4E09\u4E2A\u9891\u6BB5\u7684\u53D6\u503C\u8303\u56F4\u4E3A 0\u20149\u3002\n\n\u201C\u7B2C\u4E00\u9891\u6BB5\uFF0C\u4EE5\u661F\u6807\u89C2\u6D4B\u5458\u7684\u5230\u7AD9\u4F4D\u6B21\u4E3A\u51C6\u3002\u201D\n\n\u6CA1\u6709\u59D3\u540D\uFF0C\u53EA\u6709\u4E00\u679A\u516D\u89D2\u661F\u3002\u7B54\u6848\u4E5F\u8BB8\u7559\u5728\u6863\u6848\u5BA4\u3002", "Each radio band reads from 0 to 9.\n\n\u201CBand one takes the Star observer\u2019s place in the arrivals.\u201D\n\nNo name, only a six-pointed star. The answer may be in the archive."] },
    "radio-b": { room: "radio", phase: "echo", title: ["\u5012\u8F6C\u7684\u78C1\u5E26", "The reversed tape"], body: ["\u4E00\u6BB5\u58F0\u97F3\u7A7F\u8FC7\u524D\u4E00\u5206\u949F\uFF1A\n\n\u201C\u7B2C\u4E8C\u9891\u6BB5\uFF0C\u662F\u7B2C\u4E00\u9891\u6BB5\u7684\u4E24\u500D\u3002\u201D\n\u201C\u7B2C\u4E09\u9891\u6BB5\uFF0C\u6BD4\u7B2C\u4E8C\u9891\u6BB5\u591A\u4E8C\u3002\u201D\n\n\u78C1\u5E26\u505C\u4E0B\u4E4B\u524D\uFF0C\u90A3\u4E2A\u4EBA\u8BF4\uFF1A\n\u201C\u5982\u679C\u4F60\u542C\u5230\u4E86\uFF0C\u4E0D\u8981\u5BB3\u6015\u3002\u201D", "A voice passes through the preceding minute:\n\n\u201CBand two is twice band one.\u201D\n\u201CBand three is two more than band two.\u201D\n\nBefore the tape stops, the person says:\n\u201CIf you can hear this, do not be afraid.\u201D"] },
    "radio-result": { room: "radio", phase: "present", title: ["\u5DF2\u9501\u5B9A\u7684\u4FE1\u53F7", "The locked signal"], body: ["\u4E09\u4E2A\u9891\u6BB5\uFF1A2 / 4 / 6\u3002\n\n\u566A\u58F0\u6D88\u9000\uFF0C\u8FDC\u5904\u6709\u4EBA\u56DE\u7B54\uFF1A\u201C\u6D77\u5824\u5173\u95ED\u3002\u6211\u4EEC\u90FD\u5B89\u5168\u4E86\u3002\u53EF\u4EE5\u8BA9\u65F6\u949F\u7EE7\u7EED\u4E86\u3002\u201D\n\n\u7136\u540E\uFF0C\u4F60\u542C\u89C1\u81EA\u5DF1\u7684\u547C\u5438\uFF0C\u4ECE\u78C1\u5E26\u7684\u53E6\u4E00\u7AEF\u4F20\u6765\u3002\n\n\u58F0\u97F3\u53C2\u7167\u5DF2\u7ECF\u6062\u590D\u3002", "The three bands: 2 / 4 / 6.\n\nThe static clears. A distant voice replies: \u201CThe seawall is closed. Everyone is safe. You can let the clock move.\u201D\n\nThen you hear your own breathing from the other side of the tape.\n\nThe sound reference is restored."] },
    "tide-a": { room: "cistern", phase: "present", title: ["\u505C\u6F6E\u673A\u7EF4\u4FEE\u94ED\u724C", "The engine service plate"], body: ["\u56DB\u9488\u5404\u6709\u516B\u4E2A\u523B\u5EA6\uFF0C\u4ECE\u5317\u9762\u7684 0 \u5F00\u59CB\u987A\u65F6\u9488\u9012\u589E\uFF0C7 \u4E4B\u540E\u56DE\u5230 0\u3002\n\nA\uFF1A\u2160\u3001\u2161 \u5404\u8FDB\u4E00\u683C\u3002\nB\uFF1A\u2161\u3001\u2162 \u5404\u8FDB\u4E00\u683C\u3002\nC\uFF1A\u2162\u3001\u2163 \u5404\u8FDB\u4E00\u683C\u3002\nD\uFF1A\u2160 \u8FDB\u4E00\u683C\uFF0C\u2163 \u8FDB\u4E24\u683C\u3002\n\n\u53CD\u8F6C\u65F6\uFF0C\u7275\u52A8\u7684\u6307\u9488\u4E00\u540C\u540E\u9000\u3002", "Each hand has eight marks, increasing clockwise from 0 at the top. After 7, it returns to 0.\n\nA: I and II each advance one mark.\nB: II and III each advance one mark.\nC: III and IV each advance one mark.\nD: I advances one; IV advances two.\n\nReversing moves the coupled hands backward."] },
    "tide-b": { room: "cistern", phase: "echo", title: ["\u6C34\u9762\u4E0B\u7684\u523B\u5B57", "An inscription beneath the water"], body: ["\u56DE\u58F0\u91CC\u7684\u6C34\u4F4D\u6BD4\u73B0\u5728\u66F4\u4F4E\u3002\u53F0\u5EA7\u4E0A\u9732\u51FA\u4E00\u53E5\u8BDD\uFF1A\n\n\u201C\u56DB\u9488\u540C\u65F6\u6307\u5317\uFF0C\u6C34\u9762\u4FBF\u5FD8\u8BB0\u6D41\u52A8\u3002\u201D\n\n\u56DB\u4E2A 0\uFF0C\u4E0D\u591A\u4E00\u683C\uFF0C\u4E5F\u4E0D\u5C11\u4E00\u683C\u3002\n\n\u8FD9\u66FE\u7ECF\u662F\u4E00\u53F0\u8BA9\u6D77\u6C34\u505C\u4E0B\u6765\u7684\u673A\u5668\u3002\u73B0\u5728\uFF0C\u5B83\u5C06\u6210\u4E3A\u8BA9\u65F6\u95F4\u7EE7\u7EED\u7684\u53C2\u7167\u3002", "The water is lower in the Echo. An inscription appears on the pedestal:\n\n\u201CWhen all four hands point north, the water forgets to move.\u201D\n\nFour zeroes. Not a mark more, not a mark less.\n\nThis machine once stopped the sea. Now it will become the reference that lets time move."] },
    "tide-result": { room: "cistern", phase: "present", title: ["\u5F52\u96F6\u7684\u6F6E\u6C50\u6307\u9488", "The resting tide"], body: ["\u2160 0\u3000\u2161 0\u3000\u2162 0\u3000\u2163 0\n\n\u56DB\u6839\u6307\u9488\u5F52\u4F4D\uFF0C\u6C34\u9762\u5E73\u6574\u5F97\u50CF\u4E00\u9762\u955C\u5B50\u3002\u5B83\u6620\u51FA\u7A79\u9876\uFF0C\u800C\u7A79\u9876\u660E\u660E\u5728\u5934\u9876\u6570\u5341\u7C73\u4E4B\u5916\u3002\n\n\u6F6E\u6C50\u53C2\u7167\u5DF2\u7ECF\u6062\u590D\u3002\u4F11\u6B62\u523B\u5EA6\uFF1A0\u3002", "I 0   II 0   III 0   IV 0\n\nThe four hands settle. The water becomes a perfect mirror. It reflects the dome, although the dome is many metres above.\n\nThe tidal reference is restored. Resting mark: 0."] }
  };
  var puzzleNotes = {
    archive: ["arrival-a", "arrival-b"],
    radio: ["radio-a", "radio-b", "archive-result"],
    tide: ["tide-a", "tide-b"],
    meridian: ["meridian-rule", "archive-result", "radio-result", "tide-result"]
  };
  var hints = {
    archive: [
      ["\u5230\u7AD9\u7C3F\u5728\u201C\u73B0\u5728\u201D\u7684\u684C\u4E0A\uFF1B\u53E6\u4E00\u534A\u987A\u5E8F\u8BB0\u5F55\u85CF\u5728\u6863\u6848\u5BA4\u7684\u201C\u56DE\u58F0\u201D\u91CC\u3002", "The register is on the desk in the Present. The other half is in the archive\u2019s Echo."],
      ["\u5148\u653E\u7B2C\u4E09\u4F4D\u7684\u65E5\u6807\u3001\u7B2C\u4E94\u4F4D\u7684\u68F1\u6807\u3002\u661F\u6807\u5FC5\u987B\u7D27\u6328\u5728\u65E5\u6807\u524D\u9762\u3002\u5269\u4E0B\u4E24\u4F4D\u518D\u6BD4\u8F83\u5148\u540E\u3002", "Place Sun third and Diamond fifth. Star must be immediately before Sun. Compare the remaining two."],
      ["\u4ECE\u5DE6\u81F3\u53F3\uFF1A\u6F6E \u224B\u3001\u661F \u2736\u3001\u65E5 \u2299\u3001\u5CF0 \u25B3\u3001\u68F1 \u25C7\u3002", "Left to right: Tide \u224B, Star \u2736, Sun \u2299, Peak \u25B3, Diamond \u25C7."]
    ],
    radio: [
      ["\u9700\u8981\u6863\u6848\u5BA4\u7684\u5230\u7AD9\u987A\u5E8F\uFF0C\u4EE5\u53CA\u4FE1\u53F7\u5BA4\u4E24\u79CD\u65F6\u95F4\u72B6\u6001\u4E0B\u7684\u8BB0\u5F55\u3002", "You need the archive\u2019s arrivals and the records in both moments of the signal room."],
      ["\u661F\u6807\u662F\u7B2C\u4E8C\u4F4D\uFF0C\u6240\u4EE5\u7B2C\u4E00\u9891\u6BB5\u662F 2\u3002\u518D\u6309\u78C1\u5E26\u4E0A\u7684\u500D\u6570\u4E0E\u52A0\u6CD5\u8BA1\u7B97\u3002", "Star arrived second, so band one is 2. Apply the tape\u2019s multiplication and addition."],
      ["\u4E09\u4E2A\u9891\u6BB5\u4F9D\u6B21\u4E3A 2\u30014\u30016\u3002\u8C03\u597D\u540E\u9501\u5B9A\u9891\u6BB5\u3002", "Set the bands to 2, 4, and 6, then lock the frequencies."]
    ],
    tide: [
      ["\u56DE\u58F0\u91CC\u7684\u6C34\u4E0B\u523B\u5B57\u7ED9\u51FA\u76EE\u6807\uFF1B\u73B0\u5728\u7684\u7EF4\u4FEE\u94ED\u724C\u89E3\u91CA\u56DB\u4E2A\u65CB\u94AE\u7684\u8054\u52A8\u65B9\u5F0F\u3002", "The Echo\u2019s underwater inscription gives the target. The Present\u2019s service plate explains the coupled controls."],
      ["\u76EE\u6807\u662F\u56DB\u4E2A 0\u3002\u5148\u6CE8\u610F D \u6BCF\u6B21\u4F1A\u8BA9\u7B2C\u56DB\u9488\u8D70\u4E24\u683C\u3002\uFF0B\u4E0E\u2212\u4E92\u4E3A\u9006\u64CD\u4F5C\uFF0C\u53EF\u4EE5\u5927\u80C6\u8BD5\uFF1B\u7B2C\u4E09\u5C42\u63D0\u793A\u4F1A\u6839\u636E\u5F53\u524D\u523B\u5EA6\u7ED9\u51FA\u89E3\u6CD5\u3002", "Aim for four zeroes. D moves hand IV twice as far. + and \u2212 undo each other, so experiment freely. The final hint calculates a route from your current positions."],
      ["", ""]
    ],
    meridian: [
      ["\u7A79\u9876\u53F3\u4FA7\u7684\u955C\u67B6\u94ED\u6587\u8BF4\u660E\u4E86\u4E09\u4E2A\u8F68\u9053\u7684\u53C2\u7167\u3002\u4F60\u53EF\u4EE5\u5728\u624B\u8BB0\u91CC\u540C\u65F6\u67E5\u770B\u4E09\u5904\u6821\u51C6\u7ED3\u679C\u3002", "The inscription beside the dome\u2019s telescope explains the three references. Compare the calibrated results in your journal."],
      ["\u7531\u5185\u5411\u5916\uFF1A\u505C\u6F6E\u523B\u5EA6\u3001\u65E5\u6807\u7684\u4F4D\u6B21\u3001\u7B2C\u4E09\u9891\u6BB5\u3002\u628A\u8BFB\u6570\u5E26\u5230\u201C\u56DE\u58F0\u201D\u91CC\u3002", "Inside out: the tide\u2019s resting mark, Sun\u2019s arrival position, the third radio band. Take these readings into the Echo."],
      ["\u5185\u8F68 0\u3001\u4E2D\u8F68 3\u3001\u5916\u8F68 6\u3002\u5728\u56DE\u58F0\u4E2D\u951A\u5B9A\uFF0C\u7136\u540E\u5207\u56DE\u73B0\u5728\u91CA\u653E\u4E3B\u955C\u3002", "Inner 0, middle 3, outer 6. Anchor in the Echo, then return to the Present to release the meridian."]
    ]
  };

  // src/src/audio.js
  var Atmosphere = class {
    constructor() {
      this.context = null;
      this.master = null;
      this.enabled = false;
    }
    async enable(on) {
      this.enabled = on;
      if (!on && this.context) {
        await this.context.suspend();
        return;
      }
      if (!on) return;
      try {
        if (!this.context) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;
          this.context = new AudioContext();
          this.master = this.context.createGain();
          this.master.gain.value = 0.11;
          this.master.connect(this.context.destination);
          for (const [frequency, level] of [[55, 0.2], [82.41, 0.08], [110.15, 0.045]]) {
            const osc = this.context.createOscillator(), gain2 = this.context.createGain();
            osc.type = "sine";
            osc.frequency.value = frequency;
            gain2.gain.value = level;
            osc.connect(gain2);
            gain2.connect(this.master);
            osc.start();
          }
          const length = this.context.sampleRate * 4;
          const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
          const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter(), gain = this.context.createGain();
          source.buffer = buffer;
          source.loop = true;
          filter.type = "lowpass";
          filter.frequency.value = 340;
          gain.gain.value = 0.18;
          source.connect(filter);
          filter.connect(gain);
          gain.connect(this.master);
          source.start();
        }
        await this.context.resume();
      } catch {
      }
    }
    tone(frequency = 440, duration = 0.16, delay = 0, volume = 0.35) {
      if (!this.enabled || !this.context || this.context.state !== "running") return;
      const osc = this.context.createOscillator(), gain = this.context.createGain();
      const time = this.context.currentTime + delay;
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.018);
      gain.gain.exponentialRampToValueAtTime(1e-4, time + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(time);
      osc.stop(time + duration + 0.04);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
    shift() {
      [220, 277.18, 329.63].forEach((n, i) => this.tone(n, 0.8, i * 0.12, 0.14));
    }
    success() {
      [329.63, 440, 554.37, 659.26].forEach((n, i) => this.tone(n, 1, i * 0.13, 0.2));
    }
    signal(values) {
      values.forEach((n, i) => this.tone(180 + n * 55, 0.45, i * 0.5, 0.3));
    }
  };

  // src/src/scene-depth.js
  var SCENE_PROFILES = {
    observatory: { light: [0.45, 0.08], focus: [0.64, 0.39], size: 0.28, kind: "armillary", water: 0.75, tint: [0.54, 0.78, 0.77] },
    archive: { light: [0.78, 0.15], focus: [0.55, 0.46], size: 0.16, kind: "archive", water: 1.1, tint: [0.83, 0.68, 0.44] },
    radio: { light: [0.54, 0.12], focus: [0.57, 0.47], size: 0.13, kind: "signal", water: 1.1, tint: [0.46, 0.79, 0.71] },
    cistern: { light: [0.23, 0.25], focus: [0.57, 0.71], size: 0.27, kind: "tide", water: 0.65, tint: [0.4, 0.73, 0.79] },
    ferry: { light: [0.65, 0.22], focus: [0.24, 0.53], size: 0.15, kind: "compass", water: 0.7, tint: [0.61, 0.75, 0.83] },
    garden: { light: [0.51, 0.12], focus: [0.5, 0.43], size: 0.19, kind: "seed", water: 0.77, tint: [0.65, 0.83, 0.49] },
    lighthouse: { light: [0.54, 0.18], focus: [0.52, 0.34], size: 0.31, kind: "beacon", water: 0.79, tint: [0.83, 0.64, 0.56] }
  };
  function renderSize(width, height, dpr = 1, coarse = false) {
    if (![width, height].every((n) => Number.isFinite(n) && n > 0)) return [1, 1];
    const density = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
    const scale = Math.min(density, 1.5, 2048 / width, 2048 / height, Math.sqrt((coarse ? 7e5 : 16e5) / (width * height)));
    return [Math.max(1, Math.floor(width * scale)), Math.max(1, Math.floor(height * scale))];
  }
  var clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  var smooth = (a, b, n) => {
    const t2 = clamp((n - a) / (b - a), 0, 1);
    return t2 * t2 * (3 - 2 * t2);
  };
  var depthAt = (x, y) => 0.12 + 0.6 * smooth(0.32, 1, y) + 0.2 * Math.pow(Math.abs(x - 0.5) * 2, 3);
  function projectScenePoint(x, y, pointer, aspect) {
    let u = x, v = y;
    for (let i = 0; i < 5; i++) {
      const depth = depthAt(u, v);
      u = (x - 0.5 - pointer[0] * 0.024 * depth / aspect) / 0.974 + 0.5;
      v = (y - 0.5 - pointer[1] * 0.024 * depth) / 0.974 + 0.5;
    }
    return [u, v];
  }
  function torus(segments = 72, sides = 8) {
    const data = [];
    const vertex = (a, b) => {
      const c = Math.cos(a), s = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      data.push((1 + 0.025 * cb) * c, (1 + 0.025 * cb) * s, 0.025 * sb, cb * c, cb * s, sb);
    };
    for (let i = 0; i < segments; i++) for (let j = 0; j < sides; j++) {
      const a = i * Math.PI * 2 / segments, b = j * Math.PI * 2 / sides;
      const da = Math.PI * 2 / segments, db = Math.PI * 2 / sides;
      vertex(a, b);
      vertex(a + da, b);
      vertex(a + da, b + db);
      vertex(a, b);
      vertex(a + da, b + db);
      vertex(a, b + db);
    }
    return new Float32Array(data);
  }
  function crystal() {
    const data = [], top = [0, 1.1, 0], bottom = [0, -1.1, 0];
    const ring = [[0.6, 0, 0], [0, 0, 0.6], [-0.6, 0, 0], [0, 0, -0.6]];
    for (let i = 0; i < 4; i++) for (const vertices of [[top, ring[i], ring[(i + 1) % 4]], [bottom, ring[(i + 1) % 4], ring[i]]]) {
      const [a, b, c] = vertices, u = b.map((n2, j) => n2 - a[j]), v = c.map((n2, j) => n2 - a[j]);
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const length = Math.hypot(...n);
      for (const p of vertices) data.push(...p, ...n.map((value) => value / length));
    }
    return new Float32Array(data);
  }
  var QUAD_VERTEX = `
attribute vec2 aPosition;
varying vec2 vUv;
void main(){ vUv=vec2(aPosition.x*.5+.5,.5-aPosition.y*.5); gl_Position=vec4(aPosition,0.,1.); }
`;
  var BACKGROUND_FRAGMENT = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uImage;
uniform vec2 uPointer;
uniform vec2 uLight;
uniform vec3 uTint;
uniform float uAspect;
uniform float uTime;
uniform float uWater;
void main(){
  float depth=.12+.60*smoothstep(.32,1.,vUv.y)+.20*pow(abs(vUv.x-.5)*2.,3.);
  vec2 uv=(vUv-.5)*.974+.5+uPointer*vec2(.024/uAspect,.024)*depth;
  vec3 color=texture2D(uImage,uv).rgb;
  float below=max(0.,uv.y-uLight.y);
  float beam=exp(-pow((uv.x-uLight.x-below*.15)/(below*.32+.028),2.));
  float shafts=.55+.45*sin(uv.x*115.-uv.y*17.+sin(uTime*.13)*.7);
  float luminosity=beam*shafts*smoothstep(0.,.15,below)*(1.-smoothstep(.25,.9,below));
  color+=uTint*luminosity*.115;
  float water=smoothstep(uWater,uWater+.15,uv.y);
  float ripples=pow(.5+.5*sin(uv.y*230.+sin(uv.x*31.+uTime*.27)*2.-uTime*.7),12.);
  color+=uTint*water*ripples*.032;
  float mist=smoothstep(.53,.91,uv.y)*(.5+.5*sin(uv.x*8.+uTime*.08))* .024;
  gl_FragColor=vec4(color+uTint*mist,1.);
}
`;
  var SOLID_VERTEX = `
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform vec3 uRotation;
uniform vec2 uAnchor;
uniform float uSize;
uniform float uAspect;
varying vec3 vNormal;
varying vec3 vPosition;
vec3 rotate(vec3 p){
  float c=cos(uRotation.x),s=sin(uRotation.x); p=vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);
  c=cos(uRotation.y);s=sin(uRotation.y);p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);
  c=cos(uRotation.z);s=sin(uRotation.z);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);
}
void main(){
  vec3 p=rotate(aPosition); vNormal=rotate(aNormal); vPosition=p;
  float perspective=3.8/(3.8-p.z*.45);
  gl_Position=vec4(uAnchor+p.xy*uSize*vec2(1./uAspect,1.)*perspective,-p.z*.10,1.);
}
`;
  var SOLID_FRAGMENT = `
precision mediump float;
uniform vec3 uColor;
uniform float uGlow;
varying vec3 vNormal;
varying vec3 vPosition;
void main(){
  vec3 n=normalize(vNormal);
  float diffuse=max(0.,dot(n,normalize(vec3(-.6,1.,1.5))));
  float specular=pow(max(0.,dot(n,normalize(vec3(-.3,.5,1.8)))),28.);
  float edge=pow(1.-abs(n.z),2.);
  float patina=.94+.06*sin(vPosition.x*42.)*sin(vPosition.y*31.);
  vec3 color=uColor*(.25+diffuse*.75)*patina+vec3(.87,.83,.65)*specular*.55+uColor*edge*uGlow;
  gl_FragColor=vec4(color,1.);
}
`;
  var PARTICLE_VERTEX = `
attribute vec3 aPosition;
uniform vec2 uPointer;
uniform float uTime;
uniform float uDensity;
uniform float uAspect;
varying float vAlpha;
void main(){
  float z=aPosition.z;
  vec2 p=aPosition.xy;
  p.y=mod(p.y+1.+uTime*(.007+z*.007),2.)-1.;
  p.x+=sin(uTime*.11+aPosition.y*13.)*.013;
  p-=uPointer*vec2(.035/uAspect,-.035)*(z+.12);
  gl_Position=vec4(p,z*.3,1.);
  gl_PointSize=(1.1+pow(z,3.)*5.)*uDensity;
  vAlpha=(.13+z*.35)*smoothstep(-1.,-.8,p.y)*(1.-smoothstep(.8,1.,p.y));
}
`;
  var PARTICLE_FRAGMENT = `
precision mediump float;
uniform vec3 uTint;
varying float vAlpha;
void main(){float d=length(gl_PointCoord-.5)*2.;float alpha=exp(-d*d*4.)*(1.-smoothstep(.5,1.,d));gl_FragColor=vec4(uTint,alpha*vAlpha);}
`;
  var SceneDepth = class {
    constructor(onStatus = () => {
    }) {
      this.onStatus = onStatus;
      this.canvas = document.createElement("canvas");
      this.canvas.className = "scene-depth";
      this.canvas.setAttribute("aria-hidden", "true");
      this.pointer = [0, 0];
      this.target = [0, 0];
      this.time = 0;
      this.frame = 0;
      this.previousTime = 0;
      this.supported = null;
      this.lost = false;
      this.motion = matchMedia("(prefers-reduced-motion: reduce)");
      this.coarse = matchMedia("(pointer: coarse)");
      this.motion.addEventListener("change", () => {
        this.pointer = [0, 0];
        this.target = [0, 0];
        this.refresh();
      });
      this.coarse.addEventListener("change", () => this.resize());
      document.addEventListener("visibilitychange", () => this.refresh());
      document.addEventListener("pointermove", (event) => {
        if (!this.world || !this.enabled || this.paused || this.motion.matches || event.pointerType !== "mouse") return;
        if (event.target.closest("button,a,input,textarea,dialog,nav,.topbar")) {
          this.target = [...this.pointer];
          return;
        }
        const r = this.world.getBoundingClientRect();
        this.target = [clamp((event.clientX - r.left) / r.width * 2 - 1, -1, 1), clamp((event.clientY - r.top) / r.height * 2 - 1, -1, 1)];
      }, { passive: true });
      document.documentElement.addEventListener("pointerleave", () => {
        this.target = [0, 0];
      });
      this.canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        this.lost = true;
        this.stop();
        this.fallback("unavailable");
      });
      this.canvas.addEventListener("webglcontextrestored", () => {
        this.lost = false;
        this.supported = null;
        this.uploaded = null;
        if (this.initialize()) this.refresh();
      });
      this.observer = new ResizeObserver(() => this.resize());
    }
    initialize() {
      if (this.supported !== null) return this.supported;
      const gl = this.canvas.getContext("webgl", { alpha: false, antialias: true, depth: true, stencil: false, powerPreference: "low-power" });
      if (!gl) {
        this.supported = false;
        return false;
      }
      this.gl = gl;
      this.resources = [];
      try {
        const program = (vs, fs, names) => {
          const p = gl.createProgram();
          this.resources.push(["Program", p]);
          for (const [type, source] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            gl.attachShader(p, shader);
            gl.deleteShader(shader);
          }
          gl.bindAttribLocation(p, 0, "aPosition");
          gl.bindAttribLocation(p, 1, "aNormal");
          gl.linkProgram(p);
          if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("Scene shader unavailable");
          return { p, u: Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)])) };
        };
        const buffer = (data) => {
          const b = gl.createBuffer();
          this.resources.push(["Buffer", b]);
          gl.bindBuffer(gl.ARRAY_BUFFER, b);
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
          return { b, count: data.length };
        };
        this.background = program(QUAD_VERTEX, BACKGROUND_FRAGMENT, ["uImage", "uPointer", "uLight", "uTint", "uAspect", "uTime", "uWater"]);
        this.solid = program(SOLID_VERTEX, SOLID_FRAGMENT, ["uRotation", "uAnchor", "uSize", "uAspect", "uColor", "uGlow"]);
        this.particle = program(PARTICLE_VERTEX, PARTICLE_FRAGMENT, ["uPointer", "uTime", "uDensity", "uAspect", "uTint"]);
        this.quad = buffer(new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]));
        this.ring = buffer(torus());
        this.gem = buffer(crystal());
        let seed = 917;
        const random = () => {
          seed = seed * 16807 % 2147483647;
          return seed / 2147483647;
        };
        this.dust = buffer(new Float32Array(Array.from({ length: 96 }, () => [random() * 2 - 1, random() * 2 - 1, random()]).flat()));
        this.texture = gl.createTexture();
        this.resources.push(["Texture", this.texture]);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        this.supported = true;
        return true;
      } catch {
        for (const [type, resource] of this.resources) gl[`delete${type}`](resource);
        this.resources = [];
        this.supported = false;
        return false;
      }
    }
    attach(world, { room, enabled, paused, echo, solved = 0 }) {
      this.stop();
      this.observer.disconnect();
      this.loadController?.abort();
      this.world?.classList.remove("depth-ready");
      this.world = world;
      this.image = world.querySelector(".scene-image");
      if (this.room !== room) {
        this.pointer = [0, 0];
        this.target = [0, 0];
      }
      this.room = room;
      this.profile = SCENE_PROFILES[room] || SCENE_PROFILES.observatory;
      this.enabled = enabled;
      this.paused = paused;
      this.echo = echo;
      this.solved = solved;
      this.points = [...world.querySelectorAll(".hotspot")].map((el) => ({ el, x: parseFloat(el.style.left) / 100, y: parseFloat(el.style.top) / 100 }));
      world.append(this.canvas);
      this.observer.observe(world);
      this.loadController = new AbortController();
      this.image.addEventListener("load", () => this.refresh(), { once: true, signal: this.loadController.signal });
      this.refresh();
    }
    fallback(status) {
      this.world?.classList.remove("depth-ready");
      this.canvas.hidden = true;
      for (const { el } of this.points || []) el.style.removeProperty("translate");
      document.body.dataset.depth = "off";
      this.onStatus(status);
    }
    refresh() {
      this.stop();
      if (!this.world) return;
      if (!this.enabled) {
        this.fallback("off");
        return;
      }
      if (this.lost || !this.initialize()) {
        this.fallback("unavailable");
        return;
      }
      if (!this.image.complete || !this.image.naturalWidth) {
        this.fallback("loading");
        return;
      }
      try {
        if (this.uploaded !== this.image.src) {
          const gl = this.gl;
          gl.bindTexture(gl.TEXTURE_2D, this.texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
          this.uploaded = this.image.src;
        }
        this.canvas.hidden = false;
        this.world.classList.add("depth-ready");
        document.body.dataset.depth = "on";
        this.resize();
        this.onStatus(this.motion.matches ? "still" : "on");
      } catch {
        this.supported = false;
        this.fallback("unavailable");
      }
    }
    resize() {
      if (!this.world || this.canvas.hidden || !this.enabled || !this.supported || this.lost || !this.uploaded) return;
      const width = this.world.clientWidth, height = this.world.clientHeight;
      if (!width || !height) return;
      this.width = width;
      this.height = height;
      this.aspect = width / height;
      const [w, h] = renderSize(width, height, devicePixelRatio, this.coarse.matches);
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
      this.stop();
      this.draw();
      this.schedule();
    }
    stop() {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.previousTime = 0;
    }
    schedule() {
      if (!this.frame && !this.paused && !this.motion.matches && !document.hidden && this.enabled && !this.lost) this.frame = requestAnimationFrame((t2) => this.tick(t2));
    }
    tick(now) {
      this.frame = 0;
      const delta = this.previousTime ? Math.min((now - this.previousTime) / 1e3, 0.05) : 0;
      if (this.coarse.matches && this.previousTime && delta < 1 / 32) {
        this.schedule();
        return;
      }
      this.previousTime = now;
      this.time += delta;
      const target = this.coarse.matches ? [Math.sin(this.time * 0.13) * 0.15, Math.cos(this.time * 0.11) * 0.08] : this.target;
      const ease = 1 - Math.exp(-delta * 5);
      this.pointer = this.pointer.map((n, i) => n + (target[i] - n) * ease);
      this.draw();
      this.schedule();
    }
    draw() {
      if (!this.aspect || this.lost || !this.supported || !this.uploaded) return;
      const gl = this.gl, p = this.profile, point = this.motion.matches ? [0, 0] : this.pointer;
      const time = this.motion.matches ? 0 : this.time;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.disableVertexAttribArray(1);
      gl.useProgram(this.background.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quad.b);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const b = this.background.u;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(b.uImage, 0);
      gl.uniform2fv(b.uPointer, point);
      gl.uniform2fv(b.uLight, p.light);
      gl.uniform3fv(b.uTint, p.tint);
      gl.uniform1f(b.uAspect, this.aspect);
      gl.uniform1f(b.uTime, time);
      gl.uniform1f(b.uWater, p.water);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this.drawObjects(time, point);
      gl.disable(gl.DEPTH_TEST);
      gl.disableVertexAttribArray(1);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(this.particle.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.dust.b);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      const d = this.particle.u;
      gl.uniform2fv(d.uPointer, point);
      gl.uniform1f(d.uTime, time);
      gl.uniform1f(d.uAspect, this.aspect);
      gl.uniform1f(d.uDensity, this.canvas.width / this.width);
      gl.uniform3fv(d.uTint, this.echo ? [0.9, 0.77, 0.52] : [0.78, 0.83, 0.74]);
      gl.drawArrays(gl.POINTS, 0, this.coarse.matches ? 48 : 96);
      gl.disable(gl.BLEND);
      for (const { el, x, y } of this.points) {
        const [u, v] = projectScenePoint(x, y, point, this.aspect);
        el.style.translate = `${((u - x) * this.width).toFixed(2)}px ${((v - y) * this.height).toFixed(2)}px`;
      }
    }
    drawObjects(time, point) {
      const gl = this.gl, p = this.profile, u = this.solid.u;
      gl.useProgram(this.solid.p);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enableVertexAttribArray(1);
      const [x, y] = projectScenePoint(...p.focus, point, this.aspect);
      gl.uniform1f(u.uAspect, this.aspect);
      gl.uniform2f(u.uAnchor, x * 2 - 1, 1 - y * 2);
      gl.uniform1f(u.uGlow, this.echo ? 0.5 : 0.16 + this.solved * 0.07);
      const brass = this.echo ? [0.72, 0.6, 0.36] : [0.59, 0.5, 0.32];
      const turn = time * (this.echo ? -0.09 : 0.055);
      const draw = (geometry, size, rotation, color = brass, offset = [0, 0]) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.b);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
        gl.uniform2f(u.uAnchor, x * 2 - 1 + offset[0] / this.aspect, 1 - y * 2 + offset[1]);
        gl.uniform1f(u.uSize, p.size * size);
        gl.uniform3fv(u.uRotation, [rotation[0] + point[1] * 0.1, rotation[1] + point[0] * 0.18, rotation[2]]);
        gl.uniform3fv(u.uColor, color);
        gl.drawArrays(gl.TRIANGLES, 0, geometry.count / 6);
      };
      if (p.kind === "armillary" || p.kind === "beacon") {
        draw(this.ring, 1, [0.42, turn + 0.48, 0.13]);
        draw(this.ring, 0.87, [1.25, turn - 0.65, 0.7]);
        draw(this.ring, 0.72, [0.3, 1.15 - turn, -0.3]);
        draw(this.gem, 0.15, [0.3, turn, 0], p.tint);
      } else if (p.kind === "tide") {
        for (let i = 0; i < 3; i++) draw(this.ring, 1 - i * 0.23, [1.18, 0.15, turn * (i % 2 ? -1 : 1)], i === 1 ? p.tint : brass, [0, i * 0.012]);
      } else if (p.kind === "signal") {
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) draw(this.ring, 0.32, [0.28, turn + i * 0.5, j * 0.35], j === 1 ? p.tint : brass, [(i - 1) * 0.11, j * 0.016]);
      } else if (p.kind === "seed") {
        draw(this.gem, 0.52, [0.15, turn * 0.8, 0.12], p.tint);
        draw(this.ring, 1, [1.14, turn, 0.4]);
        draw(this.ring, 0.79, [0.2, turn + 1.1, -0.5]);
      } else if (p.kind === "archive") {
        for (let i = 0; i < 3; i++) {
          draw(this.ring, 0.75, [1.05, turn * 0.3, 0.2], brass, [0, (i - 1) * 0.09]);
          draw(this.gem, 0.14, [0.1, turn + i, 0.2], p.tint, [(i - 1) * 0.06, (i - 1) * 0.09]);
        }
      } else {
        draw(this.ring, 1, [0.9, 0.12, turn]);
        draw(this.ring, 0.7, [0.45, turn, 0.3]);
        draw(this.gem, 0.2, [0.2, turn, 0.7], p.tint);
      }
    }
  };

  // src/src/expedition.js
  var coordinate = (n) => `${"ABCD"[n % 4]}${Math.floor(n / 4) + 1}`;
  var roman = ["I", "II", "III", "IV", "V", "VI"];
  var eventKeys = ["eventGate", "eventLight", "eventBell", "eventLetter", "eventShadow"];
  function expeditionView(state2, h) {
    const { t: t2, esc: esc2, prose: prose2, button: button2, icon: icon2, logo: logo2, commonTools: commonTools2 } = h;
    const active = state2.campaign.active, chapter = chapters[active], progress = state2.campaign.chapters[active];
    const keys = CHAPTER_PUZZLES[active] || [];
    const ready = progress && keys.every((k) => progress.solved[k]);
    const label = (id) => esc2(t2(chapterPuzzles[id].title));
    const mutation = (id, index, direction = 1) => `chapter-change:${id}:${index}:${direction}`;
    const smallGrid = (values) => `<div class="shutter-grid" aria-hidden="true">${values.map((v) => `<i class="${v ? "lit" : ""}"></i>`).join("")}</div>`;
    function scene(screen2 = "game") {
      const points = keys.map((id, i) => ({ action: `chapter-puzzle:${id}`, point: chapter.points[i], label: label(id), icon: progress.solved[id] ? "check" : "star", done: progress.solved[id] }));
      points.push({ action: "chapter-notes", point: [88, 29], label: t2("readRecords"), icon: "eye", done: progress.inspected.includes(progress.phase) });
      points.push({ action: "chapter-exit", point: active === 2 ? [64, 61] : active === 3 ? [49, 35] : [53, 38], label: t2("chapterExit"), short: t2("chapterPassage"), icon: progress.complete ? "check" : "arrow", done: progress.complete });
      return `<div class="stage chapter-stage ${progress.phase === "echo" ? "is-echo" : ""}"><div class="world" id="world"><img id="scene-image" class="scene-image" src="./assets/${chapter.art}.png" alt="${esc2(t2(chapter.summary))}" draggable="false">${screen2 === "game" ? `<div class="hotspots ${state2.showHotspots ? "show-markers" : ""}">${points.map((p) => button2(`<span class="point-mark">${icon2(p.icon)}</span><span class="point-label">${p.short || p.label}</span>`, p.action, `hotspot ${p.done ? "done" : ""} ${p.point[0] < 25 ? "edge-left" : p.point[0] > 75 ? "edge-right" : ""}`, `style="left:${p.point[0]}%;top:${p.point[1]}%" aria-label="${p.label}"`)).join("")}</div>` : ""}</div><div class="scene-vignette"></div><div class="mist mist-one"></div>${progress.phase === "echo" ? '<div class="echo-grain"></div><div class="echo-line"></div>' : ""}</div>`;
    }
    function game(saveAvailable2) {
      return `${scene()}<header class="topbar game-bar"><div class="brand compact">${logo2()}<span>${esc2(t2("title"))}</span></div><div class="phase-wrap"><div class="phase-control" role="group" aria-label="${t2("shift")}">${["present", "echo"].map((p) => button2(`${icon2("phase")}${t2(p)}`, `phase:${p}`, progress.phase === p ? "active" : "", `aria-pressed="${progress.phase === p}"`)).join("")}</div><span class="phase-shortcut">${t2("shift")}</span></div>${commonTools2()}</header>
      <main class="exploration"><div class="room-heading"><div class="eyebrow">${chapter.numeral} <span class="line"></span> ${esc2(t2(chapter.subtitle))}</div><h1>${esc2(t2(chapter.title))}</h1><p>${esc2(t2(chapter.summary))}</p></div><div class="station-clock"><span>${t2(progress.phase === "echo" ? "echoTime" : "presentTime")}</span><strong>${chapter.time[progress.phase === "echo" ? 1 : 0]}</strong><div class="clock-rule"><i></i></div></div><div class="mission"><div class="mission-signals">${keys.map((k) => `<span class="signal-light ${progress.solved[k] ? "lit" : ""}" aria-label="${label(k)}: ${progress.solved[k] ? t2("solved") : "\u2014"}">${icon2(progress.solved[k] ? "check" : "star")}</span>`).join("")}<span>${keys.filter((k) => progress.solved[k]).length}<i>/</i>3</span></div><p>${t2(ready ? "chapterReady" : "chapterExplore")}</p></div></main>
      <div class="side-tools campaign-tools">${button2(icon2("book"), "journal", "icon-button", `aria-label="${t2("journal")}"`)}${button2(icon2("archive"), "chapters", "icon-button", `aria-label="${t2("chapters")}"`)}${button2(icon2("help"), "help", "icon-button", `aria-label="${t2("help")}"`)}${button2(icon2("settings"), "settings", "icon-button", `aria-label="${t2("settings")}"`)}</div>
      <nav class="room-nav chapter-room-nav" aria-label="${t2("chapterMap")}">${keys.map((id, i) => button2(`<span class="nav-number">0${i + 1}</span>${icon2(progress.solved[id] ? "check" : "star")}<span>${label(id)}</span>`, `chapter-puzzle:${id}`, "")).join("")}</nav><footer class="game-footer"><span>${t2("title")} \xB7 ${chapter.numeral} / IV</span><span>${saveAvailable2 ? t2("saved") : ""}</span></footer>`;
    }
    function chapterList() {
      const unlocked = unlockedChapter(state2);
      return `<p class="body-copy">${t2("campaignSubtitle")}</p><div class="chapter-list">${[1, 2, 3, 4].map((id) => {
        const data = chapters[id], complete = id === 1 ? Boolean(state2.ending) : state2.campaign.chapters[id].complete;
        const started = id === 1 ? state2.started : state2.campaign.chapters[id].started;
        const status = id > unlocked ? "chapterLocked" : complete ? "chapterComplete" : started ? "chapterInProgress" : "chapterUnstarted";
        return button2(`<img src="./assets/${data.art}.png" alt="" loading="lazy"><span class="chapter-list-copy"><small>${data.numeral} / IV \xB7 ${t2(status)}</small><strong>${esc2(t2(data.title))}</strong><span>${esc2(t2(data.summary))}</span></span>${icon2(id > unlocked ? "phase" : "arrow")}`, `chapter-select:${id}`, `chapter-row ${id === active ? "current" : ""}`, `${id > unlocked ? "disabled" : ""} aria-label="${esc2(t2(data.title))} \xB7 ${t2(status)}"`);
      }).join("")}</div>`;
    }
    function carried() {
      const records = [];
      if (state2.ending) records.push(`<article><h4>${t2("chapterOneRecord")}</h4>${prose2(t2("chapterOneResult"))}</article>`);
      for (const id of [2, 3]) if (state2.campaign.chapters[id].complete) records.push(`<article><h4>${esc2(t2(chapters[id].travelTitle))}</h4>${prose2(t2(chapters[id].travelResult))}</article>`);
      return `<section class="travel-records"><h3>${t2("travelNotes")}</h3><p>${t2("travelIntro")}</p>${records.join("") || `<p>${t2("noTravelNotes")}</p>`}</section>`;
    }
    function evidence() {
      return ["present", "echo"].map((p, i) => `<article class="chapter-record"><h4>${esc2(t2(chapter.records[i].slice(0, 2)))}</h4>${progress.inspected.includes(p) ? prose2(t2(chapter.records[i].slice(2))) : `<p class="missing-note">${t2("missingPhase")} \xB7 ${t2(p)}</p>`}</article>`).join("");
    }
    function journal() {
      return `<div class="journal-layout"><div class="journal-entries"><h3 class="journal-section-title">${esc2(t2(chapter.title))}</h3>${evidence()}${keys.filter((k) => progress.solved[k]).map((k) => `<article class="chapter-record"><h4>${label(k)} \xB7 ${t2("solved")}</h4>${prose2(t2(chapterPuzzles[k].result))}</article>`).join("")}${carried()}</div><aside class="personal-notes"><label for="personal-note">${t2("fieldNotes")}</label><textarea id="personal-note" maxlength="4000" placeholder="${esc2(t2("notesPlaceholder"))}">${esc2(state2.personalNote)}</textarea><small>${t2("personalSaved")} <span id="personal-counter">${state2.personalNote.length}/4000</span></small></aside></div>`;
    }
    function mechanism(id) {
      const v = progress.puzzles[id];
      if (id === "route") return `<div class="route-caption"><span>A1 \u2192 \u25EF C2 \u2192 \u25CF A4 \u2192 D4</span><output>${t2("routeSteps")} ${v.length - 1}/10</output></div><div class="route-board"><svg viewBox="0 0 400 400" aria-hidden="true"><polyline points="${v.map((n) => `${n % 4 * 100 + 50},${Math.floor(n / 4) * 100 + 50}`).join(" ")}"/></svg>${Array.from({ length: 16 }, (_, n) => button2(`<small>${coordinate(n)}</small><strong>${REEFS.includes(n) ? "\xD7" : n === 0 ? "\u25CE" : n === 15 ? "\u25C7" : n === 6 ? "\u25EF" : n === 12 ? "\u25CF" : "\xB7"}</strong><b>${v.includes(n) ? String(v.indexOf(n)).padStart(2, "0") : ""}</b>`, mutation(id, n), `route-cell ${v.includes(n) ? "visited" : ""} ${v.at(-1) === n ? "route-end" : ""}`, `aria-label="${coordinate(n)}" ${REEFS.includes(n) ? "disabled" : ""}`)).join("")}</div><p class="instrument-instruction">${t2("routeInstruction")}</p>`;
      if (id === "lamps") return `<div class="testimony-lamps">${v.map((value, i) => button2(`<span>${"ABCD"[i]}</span><i class="lamp-bulb"></i><small>${t2(value ? "lampLit" : "lampDark")}</small>`, mutation(id, i), value ? "lit" : "", `aria-label="${"ABCD"[i]} ${t2(value ? "lampLit" : "lampDark")}" aria-pressed="${Boolean(value)}"`)).join("")}</div><p class="instrument-instruction">${t2("lampsInstruction")}</p>`;
      if (id === "bridge") return `<div class="bridge-board">${v.map((value, i) => button2(`<span class="bridge-bulb"></span><small>${"ABC"[i % 3]}${Math.floor(i / 3) + 1}</small>`, mutation(id, i), value ? "lit" : "", `aria-label="${"ABC"[i % 3]}${Math.floor(i / 3) + 1} ${t2(value ? "lampLit" : "lampDark")}" aria-pressed="${Boolean(value)}"`)).join("")}</div><p class="instrument-instruction">${t2("bridgeInstruction")}</p>`;
      if (id === "mirrors") {
        const trace = traceLight(v);
        return `<div class="optical-bench"><span class="beam-source">\u2192</span><span class="beam-target ${trace.success ? "lit" : ""}">\u25C7</span><div class="mirror-grid">${Array.from({ length: 25 }, (_, cell) => {
          const n = MIRROR_CELLS.indexOf(cell);
          return n < 0 ? '<span class="empty-mirror-cell"></span>' : button2(`<small>${roman[n]}</small><strong>${v[n] ? "&#92;" : "/"}</strong>`, mutation(id, n), "mirror-cell", `aria-label="${t2("mirror")} ${roman[n]}"`);
        }).join("")}</div><svg class="beam-overlay" viewBox="-.5 -.5 6 6" aria-hidden="true"><polyline points="${trace.points.map((p) => p.join(",")).join(" ")}"/></svg></div><p class="puzzle-live-status" role="status">${t2(trace.success ? "lightReady" : trace.loop ? "lightLoop" : "lightMiss")}</p><p class="instrument-instruction">${t2("mirrorsInstruction")}</p>`;
      }
      if (id === "growth") {
        const climates = ["climateSun", "climateRain", "climateMist"], glyphs = ["\u263C", "\u22EE", "\u224B"], simulation = grow(v);
        return `<div class="climate-sequence">${v.map((n, i) => button2(`<small>0${i + 1}</small><strong>${glyphs[n]}</strong><span>${t2(climates[n])}</span>`, mutation(id, i), "climate-card", `aria-label="${t2("growthDay")} ${i + 1}: ${t2(climates[n])}"`)).join("")}</div><p class="growth-target">${t2("growthTarget")}</p><table class="growth-history"><thead><tr><th>${t2("growthDay")}</th>${["growthRoot", "growthLeaf", "growthFlower"].map((k) => `<th>${t2(k)}</th>`).join("")}</tr></thead><tbody>${simulation.history.map((row, i) => `<tr><th>${i}</th>${row.map((n) => `<td>${n}</td>`).join("")}</tr>`).join("")}</tbody></table>${simulation.valid ? "" : `<p class="phase-warning">${t2("growthInvalid")}</p>`}<p class="instrument-instruction">${t2("growthInstruction")}</p>`;
      }
      if (id === "specimens") return `<div class="specimen-grid">${v.map((n, i) => button2(`<span>${n || "\xB7"}</span>${i in SPECIMEN_GIVENS ? "<i></i>" : ""}`, mutation(id, i), i in SPECIMEN_GIVENS ? "fixed" : "", `aria-label="${t2("specimenCell")} ${Math.floor(i / 4) + 1},${i % 4 + 1}: ${n || t2("empty")}${i in SPECIMEN_GIVENS ? " " + t2("fixed") : ""}" ${i in SPECIMEN_GIVENS ? "disabled" : ""}`)).join("")}</div><p class="instrument-instruction">${t2("specimensInstruction")}</p>`;
      if (id === "causality") return `<ol class="causal-list">${v.map((event, i) => `<li><small>0${i + 1}</small><span>${t2(eventKeys[event])}</span><div>${button2("\u2191", mutation(id, i, -1), "dial-turn", `aria-label="${t2(eventKeys[event])} ${t2("moveEarlier")}" ${i === 0 ? "disabled" : ""}`)}${button2("\u2193", mutation(id, i, 1), "dial-turn", `aria-label="${t2(eventKeys[event])} ${t2("moveLater")}" ${i === 4 ? "disabled" : ""}`)}</div></li>`).join("")}</ol><p class="instrument-instruction">${t2("causalityInstruction")}</p>`;
      if (id === "shutters") return `<div class="shutter-comparison"><figure><figcaption>${t2("overlay")}</figcaption>${smallGrid(overlayShutters(v))}</figure><span>\u2192</span><figure><figcaption>${t2("targetPattern")}</figcaption>${smallGrid(SHUTTER_TARGET)}</figure></div><div class="shutter-layers">${v.map((n, i) => `<div><span>${t2("shutter")} ${"ABC"[i]} \xB7 ${n * 90}\xB0</span>${smallGrid(rotateMask(SHUTTER_MASKS[i], n))}${button2("\u21BB", mutation(id, i), "dial-turn", `aria-label="${t2("rotate")} ${"ABC"[i]}"`)}</div>`).join("")}</div><p class="instrument-instruction">${t2("shuttersInstruction")}</p>`;
      if (id === "origin") return `<div class="origin-digits">${v.map((n, i) => `<div><small>0${i + 1}</small>${button2("+", mutation(id, i), "dial-turn", `aria-label="${t2("originSlot")} ${i + 1} +"`)}<output>${n}</output>${button2("\u2212", mutation(id, i, -1), "dial-turn", `aria-label="${t2("originSlot")} ${i + 1} \u2212"`)}</div>`).join("")}</div>${carried()}`;
      return "";
    }
    function puzzle(id) {
      if (!keys.includes(id)) return "";
      const data = chapterPuzzles[id];
      if (progress.solved[id]) return `<div class="calibration-success">${icon2("check")}<span>${t2("mechanismRestored")}</span></div><div class="body-copy">${prose2(t2(data.result))}</div>${button2(t2("returnExplore") + icon2("arrow"), "close", "primary")}`;
      const level = progress.hints[id];
      let hint = level ? t2(data.hints[level - 1]) : "";
      if (id === "bridge" && level === 3) {
        const plan = bridgePlan(progress.puzzles.bridge);
        hint = plan.length ? t2("bridgeAdaptive") + plan.map((n) => `${"ABC"[n % 3]}${Math.floor(n / 3) + 1}`).join(" \xB7 ") : t2("bridgeReady");
      }
      const locked = id === "origin" && (!progress.solved.causality || !progress.solved.shutters);
      return `<p class="puzzle-intro">${esc2(t2(data.intro))}</p>${locked ? `<p class="phase-warning">${t2("originLocked")}</p>` : `<fieldset class="instrument">${mechanism(id)}</fieldset><div class="puzzle-feedback" id="puzzle-feedback" role="status" aria-live="polite"></div><div class="puzzle-actions">${button2(icon2("reset") + t2("resetPuzzle"), `chapter-reset:${id}`, "text-button")}${button2(t2("verifyMechanism") + icon2("arrow"), `chapter-check:${id}`, "primary")}</div>`}<div class="hint-area">${level ? `<p class="hint-copy"><span>${t2("hintLevel")} ${level}/3</span>${esc2(hint)}</p>` : ""}${button2(icon2("help") + t2(level === 0 ? "hint" : level === 3 ? "lastHint" : "nextHint"), `chapter-hint:${id}`, "text-button", level === 3 ? "disabled" : "")}</div><details class="evidence-peek" id="evidence-peek"><summary>${icon2("book")}${t2("relatedNotes")}<span>+</span></summary><div>${evidence()}</div></details>`;
    }
    function modal2(type, id) {
      const eyebrow = `${chapter.numeral} / IV \xB7 ${esc2(t2(chapter.title))}`;
      if (type === "chapters") return { title: t2("chapters"), eyebrow: "SILENT MERIDIAN / I \u2014 IV", content: chapterList(), cls: "chapters-modal" };
      if (type === "chapter-puzzle") return { title: label(id), eyebrow, content: puzzle(id), cls: `puzzle-modal ${id}-modal` };
      if (type === "chapter-notes") {
        const record = chapter.records[progress.phase === "echo" ? 1 : 0];
        return { title: t2(record.slice(0, 2)), eyebrow, content: `<div class="note-sheet">${prose2(t2(record.slice(2)))}<div class="note-stamp">${t2("recorded")}${icon2("check")}</div></div>${button2(t2("back") + icon2("arrow"), "close", "primary")}`, cls: "note-modal" };
      }
      if (type === "chapter-briefing") return { title: esc2(t2(chapter.title)), eyebrow, content: `<div class="body-copy">${prose2(t2(chapter.intro))}</div><p class="keyboard-guide">${t2("chapterControls")}</p>${button2(t2("beginInvestigation") + icon2("arrow"), "close", "primary")}`, cls: "" };
      if (type === "chapter-exit") return { title: t2("chapterExit"), eyebrow, content: `<div class="body-copy"><p>${t2(!ready ? "chapterExitLocked" : progress.phase === "echo" ? "chapterEchoExit" : "chapterPassageReady")}</p></div>${!ready ? `<ul class="calibration-list">${keys.map((k) => `<li class="${progress.solved[k] ? "complete" : ""}">${icon2(progress.solved[k] ? "check" : "star")}${label(k)}</li>`).join("")}</ul>` : ""}${ready ? button2(t2(progress.phase === "echo" ? "chapterToPresent" : active === 4 ? "finalPassage" : "chapterExit") + icon2("arrow"), progress.phase === "echo" ? "shift" : active === 4 ? "chapter-final" : "chapter-finish:continue", "primary") : button2(t2("returnExplore"), "close", "primary")}`, cls: "" };
      if (type === "chapter-final") return { title: t2("finalPassage"), eyebrow: "00:20 \u2192 00:21", content: `<div class="body-copy">${prose2(t2("finalPassageBody"))}</div><div class="ending-choices">${button2(t2("finalCarry"), "chapter-finish:carry", "primary")}${button2(t2("finalQuiet"), "chapter-finish:quiet", "secondary")}</div>`, cls: "" };
      return null;
    }
    function ending() {
      const last = active === 4, carry = progress.choice === "carry";
      return `${scene("ending")}<div class="ending-shade"></div><header class="topbar">${logo2()}${commonTools2()}</header><main class="ending-content campaign-ending"><div class="eyebrow">${last ? t2("campaignFinished") : `${chapter.numeral} / IV \xB7 ${t2("chapterComplete")}`}</div><div class="ending-clock">${last ? "00:21" : active === 2 ? "00:19" : "00:20"}</div><div class="line"></div><h1>${esc2(last ? t2(carry ? "endingCarryTitle" : "endingQuietTitle") : t2(chapter.endTitle))}</h1><div class="ending-copy">${prose2(last ? t2(carry ? "endingCarry" : "endingQuiet") : t2(chapter.endBody))}${last ? `<p class="echo-callback">${t2(state2.ending === "keep" ? "tapeKept" : "tapeReleased")}</p>` : ""}</div><div class="ending-actions">${button2(t2(last ? "chapters" : "nextChapter") + icon2("arrow"), last ? "chapters" : `chapter-select:${active + 1}`, "primary")}${button2(t2("reviewJournal") + icon2("book"), "journal", "text-button")}${button2(t2("chapterReturn"), "revisit", "text-button")}</div></main>`;
    }
    return { scene, game, modal: modal2, journal, ending, carried };
  }

  // src/src/app.js
  var app = document.querySelector("#app");
  var storage;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  var loaded = loadState(storage);
  var state = loaded.state;
  var saveAvailable = loaded.available;
  var screen = "title";
  var modal = null;
  var selectedSlot = 0;
  var journalFilter = "all";
  var toastTimer;
  var lastFocus = null;
  var noSaveShown = false;
  var audio = new Atmosphere();
  var sceneDepth = new SceneDepth(syncDepthControls);
  var t = (value) => Array.isArray(value) ? value[state.lang === "zh" ? 0 : 1] : words[value]?.[state.lang === "zh" ? 0 : 1] || value;
  var esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var prose = (text) => text.split("\n\n").map((p) => `<p>${esc(p).replaceAll("\n", "<br>")}</p>`).join("");
  var paths = {
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    book: '<path d="M12 5c-3-2-7-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Zm0 0v15"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    sound: '<path d="m11 5-5 4H3v6h3l5 4V5Zm4 3c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
    mute: '<path d="m11 5-5 4H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6"/>',
    phase: '<circle cx="12" cy="12" r="8"/><path d="M12 4c-5 4-5 12 0 16M12 4v16"/>',
    settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
    check: '<path d="m5 12 4 4 10-10"/>',
    eye: '<path d="M2 12S6 5 12 5s10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    dome: '<path d="M3 19h18M5 17v-5a7 7 0 0 1 14 0v5M12 5v12M5 12h14"/>',
    archive: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M5 9h14M5 15h14M10 6h4m-4 6h4m-4 6h4"/>',
    radio: '<path d="M3 12h2l2-6 4 12 3-15 3 17 2-8h2"/>',
    tide: '<path d="M2 8c4-6 6 6 10 0s6 6 10 0M2 16c4-6 6 6 10 0s6 6 10 0"/>',
    star: '<path d="m12 2 2 7 8 3-8 2-2 8-2-8-8-2 8-3Z"/>',
    reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 0c0 3-3 2-3 5m0 3v1"/>'
  };
  var icon = (name, cls = "") => `<svg class="icon ${cls}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.star}</svg>`;
  var logo = () => '<svg class="brand-mark" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width=".9" aria-hidden="true"><circle cx="24" cy="24" r="16"/><ellipse cx="24" cy="24" rx="8" ry="22" transform="rotate(28 24 24)"/><path d="M2 24h44M24 2v44"/><circle cx="24" cy="24" r="2" fill="currentColor"/></svg>';
  var button = (label, action, cls = "", extra = "") => `<button class="${cls}" data-action="${action}" data-focus="${action}" ${extra}>${label}</button>`;
  var countSolved = () => Object.values(state.solved).filter(Boolean).length;
  var currentPhase = () => state.campaign.active === 1 ? state.phase : state.campaign.chapters[state.campaign.active].phase;
  var expedition = () => expeditionView(state, { t, esc, prose, button, icon, logo, commonTools });
  function enterChapter(id) {
    if (!selectChapter(state, id)) return;
    const first = !state.started;
    state.started = true;
    journalFilter = "all";
    selectedSlot = 0;
    modal = null;
    if (id === 1) {
      screen = state.ending ? "ending" : "game";
      if (first) {
        addNote(state, "welcome");
        state.visits.push("observatory");
        modal = { type: "briefing" };
      }
    } else {
      const chapter = state.campaign.chapters[id];
      screen = chapter.complete ? "ending" : "game";
      if (!chapter.complete && !chapter.inspected.length && !Object.values(chapter.solved).some(Boolean)) modal = { type: "chapter-briefing" };
    }
    persist();
    render();
  }
  function persist() {
    saveAvailable = saveState(storage, state);
    if (!saveAvailable && !noSaveShown) {
      noSaveShown = true;
      toast(t("noSave"), 6500);
    }
  }
  function toast(message, duration = 3e3) {
    const el = document.querySelector("#toast");
    clearTimeout(toastTimer);
    el.textContent = message;
    el.classList.add("visible");
    toastTimer = setTimeout(() => el.classList.remove("visible"), duration);
  }
  function openModal(type, id = null) {
    lastFocus = document.activeElement?.dataset.focus;
    modal = { type, id };
    render();
  }
  function closeModal() {
    modal = null;
    render();
    if (lastFocus) [...app.querySelectorAll("[data-focus]")].find((el) => el.dataset.focus === lastFocus)?.focus();
  }
  function visit(room) {
    state.room = room;
    if (!state.visits.includes(room)) state.visits.push(room);
    persist();
    render();
    audio.tone(150, 0.2, 0, 0.1);
  }
  function shift() {
    const target = state.campaign.active === 1 ? state : state.campaign.chapters[state.campaign.active];
    target.phase = target.phase === "present" ? "echo" : "present";
    audio.shift();
    persist();
    render();
  }
  function sceneHTML() {
    const room = screen === "title" ? "observatory" : state.room;
    return `<div class="stage ${screen === "title" ? "title-stage" : ""} ${state.phase === "echo" && screen !== "title" ? "is-echo" : ""}" aria-hidden="${screen === "title"}">
    <div class="world" id="world"><img class="scene-image" id="scene-image" src="./assets/${room}.png" alt="${esc(t(rooms[room].description))}" draggable="false">${screen === "game" ? hotspotHTML() : ""}</div>
    <div class="scene-vignette"></div><div class="mist mist-one"></div><div class="mist mist-two"></div>
    <div class="dust">${Array.from({ length: 15 }, (_, i) => `<i style="--x:${i * 137.51 % 100}%;--delay:${-i * 2.7}s;--duration:${16 + i % 6 * 3}s"></i>`).join("")}</div>
    ${state.phase === "echo" && screen !== "title" ? '<div class="echo-grain"></div><div class="echo-line"></div>' : ""}
  </div>`;
  }
  function hotspotHTML() {
    const room = rooms[state.room], phase = state.phase === "echo" ? 1 : 0;
    const isSolved = room.puzzle === "meridian" ? state.anchor : state.solved[room.puzzle];
    const points = [
      { action: `puzzle:${room.puzzle}`, position: room.point, label: words[`${room.puzzle}Title`], icon: isSolved ? "check" : "star", done: isSolved },
      { action: `note:${room.note[phase]}`, position: phase ? room.echoPoint : room.notePoint, label: notes[room.note[phase]].title, icon: "eye", done: state.notes.includes(room.note[phase]) }
    ];
    if (state.room === "observatory") points.push({ action: "note:meridian-rule", position: [90, 70], label: notes["meridian-rule"].title, icon: "eye", done: state.notes.includes("meridian-rule") });
    if (state.room === "observatory" && phase) points[1].position = [17, 84];
    return `<div class="hotspots ${state.showHotspots ? "show-markers" : ""}">${points.map((point) => button(`<span class="point-mark">${icon(point.icon)}</span><span class="point-label">${esc(t(point.label))}${point.done ? `<small>${t("collected")}</small>` : ""}</span>`, point.action, `hotspot ${point.done ? "done" : ""} ${point.position[0] > 75 ? "edge-right" : point.position[0] < 25 ? "edge-left" : ""}`, `style="left:${point.position[0]}%;top:${point.position[1]}%" aria-label="${esc(t(point.label))}"`)).join("")}</div>`;
  }
  function syncDepthControls(status) {
    const available = status !== "unavailable";
    for (const control of app.querySelectorAll('[data-action="depth"]')) {
      control.disabled = !available;
      control.setAttribute("aria-pressed", String(available && state.depth));
      const description2 = t(!available ? "depthUnavailable" : state.depth ? "depthDisable" : "depthEnable");
      control.setAttribute("aria-label", description2);
      control.title = description2;
      const label = control.querySelector(".depth-setting-label");
      if (label) label.textContent = description2;
    }
    const description = app.querySelector(".depth-description");
    if (description) description.textContent = t(!available ? "depthUnavailable" : status === "still" ? "depthStill" : "depthDescription");
  }
  function depthControl(setting = false) {
    const cube = '<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="m12 2 9 5v10l-9 5-9-5V7Z M3 7l9 5 9-5M12 12v10M7.5 4.5l9 5v5"/></svg>';
    const description = t(state.depth ? "depthDisable" : "depthEnable");
    return button(cube + (setting ? `<span class="depth-setting-label">${description}</span><b>3D</b>` : "<span>3D</span>"), "depth", setting ? "setting-row depth-setting" : "depth-control", `aria-pressed="${state.depth}" aria-label="${description}" title="${description}"`);
  }
  function commonTools() {
    return `<div class="header-tools">${depthControl()}<div class="languages" role="group" aria-label="Language">${button("\u4E2D", "lang:zh", state.lang === "zh" ? "active" : "", `aria-pressed="${state.lang === "zh"}" aria-label="\u5207\u6362\u81F3\u4E2D\u6587"`)}<span>/</span>${button("EN", "lang:en", state.lang === "en" ? "active" : "", `aria-pressed="${state.lang === "en"}" aria-label="Switch to English"`)}</div>${button(icon(state.sound ? "sound" : "mute"), "sound", "icon-button", `aria-label="${t(state.sound ? "soundOn" : "soundOff")}" title="${t(state.sound ? "soundOn" : "soundOff")}"`)}</div>`;
  }
  function titleHTML() {
    return `${sceneHTML()}<div class="title-shade"></div>
    <header class="topbar title-bar"><a class="brand" href="./" aria-label="Silent Meridian">${logo()}<span>SILENT MERIDIAN</span></a>${commonTools()}</header>
    <main class="title-content"><div class="eyebrow"><span class="line"></span>${esc(t("prologue"))}</div>
    <h1 class="${state.lang === "zh" ? "chinese-title" : ""}">${state.lang === "zh" ? "\u9759\u9ED8<br>\u5B50\u5348\u7EBF" : "SILENT<br>MERIDIAN"}</h1>
    <div class="title-caption">${state.lang === "zh" ? "S I L E N T  M E R I D I A N" : "THE UNFINISHED NIGHT"}</div>
    <p class="tagline">${esc(t("tagline")).replace("\n", "<br>")}</p>
    ${button(`<span>${t(state.started ? "resume" : "enter")}</span>${icon("arrow")}`, "start", "primary enter-button")}
    <div class="title-meta">${esc(t("noTimer"))}</div><div class="campaign-title-meta">${t("campaignSubtitle")}</div>
    ${button(icon("archive") + t("chapters"), "chapters", "text-button title-chapters")}
    ${state.started ? button(t("newGame"), "restart", "text-button title-restart") : ""}
    </main><footer class="title-footer"><span>${esc(t("original"))}</span><span class="title-coordinate">09\xB0 17\u2032 N <b>\uFF0F</b> TIME UNKNOWN</span><span>I <i>\u2014</i> IV</span></footer>`;
  }
  function phaseHTML() {
    return `<div class="phase-wrap"><div class="phase-control" role="group" aria-label="${t("shift")}">${button(`<i></i>${t("present")}`, "phase:present", state.phase === "present" ? "active" : "", `aria-pressed="${state.phase === "present"}"`)}${button(`${icon("phase")}${t("echo")}`, "phase:echo", state.phase === "echo" ? "active" : "", `aria-pressed="${state.phase === "echo"}"`)}</div><span class="phase-shortcut">${t("shift")}</span></div>`;
  }
  function objective() {
    return t(state.ending ? "objectiveDone" : state.anchor ? "objectiveAnchor" : allCalibrated(state) ? "objectiveFinal" : "objectiveStart");
  }
  function gameHTML() {
    if (state.campaign.active > 1) return expedition().game(saveAvailable);
    const room = rooms[state.room];
    return `${sceneHTML()}
    <header class="topbar game-bar"><div class="brand compact">${logo()}<span>${esc(t("title"))}</span></div>${phaseHTML()}${commonTools()}</header>
    <main class="exploration"><div class="room-heading"><div class="eyebrow">${room.number} <span class="line"></span> ${esc(t(room.sub))}</div><h1>${esc(t(room.name))}</h1><p>${esc(t(room.description))}</p></div>
    <div class="station-clock"><span>${t(state.phase === "echo" ? "echoTime" : "presentTime")}</span><strong>${state.ending ? "00:18" : state.phase === "echo" ? "00:16" : "00:17"}</strong><div class="clock-rule"><i></i></div></div>
    <div class="mission"><div class="mission-signals">${["archive", "radio", "tide"].map((k) => `<span class="signal-light ${state.solved[k] ? "lit" : ""}" aria-label="${esc(t(`${k}Title`))}: ${state.solved[k] ? t("solved") : "\u2014"}">${icon(k)}</span>`).join("")}<span>${countSolved()}<i>/</i>3</span></div><p>${esc(objective())}</p></div>
    </main>
    <div class="side-tools">${button(icon("book") + `<span>${t("journal")}</span><b>${state.notes.length}</b>`, "journal", "journal-button", `aria-label="${t("journal")}"`)}${button(icon("archive"), "chapters", "icon-button", `aria-label="${t("chapters")}"`)}${button(icon("help"), "help", "icon-button", `aria-label="${t("help")}"`)}${button(icon("settings"), "settings", "icon-button", `aria-label="${t("settings")}"`)}</div>
    <nav class="room-nav" aria-label="${t("map")}">${ROOM_IDS.map((id, i) => button(`<span class="nav-number">0${i + 1}</span>${icon(["dome", "archive", "radio", "tide"][i])}<span>${esc(t(rooms[id].name))}</span>${state.solved[rooms[id].puzzle] || id === "observatory" && state.anchor ? '<i class="nav-dot"></i>' : ""}`, `room:${id}`, state.room === id ? "active" : "", `aria-current="${state.room === id ? "location" : "false"}"`)).join("")}</nav>
    <footer class="game-footer"><span>${t("credit")}</span><span>${saveAvailable ? "\u25E6 " + t("saved") : ""}</span></footer>`;
  }
  function dialSVG(value, total = 8, index = "") {
    const ticks = Array.from({ length: total }, (_, n) => {
      const a = n / total * Math.PI * 2 - Math.PI / 2;
      return `<text x="${60 + Math.cos(a) * 47}" y="${63 + Math.sin(a) * 47}" text-anchor="middle" class="${value === n ? "active-tick" : ""}">${n}</text>`;
    }).join("");
    return `<svg class="instrument-dial" viewBox="0 0 120 120" aria-hidden="true"><circle class="dial-outer" cx="60" cy="60" r="57"/><circle class="dial-inner" cx="60" cy="60" r="37"/>${ticks}<g class="needle" style="transform:rotate(${value / total * 360}deg)"><path d="M60 25 56 57 60 64 64 57Z"/><path d="M60 63v13"/></g><circle class="pin" cx="60" cy="60" r="4"/><text class="dial-roman" x="60" y="88" text-anchor="middle">${index}</text></svg>`;
  }
  function instrumentControls(kind, values, total, labels) {
    return `<div class="dials dials-${values.length}">${values.map((value, i) => `<div class="dial-unit"><div class="dial-label">${esc(labels[i])}</div>${dialSVG(value, total, kind === "tide" ? ["I", "II", "III", "IV"][i] : "")}<div class="dial-controls">${button("\u2212", `dial:${kind}:${i}:-1`, "dial-turn", `aria-label="${esc(labels[i])} ${t("turnMinus")}"`)}<output aria-label="${esc(labels[i])}">${value}</output>${button("+", `dial:${kind}:${i}:1`, "dial-turn", `aria-label="${esc(labels[i])} ${t("turnPlus")}"`)}</div></div>`).join("")}</div>`;
  }
  function waveSVG() {
    const [a, b, c] = state.radio;
    const path = Array.from({ length: 161 }, (_, i) => `${i === 0 ? "M" : "L"}${i * 3},${(44 + Math.sin(i * (a + 1) * 0.045) * 15 + Math.sin(i * (b + 1) * 0.07) * 9 + Math.sin(i * (c + 1) * 0.04) * 8).toFixed(1)}`).join(" ");
    return `<div class="scope"><svg viewBox="0 0 480 88" aria-hidden="true"><defs><pattern id="scope-grid" width="24" height="22" patternUnits="userSpaceOnUse"><path d="M24 0H0V22" fill="none" stroke="currentColor" stroke-opacity=".1"/></pattern></defs><rect width="480" height="88" fill="url(#scope-grid)"/><path d="M0 44H480" stroke="currentColor" stroke-opacity=".12"/><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.4"/></svg><span>RELAY / ${state.radio.map((v) => "0" + v).join(" : ")}</span></div>`;
  }
  function archiveHTML() {
    return `<div class="arrival-slots">${state.archive.map((id, i) => button(`<span class="slot-number">0${i + 1}</span><strong>${id ? symbols[id].glyph : "\xB7"}</strong><span class="slot-name">${id ? esc(t(symbols[id].name)) : t("empty")}</span>`, `slot:${i}`, `arrival-slot ${selectedSlot === i ? "selected" : ""}`, `aria-label="${t("slot")} ${i + 1}: ${id ? esc(t(symbols[id].name)) : t("empty")}" aria-pressed="${selectedSlot === i}"`)).join("")}</div><div class="order-arrow"><span>01</span><i></i>${icon("arrow")}<span>05</span></div><div class="symbol-bank">${SYMBOL_IDS.map((id) => button(`<strong>${symbols[id].glyph}</strong><span>${esc(t(symbols[id].name))}</span>`, `symbol:${id}`, state.archive.includes(id) ? "placed" : "", `aria-label="${esc(t(symbols[id].name))}"`)).join("")}</div><p class="instrument-instruction">${t("archiveInstruction")}</p>`;
  }
  function meridianHTML() {
    const orbits = state.meridian.map((v, i) => {
      const r = [53, 83, 112][i], a = v / 8 * Math.PI * 2 - Math.PI / 2;
      return `<circle class="orbit" cx="140" cy="140" r="${r}"/><circle class="orbit-node node-${i}" cx="${140 + Math.cos(a) * r}" cy="${140 + Math.sin(a) * r}" r="5"/>`;
    }).join("");
    return `<div class="meridian-device"><svg class="meridian-orbits" viewBox="0 0 280 280" aria-hidden="true"><circle class="orbit-rim" cx="140" cy="140" r="133"/><path d="M140 0v280M0 140h280M41 41l198 198M239 41 41 239" class="orbit-axis"/>${Array.from({ length: 8 }, (_, n) => {
      const a = n / 8 * Math.PI * 2 - Math.PI / 2;
      return `<text x="${140 + Math.cos(a) * 126}" y="${143 + Math.sin(a) * 126}" text-anchor="middle">${n}</text>`;
    }).join("")}${orbits}<path class="meridian-star" d="m140 121 4 15 15 4-15 4-4 15-4-15-15-4 15-4Z"/></svg><div class="orbit-controls">${state.meridian.map((v, i) => `<div><label>${t(["inner", "middle", "outer"][i])}</label><div class="dial-controls">${button("\u2212", `dial:meridian:${i}:-1`, "dial-turn", `aria-label="${t(["inner", "middle", "outer"][i])} ${t("turnMinus")}"`)}<output>${v}</output>${button("+", `dial:meridian:${i}:1`, "dial-turn", `aria-label="${t(["inner", "middle", "outer"][i])} ${t("turnPlus")}"`)}</div></div>`).join("")}</div></div><p class="instrument-instruction">${t("meridianInstruction")}</p>`;
  }
  function relatedNotesHTML(puzzle) {
    return `<details class="evidence-peek" id="evidence-peek"><summary>${icon("book")}${t("relatedNotes")}<span>+</span></summary><div>${puzzleNotes[puzzle].map((id) => state.notes.includes(id) ? `<article><h4>${esc(t(notes[id].title))}</h4>${prose(t(notes[id].body))}</article>` : `<p class="missing-note">${t("missingNote")}${esc(t(notes[id].title))} \xB7 ${esc(t(rooms[notes[id].room].name))} / ${t(notes[id].phase)}</p>`).join("")}</div></details>`;
  }
  function hintHTML(puzzle) {
    const level = state.hints[puzzle];
    let text = "";
    if (level > 0) {
      text = t(hints[puzzle][level - 1]);
      if (puzzle === "tide" && level === 3) {
        const plan = tidePlan(state.tide);
        text = plan?.cost ? `${t("tidePlan")} ${plan.presses.map((n, i) => n === 0 ? "" : `${"ABCD"[i]} ${n > 0 ? "+" : "\u2212"} \xD7 ${Math.abs(n)}`).filter(Boolean).join(" \xB7 ")}` : t("tideHintReady");
      }
    }
    return `<div class="hint-area">${level ? `<p class="hint-copy"><span>${t("hintLevel")} ${level}/3</span>${esc(text)}</p>` : ""}${button(`${icon("help")}${t(level === 0 ? "hint" : level === 3 ? "lastHint" : "nextHint")}`, `hint:${puzzle}`, "text-button", level === 3 ? "disabled" : "")}</div>`;
  }
  function puzzleHTML(puzzle) {
    const solved = puzzle === "meridian" ? state.anchor : state.solved[puzzle];
    const main = puzzle === "archive" ? archiveHTML() : puzzle === "radio" ? waveSVG() + instrumentControls("radio", state.radio, 10, [1, 2, 3].map((n) => `${t("band")} 0${n}`)) + button(icon("radio") + t("playSignal"), "listen", "text-button listen-button") + `<p class="tiny-copy">${t("signalVisual")}</p>` : puzzle === "tide" ? instrumentControls("tide", state.tide, 8, ["A", "B", "C", "D"]) + `<div class="coupling"><span>${t("coupling")}</span><code>A \u2192 I + II<br>B \u2192 II + III<br>C \u2192 III + IV<br>D \u2192 I + 2 \xD7 IV</code></div><p class="instrument-instruction">${t("tideInstruction")}</p>` : meridianHTML();
    if (puzzle === "meridian" && !allCalibrated(state)) {
      return `<div class="locked-orbit">${logo()}</div><p class="body-copy">${t("stillLocked")}</p><ul class="calibration-list">${["archive", "radio", "tide"].map((k) => `<li class="${state.solved[k] ? "complete" : ""}">${icon(state.solved[k] ? "check" : k)}<span>${t(`${k}Title`)}</span><b>${state.solved[k] ? "\u25CF" : "\u25CB"}</b></li>`).join("")}</ul>${relatedNotesHTML(puzzle)}${button(t("returnExplore") + icon("arrow"), "close", "primary")}`;
    }
    if (solved) {
      if (puzzle === "meridian") return `<div class="anchor-success">${logo()}<span>${t("solved")}</span></div><p class="body-copy">${t("anchored")}</p>${button(t(state.phase === "echo" ? "toPresent" : "releaseTime") + icon("arrow"), state.phase === "echo" ? "shift" : "final-choice", "primary")}`;
      return `<div class="calibration-success">${icon("check")}<span>${t("solved")}</span></div><div class="body-copy">${prose(t(notes[`${puzzle}-result`].body))}</div>${button(t("returnExplore") + icon("arrow"), "close", "primary")}`;
    }
    return `<p class="puzzle-intro">${t(`${puzzle}Intro`)}</p><fieldset class="instrument">${main}</fieldset><div class="puzzle-feedback" id="puzzle-feedback" role="status" aria-live="polite"></div>
    ${puzzle === "meridian" && state.phase !== "echo" ? `<p class="phase-warning">${icon("phase")}${t("requireEcho")}</p>${button(t("toEcho") + icon("phase"), "shift", "primary")}` : `<div class="puzzle-actions">${button(icon("reset") + t("resetPuzzle"), `reset-puzzle:${puzzle}`, "text-button")}${button(t({ archive: "check", radio: "tune", tide: "calibrate", meridian: "align" }[puzzle]) + icon("arrow"), `check:${puzzle}`, "primary")}</div>`}${hintHTML(puzzle)}${relatedNotesHTML(puzzle)}`;
  }
  function journalHTML() {
    if (state.campaign.active > 1) return expedition().journal();
    const visible = state.notes.filter((id) => journalFilter === "all" || notes[id].room === journalFilter);
    return `<div class="journal-tabs" role="group" aria-label="${t("evidence")}">${["all", ...ROOM_IDS].map((id) => button(id === "all" ? t("allEvidence") : esc(t(rooms[id].name)), `filter:${id}`, journalFilter === id ? "active" : "", `aria-pressed="${journalFilter === id}"`)).join("")}</div><div class="journal-layout"><div class="journal-entries">${visible.length ? visible.map((id, i) => `<article class="journal-entry"><div class="entry-meta"><span>${String(state.notes.indexOf(id) + 1).padStart(2, "0")} / ${esc(t(rooms[notes[id].room].name))}</span><span class="entry-phase">${icon("phase")}${t(notes[id].phase)}</span></div><h3>${esc(t(notes[id].title))}</h3>${prose(t(notes[id].body))}</article>`).join("") : `<p class="body-copy">${t("noNotes")}</p>`}</div><aside class="personal-notes"><label for="personal-note">${t("fieldNotes")}</label><textarea id="personal-note" maxlength="4000" placeholder="${esc(t("notesPlaceholder"))}">${esc(state.personalNote)}</textarea><small>${t("personalSaved")} <span id="personal-counter">${state.personalNote.length}/4000</span></small></aside></div>`;
  }
  function modalHTML() {
    if (!modal) return "";
    let title, eyebrow, content, cls = "";
    if (modal.type === "chapters" || modal.type.startsWith("chapter-")) {
      const view = expedition().modal(modal.type, modal.id);
      if (!view) return "";
      ({ title, eyebrow, content, cls } = view);
    } else if (modal.type === "puzzle") {
      title = t(`${modal.id}Title`);
      eyebrow = `${t("inspect")} / ${t(rooms[state.room].name)}`;
      content = puzzleHTML(modal.id);
      cls = `puzzle-modal ${modal.id}-modal`;
    } else if (modal.type === "note") {
      const note = notes[modal.id];
      title = t(note.title);
      eyebrow = `${t(rooms[note.room].name)} / ${t(note.phase)}`;
      content = `<div class="note-sheet">${prose(t(note.body))}<div class="note-stamp">${t("recorded")} ${icon("check")}</div></div>${button(t("back") + icon("arrow"), "close", "primary")}`;
      cls = "note-modal";
    } else if (modal.type === "journal") {
      const c = state.campaign.chapters[state.campaign.active];
      const entries = c ? c.inspected.length + Object.values(c.solved).filter(Boolean).length + Number(Boolean(state.ending)) + [2, 3].filter((id) => state.campaign.chapters[id].complete).length : state.notes.length;
      title = t("journal");
      eyebrow = `${String(entries).padStart(2, "0")} ${t("collected")}`;
      content = journalHTML();
      cls = "journal-modal";
    } else if (modal.type === "briefing" || modal.type === "help") {
      title = t("briefingTitle");
      eyebrow = "PROLOGUE / 00:17";
      content = `<div class="body-copy">${prose(t("briefingBody"))}</div><div class="control-guide">${icon("eye")}<p>${t("touchControls")}</p></div><p class="keyboard-guide">${t("controls")}</p>${button(t("beginInvestigation") + icon("arrow"), "close", "primary")}`;
    } else if (modal.type === "settings") {
      title = t("settings");
      eyebrow = "SILENT MERIDIAN";
      content = `<p class="body-copy">${t("settingsBody")}</p><div class="settings-list">${depthControl(true)}<p class="depth-description">${t("depthDescription")}</p>${button(icon(state.sound ? "sound" : "mute") + t(state.sound ? "soundOn" : "soundOff"), "sound", "setting-row")}${button(icon("eye") + t(state.showHotspots ? "hideMarkers" : "showMarkers"), "markers", "setting-row")}${button(icon("dome") + t("titleScreen"), "title", "setting-row")}${button(icon("reset") + t("newGame"), "restart", "setting-row")}</div>`;
    } else if (modal.type === "restart") {
      title = t("resetTitle");
      eyebrow = "I \u2014 IV / 00:17";
      content = `<p class="body-copy">${t("resetAllBody")}</p><div class="confirm-actions">${button(t("cancel"), "close", "text-button")}${button(t("confirmReset"), "confirm-restart", "primary")}</div>`;
    } else if (modal.type === "final-choice") {
      title = t("finishTitle");
      eyebrow = "00:17:59";
      content = `<div class="body-copy">${prose(t("finishBody"))}</div><div class="ending-choices">${button(icon("radio") + t("keepEcho"), "finish:keep", "primary")}${button(icon("phase") + t("releaseEcho"), "finish:release", "secondary")}</div>`;
    }
    return `<dialog id="modal" class="modal ${cls}" aria-labelledby="dialog-title"><div class="modal-scroll"><header class="modal-header"><div><div class="eyebrow">${esc(eyebrow)}</div><h2 id="dialog-title" tabindex="-1">${esc(title)}</h2></div>${button(icon("close"), "close", "icon-button close-button", `aria-label="${t("close")}"`)}</header>${content}</div></dialog>`;
  }
  function endingHTML() {
    if (state.campaign.active > 1) return expedition().ending();
    return `${sceneHTML()}<div class="ending-shade"></div><header class="topbar">${logo()}${commonTools()}</header><main class="ending-content"><div class="eyebrow">I / IV \xB7 ${t("finished")}</div><div class="ending-clock">00:18</div><div class="line"></div><h1>${t(state.ending === "keep" ? "endKeepTitle" : "endReleaseTitle")}</h1><div class="ending-copy">${prose(t(state.ending === "keep" ? "endKeep" : "endRelease"))}</div><div class="ending-actions">${button(t("nextChapter") + icon("arrow"), "chapter-select:2", "primary")}${button(t("reviewJournal") + icon("book"), "journal", "text-button")}${button(t("exploreAfter") + icon("arrow"), "revisit", "text-button")}</div></main>`;
  }
  function fitScene() {
    const img = app.querySelector("#scene-image"), world = app.querySelector("#world"), stage = app.querySelector(".stage");
    if (!img || !img.naturalWidth || !stage || !world) return;
    const { width: w, height: h } = stage.getBoundingClientRect();
    const contain = screen === "game" && (innerWidth <= 700 || innerHeight <= 500 || w / h < 1.4);
    const scale = (contain ? Math.min : Math.max)(w / img.naturalWidth, h / img.naturalHeight);
    world.style.width = `${img.naturalWidth * scale}px`;
    world.style.height = `${img.naturalHeight * scale}px`;
    sceneDepth.resize();
  }
  function render() {
    const focused = document.activeElement?.dataset.focus;
    const previousModal = app.querySelector("#modal");
    const scrollTop = previousModal?.querySelector(".modal-scroll")?.scrollTop || 0;
    const openEvidence = app.querySelector("#evidence-peek")?.open;
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.phase = screen === "title" ? "present" : currentPhase();
    document.body.dataset.screen = screen;
    document.body.dataset.chapter = String(state.campaign.active);
    document.title = `${t("title")} \xB7 ${state.lang === "zh" ? "Silent Meridian" : "\u9759\u9ED8\u5B50\u5348\u7EBF"}`;
    app.innerHTML = (screen === "title" ? titleHTML() : screen === "ending" ? endingHTML() : gameHTML()) + modalHTML();
    const img = app.querySelector("#scene-image");
    app.querySelector(".stage").style.setProperty("--room-art", `url("${img.src}")`);
    img.addEventListener("load", fitScene, { once: true });
    fitScene();
    const room = img.getAttribute("src").split("/").pop().replace(".png", "");
    sceneDepth.attach(app.querySelector("#world"), {
      room,
      enabled: state.depth,
      paused: Boolean(modal),
      echo: screen !== "title" && currentPhase() === "echo",
      solved: screen === "title" ? 0 : state.campaign.active === 1 ? countSolved() : Object.values(state.campaign.chapters[state.campaign.active].solved).filter(Boolean).length
    });
    app.querySelector(".stage").dataset.depthPaused = String(Boolean(modal));
    if (modal) {
      const dialog = app.querySelector("#modal");
      dialog.showModal();
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeModal();
      });
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
          const r = dialog.getBoundingClientRect();
          if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeModal();
        }
      });
      dialog.querySelector(".modal-scroll").scrollTop = scrollTop;
      if (openEvidence && dialog.querySelector("#evidence-peek")) dialog.querySelector("#evidence-peek").open = true;
      const focusTarget = [...dialog.querySelectorAll("[data-focus]")].find((el) => el.dataset.focus === focused);
      if (focusTarget && !focusTarget.disabled) focusTarget.focus({ preventScroll: true });
      else dialog.querySelector("#dialog-title")?.focus({ preventScroll: true });
    }
  }
  app.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target || target.disabled) return;
    const [action, id, a, b] = target.dataset.action.split(":");
    if (!["sound", "listen"].includes(action)) audio.tone(280, 0.07, 0, 0.05);
    if (action === "lang") {
      state.lang = id;
      persist();
      render();
    } else if (action === "start") {
      audio.enable(state.sound);
      enterChapter(state.campaign.active);
    } else if (action === "sound") {
      state.sound = !state.sound;
      await audio.enable(state.sound);
      persist();
      render();
    } else if (action === "chapters") openModal("chapters");
    else if (action === "chapter-select") enterChapter(Number(id));
    else if (action === "chapter-puzzle" && CHAPTER_PUZZLES[state.campaign.active]?.includes(id)) openModal("chapter-puzzle", id);
    else if (action === "chapter-notes") {
      const chapter = state.campaign.chapters[state.campaign.active];
      if (chapter) {
        if (!chapter.inspected.includes(chapter.phase)) chapter.inspected.push(chapter.phase);
        persist();
        openModal("chapter-notes");
      }
    } else if (action === "chapter-change") {
      if (changeChapterPuzzle(state, id, Number(a), Number(b))) {
        state.moves++;
        persist();
        render();
      }
    } else if (action === "chapter-reset") {
      if (resetChapterPuzzle(state, id)) {
        persist();
        render();
      }
    } else if (action === "chapter-hint" && CHAPTER_PUZZLES[state.campaign.active]?.includes(id)) {
      const c = state.campaign.chapters[state.campaign.active];
      c.hints[id] = Math.min(3, c.hints[id] + 1);
      persist();
      render();
    } else if (action === "chapter-check") {
      if (submitChapterPuzzle(state, id)) {
        audio.success();
        persist();
        render();
        toast(t("mechanismRestored"));
      } else {
        const el = app.querySelector("#puzzle-feedback");
        if (el) el.textContent = t("wrong");
        audio.tone(95, 0.25, 0, 0.18);
      }
    } else if (action === "chapter-exit") openModal("chapter-exit");
    else if (action === "chapter-final") {
      const c = state.campaign.chapters[4];
      if (state.campaign.active === 4 && Object.values(c.solved).every(Boolean) && c.phase === "present") openModal("chapter-final");
    } else if (action === "chapter-finish" && completeChapter(state, id)) {
      modal = null;
      screen = "ending";
      persist();
      render();
      audio.success();
    } else if (action === "room" && ROOM_IDS.includes(id)) visit(id);
    else if (action === "phase") {
      if (currentPhase() !== id) shift();
    } else if (action === "shift") shift();
    else if (action === "note" && notes[id]) {
      const isNew = addNote(state, id);
      persist();
      openModal("note", id);
      if (isNew) toast(t("recorded"));
    } else if (action === "puzzle") {
      selectedSlot = 0;
      openModal("puzzle", id);
    } else if (action === "journal") {
      journalFilter = "all";
      openModal("journal");
    } else if (action === "filter") {
      journalFilter = id;
      render();
    } else if (action === "help") openModal(state.campaign.active === 1 ? "help" : "chapter-briefing");
    else if (action === "settings") openModal("settings");
    else if (action === "depth") {
      state.depth = !state.depth;
      persist();
      render();
    } else if (action === "markers") {
      state.showHotspots = !state.showHotspots;
      persist();
      render();
    } else if (action === "close") closeModal();
    else if (action === "title") {
      modal = null;
      screen = "title";
      render();
    } else if (action === "restart") openModal("restart");
    else if (action === "confirm-restart") {
      const { lang, sound, depth } = state;
      state = freshState(lang);
      state.sound = sound;
      state.depth = depth;
      state.started = true;
      state.visits = ["observatory"];
      addNote(state, "welcome");
      screen = "game";
      modal = { type: "briefing" };
      selectedSlot = 0;
      persist();
      render();
    } else if (action === "slot") {
      selectedSlot = Number(id);
      render();
    } else if (action === "symbol" && !state.solved.archive) {
      state.archive = placeSymbol(state.archive, selectedSlot, id);
      state.moves++;
      selectedSlot = (selectedSlot + 1) % 5;
      persist();
      render();
    } else if (action === "dial" && !(id === "meridian" ? state.anchor : state.solved[id])) {
      const index = Number(a), direction = Number(b);
      if (id === "tide") state.tide = turnTide(state.tide, index, direction);
      else state[id][index] = mod(state[id][index] + direction, id === "radio" ? 10 : 8);
      state.moves++;
      audio.tone(220 + state[id][index] * 35, 0.12, 0, 0.15);
      persist();
      render();
    } else if (action === "reset-puzzle" && !(id === "meridian" ? state.anchor : state.solved[id])) {
      state[id] = id === "archive" ? [null, null, null, null, null] : id === "tide" ? [...TIDE_INITIAL] : [0, 0, 0];
      selectedSlot = 0;
      persist();
      render();
    } else if (action === "check") {
      if (solvePuzzle(state, id)) {
        audio.success();
        persist();
        render();
        toast(t("solved"));
      } else {
        const el = app.querySelector("#puzzle-feedback");
        if (el) {
          el.textContent = t("wrong");
          el.classList.remove("shake");
          void el.offsetWidth;
          el.classList.add("shake");
        }
        audio.tone(95, 0.25, 0, 0.18);
      }
    } else if (action === "hint") {
      state.hints[id] = Math.min(3, state.hints[id] + 1);
      persist();
      render();
    } else if (action === "listen") {
      if (!state.sound) {
        state.sound = true;
        await audio.enable(true);
        persist();
        render();
      }
      audio.signal(state.radio);
    } else if (action === "final-choice" && canFinish(state)) openModal("final-choice");
    else if (action === "finish" && finish(state, id)) {
      modal = null;
      screen = "ending";
      state.room = "observatory";
      persist();
      render();
      audio.success();
    } else if (action === "revisit") {
      modal = null;
      screen = "game";
      render();
    }
  });
  app.addEventListener("input", (event) => {
    if (event.target.id === "personal-note") {
      state.personalNote = event.target.value.slice(0, 4e3);
      persist();
      const counter = app.querySelector("#personal-counter");
      if (counter) counter.textContent = `${state.personalNote.length}/4000`;
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.target.closest('input, textarea, select, [contenteditable="true"]') || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (modal) return;
    if (screen !== "game") return;
    if (event.code === "Space" && !event.target.closest("button, a, summary")) {
      event.preventDefault();
      shift();
    }
    if (event.key.toLowerCase() === "j") {
      event.preventDefault();
      journalFilter = "all";
      openModal("journal");
    }
    if (event.key === "Escape") openModal("settings");
  });
  window.addEventListener("resize", fitScene);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio.enable(false);
    else audio.enable(state.sound);
  });
  render();
  for (const id of ROOM_IDS) {
    const image = new Image();
    image.src = `./assets/${id}.png`;
  }
})();

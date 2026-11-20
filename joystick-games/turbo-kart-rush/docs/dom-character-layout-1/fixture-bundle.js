"use strict";
(() => {
  // joystick-games/turbo-kart-rush/src/upstream/src/core/events.ts
  var EventBus = class {
    handlers = /* @__PURE__ */ new Map();
    on(name, handler) {
      let set = this.handlers.get(name);
      if (!set) {
        set = /* @__PURE__ */ new Set();
        this.handlers.set(name, set);
      }
      set.add(handler);
      return () => this.off(name, handler);
    }
    once(name, handler) {
      const off = this.on(name, (payload) => {
        off();
        handler(payload);
      });
      return off;
    }
    off(name, handler) {
      this.handlers.get(name)?.delete(handler);
    }
    emit(name, payload) {
      const set = this.handlers.get(name);
      if (!set) return;
      for (const h of Array.from(set)) {
        try {
          h(payload);
        } catch (err) {
          console.error(`[events] handler for ${name} threw`, err);
        }
      }
    }
    clear() {
      this.handlers.clear();
    }
  };
  var events = new EventBus();

  // joystick-games/turbo-kart-rush/src/upstream/src/core/constants.ts
  var GAME_TITLE = "TURBO KART RUSH";
  var DEFAULT_LAPS = 3;
  var FIXED_DT = 1 / 120;
  var MAX_FRAME_DT = 1 / 20;

  // joystick-games/turbo-kart-rush/src/upstream/src/ui/dom.ts
  function el(tag, className = "", text, parent) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== void 0) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }
  function cssHex(color) {
    return "#" + (color >>> 0 & 16777215).toString(16).padStart(6, "0");
  }
  function cssRgba(color, alpha) {
    const r = color >> 16 & 255;
    const g = color >> 8 & 255;
    const b = color & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  var TextField = class {
    constructor(node) {
      this.node = node;
    }
    node;
    value = "";
    set(text) {
      if (text === this.value) return false;
      this.value = text;
      this.node.textContent = text;
      return true;
    }
    get() {
      return this.value;
    }
  };
  function button(label, className, onClick) {
    const b = el("button", `btn ${className}`.trim(), label);
    b.type = "button";
    b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onClick();
    });
    return b;
  }

  // joystick-games/turbo-kart-rush/src/upstream/src/ui/MainMenu.ts
  var DIFFICULTIES = ["easy", "normal", "hard"];
  var DIFFICULTY_LABEL = { easy: "EASY", normal: "NORMAL", hard: "HARD" };
  var DIFFICULTY_BLURB = {
    easy: "Relaxed rivals, generous rubber-banding.",
    normal: "The classic Grand Prix challenge.",
    hard: "Ruthless AI, near-perfect lines, no mercy."
  };
  var STAT_KEYS = [
    { key: "speed", label: "SPD" },
    { key: "acceleration", label: "ACC" },
    { key: "handling", label: "HND" },
    { key: "weight", label: "WGT" },
    { key: "miniTurbo", label: "MT" }
  ];
  var CHAR_COLUMNS = 4;
  var MainMenu = class {
    constructor(root, characters, tracks) {
      this.characters = characters;
      this.tracks = tracks;
      this.rootNode = el("div", "screen menu hidden", void 0, root);
      const title = el("section", "panel-title-screen", void 0, this.rootNode);
      const logoWrap = el("div", "logo", void 0, title);
      const words = GAME_TITLE.split(" ");
      words.forEach((w, i) => {
        const line = el("span", `logo-word logo-word-${i}`, void 0, logoWrap);
        line.dataset.text = w;
        line.textContent = w;
      });
      el("div", "logo-sub", "ARCADE GRAND PRIX", title);
      const prompt = el("div", "press-start", void 0, title);
      el("span", "press-start-text", "PRESS ENTER / CLICK TO START", prompt);
      const legend = el("div", "controls-legend glass", void 0, title);
      const keys = [
        ["W / \u2191", "Throttle"],
        ["S / \u2193", "Brake / Reverse"],
        ["A D / \u2190 \u2192", "Steer"],
        ["SPACE / SHIFT", "Hop \xB7 Drift"],
        ["E / CTRL", "Use item (hold BRAKE to throw back)"],
        ["Q", "Look back"],
        ["ESC / P", "Pause"],
        ["M", "Mute"]
      ];
      for (const [k, v] of keys) {
        const row = el("div", "legend-row", void 0, legend);
        el("kbd", "", k, row);
        el("span", "", v, row);
      }
      el("div", "version", "v1.0 \xB7 Three.js \xB7 100% procedural \xB7 gamepad supported", title);
      title.addEventListener("click", () => {
        if (this.panel === "title") this.goTo("characterSelect", true);
      });
      const chars = el("section", "panel-select panel-chars", void 0, this.rootNode);
      const charHead = el("header", "select-header", void 0, chars);
      el("div", "panel-kicker", "STEP 1 / 2", charHead);
      el("h2", "panel-title", "CHOOSE YOUR RACER", charHead);
      const charGrid = el("div", "card-grid char-grid", void 0, chars);
      characters.forEach((c, i) => {
        const card = this.buildCharacterCard(c);
        card.addEventListener("pointerenter", () => this.setCharacter(i));
        card.addEventListener("click", () => {
          if (this.charIndex === i) this.goTo("trackSelect", true);
          else this.setCharacter(i, true);
        });
        card.addEventListener("dblclick", () => this.goTo("trackSelect", true));
        charGrid.appendChild(card);
        this.charCards.push(card);
      });
      const charFoot = el("footer", "select-footer glass", void 0, chars);
      const charInfo = el("div", "select-info", void 0, charFoot);
      this.charName = new TextField(el("div", "select-info-name", "", charInfo));
      this.charTagline = new TextField(el("div", "select-info-tagline", "", charInfo));
      const charActions = el("div", "actions", void 0, charFoot);
      charActions.appendChild(button("\u2190 BACK", "ghost", () => this.goTo("title", true)));
      charActions.appendChild(button("CONTINUE \u2192", "primary", () => this.goTo("trackSelect", true)));
      const tr = el("section", "panel-select panel-tracks", void 0, this.rootNode);
      const trHead = el("header", "select-header", void 0, tr);
      el("div", "panel-kicker", "STEP 2 / 2", trHead);
      el("h2", "panel-title", "PICK A CIRCUIT", trHead);
      const trackGrid = el("div", "card-grid track-grid", void 0, tr);
      tracks.forEach((t, i) => {
        const card = this.buildTrackCard(t);
        card.addEventListener("pointerenter", () => {
          this.trackRow = 0;
          this.setTrack(i);
        });
        card.addEventListener("click", () => {
          if (this.trackIndex === i && this.trackRow === 0) this.start();
          else {
            this.trackRow = 0;
            this.setTrack(i, true);
          }
        });
        trackGrid.appendChild(card);
        this.trackCards.push(card);
      });
      const trFoot = el("footer", "select-footer glass", void 0, tr);
      const diffWrap = el("div", "difficulty", void 0, trFoot);
      el("div", "difficulty-label", "DIFFICULTY", diffWrap);
      const seg = el("div", "segmented", void 0, diffWrap);
      DIFFICULTIES.forEach((d, i) => {
        const b = el("button", "seg", DIFFICULTY_LABEL[d], seg);
        b.type = "button";
        b.addEventListener("pointerenter", () => {
          this.trackRow = 1;
          this.refreshTrackFocus();
        });
        b.addEventListener("click", (ev) => {
          ev.stopPropagation();
          this.trackRow = 1;
          this.setDifficulty(i, true);
        });
        this.diffButtons.push(b);
      });
      this.diffBlurb = new TextField(el("div", "difficulty-blurb", "", diffWrap));
      const trActions = el("div", "actions", void 0, trFoot);
      trActions.appendChild(button("\u2190 BACK", "ghost", () => this.goTo("characterSelect", true)));
      this.startButton = button("START RACE", "primary start", () => this.start());
      this.startButton.addEventListener("pointerenter", () => {
        this.trackRow = 2;
        this.refreshTrackFocus();
      });
      trActions.appendChild(this.startButton);
      this.panels = { title, characterSelect: chars, trackSelect: tr };
      this.setCharacter(0);
      this.setTrack(0);
      this.setDifficulty(1);
      this.applyPanel();
    }
    characters;
    tracks;
    onStart = null;
    onHighlight = null;
    onPanelChange = null;
    rootNode;
    panels;
    panel = "title";
    visible = false;
    // Character select
    charCards = [];
    charIndex = 0;
    charName;
    charTagline;
    // Track select
    trackCards = [];
    trackIndex = 0;
    diffButtons = [];
    difficultyIndex = 1;
    diffBlurb;
    startButton;
    /** 0 = track cards row, 1 = difficulty row, 2 = start button. */
    trackRow = 0;
    // ------------------------------------------------------------------ public
    get currentPanel() {
      return this.panel;
    }
    get highlightedCharacter() {
      return this.characters[this.charIndex];
    }
    show(panel3 = "title") {
      this.rootNode.classList.remove("hidden");
      this.visible = true;
      this.goTo(panel3, false);
      this.onHighlight?.(this.highlightedCharacter.id);
    }
    hide() {
      this.rootNode.classList.add("hidden");
      this.visible = false;
    }
    dispose() {
      this.rootNode.remove();
    }
    /** Drive navigation from the InputState edges (keyboard / gamepad). */
    handleInput(input) {
      if (!this.visible) return;
      switch (this.panel) {
        case "title":
          if (input.confirm) this.goTo("characterSelect", true);
          break;
        case "characterSelect": {
          const n = this.characters.length;
          if (input.menuLeft) this.setCharacter((this.charIndex - 1 + n) % n, true);
          else if (input.menuRight) this.setCharacter((this.charIndex + 1) % n, true);
          else if (input.menuUp) this.setCharacter((this.charIndex - CHAR_COLUMNS + n) % n, true);
          else if (input.menuDown) this.setCharacter((this.charIndex + CHAR_COLUMNS) % n, true);
          if (input.confirm) this.goTo("trackSelect", true);
          else if (input.back) this.goTo("title", true);
          break;
        }
        case "trackSelect": {
          if (input.menuUp) {
            this.trackRow = (this.trackRow + 2) % 3;
            this.refreshTrackFocus();
            events.emit("ui:move", {});
          } else if (input.menuDown) {
            this.trackRow = (this.trackRow + 1) % 3;
            this.refreshTrackFocus();
            events.emit("ui:move", {});
          } else if (input.menuLeft || input.menuRight) {
            const dir = input.menuRight ? 1 : -1;
            if (this.trackRow === 0) {
              const n = this.tracks.length;
              this.setTrack((this.trackIndex + dir + n) % n, true);
            } else if (this.trackRow === 1) {
              this.setDifficulty((this.difficultyIndex + dir + 3) % 3, true);
            } else {
              events.emit("ui:move", {});
            }
          }
          if (input.confirm) this.start();
          else if (input.back) this.goTo("characterSelect", true);
          break;
        }
      }
    }
    // ----------------------------------------------------------------- private
    goTo(panel3, sound) {
      if (sound) {
        const forward = this.panel === "title" && panel3 !== "title" || this.panel === "characterSelect" && panel3 === "trackSelect";
        events.emit(forward ? "ui:select" : "ui:back", {});
      }
      const changed = panel3 !== this.panel;
      this.panel = panel3;
      this.applyPanel();
      if (changed) this.onPanelChange?.(panel3);
    }
    applyPanel() {
      for (const key of Object.keys(this.panels)) {
        const node = this.panels[key];
        const active = key === this.panel;
        node.classList.toggle("active", active);
        if (active) {
          node.classList.remove("panel-in");
          void node.offsetWidth;
          node.classList.add("panel-in");
        }
      }
      if (this.panel === "trackSelect") {
        this.trackRow = 0;
        this.refreshTrackFocus();
      }
    }
    setCharacter(i, sound = false) {
      if (i < 0 || i >= this.characters.length) return;
      const changed = i !== this.charIndex;
      this.charIndex = i;
      this.charCards.forEach((c, k) => {
        c.classList.toggle("selected", k === i);
        c.classList.toggle("focused", k === i);
      });
      const def = this.characters[i];
      this.charName.set(def.name.toUpperCase());
      this.charTagline.set(def.tagline);
      if (changed) {
        if (sound) events.emit("ui:move", {});
        this.onHighlight?.(def.id);
      }
    }
    setTrack(i, sound = false) {
      if (i < 0 || i >= this.tracks.length) return;
      const changed = i !== this.trackIndex;
      this.trackIndex = i;
      this.trackCards.forEach((c, k) => c.classList.toggle("selected", k === i));
      this.refreshTrackFocus();
      if (changed && sound) events.emit("ui:move", {});
    }
    setDifficulty(i, sound = false) {
      const changed = i !== this.difficultyIndex;
      this.difficultyIndex = i;
      this.diffButtons.forEach((b, k) => b.classList.toggle("selected", k === i));
      this.diffBlurb.set(DIFFICULTY_BLURB[DIFFICULTIES[i]]);
      this.refreshTrackFocus();
      if (changed && sound) events.emit("ui:move", {});
    }
    refreshTrackFocus() {
      this.trackCards.forEach((c, k) => c.classList.toggle("focused", this.trackRow === 0 && k === this.trackIndex));
      this.diffButtons.forEach(
        (b, k) => b.classList.toggle("focused", this.trackRow === 1 && k === this.difficultyIndex)
      );
      this.startButton.classList.toggle("focused", this.trackRow === 2);
    }
    start() {
      const track = this.tracks[this.trackIndex];
      const character = this.characters[this.charIndex];
      if (!track || !character) return;
      events.emit("ui:select", {});
      this.onStart?.({
        characterId: character.id,
        trackId: track.id,
        difficulty: DIFFICULTIES[this.difficultyIndex],
        laps: track.laps > 0 ? track.laps : DEFAULT_LAPS
      });
    }
    buildCharacterCard(c) {
      const card = el("div", "card char-card glass");
      card.tabIndex = -1;
      card.style.setProperty("--card-accent", cssHex(c.color));
      card.style.setProperty("--card-accent-2", cssHex(c.accent));
      card.style.setProperty("--card-glow", cssRgba(c.color, 0.55));
      const swatch = el("div", "char-swatch", void 0, card);
      swatch.style.background = `linear-gradient(145deg, ${cssHex(c.color)} 0%, ${cssHex(c.accent)} 100%)`;
      const helmet = el("div", "char-helmet", void 0, swatch);
      helmet.style.background = `radial-gradient(circle at 35% 35%, #fff 0%, ${cssHex(c.driverColor)} 45%, ${cssHex(
        c.accent
      )} 100%)`;
      el("div", "char-wheel char-wheel-l", void 0, swatch);
      el("div", "char-wheel char-wheel-r", void 0, swatch);
      el("div", "card-name", c.name.toUpperCase(), card);
      el("div", "card-tag", c.tagline, card);
      const pill = el("div", `pill weight-${c.weightClass}`, c.weightClass.toUpperCase(), card);
      pill.title = "Weight class";
      const stats = el("div", "stats", void 0, card);
      for (const s of STAT_KEYS) {
        const row = el("div", "stat", void 0, stats);
        el("span", "stat-label", s.label, row);
        const bar = el("div", "stat-bar", void 0, row);
        const fill = el("div", "stat-fill", void 0, bar);
        const v = Math.max(0, Math.min(1, c.stats[s.key]));
        fill.style.width = `${Math.round(v * 100)}%`;
      }
      return card;
    }
    buildTrackCard(t) {
      const card = el("div", "card track-card glass");
      card.tabIndex = -1;
      const env = t.environment;
      card.style.setProperty("--card-accent", cssHex(env.skyHorizon));
      card.style.setProperty("--card-glow", cssRgba(env.skyHorizon, 0.5));
      const art = el("div", "track-art", void 0, card);
      art.style.background = `linear-gradient(180deg, ${cssHex(env.skyTop)} 0%, ${cssHex(env.skyHorizon)} 55%, ${cssHex(
        t.palette.ground
      )} 56%, ${cssHex(t.palette.ground)} 100%)`;
      const road = el("div", "track-art-road", void 0, art);
      road.style.background = cssHex(t.palette.road);
      road.style.borderColor = cssHex(t.palette.curb);
      el("div", "track-theme-pill pill", t.theme.toUpperCase(), art);
      const body = el("div", "track-body", void 0, card);
      const nameRow = el("div", "track-name-row", void 0, body);
      el("div", "card-name", t.name.toUpperCase(), nameRow);
      const stars = el("div", "stars", void 0, nameRow);
      for (let i = 0; i < 3; i++) el("span", i < t.difficulty ? "star on" : "star", "\u2605", stars);
      el("div", "card-tag", t.description, body);
      const meta = el("div", "track-meta", void 0, body);
      el("span", "pill", `${t.laps} LAPS`, meta);
      el("span", "pill", `${["ROOKIE", "PRO", "EXPERT"][t.difficulty - 1] ?? "PRO"}`, meta);
      return card;
    }
  };

  // joystick-games/turbo-kart-rush/src/upstream/src/kart/roster.ts
  var CHARACTERS = [
    // --- light ---------------------------------------------------------------
    {
      id: "zippy",
      name: "Zippy Nova",
      color: 2086638,
      accent: 16727988,
      driverColor: 16251391,
      weightClass: "light",
      stats: { speed: 0.18, acceleration: 0.95, handling: 0.9, weight: 0.12, miniTurbo: 0.9 },
      tagline: "Blink and she is already two corners ahead."
    },
    {
      id: "pixel",
      name: "Pixel Pop",
      color: 16732067,
      accent: 5111747,
      driverColor: 16773544,
      weightClass: "light",
      stats: { speed: 0.12, acceleration: 0.9, handling: 0.95, weight: 0.08, miniTurbo: 0.85 },
      tagline: "Sugar-rush handling. Corners are her candy."
    },
    {
      id: "fennec",
      name: "Fennec Flash",
      color: 16764703,
      accent: 16738816,
      driverColor: 2824978,
      weightClass: "light",
      stats: { speed: 0.25, acceleration: 0.85, handling: 0.8, weight: 0.2, miniTurbo: 0.95 },
      tagline: "Big ears, bigger mini-turbos."
    },
    // --- medium --------------------------------------------------------------
    {
      id: "max",
      name: "Max Vortex",
      color: 14885410,
      accent: 16765503,
      driverColor: 16777215,
      weightClass: "medium",
      stats: { speed: 0.55, acceleration: 0.55, handling: 0.55, weight: 0.5, miniTurbo: 0.55 },
      tagline: "The all-rounder. Every lap is a highlight reel."
    },
    {
      id: "juno",
      name: "Juno Bolt",
      color: 8141549,
      accent: 16756768,
      driverColor: 1446694,
      weightClass: "medium",
      stats: { speed: 0.6, acceleration: 0.45, handling: 0.5, weight: 0.55, miniTurbo: 0.65 },
      tagline: "Charges every drift like a thunderstorm."
    },
    {
      id: "kai",
      name: "Kai Tidewater",
      color: 1993727,
      accent: 16742938,
      driverColor: 14677759,
      weightClass: "medium",
      stats: { speed: 0.5, acceleration: 0.6, handling: 0.65, weight: 0.45, miniTurbo: 0.5 },
      tagline: "Cool as the deep end, smooth as a swell."
    },
    // --- heavy ---------------------------------------------------------------
    {
      id: "bram",
      name: "Boulder Bram",
      color: 2071115,
      accent: 14191164,
      driverColor: 5913377,
      weightClass: "heavy",
      stats: { speed: 0.92, acceleration: 0.2, handling: 0.25, weight: 0.95, miniTurbo: 0.3 },
      tagline: "Slow to wake up. Impossible to shove."
    },
    {
      id: "rosa",
      name: "Big Rig Rosa",
      color: 16738816,
      accent: 1692613,
      driverColor: 2763316,
      weightClass: "heavy",
      stats: { speed: 1, acceleration: 0.15, handling: 0.3, weight: 0.9, miniTurbo: 0.35 },
      tagline: "Eighteen wheels of attitude in a four-wheel kart."
    }
  ];

  // joystick-games/turbo-kart-rush/src/upstream/src/track/tracks/sunnyCircuit.ts
  var sunnyCircuit = {
    id: "sunny_circuit",
    name: "Sunny Circuit",
    theme: "grassland",
    laps: 3,
    description: "Rolling green hills, a long start straight and one tricky hairpin. The perfect warm-up.",
    difficulty: 1,
    controlPoints: [
      { x: 0, y: 0, z: 0 },
      // 0 finish line
      { x: 0, y: 0, z: -68.5 },
      { x: 0, y: 0, z: -137.1 },
      { x: 16.1, y: 0.8, z: -175.9 },
      // sweeping right 1
      { x: 54.8, y: 1.5, z: -191.9 },
      { x: 100.5, y: 2, z: -191.9 },
      { x: 136.1, y: 3.5, z: -177.2 },
      // sweeping right 2, climbing
      { x: 150.8, y: 5, z: -141.7 },
      { x: 150.8, y: 7, z: -61.7 },
      // hill crest
      { x: 150.8, y: 2.2, z: 18.3 },
      { x: 140.7, y: 1.5, z: 35.7 },
      // hairpin
      { x: 120.6, y: 1.5, z: 35.7 },
      { x: 110.6, y: 1.5, z: 18.3 },
      { x: 110.6, y: 0.5, z: -36.6 },
      { x: 102.6, y: 0, z: -55.9 },
      // left-left twisty section
      { x: 83.2, y: 0, z: -64 },
      { x: 64.9, y: 0, z: -64 },
      { x: 48.7, y: 0, z: -57.3 },
      { x: 42, y: 0, z: -41.1 },
      { x: 58, y: 0, z: -13.4 },
      // S-bend
      { x: 74, y: 0, z: 14.3 },
      { x: 74, y: 0, z: 32.6 },
      { x: 55.5, y: 0, z: 64.6 },
      // stadium U-turn
      { x: 18.5, y: 0, z: 64.6 },
      { x: 0, y: 0, z: 32.6 }
    ],
    halfWidth: 8,
    halfWidths: [8.5, 8.5, 8.5, 8, 8, 8, 8, 8, 8, 8.5, 9, 9, 8.5, 8, 8, 8, 8, 8, 8, 8, 8, 8.5, 9, 9, 8.5],
    wallHalfWidthFactor: 1.55,
    itemBoxRows: [0.1, 0.4, 0.62, 0.83],
    boostPads: [0.3, 0.7, 0.95],
    environment: {
      skyTop: 3108824,
      skyHorizon: 10474495,
      skyBottom: 14675711,
      fogColor: 13624319,
      fogDensity: 16e-4,
      sunColor: 16773848,
      sunIntensity: 2.6,
      sunDirection: { x: 0.47, y: 0.78, z: 0.41 },
      ambientSky: 10470911,
      ambientGround: 7311183,
      ambientIntensity: 0.9
    },
    palette: {
      road: 4869202,
      roadStripe: 16053484,
      curb: 14165803,
      curbAlt: 16119285,
      offroad: 6134330,
      wall: 2763310,
      ground: 5214004
    }
  };

  // joystick-games/turbo-kart-rush/src/upstream/src/track/tracks/duneDrift.ts
  var duneDrift = {
    id: "dune_drift",
    name: "Dune Drift",
    theme: "desert",
    laps: 3,
    description: "Sunset sweepers, a canyon run between towering sandstone walls and two hairpins that punish greed.",
    difficulty: 2,
    controlPoints: [
      { x: 0, y: 0, z: 0 },
      // 0 finish line
      { x: 0, y: 0, z: -120.2 },
      { x: 60.1, y: 2, z: -180.3 },
      // banked sweeper 1
      { x: 100.2, y: 3, z: -180.3 },
      { x: 136.2, y: 4.5, z: -144.2 },
      { x: 136.2, y: 8, z: -116.2 },
      // jump crest
      { x: 136.2, y: 4.5, z: -88.1 },
      { x: 146.2, y: 2, z: -70.8 },
      // hairpin 1 (left)
      { x: 166.3, y: 2, z: -70.8 },
      { x: 176.3, y: 2, z: -88.1 },
      { x: 176.3, y: 3, z: -128.2 },
      { x: 212.3, y: 5, z: -164.2 },
      // banked sweeper 2 (180 deg)
      { x: 248.4, y: 6, z: -128.2 },
      { x: 248.4, y: 3.8, z: -20.8 },
      // canyon descent
      { x: 248.4, y: 0.5, z: 86.5 },
      { x: 237.6, y: 0, z: 105.3 },
      // hairpin 2 (right)
      { x: 215.9, y: 0, z: 105.3 },
      { x: 205.1, y: 0, z: 86.5 },
      { x: 205.1, y: 0, z: 66.5 },
      { x: 171.5, y: 0.5, z: 32.8 },
      // left sweep
      { x: 136.8, y: 1.5, z: 52.9 },
      // S-bend
      { x: 102.1, y: 2.5, z: 72.9 },
      { x: 44.1, y: 0.5, z: 72.9 },
      { x: 0, y: 0, z: 28.8 }
      // final sweeper onto the straight
    ],
    halfWidth: 8.5,
    halfWidths: [9, 9, 8.5, 8.5, 8.5, 8.5, 8.5, 9, 9, 9, 8.5, 8.5, 8, 7.5, 7.5, 9, 9, 9, 8.5, 8.5, 8.5, 8.5, 9, 9],
    wallHalfWidthFactor: 1.3,
    itemBoxRows: [0.12, 0.42, 0.62, 0.86],
    boostPads: [0.255, 0.55, 0.88],
    environment: {
      skyTop: 2833024,
      skyHorizon: 16751196,
      skyBottom: 16767400,
      fogColor: 15907210,
      fogDensity: 22e-4,
      sunColor: 16757355,
      sunIntensity: 2.4,
      sunDirection: { x: -0.7, y: 0.36, z: 0.61 },
      ambientSky: 16762266,
      ambientGround: 10119738,
      ambientIntensity: 0.85
    },
    palette: {
      road: 5918278,
      roadStripe: 16769658,
      curb: 13062191,
      curbAlt: 15984328,
      offroad: 14262620,
      wall: 13209178,
      ground: 13736271
    }
  };

  // joystick-games/turbo-kart-rush/src/upstream/src/track/tracks/frostbiteFalls.ts
  var frostbiteFalls = {
    id: "frostbite_falls",
    name: "Frostbite Falls",
    theme: "snow",
    laps: 3,
    description: "A plunging descent onto a frozen lake causeway with nothing but ice between you and the drop.",
    difficulty: 2,
    controlPoints: [
      { x: 0, y: 8, z: 0 },
      // 0 finish line (plateau)
      { x: 0, y: 8, z: -134.1 },
      { x: -6.7, y: 7.5, z: -150.4 },
      // chicane 1
      { x: -6.7, y: 6.5, z: -182.9 },
      { x: 0, y: 5.5, z: -199.2 },
      { x: 0, y: 4.5, z: -237.5 },
      { x: 57.5, y: 2, z: -295 },
      // big downhill sweeper
      { x: 134.1, y: 0, z: -295 },
      { x: 208.7, y: -1, z: -264.1 },
      // frozen lake sweep (void)
      { x: 239.5, y: -1, z: -189.6 },
      { x: 239.5, y: -1, z: -122.5 },
      // end of lake
      { x: 239.5, y: 1.5, z: -21.9 },
      // long climb
      { x: 239.5, y: 4, z: 78.7 },
      { x: 191.6, y: 5.5, z: 126.6 },
      { x: 143.7, y: 6.5, z: 126.6 },
      { x: 127.5, y: 7.5, z: 119.8 },
      // chicane 2
      { x: 94.9, y: 8.5, z: 119.8 },
      { x: 78.7, y: 9, z: 126.6 },
      { x: 47.9, y: 8.5, z: 126.6 },
      { x: 0, y: 8, z: 78.7 }
      // final corner onto the straight
    ],
    halfWidth: 8,
    halfWidths: [8.5, 8.5, 8.5, 8.5, 8.5, 8, 8, 7.5, 7.5, 7.5, 7.5, 8, 8, 8, 8, 8.5, 8.5, 8.5, 8, 8.5],
    wallHalfWidthFactor: 1.5,
    itemBoxRows: [0.08, 0.36, 0.62, 0.9],
    boostPads: [0.22, 0.66, 0.935],
    voidRanges: [[0.315, 0.545]],
    environment: {
      skyTop: 1982330,
      skyHorizon: 10275824,
      skyBottom: 14938623,
      fogColor: 12376306,
      fogDensity: 32e-4,
      sunColor: 14674687,
      sunIntensity: 2,
      sunDirection: { x: 0.36, y: 0.66, z: -0.66 },
      ambientSky: 11128309,
      ambientGround: 9414852,
      ambientIntensity: 1
    },
    palette: {
      road: 5595246,
      roadStripe: 15267583,
      curb: 3108789,
      curbAlt: 16777215,
      offroad: 15397883,
      wall: 9425138,
      ground: 15134712
    }
  };

  // joystick-games/turbo-kart-rush/src/upstream/src/track/tracks/neonNexus.ts
  var neonNexus = {
    id: "neon_nexus",
    name: "Neon Nexus",
    theme: "neon",
    laps: 3,
    description: "Three hairpins, a rooftop jump and a flat-out neon straight under a violet sky. Experts only.",
    difficulty: 3,
    controlPoints: [
      { x: 0, y: 0, z: 0 },
      // 0 finish line
      { x: 0, y: 0, z: -158.5 },
      { x: 65.3, y: 2, z: -223.7 },
      // high-speed sweep
      { x: 93.2, y: 6.5, z: -223.7 },
      // jump crest
      { x: 121.2, y: 3, z: -223.7 },
      { x: 163.1, y: 1, z: -181.8 },
      { x: 163.1, y: 0, z: -144.5 },
      { x: 173.4, y: 0, z: -126.7 },
      // hairpin 1 (left)
      { x: 193.9, y: 0, z: -126.7 },
      { x: 204.1, y: 0, z: -144.5 },
      { x: 204.1, y: 1, z: -181.8 },
      { x: 246.1, y: 2.5, z: -223.7 },
      // 180 degree sweep
      { x: 288, y: 4, z: -181.8 },
      { x: 288, y: 0, z: 4.7 },
      // long straight
      { x: 275, y: 0, z: 27.3 },
      // hairpin 2 (right)
      { x: 248.9, y: 0, z: 27.3 },
      { x: 235.8, y: 0, z: 4.7 },
      { x: 193.9, y: 2, z: -37.3 },
      // fast left
      { x: 147.3, y: 3, z: -37.3 },
      { x: 111, y: 2.5, z: -16.3 },
      // S-bend
      { x: 74.6, y: 1.5, z: 4.7 },
      { x: 46.7, y: 1, z: 32.6 },
      { x: 46.7, y: 0.5, z: 88.6 },
      { x: 35, y: 0, z: 108.8 },
      // hairpin 3 (right) onto the straight
      { x: 11.7, y: 0, z: 108.8 },
      { x: 0, y: 0, z: 88.6 }
    ],
    halfWidth: 7.5,
    halfWidths: [8, 8, 7.5, 7.5, 7.5, 7.5, 8, 8.5, 8.5, 8.5, 8, 7.5, 7.5, 8, 8.5, 8.5, 8.5, 7.5, 7.5, 7.5, 7.5, 7.5, 8, 8.5, 8.5, 8],
    wallHalfWidthFactor: 1.4,
    itemBoxRows: [0.09, 0.4, 0.56, 0.8],
    boostPads: [0.175, 0.52, 0.75],
    environment: {
      skyTop: 131596,
      skyHorizon: 7019164,
      skyBottom: 1264227,
      fogColor: 1181215,
      fogDensity: 8e-4,
      sunColor: 10467327,
      sunIntensity: 0.9,
      sunDirection: { x: -0.35, y: 0.8, z: -0.49 },
      ambientSky: 3873894,
      ambientGround: 993850,
      ambientIntensity: 0.7
    },
    palette: {
      road: 1381404,
      roadStripe: 16723926,
      curb: 58879,
      curbAlt: 16723926,
      offroad: 1973290,
      wall: 58879,
      ground: 789268
    }
  };

  // joystick-games/turbo-kart-rush/src/upstream/src/track/tracks/index.ts
  var TRACKS = [sunnyCircuit, duneDrift, frostbiteFalls, neonNexus];
  if (false) {
    validateAllTracks(TRACKS);
  }

  // joystick-games/turbo-kart-rush/src/upstream/src/core/types.ts
  function createEmptyInput() {
    return {
      throttle: 0,
      brake: 0,
      steer: 0,
      drift: false,
      useItem: false,
      useItemHeld: false,
      lookBack: false,
      pause: false,
      confirm: false,
      back: false,
      menuUp: false,
      menuDown: false,
      menuLeft: false,
      menuRight: false
    };
  }

  // joystick-games/shared/web/controller-clients.js
  (function(root) {
    "use strict";
    var actions = ["a", "b", "start", "select"];
    function create(options) {
      options = options || {};
      var seats = {}, latest = [];
      function read(players) {
        var rows = (players || []).filter(function(p) {
          return p && Number(p.id) > 0;
        });
        Object.keys(seats).forEach(function(id) {
          if (seats[id].wifi && !rows.some(function(p) {
            return Number(p.id) === Number(id);
          }))
            rows.push({ id: Number(id), connected: false, transport: "wifi" });
        });
        latest = rows.map(function(raw) {
          var p = Object.assign({}, raw), id = Number(p.id), old = seats[id];
          var wifi = p.transport === "wifi", online = !!p.connected;
          var source = online ? wifi ? "wifi:" + String(p.session || p.controllerId || id) : "phone:" + String(p.session || id) : "";
          var cancel = Number.isSafeInteger(p.cancelSeq) ? p.cancelSeq : 0;
          var changed = !!old && (old.source !== source || old.rawCancel !== cancel);
          var wifiChange = !old && wifi && online || changed && (wifi || old.wifi);
          var memory = old || { epoch: cancel, blocked: {} };
          if (changed) memory.epoch++;
          var quarantine = wifiChange && options.onCancel && options.onCancel({ id, previous: old ? old.source : "", source, disconnected: !online }) === true;
          if (quarantine) actions.forEach(function(key) {
            memory.blocked[key] = !!p[key];
          });
          actions.forEach(function(key) {
            if (!p[key]) memory.blocked[key] = false;
            p[key] = online && !quarantine && !memory.blocked[key] && !!p[key];
          });
          if (!online || quarantine) {
            p.x = p.y = p.aimX = p.aimY = 0;
          }
          p.id = id;
          p.connected = online;
          p.cancelSeq = memory.epoch;
          memory.source = source;
          memory.wifi = wifi;
          memory.rawCancel = cancel;
          seats[id] = memory;
          return p;
        });
        return latest.map(function(p) {
          return Object.assign({}, p);
        });
      }
      return { read, peek: function() {
        return latest.map(function(p) {
          return Object.assign({}, p);
        });
      } };
    }
    var clientViews = /* @__PURE__ */ new WeakMap();
    function installClientStyle(doc) {
      if (doc.getElementById("ptv-client-style")) return;
      var style = doc.createElement("style");
      style.id = "ptv-client-style";
      style.textContent = "[data-puretv-clients]{box-sizing:border-box;min-width:0}[data-puretv-clients][hidden]{display:none!important}.ptv-client-card{box-sizing:border-box;display:flex;align-items:flex-start;min-width:0;padding:7px 8px;border:1px solid rgba(130,222,229,.45);border-radius:9px;background:rgba(8,28,36,.96);color:#effcff;text-align:left}.ptv-client-card+.ptv-client-card{margin-top:6px}.ptv-client-icon{display:block;width:24px;height:24px;flex:0 0 24px;margin-right:8px;color:#8ae5dc}.ptv-client-body{flex:1;min-width:0}.ptv-client-heading{display:flex;align-items:baseline;flex-wrap:wrap;font:600 12px/1.35 sans-serif;letter-spacing:normal;text-transform:none}.ptv-client-seat{font:inherit;color:inherit}.ptv-client-state{font:inherit;margin-left:6px;color:#a9f0d4}.ptv-client-id{display:block;min-width:0;margin-top:3px;font:12px/1.4 monospace;color:#effcff;white-space:normal;word-break:break-all;overflow-wrap:anywhere;letter-spacing:normal;text-transform:none}";
      (doc.head || doc.documentElement).appendChild(style);
    }
    function controllerIcon(doc) {
      var ns = "http://www.w3.org/2000/svg", svg = doc.createElementNS(ns, "svg");
      svg.setAttribute("class", "ptv-client-icon");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "1.7");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      var outline = doc.createElementNS(ns, "path");
      outline.setAttribute("d", "M7.5 7h9c2.2 0 3.4 1.2 4 3.3l1.2 4.8c.5 2.1-1.7 3.6-3.2 2.1l-2.1-2.1H7.6l-2.1 2.1c-1.5 1.5-3.7 0-3.2-2.1l1.2-4.8C4.1 8.2 5.3 7 7.5 7Z");
      svg.appendChild(outline);
      var cross = doc.createElementNS(ns, "path");
      cross.setAttribute("d", "M7 9.7v4.6M4.7 12h4.6");
      svg.appendChild(cross);
      [[16, 10.7], [18.8, 13]].forEach(function(point) {
        var dot = doc.createElementNS(ns, "circle");
        dot.setAttribute("cx", String(point[0]));
        dot.setAttribute("cy", String(point[1]));
        dot.setAttribute("r", ".75");
        dot.setAttribute("fill", "currentColor");
        dot.setAttribute("stroke", "none");
        svg.appendChild(dot);
      });
      return svg;
    }
    function renderClients(container, cachedPlayers, options) {
      if (!container || !container.ownerDocument) return;
      var language = options && options.language === "en" ? "en" : "zh";
      var rows = (Array.isArray(cachedPlayers) ? cachedPlayers : []).filter(function(p) {
        return p && p.connected === true && p.transport === "wifi" && Number(p.id) > 0;
      }).map(function(p) {
        return { seat: Number(p.id), identity: typeof p.controllerId === "string" ? p.controllerId : "" };
      }).sort(function(a, b) {
        return a.seat - b.seat;
      });
      var signature = JSON.stringify([language, rows]);
      if (clientViews.get(container) === signature) return;
      clientViews.set(container, signature);
      var doc = container.ownerDocument;
      installClientStyle(doc);
      container.setAttribute("data-puretv-clients", "");
      container.setAttribute("role", "status");
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "true");
      container.setAttribute("aria-label", language === "en" ? "Connected pureTV controllers" : "\u5DF2\u8FDE\u63A5\u7684 pureTV \u624B\u67C4");
      while (container.firstChild) container.removeChild(container.firstChild);
      rows.forEach(function(row) {
        var card = doc.createElement("div");
        card.className = "ptv-client-card";
        card.setAttribute("data-puretv-controller-id", row.identity);
        card.setAttribute("data-player-id", String(row.seat));
        card.appendChild(controllerIcon(doc));
        var body = doc.createElement("div");
        body.className = "ptv-client-body";
        var heading = doc.createElement("div");
        heading.className = "ptv-client-heading";
        var seat = doc.createElement("strong");
        seat.className = "ptv-client-seat";
        seat.textContent = row.seat + "P";
        var state = doc.createElement("span");
        state.className = "ptv-client-state";
        state.textContent = language === "en" ? "Connected" : "\u5DF2\u8FDE\u63A5";
        heading.appendChild(seat);
        heading.appendChild(state);
        body.appendChild(heading);
        var identity = doc.createElement("span");
        identity.className = "ptv-client-id";
        identity.setAttribute("data-puretv-controller-id-text", "");
        identity.textContent = "ID: " + (row.identity || (language === "en" ? "not reported" : "\u672A\u63D0\u4F9B"));
        body.appendChild(identity);
        card.appendChild(body);
        container.appendChild(card);
      });
      container.hidden = rows.length === 0;
    }
    root.PureTVControllerAdapter = { create, renderClients };
    if (typeof module !== "undefined" && module.exports) module.exports = root.PureTVControllerAdapter;
  })(typeof window !== "undefined" ? window : globalThis);

  // joystick-games/shared/web/input.js
  var BUTTONS = Object.freeze(["UP", "DOWN", "LEFT", "RIGHT", "START", "A", "B", "X", "Y"]);
  var empty = () => Object.fromEntries(BUTTONS.map((key) => [key, false]));
  var copy = (value) => JSON.parse(JSON.stringify(value));
  var nativeKeys = { ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT", Enter: "A", Start: "START", p: "START", b: "B", Select: "Y" };
  function createInputReducer() {
    let previous = empty(), source = "", epoch = null, hasSeenController = false;
    let blocked = empty(), resetPending = false;
    return {
      cancel() {
        resetPending = true;
      },
      read(snapshot = {}, local = {}) {
        if (!snapshot || typeof snapshot !== "object") snapshot = {};
        const players = Array.isArray(snapshot.players) ? snapshot.players.filter((p) => p && Number(p.id) > 0) : [];
        const player = players.filter((p) => p.connected === true && p.transport === "wifi").sort((a, b) => Number(a.id) - Number(b.id))[0];
        const nextSource = player ? JSON.stringify([player.id, player.controllerId, player.session]) : "";
        const nextEpoch = player?.cancelSeq ?? null;
        const changed = source !== nextSource || !!source && epoch !== nextEpoch;
        const cancelled = resetPending || changed && !!source;
        const quarantine = cancelled || changed && hasSeenController && !!nextSource;
        const raw = empty();
        const active = snapshot.inputActive !== false && player?.inputActive !== false;
        for (const key of BUTTONS) raw[key] = !!local[key] || active && player?.buttons?.[key] === true;
        if (quarantine) for (const key of BUTTONS) blocked[key] = raw[key];
        const buttons = empty(), pressed = empty(), released = empty();
        for (const key of BUTTONS) {
          if (!raw[key]) blocked[key] = false;
          buttons[key] = !quarantine && raw[key] && !blocked[key];
          pressed[key] = buttons[key] && !previous[key];
          released[key] = !cancelled && !quarantine && !buttons[key] && previous[key];
        }
        previous = buttons;
        source = nextSource;
        epoch = nextEpoch;
        resetPending = false;
        if (player) hasSeenController = true;
        return { buttons, pressed, released, connected: !!player, cancelled, players: copy(players), source };
      }
    };
  }
  function panel(document2, options) {
    const style = document2.createElement("style");
    style.textContent = `
    #puretv-controller-panel{position:fixed;z-index:30;box-sizing:border-box;max-height:calc(100vh - 24px);overflow:auto;color:#eef6ff;background:rgba(12,22,36,.94);border:1px solid rgba(153,192,225,.35);border-radius:12px;padding:10px;font:13px/1.5 system-ui,sans-serif;text-align:left;overflow-wrap:anywhere;box-shadow:0 8px 28px #0004}
    #puretv-controller-panel[hidden]{display:none!important}
    #puretv-controller-panel strong{font-weight:650}
    #puretv-controller-panel .ptv-host-title{display:block;font-size:13px;color:#a8ddff;margin-bottom:5px}
    #puretv-controller-panel .ptv-host-info{white-space:pre-line;margin:6px 0 0;color:#c4d5e7;font-size:12px}
    #puretv-controller-panel[data-playing=true]{background:transparent;border:0;padding:0;box-shadow:none}
    #puretv-controller-panel[data-playing=true] .ptv-host-title,#puretv-controller-panel[data-playing=true] .ptv-host-info{display:none}
    #puretv-controller-panel .ptv-client-card{background:rgba(12,25,43,.94)}
    #puretv-controller-panel .ptv-client-id{font-size:11px}
    #puretv-controller-panel .ptv-client-heading{font-size:12px}
  `;
    document2.head.appendChild(style);
    const element = document2.createElement("aside");
    element.id = "puretv-controller-panel";
    element.setAttribute("aria-label", "pureTV \u624B\u67C4\u8FDE\u63A5");
    element.style[options.side === "left" ? "left" : "right"] = "12px";
    element.style.top = options.top || "12px";
    element.style.width = `${Math.max(150, Math.min(300, Number(options.width) || 198))}px`;
    const title = document2.createElement("strong");
    title.className = "ptv-host-title";
    title.textContent = "pureTV \u624B\u67C4";
    const clients = document2.createElement("div");
    clients.id = "puretv-controller-clients";
    clients.hidden = true;
    const info = document2.createElement("p");
    info.className = "ptv-host-info";
    element.append(title, clients, info);
    document2.body.appendChild(element);
    return { element, clients, info };
  }
  function createController(options = {}) {
    const root = window, document2 = root.document;
    const view = panel(document2, options), reducer = createInputReducer();
    let localHeld = empty(), localPulse = empty(), info = {}, infoAt = -Infinity, playing = false;
    let frame = { buttons: empty(), pressed: empty(), released: empty(), connected: false, cancelled: false, players: [], source: "", pollCount: 0, info: {} };
    const previousHost = root.PureGame;
    function acceptInfo(value) {
      if (value && typeof value === "object") info = copy(value);
    }
    function suspend() {
      localHeld = empty();
      localPulse = empty();
      reducer.cancel();
      options.onSuspend?.();
    }
    const hooks = {
      key(key, down) {
        const action = nativeKeys[key];
        if (!action) return;
        if (down && !localHeld[action]) localPulse[action] = true;
        localHeld[action] = !!down;
      },
      focus(focused) {
        if (!focused) suspend();
      },
      suspend(paused) {
        if (paused) suspend();
      },
      resume() {
      },
      roomInfo: acceptInfo,
      networkChanged(value) {
        acceptInfo(value);
        suspend();
      }
    };
    root.PureGame = hooks;
    const onVisibility = () => {
      if (document2.hidden) suspend();
    };
    root.addEventListener("blur", suspend);
    document2.addEventListener("visibilitychange", onVisibility);
    function render() {
      root.PureTVControllerAdapter.renderClients(view.clients, frame.players, { language: "zh" });
      view.element.dataset.playing = String(playing);
      view.element.hidden = playing && !frame.connected;
      const wifi = info.wifiController || {};
      const addresses = Array.isArray(wifi.addresses) ? wifi.addresses : Array.isArray(info.addresses) ? info.addresses : [];
      const address = addresses.filter((value) => typeof value === "string").join(" / ");
      const name = typeof wifi.serviceName === "string" ? wifi.serviceName : "";
      const port = Number.isInteger(wifi.port) && wifi.port > 0 ? wifi.port : 63485;
      const activeSeat = frame.players.filter((p) => p.connected === true && p.transport === "wifi").map((p) => Number(p.id)).sort((a, b) => a - b)[0];
      let status = frame.connected ? `\u5355\u4EBA\u6E38\u620F \xB7 ${activeSeat}P \u624B\u67C4\u64CD\u4F5C` : "\u624B\u67C4\u6309 GPIO 23 \u641C\u7D22\u8FDE\u63A5";
      if (!root.PureGameHost) status = "\u6D4F\u89C8\u5668\u9884\u89C8 \xB7 \u952E\u9F20\u53EF\u73A9\nWi-Fi \u624B\u67C4\u9700\u542F\u52A8\u5B89\u88C5\u7248";
      if (name) status += "\n" + name;
      if (address) status += "\n" + address;
      if (root.PureGameHost) status += "\nTCP " + port;
      if (typeof wifi.error === "string" && wifi.error) status += "\n" + wifi.error;
      if (wifi.state === "failed" || wifi.state === "unavailable") status += "\n\u624B\u67C4\u670D\u52A1\u6682\u4E0D\u53EF\u7528";
      view.info.textContent = status;
    }
    return {
      poll() {
        let sample = { players: [] };
        const now = root.performance.now();
        try {
          if (root.PureGameHost?.getInfo && now - infoAt >= 1e3) {
            acceptInfo(JSON.parse(root.PureGameHost.getInfo()));
            infoAt = now;
          }
          if (root.PureGameHost?.snapshot) sample = JSON.parse(root.PureGameHost.snapshot());
        } catch (_) {
          sample = { players: [] };
        }
        const local = empty();
        for (const key of BUTTONS) local[key] = localHeld[key] || localPulse[key];
        localPulse = empty();
        frame = { ...reducer.read(sample, local), info: copy(info), pollCount: frame.pollCount + 1, native: !!root.PureGameHost, inputAvailable: !!root.PureGameHost };
        render();
        if (frame.cancelled) options.onCancel?.();
        return copy(frame);
      },
      peek() {
        return copy(frame);
      },
      setPlaying(value) {
        playing = !!value;
        render();
      },
      cancel: suspend,
      destroy() {
        root.removeEventListener("blur", suspend);
        document2.removeEventListener("visibilitychange", onVisibility);
        if (root.PureGame === hooks) root.PureGame = previousHost;
        view.element.remove();
      }
    };
  }

  // ../racing-review-karts/rush-work/menu-fixture.ts
  window.PureGameHost = { getInfo: () => JSON.stringify({ wifiController: { port: 63485 } }), snapshot: () => JSON.stringify({ players: [{ id: 1, controllerId: "rush-test-controller-960-long-id", session: "dom-only", connected: true, transport: "wifi", buttons: {} }] }) };
  var controller = createController({ width: 190 });
  controller.poll();
  var panel2 = document.getElementById("puretv-controller-panel");
  panel2.dataset.connected = "true";
  var menu = new MainMenu(document.getElementById("ui"), CHARACTERS, TRACKS);
  menu.onPanelChange = (mode) => panel2.dataset.mode = mode;
  menu.show("characterSelect");
  panel2.dataset.mode = "characterSelect";
  window.fixture = { open: (mode) => {
    menu.show(mode);
    panel2.dataset.mode = mode;
  }, nav: (key) => menu.handleInput({ ...createEmptyInput(), [key]: true }) };
  window.fixtureReady = true;
})();

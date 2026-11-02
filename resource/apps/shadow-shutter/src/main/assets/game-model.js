(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PureModel = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DATA = {
  "schemaVersion": 1,
  "designStatus": "static-draft-awaiting-root-review",
  "identity": {
    "gameId": 33,
    "name": "影窗快门",
    "englishName": "Shadow Shutter",
    "slug": "shadow-shutter",
    "packageId": "com.ecojust.shadowshuttertv",
    "versionName": "0.1.0",
    "versionCode": 1,
    "seed": 733,
    "actionCount": 2,
    "assignmentSha256": "4f804d95a15a5e732b72425a9a2dbf2cb43483be04442d69112ce99df0fea451"
  },
  "premise": "Move the opaque board's exposure window around a miniature paper-shadow stage. Three separately moving paper cutouts must form each published photograph with every required part visible. The foreground paper strip can hide a part. Capture the three ordered compositions with limited film.",
  "geometry": {
    "unitsPerCell": 480,
    "ticksPerSecond": 60,
    "worldSizeCells": [28,16],
    "origin": "world upper-left; x increases right, y increases down",
    "cellRegion": "cell [x,y] denotes the half-open rectangle [480*x,480*(x+1)) by [480*y,480*(y+1)); geometry is the exact union of those rectangles",
    "boundaryRule": "shared edges have zero overlap; exact containment at an aperture edge is accepted",
    "mirrorRule": "reflect a shape within its fixed published widthCells: local cell x becomes widthCells-1-x; no automatic reflection, rotation or recentering is allowed during matching",
    "registration": "target coordinates are fixed relative to the exposure window's upper-left; each identified required actor must exactly equal its own target region in that coordinate frame",
    "spatialToleranceUnits": 0,
    "humanMargin": "window movement is in exact one-cell steps; successful scene poses dwell, so exposure timing has a multi-second interval rather than a one-tick coincidence",
    "depthOrder": ["part-a","part-b","part-c","paper-strip"],
    "requiredActors": ["part-a","part-b","part-c"],
    "actorTones": ["deep-indigo","warm-charcoal","muted-plum"],
    "occluderTone": "opaque illuminated paper, replacing ink with background in a photograph",
    "fullVisibility": "every required actor's complete world region must lie inside world and aperture, and no part may intersect any higher opaque actor or the foreground paper strip",
    "sameColorOverlap": "overlap still occludes the lower actor even if display colors are similar; visible component tints and seams identify the three required parts",
    "exposure": "compose back-to-front inside the aperture; required actors deposit ink and the paper strip overwrites covered ink with paper; compare the entire resulting local ink set to the target union",
    "match": "correct frame mode AND exact per-required-actor local region equality AND complete visibility of every required actor AND exact full exposure union equality"
  },
  "aperture": {
    "initialMode": "landscape",
    "initialCenterDoubledCells": [27,15],
    "modes": [
      {"id":"landscape","sizeCells":[9,7]},
      {"id":"portrait","sizeCells":[7,9]}
    ],
    "centerLattice": "odd integer doubled-cell coordinates; one navigation step changes one center coordinate by 2",
    "clampRule": "for width w and height h in cells, clamp centerX2 to [w,56-w] and centerY2 to [h,32-h]",
    "modeChange": "B toggles landscape/portrait, keeps the center, then clamps that center to the new mode's legal range",
    "board": "the opaque player board blocks the world outside the exposure rectangle; it does not translate the stage or the target geometry"
  },
  "motion": {
    "periodTicks": 2160,
    "phaseRule": "phaseTick=mod(tick+scenario.phaseOffsetTicks,2160), with mod returning [0,2160)",
    "poseWorldOrigin": "actor origin at pose k is 480*(pose.stageOriginCells + pose.parts[actorId].originCells)",
    "segments": [
      {"fromPhaseTick":0,"toPhaseTick":480,"kind":"translate","fromPose":2,"toPose":0},
      {"fromPhaseTick":480,"toPhaseTick":720,"kind":"dwell","pose":0},
      {"fromPhaseTick":720,"toPhaseTick":1200,"kind":"translate","fromPose":0,"toPose":1},
      {"fromPhaseTick":1200,"toPhaseTick":1440,"kind":"dwell","pose":1},
      {"fromPhaseTick":1440,"toPhaseTick":1920,"kind":"translate","fromPose":1,"toPose":2},
      {"fromPhaseTick":1920,"toPhaseTick":2160,"kind":"dwell","pose":2}
    ],
    "translation": "linear exact integer-origin interpolation over 480 ticks; all waypoint differences are whole cells so each per-tick velocity is an integer number of units",
    "mirrorDuringTransit": "use fromPose mirror state for transit ages 0..239 and toPose mirror state for ages 240..479; this is an explicit instantaneous paper-holder reversal at the transit midpoint",
    "segmentBoundary": "segments are [from,to); endpoint positions agree; phase 0 is pose 2's exact position and mirror state at the start of its departing transit",
    "occluder": {
      "id":"paper-strip",
      "sizeCells":[9,1],
      "dwellStartOrigin": "pose.stageOriginCells + [0,1]",
      "dwellExitOrigin": "pose.stageOriginCells + [0,frameHeightCells+1]",
      "dwellExitTravelTicks":60,
      "dwellRule":"move linearly from start to exit during the first 60 dwell ticks, then remain at exit through the dwell end",
      "transitRule":"during each 480-tick actor transit, move linearly from the previous pose's exit origin to the next pose's dwell-start origin",
      "guaranteedClearDwellInterval":"closed capture interval [dwellStart+60,dwellEnd], lasting 180 ticks and containing 181 integer capture boundaries; at dwellEnd the next transit has the same endpoint geometry, with no strip overlap with the whole aperture"
    }
  },
  "controls": {
    "direction":"move the window one cell on the selected axis; nonzero Y takes priority over X; every direction-token change resets age to zero and acts immediately, held repeat at ages 12,18,24,... actual integrated ticks",
    "a":{"label":"拍摄","meaning":"one fresh A captures the actual scene at the input boundary and consumes one film sheet"},
    "b":{"label":"横竖画幅","meaning":"one fresh B toggles aperture mode, with no film cost"},
    "sameBoundaryOrder":"navigation, then fresh B mode change/clamp, then fresh A capture, then (only if nonterminal) one tick of silhouette motion",
    "freshAAndBTogether":"both apply in the published order: change frame first, then take exactly one photograph in the resulting aperture",
    "pause":"fixed host pause entry; the host stops Model.step",
    "instructionText":[
      "移动遮光板的窗口，把三块纸影拼成右侧目标。目标里的分色与接缝对应三块必需纸片。",
      "方向键移动窗口；B切换横幅/竖幅；A拍摄。每次拍摄消耗一张胶片，长按只拍一张。",
      "纸片必须完整入窗，不能被前层纸片或浅色纸带挡住。目标朝向固定，镜像不能替代。",
      "按顺序拍齐三张。拍摄取按键当刻的舞台，成功换目标不会重置运动。"
    ]
  },
  "roundRules": {
    "targetOrder":"poses 0,1,2 in order; only the currently active target can earn credit",
    "targetSwitch":"on a matching photo, credit exactly one target and advance once; retain all world motion phase, aperture, film history and input armed states",
    "film":"every admitted fresh A photo consumes one sheet, including a miss, an already-credited-looking composition or a future-target-looking composition",
    "lastFilmPriority":"after capture, apply the current target result; if all three are credited, win even when film is now zero; otherwise film zero loses immediately",
    "captureTerminal":"a win or film-exhausted loss at input time ends that transaction with no motion interval and no mechanical tick increment",
    "deadline":"if no capture terminal occurred, advance exactly one interval and then lose when tick reaches deadlineTick; no capture is admitted at or after that boundary",
    "heldShutter":"effective A uses raw a OR aPressed and an armed edge latch; one held press cannot create a second photo even if the target changes",
    "retry":"host creates the same authored scenario from tick zero, restoring film, target index, aperture center/mode, all initial phases and quarantined input",
    "pause":"no Model.step means every model field freezes; resume uses existing shared cancellation and neutralization, without a wall-clock catch-up"
  },
  "scenarios": [
    {
      "id":"paper-bird","name":"纸鸟回眸","phaseOffsetTicks":0,"initialFilm":5,"deadlineTick":4560,
      "actors":[
        {"id":"part-a","name":"鸟身","widthCells":3,"heightCells":2,"cells":[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]},
        {"id":"part-b","name":"长翼","widthCells":2,"heightCells":3,"cells":[[0,0],[0,1],[0,2],[1,2]]},
        {"id":"part-c","name":"鸟首与喙","widthCells":3,"heightCells":2,"cells":[[0,0],[1,0],[2,0],[0,1]]}
      ],
      "poses":[
        {"id":"bird-right","name":"向右展翼","mode":"landscape","stageOriginCells":[2,2],"parts":{"part-a":{"originCells":[2,4],"mirrorX":false},"part-b":{"originCells":[2,1],"mirrorX":false},"part-c":{"originCells":[5,3],"mirrorX":false}}},
        {"id":"bird-rise","name":"昂首高栖","mode":"portrait","stageOriginCells":[11,4],"parts":{"part-a":{"originCells":[2,5],"mirrorX":false},"part-b":{"originCells":[2,2],"mirrorX":false},"part-c":{"originCells":[3,1],"mirrorX":false}}},
        {"id":"bird-left","name":"向左回眸","mode":"landscape","stageOriginCells":[18,1],"parts":{"part-a":{"originCells":[4,4],"mirrorX":true},"part-b":{"originCells":[5,1],"mirrorX":true},"part-c":{"originCells":[1,3],"mirrorX":true}}}
      ]
    },
    {
      "id":"folded-sail","name":"纸帆远航","phaseOffsetTicks":-480,"initialFilm":5,"deadlineTick":5040,
      "actors":[
        {"id":"part-a","name":"船身","widthCells":5,"heightCells":2,"cells":[[0,0],[1,0],[2,0],[3,0],[4,0],[1,1],[2,1],[3,1]]},
        {"id":"part-b","name":"桅杆","widthCells":1,"heightCells":3,"cells":[[0,0],[0,1],[0,2]]},
        {"id":"part-c","name":"三角帆","widthCells":3,"heightCells":3,"cells":[[0,0],[0,1],[1,1],[0,2],[1,2],[2,2]]}
      ],
      "poses":[
        {"id":"sail-right","name":"顺风右帆","mode":"landscape","stageOriginCells":[17,2],"parts":{"part-a":{"originCells":[2,4],"mirrorX":false},"part-b":{"originCells":[3,1],"mirrorX":false},"part-c":{"originCells":[4,1],"mirrorX":false}}},
        {"id":"sail-high","name":"高挂风帆","mode":"portrait","stageOriginCells":[3,3],"parts":{"part-a":{"originCells":[1,6],"mirrorX":false},"part-b":{"originCells":[2,3],"mirrorX":false},"part-c":{"originCells":[3,1],"mirrorX":false}}},
        {"id":"sail-left","name":"逆向左帆","mode":"landscape","stageOriginCells":[11,7],"parts":{"part-a":{"originCells":[2,4],"mirrorX":true},"part-b":{"originCells":[5,1],"mirrorX":true},"part-c":{"originCells":[2,1],"mirrorX":true}}}
      ]
    },
    {
      "id":"tea-lantern","name":"壶影茶灯","phaseOffsetTicks":-960,"initialFilm":6,"deadlineTick":5400,
      "actors":[
        {"id":"part-a","name":"壶身","widthCells":4,"heightCells":3,"cells":[[1,0],[2,0],[0,1],[1,1],[2,1],[3,1],[1,2],[2,2]]},
        {"id":"part-b","name":"壶盖","widthCells":3,"heightCells":2,"cells":[[1,0],[0,1],[1,1],[2,1]]},
        {"id":"part-c","name":"长壶嘴","widthCells":3,"heightCells":3,"cells":[[1,0],[2,0],[0,1],[1,1],[0,2]]}
      ],
      "poses":[
        {"id":"tea-right","name":"向右注茶","mode":"landscape","stageOriginCells":[3,7],"parts":{"part-a":{"originCells":[1,3],"mirrorX":false},"part-b":{"originCells":[1,1],"mirrorX":false},"part-c":{"originCells":[5,2],"mirrorX":false}}},
        {"id":"tea-high","name":"提盖高注","mode":"portrait","stageOriginCells":[17,2],"parts":{"part-a":{"originCells":[1,5],"mirrorX":false},"part-b":{"originCells":[1,3],"mirrorX":false},"part-c":{"originCells":[4,2],"mirrorX":false}}},
        {"id":"tea-left","name":"向左收壶","mode":"landscape","stageOriginCells":[9,1],"parts":{"part-a":{"originCells":[4,3],"mirrorX":true},"part-b":{"originCells":[5,1],"mirrorX":true},"part-c":{"originCells":[1,2],"mirrorX":true}}}
      ]
    }
  ],
  "sharedRuntime": {
    "exports":["create(seed=733,difficulty=0)","step(state,dt,input)"],
    "createInputDomain":"seed must be a nonnegative safe integer; difficulty must be exactly integer 0,1,2; omitted/undefined arguments use defaults, all other invalid values throw RangeError; valid seeds are recorded but do not randomize these authored scenarios",
    "difficultyMapping":"0/1/2 map to authored scenarios in array order",
    "dt":"active positive dt must be finite and within 1e-12 of 1/60; dt=0 and terminal calls are full no-ops",
    "input":"existing x/y, a/b, aPressed/bPressed, cancelled/cancelEpoch; 0.55 axis threshold; initial quarantine and complete neutral acknowledgement before armed actions",
    "cancelRule":"cancelled or changed finite cancelEpoch suppresses inputs but still permits the actual ordinary interval; a later neutral sample clears quarantine without issuing an action",
    "transaction":"each valid active call creates one transaction, independently of whether a capture terminal allows any motion interval",
    "preview":"only current tick/active target and current geometric match facts; null when activeTargetIndex is 3; a shot always reevaluates after this transaction's navigation/B, never reuses an old preview",
    "score":"1000 + 100*remainingFilm on win, otherwise 100*creditedTargetCount; display only"
  },
  "presentation": {
    "logicalResolution":[960,540],
    "renderer":"reuse shared WebGL1 atlas and one draw submission; opaque orthogonal unions can be emitted as batched rectangles or faithful pre-baked sprites",
    "visualDirection":"warm darkroom and illuminated paper theatre, continuous paper edges and restrained material grain; no visible cell grid, pixel tiles or numeric timer-only play",
    "requiredViews":["live stage and actual exposure window","three identifiable required cutouts and front paper strip","complete current target with per-part tints/seams and fixed direction","ordered target contact sheet","remaining film and deadline","immutable last photograph with its original result and target"],
    "photoRule":"last photograph uses detached geometry from the actual capture receipt, never the next live frame",
    "outsideAperture":"a separate clearly labelled full-stage navigation preview may show the scene beyond the window; it is not the exposure image. The actual board and the foreground paper strip remain opaque in the exposure view and saved photograph, with no ghosted hidden parts",
    "blueprint":"all target masks, component identities, frame modes and direction are visible before play and in the host pause view"
  },
  "authorizationBoundary":"Static design only; no production code, executable design simulation, Model import, test, browser run, solver or automatic search is authorized by these files."
};

  var U = 480, HZ = 60, DT = 1 / HZ;
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.keys(value).forEach(function (key) { freeze(value[key]); }); Object.freeze(value);
    }
    return value;
  }
  function need(ok, message) { if (!ok) throw new RangeError(message); }
  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function mod(value, period) { return value - period * Math.floor(value / period); }
  function rectangle(x0, y0, x1, y1) { return { x0: x0, y0: y0, x1: x1, y1: y1 }; }
  function ordered(rows) { return rows.sort(function (a, b) { return a.y0 - b.y0 || a.x0 - b.x0 || a.y1 - b.y1 || a.x1 - b.x1; }); }
  function overlap(a, b) {
    var r = rectangle(Math.max(a.x0, b.x0), Math.max(a.y0, b.y0), Math.min(a.x1, b.x1), Math.min(a.y1, b.y1));
    return r.x0 < r.x1 && r.y0 < r.y1 ? r : null;
  }
  function cutOne(a, b) {
    var c = overlap(a, b); if (!c) return [a];
    return [rectangle(a.x0, a.y0, a.x1, c.y0), rectangle(a.x0, c.y1, a.x1, a.y1),
      rectangle(a.x0, c.y0, c.x0, c.y1), rectangle(c.x1, c.y0, a.x1, c.y1)].filter(function (r) { return r.x0 < r.x1 && r.y0 < r.y1; });
  }
  function minus(a, b) {
    var result = a.slice(); b.forEach(function (cut) { result = result.flatMap(function (r) { return cutOne(r, cut); }); });
    return ordered(result);
  }
  function union(rows) {
    var result = []; rows.forEach(function (r) { result.push.apply(result, minus([r], result)); }); return ordered(result);
  }
  function intersect(a, b) {
    var result = []; a.forEach(function (x) { b.forEach(function (y) { var r = overlap(x, y); if (r) result.push(r); }); }); return union(result);
  }
  function equalRegion(a, b) { return minus(a, b).length === 0 && minus(b, a).length === 0; }
  function translate(rows, x, y) { return ordered(rows.map(function (r) { return rectangle(r.x0 + x, r.y0 + y, r.x1 + x, r.y1 + y); })); }
  function shape(actor, mirrored, x, y) {
    return ordered(actor.cells.map(function (cell) {
      var cx = mirrored ? actor.widthCells - 1 - cell[0] : cell[0], cy = cell[1];
      return rectangle(x + U * cx, y + U * cy, x + U * (cx + 1), y + U * (cy + 1));
    }));
  }
  function mode(id) { return DATA.aperture.modes.find(function (row) { return row.id === id; }); }
  function aperture(id, cx, cy) {
    var size = mode(id).sizeCells, w = size[0], h = size[1];
    cx = Math.max(w, Math.min(56 - w, cx)); cy = Math.max(h, Math.min(32 - h, cy));
    var x = (cx - w) * U / 2, y = (cy - h) * U / 2;
    return freeze({ mode: id, centerX2: cx, centerY2: cy, widthCells: w, heightCells: h, rect: rectangle(x, y, x + U * w, y + U * h) });
  }
  function targets(scenario) {
    return freeze(scenario.poses.map(function (pose, index) {
      var size = mode(pose.mode).sizeCells;
      var actors = DATA.geometry.requiredActors.map(function (id) {
        var actor = scenario.actors.find(function (row) { return row.id === id; }), part = pose.parts[id];
        return { id: id, localRects: shape(actor, part.mirrorX, U * part.originCells[0], U * part.originCells[1]) };
      });
      return { targetIndex: index, targetId: pose.id, name: pose.name, mode: pose.mode, widthCells: size[0], heightCells: size[1],
        actors: actors, unionRects: union(actors.flatMap(function (actor) { return actor.localRects; })) };
    }));
  }
  function origin(pose, id) { return [U * (pose.stageOriginCells[0] + pose.parts[id].originCells[0]), U * (pose.stageOriginCells[1] + pose.parts[id].originCells[1])]; }
  function stripOrigin(pose, exit) { return [U * pose.stageOriginCells[0], U * (pose.stageOriginCells[1] + (exit ? mode(pose.mode).sizeCells[1] + 1 : 1))]; }
  function interpolate(from, to, age, duration) { return [from[0] + (to[0] - from[0]) / duration * age, from[1] + (to[1] - from[1]) / duration * age]; }
  function sceneAt(s, tick) {
    var phase = mod(tick + s.scenario.phaseOffsetTicks, DATA.motion.periodTicks);
    var index = DATA.motion.segments.findIndex(function (segment) { return phase >= segment.fromPhaseTick && phase < segment.toPhaseTick; });
    var segment = DATA.motion.segments[index], age = phase - segment.fromPhaseTick, moving = segment.kind === 'translate';
    var from = s.scenario.poses[moving ? segment.fromPose : segment.pose], to = s.scenario.poses[moving ? segment.toPose : segment.pose];
    var actors = DATA.geometry.requiredActors.map(function (id, depth) {
      var actor = s.scenario.actors.find(function (row) { return row.id === id; });
      var xy = moving ? interpolate(origin(from, id), origin(to, id), age, 480) : origin(from, id);
      var mirrored = (moving && age >= 240 ? to : from).parts[id].mirrorX;
      need(xy.every(Number.isSafeInteger), 'Authored actor positions must stay integer');
      return { id: id, depth: depth, originX: xy[0], originY: xy[1], mirrorX: mirrored,
        widthCells: actor.widthCells, heightCells: actor.heightCells, worldRects: shape(actor, mirrored, xy[0], xy[1]) };
    });
    var xy = moving ? interpolate(stripOrigin(from, true), stripOrigin(to, false), age, 480)
      : interpolate(stripOrigin(from, false), stripOrigin(from, true), Math.min(age, 60), 60);
    need(xy.every(Number.isSafeInteger), 'Authored strip positions must stay integer');
    return freeze({ motionPhaseTick: phase, segmentIndex: index, actors: actors,
      strip: { id: 'paper-strip', depth: 3, originX: xy[0], originY: xy[1], worldRect: rectangle(xy[0], xy[1], xy[0] + 9 * U, xy[1] + U) } });
  }
  function evaluate(scene, frame, target) {
    var world = [rectangle(0, 0, 28 * U, 16 * U)];
    var checks = scene.actors.map(function (actor, index) {
      var raw = actor.worldRects, higher = union(scene.actors.slice(index + 1).flatMap(function (row) { return row.worldRects; }).concat([scene.strip.worldRect]));
      var outsideWorld = minus(raw, world), outsideAperture = minus(raw, [frame.rect]), occluded = intersect(raw, higher);
      var visible = minus(intersect(intersect(raw, world), [frame.rect]), higher);
      var local = translate(raw, -frame.rect.x0, -frame.rect.y0), visibleLocal = translate(visible, -frame.rect.x0, -frame.rect.y0);
      var expected = target.actors.find(function (row) { return row.id === actor.id; }).localRects;
      return { id: actor.id, worldRects: raw, localRawRects: local, visibleWorldRects: visible, visibleLocalRects: visibleLocal,
        outsideWorldRects: outsideWorld, outsideApertureRects: outsideAperture, occludedWorldRects: occluded, expectedLocalRects: expected,
        insideWorld: outsideWorld.length === 0, insideAperture: outsideAperture.length === 0, unoccluded: occluded.length === 0,
        fullVisible: equalRegion(visible, raw), registered: equalRegion(local, expected) };
    });
    var exposed = union(checks.flatMap(function (row) { return row.visibleLocalRects; }));
    var modeMatches = frame.mode === target.mode, allVisible = checks.every(function (row) { return row.fullVisible; });
    var allRegistered = checks.every(function (row) { return row.registered; }), exposedMatches = equalRegion(exposed, target.unionRects);
    var reason = !modeMatches ? 'wrong_frame_mode' : checks.some(function (row) { return !row.insideWorld || !row.insideAperture; }) ? 'required_piece_clipped'
      : checks.some(function (row) { return !row.unoccluded; }) ? 'required_piece_occluded' : !allRegistered ? 'component_registration_mismatch'
      : !exposedMatches ? 'exposure_mismatch' : 'matched';
    return { actorChecks: checks, exposureLocalRects: exposed, modeMatches: modeMatches, allFullyVisible: allVisible,
      allRegistered: allRegistered, exposureEqualsTarget: exposedMatches, matched: modeMatches && allVisible && allRegistered && exposedMatches, reason: reason };
  }
  function derive(s) {
    s.elapsed = s.tick / HZ; s.activeTargetId = s.activeTargetIndex < s.targets.length ? s.targets[s.activeTargetIndex].targetId : null;
    s.score = s.phase === 'won' ? 1000 + 100 * s.film.remaining : 100 * s.targetCredits.length;
    if (s.activeTargetId === null) s.preview = null;
    else {
      var result = evaluate(s.scene, s.aperture, s.targets[s.activeTargetIndex]);
      s.preview = freeze({ tick: s.tick, activeTargetIndex: s.activeTargetIndex, activeTargetId: s.activeTargetId,
        actors: result.actorChecks.map(function (row) { return { id: row.id, fullVisible: row.fullVisible, registered: row.registered }; }),
        modeMatches: result.modeMatches, allFullyVisible: result.allFullyVisible, allRegistered: result.allRegistered,
        exposureEqualsTarget: result.exposureEqualsTarget, matched: result.matched, reason: result.reason });
    }
    s.message = s.phase === 'won' ? '三张影窗照片全部完成' : s.lostReason === 'film_exhausted' ? '胶片已用尽，照片与已完成目标已保留'
      : s.lostReason === 'deadline' ? '拍摄时间结束，未完成全部目标' : s.preview.matched ? '当前构图完整对准，可以按 A 拍摄'
      : '目标 ' + (s.activeTargetIndex + 1) + '/3 · 移动窗口，B 切画幅，等待完整纸影后按 A';
  }
  function create(seed, difficulty) {
    if (seed === undefined) seed = 733; if (difficulty === undefined) difficulty = 0;
    need(Number.isSafeInteger(seed) && seed >= 0, 'Run seed must be a nonnegative safe integer');
    need(Number.isInteger(difficulty) && difficulty >= 0 && difficulty <= 2, 'Difficulty must be an integer 0..2');
    var scenario = DATA.scenarios[difficulty], center = DATA.aperture.initialCenterDoubledCells;
    var s = { width: 960, height: 540, schemaVersion: 1, identity: freeze(clone(DATA.identity)), seed: seed, difficulty: difficulty,
      level: difficulty + 1, levelName: scenario.name, scenarioId: scenario.id, scenario: freeze(clone(scenario)),
      physics: freeze({ geometry: clone(DATA.geometry), aperture: clone(DATA.aperture), motion: clone(DATA.motion) }), targets: targets(scenario),
      phase: 'playing', tick: 0, elapsed: 0, score: 0, lostReason: null, message: '', terminal: null, deadlineTick: scenario.deadlineTick,
      activeTargetIndex: 0, activeTargetId: null, film: { initial: scenario.initialFilm, used: 0, remaining: scenario.initialFilm },
      aperture: aperture(DATA.aperture.initialMode, center[0], center[1]), scene: null, preview: null,
      inputState: { cancelEpoch: 0, quarantined: true, aArmed: false, bArmed: false, direction: null, repeatAgeTicks: 0 },
      lastInput: null, transactionCount: 0, lastTransaction: null, lastInterval: null, lastPhoto: null, lastFrameChange: null,
      photoReceipts: [], targetCredits: [] };
    s.scene = sceneAt(s, 0); derive(s); return s;
  }
  function finish(s, reason) {
    s.phase = reason === 'all_targets_captured' ? 'won' : 'lost'; s.lostReason = s.phase === 'lost' ? reason : null;
    s.terminal = freeze({ reason: reason, boundaryTick: s.tick, transactionId: s.transactionCount });
  }
  function capture(s) {
    var index = s.activeTargetIndex, target = s.targets[index], result = evaluate(s.scene, s.aperture, target);
    var id = s.photoReceipts.length + 1, before = clone(s.film);
    s.film = { initial: s.film.initial, used: s.film.used + 1, remaining: s.film.remaining - 1 };
    if (result.matched) {
      s.targetCredits.push(freeze({ creditId: s.targetCredits.length + 1, targetIndex: index, targetId: target.targetId,
        photoReceiptId: id, transactionId: s.transactionCount, boundaryTick: s.tick })); s.activeTargetIndex++;
    }
    if (s.activeTargetIndex === s.targets.length) finish(s, 'all_targets_captured');
    else if (s.film.remaining === 0) finish(s, 'film_exhausted');
    var row = { receiptId: id, transactionId: s.transactionCount, boundaryTick: s.tick,
      motionPhaseTick: s.scene.motionPhaseTick, segmentIndex: s.scene.segmentIndex, targetIndexBefore: index, targetIdBefore: target.targetId,
      targetIndexAfter: s.activeTargetIndex, targetIdAfter: s.activeTargetIndex < s.targets.length ? s.targets[s.activeTargetIndex].targetId : null,
      aperture: clone(s.aperture), sceneAtCapture: clone(s.scene), expected: clone(target),
      actorChecks: clone(result.actorChecks), exposureLocalRects: clone(result.exposureLocalRects),
      modeMatches: result.modeMatches, allFullyVisible: result.allFullyVisible, allRegistered: result.allRegistered,
      exposureEqualsTarget: result.exposureEqualsTarget, matched: result.matched, reason: result.reason,
      filmBefore: before, filmAfter: clone(s.film), chargedFilm: 1, creditedTargetId: result.matched ? target.targetId : null,
      terminalAfterCapture: clone(s.terminal) };
    freeze(row); s.photoReceipts.push(row); s.lastPhoto = row;
  }
  function clearDirection(latch) { latch.direction = null; latch.repeatAgeTicks = 0; }
  function inputStep(s, input) {
    input = input && typeof input === 'object' ? input : {};
    var l = s.inputState, rawX = finite(input.x) ? input.x : null, rawY = finite(input.y) ? input.y : null;
    var rawEpoch = finite(input.cancelEpoch) ? input.cancelEpoch : null, epoch = rawEpoch === null ? l.cancelEpoch : rawEpoch;
    var x = rawX === null ? 0 : Math.max(-1, Math.min(1, rawX)), y = rawY === null ? 0 : Math.max(-1, Math.min(1, rawY));
    var ax = x >= .55 ? 1 : x <= -.55 ? -1 : 0, ay = y >= .55 ? 1 : y <= -.55 ? -1 : 0;
    var a = input.a === true, b = input.b === true, ap = input.aPressed === true, bp = input.bPressed === true;
    var li = s.lastInput = { transactionId: s.transactionCount, rawX: rawX, rawY: rawY, x: x, y: y, axisX: ax, axisY: ay,
      rawA: a, rawB: b, rawAPressed: ap, rawBPressed: bp, effectiveA: a || ap, effectiveB: b || bp,
      cancelled: input.cancelled === true, rawCancelEpoch: rawEpoch, cancelEpoch: epoch, epochChanged: epoch !== l.cancelEpoch,
      quarantinedBefore: l.quarantined, quarantinedAfter: l.quarantined, neutralAcknowledged: false, freshA: false, freshB: false,
      direction: l.direction, repeatAgeBefore: l.repeatAgeTicks, repeatAgeAfter: l.repeatAgeTicks };
    var before = clone(s.aperture), afterNavigation, requested = null, changed = false;
    l.cancelEpoch = epoch;
    if (li.cancelled || li.epochChanged) { l.quarantined = true; l.aArmed = l.bArmed = false; clearDirection(l); }
    else if (l.quarantined) {
      if (!ax && !ay && !li.effectiveA && !li.effectiveB) { l.quarantined = false; l.aArmed = l.bArmed = true; clearDirection(l); li.neutralAcknowledged = true; }
    } else {
      var direction = ay ? (ay < 0 ? 'up' : 'down') : ax ? (ax < 0 ? 'left' : 'right') : null;
      if (direction === null) clearDirection(l);
      else {
        var first = direction !== l.direction; if (first) { l.direction = direction; l.repeatAgeTicks = 0; }
        if (first || (l.repeatAgeTicks >= 12 && (l.repeatAgeTicks - 12) % 6 === 0)) {
          requested = direction; var cx = s.aperture.centerX2, cy = s.aperture.centerY2;
          s.aperture = aperture(s.aperture.mode, cx + (direction === 'left' ? -2 : direction === 'right' ? 2 : 0), cy + (direction === 'up' ? -2 : direction === 'down' ? 2 : 0));
          changed = cx !== s.aperture.centerX2 || cy !== s.aperture.centerY2;
        }
      }
      li.freshA = li.effectiveA && l.aArmed; li.freshB = li.effectiveB && l.bArmed;
      l.aArmed = !li.effectiveA; l.bArmed = !li.effectiveB;
    }
    afterNavigation = clone(s.aperture);
    if (li.freshB) s.aperture = aperture(s.aperture.mode === 'landscape' ? 'portrait' : 'landscape', s.aperture.centerX2, s.aperture.centerY2);
    s.lastFrameChange = freeze({ transactionId: s.transactionCount, apertureBefore: before, navigationRequested: requested, navigationChanged: changed,
      apertureAfterNavigation: afterNavigation, modeToggleRequested: li.freshB, modeToggleApplied: li.freshB, apertureAfterB: clone(s.aperture) });
  }
  function integrate(s, fromTick) {
    var before = s.scene, after = sceneAt(s, fromTick + 1); s.scene = after; s.tick = fromTick + 1;
    if (!s.inputState.quarantined && s.inputState.direction !== null) s.inputState.repeatAgeTicks++;
    if (s.tick >= s.deadlineTick) finish(s, 'deadline');
    s.lastInterval = freeze({ intervalId: s.tick, transactionId: s.transactionCount, fromTick: fromTick, toTick: s.tick,
      fromMotionPhaseTick: before.motionPhaseTick, toMotionPhaseTick: after.motionPhaseTick, sourceSegmentIndex: before.segmentIndex,
      precedingPhotoReceiptIds: s.lastPhoto ? [s.lastPhoto.receiptId] : [],
      actors: before.actors.map(function (actor, index) {
        var end = after.actors[index];
        return { id: actor.id, fromOriginX: actor.originX, fromOriginY: actor.originY, toOriginX: end.originX, toOriginY: end.originY,
          velocityX: end.originX - actor.originX, velocityY: end.originY - actor.originY,
          fromMirrorX: actor.mirrorX, toMirrorX: end.mirrorX, mirrorChangedAtEnd: actor.mirrorX !== end.mirrorX };
      }),
      strip: { fromOriginX: before.strip.originX, fromOriginY: before.strip.originY, toOriginX: after.strip.originX, toOriginY: after.strip.originY,
        velocityX: after.strip.originX - before.strip.originX, velocityY: after.strip.originY - before.strip.originY },
      apertureDuringInterval: clone(s.aperture), filmDuringInterval: clone(s.film), targetIndexDuringInterval: s.activeTargetIndex,
      terminalAfter: clone(s.terminal), phaseAfter: s.phase });
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing' || dt === 0) return s;
    need(finite(dt) && dt > 0 && Math.abs(dt - DT) <= 1e-12, 'step requires one fixed 1/60 second interval');
    var t = s.tick, creditsBefore = s.targetCredits.length;
    s.transactionCount++; s.lastPhoto = null; s.lastInterval = null; inputStep(s, input);
    if (s.lastInput.freshA) capture(s);
    if (s.phase === 'playing') integrate(s, t);
    derive(s);
    var l = s.inputState, li = s.lastInput;
    li.quarantinedAfter = l.quarantined; li.direction = l.direction; li.repeatAgeAfter = l.repeatAgeTicks; freeze(li);
    s.lastTransaction = freeze({ id: s.transactionCount, fromTick: t, toTick: s.tick, advanced: s.tick !== t,
      photoReceiptIds: s.lastPhoto ? [s.lastPhoto.receiptId] : [],
      creditIds: s.targetCredits.length > creditsBefore ? [s.targetCredits[s.targetCredits.length - 1].creditId] : [],
      intervalId: s.lastInterval ? s.lastInterval.intervalId : null, terminalAfter: clone(s.terminal) });
    return s;
  }
  return { create: create, step: step };
}));


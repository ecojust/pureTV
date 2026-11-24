#!/usr/bin/env node
// Bundle editable stage data for the Android asset WebView, which has no fetch dependency.
const fs = require("node:fs");
const path = require("node:path");
const assets = path.resolve(__dirname, "../src/main/assets");
const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(assets, "data", name), "utf8"));
const data = {
  stages: Array.from({ length: 6 }, (_, i) => read(`stage-${i + 1}.json`)),
  specs: read("entities.json").specs,
  destruction: read("destruction.json").patches,
};
for (const s of data.stages) {
  const n = s.width_tiles * s.height_tiles;
  if (
    s.width_tiles !== 64 ||
    s.tile_size !== 8 ||
    [s.tiles, s.palettes, s.collision].some((a) => a.length !== n)
  )
    throw new Error(`Invalid stage ${s.stage}`);
}
const output =
  "/* Recovered original game data; provenance and rights are recorded in data/*.json and docs/reference.md. Runtime conversion code is MIT. */\n(function(root){\n'use strict';\nconst data=" +
  JSON.stringify(data) +
  ";\nroot.JackalLevels=data;if(typeof module!=='undefined'&&module.exports)module.exports=data;\n})(typeof window!=='undefined'?window:globalThis);\n";
const target = path.join(assets, "levels.js");
if (process.argv.includes("--check")) {
  if (fs.readFileSync(target, "utf8") !== output) {
    console.error(
      "levels.js differs from the editable JSON; run node tools/build-levels.cjs",
    );
    process.exitCode = 1;
  }
} else fs.writeFileSync(target, output);

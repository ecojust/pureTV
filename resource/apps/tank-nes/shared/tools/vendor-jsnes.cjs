#!/usr/bin/env node
/* Reproducibly lower JSNES syntax for Android 8-era WebView. No core edits. */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const esbuild = require(
  path.resolve(__dirname, "../../../../../desktop/node_modules/esbuild"),
);
const input = process.argv[2];
if (!input)
  throw new Error(
    "Usage: node vendor-jsnes.cjs /path/to/jsnes-2.1.0/package/dist/jsnes.min.js",
  );
if (esbuild.version !== "0.25.12") throw new Error("Expected esbuild 0.25.12");
const sha256 = (bytes) =>
  crypto.createHash("sha256").update(bytes).digest("hex");
if (
  sha256(fs.readFileSync(input)) !==
  "84946f0dae4bcf3b2dfebe84ad3bfeb1dbcb413bd9b1a69e1f45910a95fd7b41"
)
  throw new Error("Input does not match JSNES 2.1.0 npm distribution");
const output = path.resolve(
  __dirname,
  "../src/main/assets/vendor/jsnes.min.js",
);
esbuild.buildSync({
  entryPoints: [path.resolve(input)],
  outfile: output,
  target: "chrome61",
  minify: true,
  banner: {
    js: '/* JSNES 2.1.0 — Apache-2.0. See JSNES-LICENSE.txt and JSNES-NOTICE.md. Transpiled for Chrome 61. */\nif(typeof globalThis==="undefined")window.globalThis=window;',
  },
  legalComments: "inline",
});
const generated = sha256(fs.readFileSync(output));
if (
  generated !==
  "fee1ae5bb33739bd217657bf40ca7986b7775336fc0fc17a5c79cdbc51e33d4f"
)
  throw new Error("Unexpected generated hash: " + generated);
console.log("JSNES 2.1.0 browser bundle verified: " + generated);

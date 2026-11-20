# Last Track · 末路战车

Unofficial pureTV controller adaptation of Alexander Uspenskiy's Last Track v0.10.6.
Original repository: https://github.com/alexander-uspenskiy/LastTrack
Fixed upstream commit: 7fdf7cfb6affb84748e11980f837255b12130bb7.

Copyright (c) 2026 Alexander Uspenskiy. The original MIT LICENSE is retained in
this directory and in src/upstream/LICENSE. The complete fixed upstream source,
including its artwork, music, documentation and tests, remains in src/upstream/.
Its file identities and the adaptation changes are recorded in docs/source-changes.json
and docs/upstream-source.json.

Three.js is MIT licensed. The unchanged vendored r170 runtime and the original
dependency lock are retained; the installed package includes its license in
dist/THIRD-PARTY-NOTICES.txt. All original runtime assets retain their source bytes.
The separate top-level upstream trailer production tools are preserved in source
and are not required by the installed game.

The pureTV changes provide nine-button input, visible menu focus, cancellation,
read-only QA observations, native storage declarations and offline packaging.
The original vehicle physics, AI, weapons, tracks and economy remain upstream.
The hosted analytics bootstrap is removed. Bare Three.js imports become relative
imports of the same vendored runtime, and the entry uses an async boot function
for installed WebView compatibility. Original development model setters are not
exported by the installed page.

Build and source preparation do not imply completed native or physical-device QA.

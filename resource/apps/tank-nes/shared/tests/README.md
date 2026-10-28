# NES integration fixtures

`fixtures/controller-rom.cjs` is an original MIT-licensed test cartridge generator
written for pureTV. It contains no game graphics, music or code from Battle City,
Jackal or another commercial ROM. Test cartridges are generated in memory; neither
application bundles them.

- `controllerRom()` returns a mapper-0 iNES cartridge. Its own 6502 program renders
  an animated checkerboard, produces a pulse tone, and reads both controllers.
  Zero-page bytes `$10` and `$11` contain player 1 and player 2 input respectively:
  bits 7–0 are A, B, SELECT, START, up, down, left, right. `$00` is the NMI frame
  counter. A changes one checker color; player 2 B changes the other.
- `mapper2Rom()` returns a four-bank UxROM cartridge. Its fixed-bank program
  selects banks 0, 1 and 2, then stores their `$11`, `$22` and `$33` markers at
  zero-page `$20`, `$21` and `$22`. This checks real bank switching, rather than
  merely trusting the cartridge header's mapper number.

Run from the repository root:

```sh
node --test resource/apps/tank-nes/shared/tests/adapter.test.cjs
CHROMIUM_PATH=/usr/bin/chromium node resource/apps/tank-nes/shared/tests/browser.mjs
```

The browser suite uses the packaged JSNES core, TV page and phone controller. Its
Android bridge and WebSocket room are simulated; ROM upload requests are real
XHR/HTTP requests to a local fixture server. Native server authentication, storage
and lifecycle behavior have separate Android tests. These checks do not establish
physical-TV performance or compatibility with a particular commercial cartridge.

`NES_UI_CAPTURE_DIR` selects the output directory (default
`/tmp/puretv-nes-previews`). `{tank,jackal}-nes-tv{,.en}.png` show the actual import
screen, while `{tank,jackal}-nes-controller{,.en}.png` show the actual phone page.
`nes-diagnostic.png` is visibly labeled as our test ROM and must not be presented
as a screenshot of either original game.

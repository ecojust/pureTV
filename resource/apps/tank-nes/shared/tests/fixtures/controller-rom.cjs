// SPDX-License-Identifier: MIT
// Original pureTV test program. This is not extracted from a commercial game.
// Generates a mapper-0 iNES cartridge with an animated two-color checkerboard,
// a 440 Hz pulse, and both controller ports mirrored into zero-page RAM.
// RAM $10/$11: P1/P2 A B Select Start Up Down Left Right, bits 7 through 0.
// The A button changes checker color 1; P2 B changes checker color 2.
function controllerRom() {
  const code = [], labels = new Map(), patches = [];
  const emit = (...bytes) => code.push(...bytes);
  const label = name => labels.set(name, 0x8000 + code.length);
  const branch = (opcode, target) => { emit(opcode, 0); patches.push({ at: code.length - 1, target, relative: true }); };
  const jump = target => { emit(0x4c, 0, 0); patches.push({ at: code.length - 2, target }); };
  label('reset');
  emit(0x78, 0xd8, 0xa2, 0xff, 0x9a, 0xe8); // SEI CLD LDX #ff TXS INX
  emit(0x8e, 0x00, 0x20, 0x8e, 0x01, 0x20); // Disable PPU
  emit(0xa9, 0x40, 0x8d, 0x17, 0x40); // Disable APU frame IRQ
  emit(0xa9, 0, 0x85, 0, 0x85, 1, 0x85, 0x10, 0x85, 0x11);
  label('warm1'); emit(0x2c, 0x02, 0x20); branch(0x10, 'warm1');
  label('warm2'); emit(0x2c, 0x02, 0x20); branch(0x10, 'warm2');
  // Initial palette: black, blue, green, white. Attribute bytes use palette 0.
  emit(0xa9, 0x3f, 0x8d, 0x06, 0x20, 0xa9, 0, 0x8d, 0x06, 0x20);
  for (const value of [0x0f, 0x21, 0x2a, 0x30]) emit(0xa9, value, 0x8d, 0x07, 0x20);
  emit(0xa9, 0x20, 0x8d, 0x06, 0x20, 0xa9, 0, 0x8d, 0x06, 0x20);
  // Fill all 960 background cells using our checker tile.
  emit(0xa0, 3, 0xa2, 0, 0xa9, 1);
  label('page'); emit(0x8d, 0x07, 0x20, 0xe8); branch(0xd0, 'page');
  emit(0x88); branch(0xd0, 'page');
  emit(0xa2, 192);
  label('tail'); emit(0x8d, 0x07, 0x20, 0xca); branch(0xd0, 'tail');
  emit(0xa2, 64, 0xa9, 0);
  label('attributes'); emit(0x8d, 0x07, 0x20, 0xca); branch(0xd0, 'attributes');
  // Pulse channel: length counter halted, constant volume, about 440 Hz.
  for (const [address, value] of [[0x4015, 1], [0x4000, 0xbf], [0x4001, 8], [0x4002, 0xfd], [0x4003, 8]]) {
    emit(0xa9, value, 0x8d, address & 255, address >> 8);
  }
  emit(0xa9, 0, 0x8d, 0x05, 0x20, 0x8d, 0x05, 0x20);
  emit(0xa9, 0x80, 0x8d, 0x00, 0x20, 0xa9, 0x0a, 0x8d, 0x01, 0x20);
  label('frame'); emit(0xa5, 0, 0xc5, 1); branch(0xf0, 'frame'); emit(0x85, 1);
  // Reading ports serially in parallel preserves all eight NES buttons.
  emit(0xa9, 1, 0x8d, 0x16, 0x40, 0xa9, 0, 0x8d, 0x16, 0x40, 0x85, 0x10, 0x85, 0x11, 0xa2, 8);
  label('buttons');
  emit(0xad, 0x16, 0x40, 0x4a, 0x26, 0x10, 0xad, 0x17, 0x40, 0x4a, 0x26, 0x11, 0xca);
  branch(0xd0, 'buttons');
  emit(0x2c, 0x02, 0x20, 0xa9, 0x3f, 0x8d, 0x06, 0x20, 0xa9, 1, 0x8d, 0x06, 0x20);
  emit(0xa5, 0x10, 0x29, 0x80); branch(0xf0, 'p1blue'); emit(0xa9, 0x16); jump('p1color');
  label('p1blue'); emit(0xa9, 0x21);
  label('p1color'); emit(0x8d, 0x07, 0x20);
  emit(0xa5, 0x11, 0x29, 0x40); branch(0xf0, 'p2green'); emit(0xa9, 0x28); jump('p2color');
  label('p2green'); emit(0xa9, 0x2a);
  label('p2color'); emit(0x8d, 0x07, 0x20);
  emit(0xa5, 0, 0x29, 0x10); branch(0xf0, 'dark'); emit(0xa9, 0x30); jump('blink');
  label('dark'); emit(0xa9, 0x10);
  label('blink'); emit(0x8d, 0x07, 0x20, 0xa9, 0x80, 0x8d, 0x00, 0x20, 0xa9, 0, 0x8d, 0x05, 0x20, 0x8d, 0x05, 0x20);
  jump('frame');
  label('nmi'); emit(0xe6, 0, 0x40); // INC frame counter; RTI
  label('irq'); emit(0x40);
  for (const patch of patches) {
    const address = labels.get(patch.target);
    if (address === undefined) throw new Error(`Unknown label ${patch.target}`);
    if (patch.relative) {
      const offset = address - (0x8000 + patch.at + 1);
      if (offset < -128 || offset > 127) throw new Error(`Branch too far: ${patch.target}`);
      code[patch.at] = offset & 255;
    } else { code[patch.at] = address & 255; code[patch.at + 1] = address >> 8; }
  }
  const rom = Buffer.alloc(16 + 16384 + 8192);
  rom.set([0x4e, 0x45, 0x53, 0x1a, 1, 1, 0, 0], 0);
  rom.fill(0xea, 16, 16 + 16384);
  rom.set(code, 16);
  for (const [offset, name] of [[0x3ffa, 'nmi'], [0x3ffc, 'reset'], [0x3ffe, 'irq']]) {
    rom.writeUInt16LE(labels.get(name), 16 + offset);
  }
  // Tile 1: our 4×4 checker with one contrasting diagonal color-3 pixel per row.
  const chr = 16 + 16384 + 16;
  for (let row = 0; row < 8; row++) {
    const diagonal = 0x80 >> row;
    rom[chr + row] = (row < 4 ? 0xf0 : 0x0f) | diagonal;
    rom[chr + row + 8] = (row < 4 ? 0x0f : 0xf0) | diagonal;
  }
  return rom;
}
function mapper2Rom() {
  // Four switchable 16 KiB PRG banks; code lives in the fixed last bank.
  // This original test uses no graphics. RAM $20/$21/$22 receive bank markers.
  const rom = Buffer.alloc(16 + 4 * 16384 + 8192);
  rom.set([0x4e, 0x45, 0x53, 0x1a, 4, 1, 0x20, 0], 0);
  for (let bank = 0; bank < 3; bank++) rom[16 + bank * 16384] = 0x11 * (bank + 1);
  const code = [0x78, 0xd8, 0xa2, 0xff, 0x9a];
  for (const bank of [0, 1, 2]) code.push(0xa9, bank, 0x8d, 0x00, 0x80, 0xad, 0x00, 0x80, 0x85, 0x20 + bank);
  const loop = 0xc000 + code.length;
  code.push(0xe6, 0x23, 0x4c, loop & 255, loop >> 8);
  rom.set(code, 16 + 3 * 16384);
  for (const vector of [0xfffa, 0xfffc, 0xfffe]) rom.writeUInt16LE(0xc000, 16 + 3 * 16384 + vector - 0xc000);
  return rom;
}
module.exports = { controllerRom, mapper2Rom };
if (require.main === module) require('node:fs').writeFileSync(process.argv[2] || '/tmp/puretv-controller-test.nes', controllerRom());

// Both published renderers bundle the same simulation. Bind the additional
// rows at their respective table initializers, before budgets are derived.
export function adaptRenderer(source) {
  const factory = source.match(/this\.viewEnvironment=(\w+)\(this\.backend\.createPmrem\(\)\)/)?.[1];
  if (!factory) throw new Error('Upstream reflection map factory changed');
  const hooks = [
    // Low-end televisions and software WebGL spend much of startup filtering
    // the two reflection probes. Keep the light rigs and reduce cubemap texels.
    [/\.fromScene\(new (\w+),\.04\)\.texture/, (_, scene) =>
      '.fromScene(new ' + scene + ',.04,.1,100,{size:this.quality.level==="low"?32:256}).texture'],
    ['function ' + factory + '(n){', 'function ' + factory + '(n,probeSize){'],
    [factory + '(this.backend.createPmrem())', factory + '(this.backend.createPmrem(),this.quality.level==="low"?32:128)'],
    ['.02,.1,40,{size:128}', '.02,.1,40,{size:probeSize}'],
    [/walker:\{name:"walker"/, '...PureLab.rules,walker:{name:"walker"'],
    [/walker:(\w+),runner:\{\.\.\.\1,tint:/, (_, base) => '...PureLab.skins(' + base + '),walker:' + base + ',runner:{...' + base + ',tint:'],
    ['killBase:{walker:100', 'killBase:{...PureLab.scores,walker:100'],
    ['walker:"Walker"', '...PureLab.names,walker:"Walker"'],
    ['runner:"Fast —', '...PureLab.hints,runner:"Fast —'],
    ['[{variant:"heavy",chance:', '[...PureLab.picker,{variant:"heavy",chance:'],
    ['[{variant:"runner",sector:', '[...PureLab.introductions,{variant:"runner",sector:'],
    [/leaperChance:(\w+)\((\w+),"leaper",(\w+),(\w+)\)/, (original, curve, sector, critical, schedule) =>
      '...PureLab.chances(' + [curve, sector, critical, schedule].join(',') + '),' + original],
    // The host direction keys aim directly. Pointer lock is still available on mouse down.
    ['this.input.requestLock(),this.hud.setCaptureHint(this.needsCaptureHint)',
      'this.hud.setCaptureHint(this.needsCaptureHint)'],
    ['this.input.needsCaptureHint&&!this.touchLayer.isActive', 'this.input.needsCaptureHint&&!this.touchLayer.isActive&&!window.PureLabPadActive']
  ];
  for (const [anchor, replacement] of hooks) {
    const match = typeof anchor === 'string' ? anchor : source.match(anchor)?.[0];
    if (!match || source.indexOf(match) !== source.lastIndexOf(match))
      throw new Error('Upstream anchor changed: ' + anchor);
    source = source.replace(anchor, replacement);
  }
  // Flat classic scripts also run in file-backed WebViews. This URL is the
  // base used by Vite's in-bundle module preload helper in the WebGPU build.
  return '(function(){\n' + source.replace('import.meta.url', 'document.baseURI') + '\n})();\n';
}

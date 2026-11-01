// Diagnostics only. Do not inject into the final clean recording context.
// Canvas paint commands are API operations, NOT GPU draw calls.
(() => {
  const counters = { webglDrawCalls: 0, canvasPaintCommands: 0 };
  const records = [], wrapped = new WeakSet();
  const glMethods = ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced'];
  const paintMethods = ['clearRect', 'fillRect', 'strokeRect', 'fill', 'stroke', 'drawImage', 'fillText', 'strokeText', 'putImageData'];
  const wrap = (object, names, metric) => {
    if (!object || wrapped.has(object)) return;
    wrapped.add(object);
    for (const name of names) {
      const original = object[name];
      if (typeof original !== 'function') continue;
      object[name] = function (...args) {
        counters[metric]++;
        return Reflect.apply(original, this, args);
      };
    }
  };
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
    const context = Reflect.apply(getContext, this, [kind, ...args]);
    if (kind === '2d') wrap(context, paintMethods, 'canvasPaintCommands');
    if (/^webgl2?$|^experimental-webgl$/.test(kind) && context && !wrapped.has(context)) {
      wrap(context, glMethods, 'webglDrawCalls');
      const getExtension = context.getExtension;
      context.getExtension = function (...values) {
        const extension = Reflect.apply(getExtension, this, values);
        if (values[0] === 'ANGLE_instanced_arrays') wrap(extension, ['drawArraysInstancedANGLE', 'drawElementsInstancedANGLE'], 'webglDrawCalls');
        if (values[0] === 'WEBGL_multi_draw') wrap(extension, ['multiDrawArraysWEBGL', 'multiDrawElementsWEBGL', 'multiDrawArraysInstancedWEBGL', 'multiDrawElementsInstancedWEBGL'], 'webglDrawCalls');
        return extension;
      };
    }
    return context;
  };
  let previousTime, previous = { ...counters };
  function sample(time) {
    if (previousTime !== undefined) {
      records.push({ time, rafIntervalMs: time - previousTime,
        webglDrawCalls: counters.webglDrawCalls - previous.webglDrawCalls,
        canvasPaintCommands: counters.canvasPaintCommands - previous.canvasPaintCommands });
      if (records.length > 7200) records.shift();
    }
    previousTime = time;
    previous = { ...counters };
    requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
  Object.defineProperty(window, 'PureTVRenderMetrics', { configurable: false, writable: false,
    value: Object.freeze({ snapshot: () => ({ totals: { ...counters }, samples: records.map(x => ({ ...x })),
      note: 'Intervals between observer RAF callbacks on this browser; not render CPU time or device FPS. WebGL multi_draw counts API submissions, not its subdraws. Canvas paint commands are not GPU draw calls. OffscreenCanvas workers are not observed.' }) }) });
})();

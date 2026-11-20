import { expect, it } from 'vitest';
import { createRenderCanvas, webglOutputPolicy } from '../src/boot';

it('uses the RGBA8 direct renderer at CSS resolution on identified software GPUs', () => {
  for (const gpu of ['Android Emulator OpenGL ES Translator (Google SwiftShader)', 'Mesa llvmpipe', 'Microsoft Basic Render Driver']) {
    expect(webglOutputPolicy(gpu, true, 2)).toEqual({ halfFloat: false, pixelRatio: 1, antialias: false });
  }
});

it('preserves hardware and undisclosed GPU defaults, including support for RGBA8-only devices', () => {
  for (const gpu of ['Adreno (TM) 740', 'Apple M2', 'webgl2']) {
    expect(webglOutputPolicy(gpu, true, 3)).toEqual({ halfFloat: true, pixelRatio: 2, antialias: true });
    expect(webglOutputPolicy(gpu, false, 1.5)).toEqual({ halfFloat: false, pixelRatio: 1.5, antialias: true });
  }
});

it('only replaces a usable multisampled software context after a single-sample context succeeds', () => {
  for (const [gpu, firstAntialias, replacementAvailable] of [
    ['SwiftShader', true, true], ['SwiftShader', true, false], ['SwiftShader', false, true], ['Adreno', true, true],
  ] as const) {
    const requested: boolean[] = [];
    let released = false;
    const contexts: object[] = [];
    const makeCanvas = () => ({
      getContext(_type: string, options: WebGLContextAttributes) {
        requested.push(!!options.antialias);
        if (requested.length > 1 && !replacementAvailable) return null;
        const context = {
          getParameter: () => gpu,
          getContextAttributes: () => ({ antialias: requested.length === 1 && firstAntialias }),
          getExtension: (name: string) => name === 'WEBGL_lose_context' ? { loseContext: () => { released = true; } } : {},
        };
        contexts.push(context);
        return context;
      },
    }) as unknown as HTMLCanvasElement;
    const result = createRenderCanvas(true, 2, makeCanvas);
    const secondNeeded = gpu === 'SwiftShader' && firstAntialias;
    expect(requested).toEqual(secondNeeded ? [true, false] : [true]);
    expect(released).toBe(secondNeeded && replacementAvailable);
    expect(result.context).toBe(contexts[contexts.length - 1]);
    expect(result.output.antialias).toBe(gpu === 'Adreno');
  }
});

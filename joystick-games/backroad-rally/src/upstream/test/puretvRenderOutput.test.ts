import { expect, it } from 'vitest';
import { webglOutputPolicy } from '../src/boot';

it('uses the RGBA8 direct renderer at CSS resolution on identified software GPUs', () => {
  for (const gpu of ['Android Emulator OpenGL ES Translator (Google SwiftShader)', 'Mesa llvmpipe', 'Microsoft Basic Render Driver']) {
    expect(webglOutputPolicy(gpu, true, 2)).toEqual({ halfFloat: false, pixelRatio: 1 });
  }
});

it('preserves hardware and undisclosed GPU defaults, including support for RGBA8-only devices', () => {
  for (const gpu of ['Adreno (TM) 740', 'Apple M2', 'webgl2']) {
    expect(webglOutputPolicy(gpu, true, 3)).toEqual({ halfFloat: true, pixelRatio: 2 });
    expect(webglOutputPolicy(gpu, false, 1.5)).toEqual({ halfFloat: false, pixelRatio: 1.5 });
  }
});

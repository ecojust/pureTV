import { expect, it, vi } from 'vitest';
import type * as THREE from 'three/webgpu';
import { backdropFence } from '../src/boot';

function device() {
  const gl = {
    TIMEOUT_EXPIRED: 1, CONDITION_SATISFIED: 2, WAIT_FAILED: 3,
    SYNC_GPU_COMMANDS_COMPLETE: 4,
    fenceSync: vi.fn(() => ({})),
    clientWaitSync: vi.fn(() => 1),
    flush: vi.fn(), deleteSync: vi.fn(),
  };
  const renderer = {backend: {gl}} as unknown as THREE.WebGPURenderer;
  return {gl, renderer};
}
it('uses no synchronization calls on an unrecognized or hardware driver', () => {
  for (const gpu of ['webgl2','Adreno (TM) 740','Apple M2']) {
    const {gl, renderer} = device();
    expect(backdropFence(renderer,gpu)).toBeNull();
    expect(gl.fenceSync).not.toHaveBeenCalled();
  }
});
it('skips only an outstanding software draw, using zero CPU wait', () => {
  const {gl,renderer}=device();
  const fence=backdropFence(renderer,'ANGLE (Mesa, llvmpipe)')!;
  expect(fence.ready()).toBe(true);
  fence.submitted();
  expect(gl.flush).toHaveBeenCalledOnce();
  expect(fence.ready()).toBe(false);
  expect(gl.clientWaitSync).toHaveBeenCalledWith(expect.any(Object),0,0);
  gl.clientWaitSync.mockReturnValue(gl.CONDITION_SATISFIED);
  expect(fence.ready()).toBe(true);
  expect(gl.deleteSync).toHaveBeenCalledOnce();
});
it('allows the original path to proceed after a failed driver query', () => {
  const {gl,renderer}=device();
  const fence=backdropFence(renderer,'Android Emulator OpenGL ES Translator (Google SwiftShader)')!;
  fence.submitted();
  gl.clientWaitSync.mockReturnValue(gl.WAIT_FAILED);
  expect(fence.ready()).toBe(true);
  fence.submitted();
  expect(gl.fenceSync).toHaveBeenCalledOnce();
});

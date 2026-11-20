// Half-float color attachments are optional even in a WebGL 2 context.
export function supportsHalfFloatTargets(renderer) {
  return renderer.extensions.has('EXT_color_buffer_float') ||
    renderer.extensions.has('EXT_color_buffer_half_float');
}

export function halfFloatSamples(renderer) {
  const gl = renderer.getContext();
  const supported = gl.getInternalformatParameter(gl.RENDERBUFFER, gl.RGBA16F, gl.SAMPLES);
  return Math.max(0, ...Array.from(supported ?? []).filter(count => count <= 4));
}

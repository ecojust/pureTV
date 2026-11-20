/** Both the bloom compositor and the menu reflection map render to RGBA16F. */
export function supportsHdrEffects(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) {
    return false;
  }
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const name = gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
  return !/swiftshader|llvmpipe|lavapipe|softpipe|microsoft basic render|software rasterizer/i.test(String(name));
}

export function drawingPixelRatio(hdr: boolean, dpr: number, width: number, height: number): number {
  // Keep the HUD at the display's native CSS size. Only the 3D world is scaled.
  return hdr ? Math.min(dpr, 2) : Math.min(dpr, 1, 960 / width, 540 / height);
}

const softwareRenderer = /\b(?:swiftshader|llvmpipe|softpipe|lavapipe|swrast|software rasterizer|microsoft basic render driver)\b/i;

export function usesSoftwareRenderer(gl) {
  const details = gl.getExtension('WEBGL_debug_renderer_info');
  const name = details && gl.getParameter(details.UNMASKED_RENDERER_WEBGL);
  return softwareRenderer.test(name || gl.getParameter(gl.RENDERER) || '');
}

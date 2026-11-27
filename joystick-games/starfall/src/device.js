export function chooseDeviceQuality(gl, quality) {
  const extension = gl.getExtension('WEBGL_debug_renderer_info');
  const name = gl.getParameter(extension ? extension.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
  const software = /swiftshader|llvmpipe|software rasterizer|basic render/i.test(name);
  if (!software && !/Android|iPhone|iPad/i.test(navigator.userAgent)) return;
  Object.assign(quality, {
    preset: software ? 0 : 1, shadows: false, shadowResolution: 512,
    bloom: !software, volumetrics: false, ssao: false, antialias: 'none',
    maxParticles: software ? 2200 : 7500, lodBias: software ? 0.55 : 0.9,
    pixelRatio: Math.min(devicePixelRatio || 1, (software ? 700 : 1120) / Math.max(innerWidth, innerHeight)),
  });
}

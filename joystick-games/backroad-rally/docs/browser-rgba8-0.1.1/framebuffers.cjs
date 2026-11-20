const { chromium } = require(process.env.PLAYWRIGHT_CORE_MODULE || 'playwright-core');

async function measure() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_BIN || '/usr/bin/chromium',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage();
    return await page.evaluate(() => {
      function checkFormat(gl, format) {
        const framebuffer = gl.createFramebuffer();
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl[format], 1, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
        gl.deleteFramebuffer(framebuffer);
        gl.deleteTexture(texture);
        return [format, complete];
      }
      return [false, true].map(extensions => {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (extensions) gl.getExtension('EXT_color_buffer_float');
        return { extensions, targets: ['RGBA8', 'RGBA16F'].map(format => checkFormat(gl, format)) };
      });
    });
  } finally {
    await browser.close();
  }
}
measure().then(result => console.log(JSON.stringify(result))).catch(error => {
  console.error(error);
  process.exitCode = 1;
});

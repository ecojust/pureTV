const {chromium}=require(process.env.PLAYWRIGHT_CORE_MODULE || 'playwright-core');
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROMIUM_BIN || '/usr/bin/chromium',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const p=await b.newPage();
 console.log(JSON.stringify(await p.evaluate(()=>[false,true].map(extensions=>{
 const gl=document.createElement('canvas').getContext('webgl2'); if(extensions)gl.getExtension('EXT_color_buffer_float');
 return {extensions,targets:['RGBA8','RGBA16F'].map(format=>{
 const fb=gl.createFramebuffer(),tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.texStorage2D(gl.TEXTURE_2D,1,gl[format],1,1);gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
 gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
 return [format,gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE];
 })};
 }))));
}finally{await b.close();}
})()

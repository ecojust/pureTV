(() => {
  const results=[], precision=(gl,stage,type)=>{const p=gl.getShaderPrecisionFormat(stage,type);return p?{rangeMin:p.rangeMin,rangeMax:p.rangeMax,precision:p.precision}:null};
  async function test(kind,powerPreference) {
    const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;document.body.appendChild(canvas);
    const events=[],r={kind,powerPreference,events,samples:[]};results.push(r);
    canvas.addEventListener('webglcontextcreationerror',e=>events.push({event:e.type,msg:e.statusMessage}));canvas.addEventListener('webglcontextlost',e=>events.push({event:e.type,msg:e.statusMessage}));
    const gl=canvas.getContext(kind,{powerPreference,antialias:false});r.created=!!gl;if(!gl)return;
    for(let i=0;i<3;i++) {
      await new Promise(requestAnimationFrame);
      const v={lost:gl.isContextLost(),version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER),vertexHigh:precision(gl,gl.VERTEX_SHADER,gl.HIGH_FLOAT),fragmentHigh:precision(gl,gl.FRAGMENT_SHADER,gl.HIGH_FLOAT),error:gl.getError()};
      if(i===0) {const d=gl.getExtension('WEBGL_debug_renderer_info');if(d)v.unmasked=gl.getParameter(d.UNMASKED_RENDERER_WEBGL)}
      r.samples.push(v);
    }
    const is2=kind==='webgl2',vertex=(is2?'#version 300 es\nin':'attribute')+' vec2 position;void main(){gl_Position=vec4(position,0.,1.);}',frag=(is2?'#version 300 es\nprecision highp float;out vec4 color;void main(){color':'precision highp float;void main(){gl_FragColor')+'=vec4(1.,0.,0.,1.);}';
    const make=(type,source,key)=>{const s=gl.createShader(type);r[key]={created:!!s};if(!s)return null;gl.shaderSource(s,source);gl.compileShader(s);r[key].compiled=gl.getShaderParameter(s,gl.COMPILE_STATUS);r[key].log=gl.getShaderInfoLog(s);return s};
    const v=make(gl.VERTEX_SHADER,vertex,'vertex'), f=make(gl.FRAGMENT_SHADER,frag,'fragment'),p=gl.createProgram();r.program=!!p;
    if(v&&f&&p) {gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);r.linked=gl.getProgramParameter(p,gl.LINK_STATUS);r.programLog=gl.getProgramInfoLog(p);
      if(r.linked){gl.useProgram(p);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
        const loc=gl.getAttribLocation(p,'position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
        gl.viewport(0,0,32,32);gl.clearColor(0,1,0,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,3);
        const pixel=new Uint8Array(4);gl.readPixels(16,16,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);r.pixel=[...pixel];r.redDraw=r.pixel.join(',')==='255,0,0,255';}
    }
    r.finalError=gl.getError();r.finalLost=gl.isContextLost();
  }
  let done=false;window.__probeRead=()=>({done,userAgent:navigator.userAgent,results});
  addEventListener('DOMContentLoaded',async()=>{for(const [kind,power] of [['webgl2','default'],['webgl2','high-performance'],['webgl2','low-power'],['webgl','default']]){try{await test(kind,power)}catch(e){results[results.length-1].exception=String(e)}}done=true;});
})();

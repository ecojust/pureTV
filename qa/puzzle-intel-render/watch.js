(() => {
  const errors=[], contexts=[];
  addEventListener('error', e=>errors.push({message:e.message,source:e.filename,line:e.lineno,column:e.colno,stack:e.error?.stack || null}),true);
  addEventListener('unhandledrejection',e=>errors.push({message:String(e.reason),stack:e.reason?.stack||null}));
  // Observational tap only: return the exact browser context, including null.
  const native=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(...args) {
    const gl=native.apply(this,args), kind=String(args[0]);
    if(kind.startsWith('webgl')&&!contexts.some(x=>x.canvas===this&&x.kind===kind)){
      const item={kind,canvas:this,gl,created:!!gl,attributes:args[1]||null,events:[],precision:[]}; contexts.push(item);
      this.addEventListener('webglcontextlost',e=>item.events.push({kind:'lost',status:e.statusMessage||null}));
      this.addEventListener('webglcontextrestored',()=>item.events.push({kind:'restored'}));
      if(gl){ const fn=gl.getShaderPrecisionFormat;
        gl.getShaderPrecisionFormat=function(...params){const p=fn.apply(this,params);
          if(item.precision.length<8)item.precision.push({stage:params[0],type:params[1],value:p?{rangeMin:p.rangeMin,rangeMax:p.rangeMax,precision:p.precision}:null});
          return p;
        };
      }
    }
    return gl;
  };
  window.__probeRead=()=>{
    let g=null;try{g=window.JoystickGameQA?.snapshot?.()||null}catch(e){errors.push({message:String(e)})}
    return {done:(g?.frames>1||errors.length>0)&&document.readyState!=='loading',ready:document.readyState,title:document.title,userAgent:navigator.userAgent,game:g?{id:g.game,stage:g.stage,frames:g.frames,renderer:g.renderer,webglVersion:g.webglVersion,errors:g.errors}:null,errors,
      contexts:contexts.map(({canvas,gl,kind,attributes,created,events,precision})=>({kind,created,attributes,events,precision,width:canvas.width,height:canvas.height,contextLost:gl?gl.isContextLost():null,actualVersion:gl&&!gl.isContextLost()?gl.getParameter(gl.VERSION):null}))};
  };
})();

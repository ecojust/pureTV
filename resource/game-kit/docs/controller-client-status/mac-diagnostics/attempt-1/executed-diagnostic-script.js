(()=>{
  const rectangle=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
  const within=(r,c)=>r.left>=c.left-1&&r.top>=c.top-1&&r.right<=c.right+1&&r.bottom<=c.bottom+1;
  const geometry=element=>{
    if(!element)return {visible:false,fullyVisible:false,rect:null,clip:null};
    const rect=rectangle(element.getBoundingClientRect()),clip={left:0,top:0,right:innerWidth,bottom:innerHeight};
    let visible=rect.width>0&&rect.height>0;
    for(let node=element;node;node=node.parentElement){
      const style=getComputedStyle(node),box=node.getBoundingClientRect();
      if(node.hidden||style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse'||Number(style.opacity)===0)visible=false;
      if(/^(auto|scroll|hidden|clip)$/.test(style.overflowX)){clip.left=Math.max(clip.left,box.left);clip.right=Math.min(clip.right,box.right);}
      if(/^(auto|scroll|hidden|clip)$/.test(style.overflowY)){clip.top=Math.max(clip.top,box.top);clip.bottom=Math.min(clip.bottom,box.bottom);}
    }
    visible=visible&&rect.right>clip.left&&rect.left<clip.right&&rect.bottom>clip.top&&rect.top<clip.bottom;
    return {visible,fullyVisible:visible&&within(rect,clip),rect,clip};
  };
  const controllerClients=Array.from(document.querySelectorAll('[data-puretv-clients] [data-puretv-controller-id]')).map(card=>{
    const text=card.querySelector('[data-puretv-controller-id-text]'),icon=card.querySelector('svg.ptv-client-icon');
    const cardGeometry=geometry(card),textGeometry=geometry(text),iconGeometry=geometry(icon),range=document.createRange();
    if(text)range.selectNodeContents(text);
    const textRects=text?Array.from(range.getClientRects()).map(rectangle):[];
    return {controllerId:card.getAttribute('data-puretv-controller-id'),playerId:card.getAttribute('data-player-id'),visible:cardGeometry.visible,fullyVisible:cardGeometry.fullyVisible,rect:cardGeometry.rect,clip:cardGeometry.clip,iconVisible:iconGeometry.fullyVisible,iconRect:iconGeometry.rect,idText:text?.textContent||'',idTextRects:textRects,idTextFullyVisible:textGeometry.visible&&textRects.length>0&&textRects.every(r=>within(r,textGeometry.clip)),idTextOverflow:text?getComputedStyle(text).textOverflow:'',statusText:card.querySelector('.ptv-client-state')?.textContent||'',containerId:card.closest('[data-puretv-clients]')?.id||''};
  });
  return {game:window.PureTVQA?.snapshot()||null,document:{url:location.href,title:document.title,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,webglError:document.body.classList.contains('rush-webgl-error'),primaryText:document.getElementById('primary')?.textContent||'',language:document.documentElement.lang,controllerClients}};
})()
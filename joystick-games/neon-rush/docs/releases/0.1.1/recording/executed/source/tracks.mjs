/** Original closed racing routes. All render and collision coordinates use this module.
 * Heading yaw is atan2(dx, dz): +Z is forward at yaw 0 and positive lateral is right.
 * points excludes a repeated end point; sampleTrack(track, track.length) wraps to start.
 */
const TAU = Math.PI * 2;
const SAMPLE_COUNT = 768;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angleDelta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

export const TRACKS = Object.freeze([
  Object.freeze({ id: 'skyport', name: '星港夜航', nameEn: 'Skyport Circuit', theme: 'skyport', width: 20,
    description: '高架长直道与宽弯，霓虹城市中的入门竞速。', descriptionEn: 'Elevated straights and broad turns above a neon city.' }),
  Object.freeze({ id: 'coast', name: '海风回廊', nameEn: 'Seabreeze Switchback', theme: 'coast', width: 20,
    description: '海岸连续转向与起伏，保持线路完成漂移。', descriptionEn: 'Coastal switchbacks and rolling hills reward a clean racing line.' }),
  Object.freeze({ id: 'canyon', name: '赤岩跃谷', nameEn: 'Redrock Leap', theme: 'canyon', width: 22,
    description: '红岩山谷的加速直道、跳台与高低差。', descriptionEn: 'Boost straights, a launch ramp and sweeping redrock bends.' }),
]);

const DESIGNS = {
  skyport: { radius: 68, vertices: [[-135,-155],[-135,155],[135,155],[135,-155]],
    base: 12, hills: [3.5, 1.8], boosts: [65, 560], jumps: [] },
  coast: { radius: 52, vertices: [[-150,-100],[-150,100],[-80,160],[30,160],[150,80],[120,-20],[150,-110],[40,-160],[-70,-160]],
    base: 4, hills: [8, 2], boosts: [60, 515], jumps: [] },
  canyon: { radius: 52.25, vertices: [[-161.5,-104.5],[-161.5,123.5],[-38,180.5],[114,123.5],[161.5,-19],[85.5,-161.5],[-66.5,-161.5]],
    base: 10, hills: [13, 4], boosts: [45, 575], jumps: [{ start: 101, length: 6, power: 7.4, rise: 4.5, lead: 46, fall: 72 }] },
};

/** Positive modular distance. Invalid input is rejected rather than poisoning a physics state. */
export function wrapDistance(distance, length) {
  if (!Number.isFinite(distance) || !Number.isFinite(length) || length <= 0) throw new RangeError('Finite distance and positive track length required');
  return ((distance % length) + length) % length;
}

function roundedSegments(design) {
  const v = design.vertices.map(([x,z]) => ({x,z}));
  const corners = v.map((point, i) => {
    const prev = v[(i + v.length - 1) % v.length], next = v[(i + 1) % v.length];
    const before = Math.hypot(point.x - prev.x, point.z - prev.z), after = Math.hypot(next.x - point.x, next.z - point.z);
    const incoming = {x:(point.x-prev.x)/before,z:(point.z-prev.z)/before};
    const outgoing = {x:(next.x-point.x)/after,z:(next.z-point.z)/after};
    const turn = Math.atan2(incoming.x*outgoing.z-incoming.z*outgoing.x,incoming.x*outgoing.x+incoming.z*outgoing.z);
    const tangent = Math.tan(Math.abs(turn)/2);
    // Each corner uses less than half of either adjacent edge, leaving a real straight.
    const radius = Math.min(design.radius, Math.min(before,after)*.44/tangent);
    const cut = radius*tangent, direction = Math.sign(turn);
    const enter={x:point.x-incoming.x*cut,z:point.z-incoming.z*cut};
    const exit={x:point.x+outgoing.x*cut,z:point.z+outgoing.z*cut};
    const center={x:enter.x-incoming.z*radius*direction,z:enter.z+incoming.x*radius*direction};
    return {enter,exit,center,radius,turn,startAngle:Math.atan2(enter.z-center.z,enter.x-center.x)};
  });
  const segments=[];let total=0;
  for(let i=0;i<corners.length;i++) {
    const here=corners[i], next=corners[(i+1)%corners.length];
    const length=Math.hypot(next.enter.x-here.exit.x,next.enter.z-here.exit.z);
    if(length>1e-6){segments.push({kind:'line',a:here.exit,b:next.enter,length,start:total});total+=length;}
    const arcLength=next.radius*Math.abs(next.turn);
    segments.push({kind:'arc',...next,length:arcLength,start:total});total+=arcLength;
  }
  return {segments,length:total};
}

function planarSample(route,s) {
  s=wrapDistance(s,route.length);
  let low=0,high=route.segments.length-1;
  while(low<high){const mid=(low+high+1)>>1;if(route.segments[mid].start<=s)low=mid;else high=mid-1;}
  const p=route.segments[low],t=clamp((s-p.start)/p.length,0,1);
  if(p.kind==='line')return {x:lerp(p.a.x,p.b.x,t),z:lerp(p.a.z,p.b.z,t),yaw:Math.atan2(p.b.x-p.a.x,p.b.z-p.a.z)};
  const angle=p.startAngle+p.turn*t, sign=Math.sign(p.turn);
  return {x:p.center.x+Math.cos(angle)*p.radius,z:p.center.z+Math.sin(angle)*p.radius,yaw:Math.atan2(-Math.sin(angle)*sign,Math.cos(angle)*sign)};
}

const ease = t => .5 - .5 * Math.cos(Math.PI * clamp(t,0,1));
function elevation(design,s,length) {
  const angle=s/length*TAU;
  let y=design.base+design.hills[0]*(1-Math.cos(angle))*.5+design.hills[1]*Math.sin(angle*2);
  for(const jump of design.jumps){
    const from=jump.start-jump.lead,to=jump.start+jump.length+jump.fall;
    if(s>=from&&s<=jump.start)y+=jump.rise*ease((s-from)/jump.lead);
    else if(s>jump.start&&s<=jump.start+jump.length)y+=jump.rise;
    else if(s>jump.start+jump.length&&s<to)y+=jump.rise*(1-ease((s-jump.start-jump.length)/jump.fall));
  }
  return y;
}

/** Build fresh plain data so callers cannot corrupt another race through a shared cache. */
export function makeTrack(idOrIndex=0) {
  const index=typeof idOrIndex==='string'?TRACKS.findIndex(t=>t.id===idOrIndex):idOrIndex;
  if(!Number.isInteger(index)||index<0||index>=TRACKS.length)throw new RangeError('Unknown Neon Rush track');
  const meta=TRACKS[index], design=DESIGNS[meta.id], route=roundedSegments(design);
  const points=Array.from({length:SAMPLE_COUNT},(_,i)=>{
    const planarS=i/SAMPLE_COUNT*route.length,p=planarSample(route,planarS);
    return {...p,y:elevation(design,planarS,route.length),s:0,width:meta.width,curvature:0};
  });
  let length=0;
  for(let i=0;i<points.length;i++){
    const p=points[i],q=points[(i+1)%points.length];p.s=length;
    length+=Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z);
  }
  for(let i=0;i<points.length;i++){
    const p=points[i],a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];
    const ds=wrapDistance(b.s-a.s,length);p.curvature=angleDelta(a.yaw,b.yaw)/ds;
  }
  // Convert design distances to the same 3D arc-distance parameter as all consumers.
  const fromPlanar=s=>{
    const f=wrapDistance(s,route.length)/route.length*points.length,i=Math.floor(f),t=f-i;
    return lerp(points[i].s,i+1<points.length?points[i+1].s:length,t);
  };
  const bounds={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity,minY:Infinity,maxY:-Infinity};
  for(const p of points){bounds.minX=Math.min(bounds.minX,p.x);bounds.maxX=Math.max(bounds.maxX,p.x);bounds.minZ=Math.min(bounds.minZ,p.z);bounds.maxZ=Math.max(bounds.maxZ,p.z);bounds.minY=Math.min(bounds.minY,p.y);bounds.maxY=Math.max(bounds.maxY,p.y);}
  return {...meta,index,length,width:meta.width,points,bounds,checkpoints:8,
    boostPads:design.boosts.map(s=>({s:fromPlanar(s),length:12})),
    jumpPads:design.jumps.map(p=>({s:fromPlanar(p.start),length:fromPlanar(p.start+p.length)-fromPlanar(p.start),power:p.power})),
  };
}

function segmentAt(track,s) {
  let low=0,high=track.points.length-1;
  while(low<high){const mid=(low+high+1)>>1;if(track.points[mid].s<=s)low=mid;else high=mid-1;}
  return low;
}
function sampleSegment(track,i,t,s) {
  const a=track.points[i],b=track.points[(i+1)%track.points.length];
  return {x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),z:lerp(a.z,b.z,t),
    yaw:a.yaw+angleDelta(a.yaw,b.yaw)*t,curvature:lerp(a.curvature,b.curvature,t),width:lerp(a.width,b.width,t),s};
}

/** Arc-distance interpolation is shared by roads, checkpoints, kart heights and minimaps. */
export function sampleTrack(track,distance) {
  const s=wrapDistance(distance,track.length),i=segmentAt(track,s),a=track.points[i];
  const end=i+1<track.points.length?track.points[i+1].s:track.length;
  return sampleSegment(track,i,(s-a.s)/(end-a.s),s);
}

/** Closest XZ centerline projection. The hint narrows normal driving work, with global recovery.
 * The distance is horizontal distance to the road center, not signed road clearance.
 */
export function projectTrack(track,x,z,hintS=0) {
  if(!Number.isFinite(x)||!Number.isFinite(z))throw new RangeError('Finite world coordinates required');
  const count=track.points.length, hinted=Number.isFinite(hintS);
  const center=hinted?segmentAt(track,wrapDistance(hintS,track.length)):0;
  let bestD2=Infinity,bestI=0,bestT=0;
  function inspect(i){
    i=(i+count)%count;const a=track.points[i],b=track.points[(i+1)%count];
    const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);
    const d2=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;
    if(d2<bestD2){bestD2=d2;bestI=i;bestT=t;}
  }
  if(hinted){for(let offset=-28;offset<=28;offset++)inspect(center+offset);}
  // Normal cars remain close to the hinted path. Recovery and arbitrary map probes
  // get a complete search so stale/absent hints do not select a distant track section.
  const atSearchEdge=bestI===(center+28)%count||bestI===(center-28+count)%count;
  if(!hinted||atSearchEdge||bestD2>track.width*track.width*.36){for(let i=0;i<count;i++)inspect(i);}
  const a=track.points[bestI],end=bestI+1<count?track.points[bestI+1].s:track.length;
  const s=wrapDistance(lerp(a.s,end,bestT),track.length),p=sampleSegment(track,bestI,bestT,s);
  return {...p,lateral:(x-p.x)*Math.cos(p.yaw)-(z-p.z)*Math.sin(p.yaw),distance:Math.sqrt(bestD2),segment:bestI};
}

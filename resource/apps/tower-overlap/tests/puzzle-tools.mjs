// Independent public motion/interval reference, only used in tests.
export const layouts=[{width:220,speed:145,goal:6,profile:'steady',period:1},{width:200,speed:170,goal:8,profile:'pulse',period:1.6},{width:180,speed:195,goal:10,profile:'swell',period:2.4}];
export function area(profile,t){
 if(profile==='steady')return t;
 const period=profile==='pulse'?1.6:2.4,n=Math.floor(t/period),p=t-n*period;
 if(profile==='pulse')return n*period+1.2*Math.min(p,.8)+.8*Math.max(0,p-.8);
 return n*period+(p<=1.2?.7*p+.25*p*p:1.2+1.3*(p-1.2)-.25*(p-1.2)**2);
}
export function speedFactor(profile,phase){if(profile==='steady')return 1;if(profile==='pulse')return phase<.8?1.2:.8;return phase<=1.2?.7+.5*phase:1.3-.5*(phase-1.2);}
export function motion(slab,layout,dt){
 const range=600-slab.width,travel=layout.speed*(area(layout.profile,slab.cycle+dt)-area(layout.profile,slab.cycle));
 let coordinate=((slab.direction===1?slab.x:2*range-slab.x)+travel)%(2*range);
 if(Math.abs(coordinate)<1e-9||Math.abs(coordinate-2*range)<1e-9)coordinate=0;if(Math.abs(coordinate-range)<1e-9)coordinate=range;
 const x=coordinate<=range?coordinate:2*range-coordinate,direction=coordinate<range?1:-1;
 let cycle=(slab.cycle+dt)%layout.period;if(Math.abs(cycle-layout.period)<1e-9||cycle<1e-9)cycle=0;
 for(const edge of [layout.period/2])if(Math.abs(cycle-edge)<1e-9)cycle=edge;
 return {x,width:slab.width,direction,cycle,velocity:direction*layout.speed*speedFactor(layout.profile,cycle)};
}
export function intersection(source,previous){const x=Math.max(source.x,previous.x),width=Math.max(0,Math.min(source.x+source.width,previous.x+previous.width)-x);return {x,width,leftTrim:Math.max(0,x-source.x),rightTrim:Math.max(0,source.x+source.width-(x+width))};}

// Independent public motion/interval reference, only used in tests.
export const layouts=[
 {width:220,speed:145,goal:6,profile:'steady',period:1},
 {width:200,speed:170,goal:8,profile:'pulse',period:1.6},
 {width:180,speed:195,goal:10,profile:'swell',period:2.4},
 {width:205,speed:175,goal:8,profile:'signal',period:1.8},
 {width:190,speed:180,goal:12,profile:'gust',period:1.5},
 {width:170,speed:185,goal:14,profile:'ramp',period:2}
];
export function area(profile,t){
 if(profile==='steady')return t;
 const period={pulse:1.6,swell:2.4,signal:1.8,gust:1.5,ramp:2}[profile],n=Math.floor(t/period),p=t-n*period;
 if(profile==='pulse')return n*period+1.2*Math.min(p,.8)+.8*Math.max(0,p-.8);
 if(profile==='swell')return n*period+(p<=1.2?.7*p+.25*p*p:1.2+1.3*(p-1.2)-.25*(p-1.2)**2);
 if(profile==='signal')return n*1.74+1.2*Math.max(0,p-.35);
 if(profile==='gust')return n*1.5075+.55*Math.min(p,.45)+1.6*Math.min(.45,Math.max(0,p-.45))+.9*Math.max(0,p-.9);
 return n*2+.55*p+.225*p*p;
}
export function speedFactor(profile,phase){
 if(profile==='steady')return 1;
 if(profile==='pulse')return phase<.8?1.2:.8;
 if(profile==='swell')return phase<=1.2?.7+.5*phase:1.3-.5*(phase-1.2);
 if(profile==='signal')return phase<.35?0:1.2;
 if(profile==='gust')return phase<.45?.55:phase<.9?1.6:.9;
 return .55+.45*phase;
}
export function motion(slab,layout,dt){
 const range=600-slab.width,travel=layout.speed*(area(layout.profile,slab.cycle+dt)-area(layout.profile,slab.cycle));
 let coordinate=((slab.direction===1?slab.x:2*range-slab.x)+travel)%(2*range);
 if(Math.abs(coordinate)<1e-9||Math.abs(coordinate-2*range)<1e-9)coordinate=0;if(Math.abs(coordinate-range)<1e-9)coordinate=range;
 const x=coordinate<=range?coordinate:2*range-coordinate,direction=coordinate<range?1:-1;
 let cycle=(slab.cycle+dt)%layout.period;if(Math.abs(cycle-layout.period)<1e-9||cycle<1e-9)cycle=0;
 const edges={steady:[],pulse:[.8],swell:[1.2],signal:[.35],gust:[.45,.9],ramp:[]}[layout.profile];
 for(const edge of edges)if(Math.abs(cycle-edge)<1e-9)cycle=edge;
 return {x,width:slab.width,direction,cycle,velocity:direction*layout.speed*speedFactor(layout.profile,cycle)};
}
export function intersection(source,previous){const x=Math.max(source.x,previous.x),width=Math.max(0,Math.min(source.x+source.width,previous.x+previous.width)-x);return {x,width,leftTrim:Math.max(0,x-source.x),rightTrim:Math.max(0,source.x+source.width-(x+width))};}

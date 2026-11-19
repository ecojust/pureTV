// Nine independent pureTV buttons; no auto-throttle and no synthesized key releases.
export const DRIVE = Object.freeze({UP:'gas',DOWN:'brake',LEFT:'left',RIGHT:'right',A:'drift',B:'nitro'});
export function drivingHeld(buttons) { return new Set(Object.entries(DRIVE).filter(([key])=>buttons[key]).map(([,action])=>action)); }
export function edges(buttons, previous) { return Object.fromEntries(Object.keys(buttons).map(key=>[key,!!buttons[key]&&!previous[key]])); }

// Menu navigation holds never become driving actions until those keys are released.
export function createMenuGate(){let wasMenu=true;const blocked=new Set();return(menu,held)=>{if(wasMenu&&!menu)for(const [key,on]of Object.entries(held))if(on)blocked.add(key);wasMenu=menu;const safe={...held};for(const key of blocked){if(!held[key])blocked.delete(key);else safe[key]=false;}return safe;};}

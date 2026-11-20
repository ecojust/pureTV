// Intentional cancellation is distinct from releasing a charged drift.
export function clearDrive(input,kart){for(const k of Object.keys(input))input[k]=k==='axis'?0:false;if(kart){kart.driftCharge=0;kart.drifting=false;kart.driftAmt=0;kart.steerSmooth=0;if(kart.ctl)Object.assign(kart.ctl,{steer:0,gas:false,brake:false});}}
export function applyDrive(input,held,pressed){input.gas=!!held.UP;input.brake=!!held.DOWN;input.left=!!held.LEFT;input.right=!!held.RIGHT;input.axis=0;if(pressed.A)input.item=true;if(pressed.B)input.itemAlt=true;if(pressed.X)input.reset=true;}

// Menu navigation holds never become driving actions until those keys are released.
export function createMenuGate(){let wasMenu=true;const blocked=new Set();return(menu,held)=>{if(wasMenu&&!menu)for(const [key,on]of Object.entries(held))if(on)blocked.add(key);wasMenu=menu;const safe={...held};for(const key of blocked){if(!held[key])blocked.delete(key);else safe[key]=false;}return safe;};}

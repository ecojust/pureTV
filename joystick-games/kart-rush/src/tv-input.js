// Intentional cancellation is distinct from releasing a charged drift.
export function clearDrive(input,kart){for(const k of Object.keys(input))input[k]=k==='axis'?0:false;if(kart){kart.driftCharge=0;kart.drifting=false;kart.driftAmt=0;kart.steerSmooth=0;if(kart.ctl)Object.assign(kart.ctl,{steer:0,gas:false,brake:false});}}
export function applyDrive(input,held,pressed){input.gas=!!held.UP;input.brake=!!held.DOWN;input.left=!!held.LEFT;input.right=!!held.RIGHT;input.axis=0;if(pressed.A)input.item=true;if(pressed.B)input.itemAlt=true;if(pressed.X)input.reset=true;}

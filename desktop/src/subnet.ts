import type { LocalNetworkInfo } from './types';

function ipv4(value:string):number|null {
 const parts=value.split('.');
 if(parts.length!==4 || parts.some(part=>!/^\d{1,3}$/.test(part) || Number(part)>255 || (part.length>1 && part.startsWith('0'))))return null;
 return parts.reduce((result,part)=>(result<<8)|Number(part),0)>>>0;
}
/** Unknown addresses are not a mismatch. Any matching active adapter is enough. */
export function sameSubnet(host:string,network:LocalNetworkInfo):boolean|null {
 const target=ipv4(host.trim());if(target===null || network.error)return null;
 let compared=false;
 for(const adapter of network.addresses){
  const local=ipv4(adapter.ip),prefix=adapter.prefixLength;
  if(local===null || !Number.isInteger(prefix) || prefix<0 || prefix>32)continue;
  compared=true;const mask=prefix===0?0:(0xffffffff<<(32-prefix))>>>0;
  if((local&mask)===(target&mask))return true;
 }
 return compared?false:null;
}
